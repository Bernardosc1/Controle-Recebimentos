import pandas as pd

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser

from ControleDeRecebimentos.models import Cliente, Empreendimento, Venda


class ImportAcompanhamentoAPIView(APIView):
    parser_classes = [MultiPartParser]

    def post(self, request):
        file = request.FILES.get("file")

        if not file:
            return Response(
                {"error": "Nenhum arquivo enviado!"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            df = pd.read_excel(file, skiprows=3)

            df.columns = [
                "quant",
                "data",
                "nome",
                "corretor",
                "imobiliaria",
                "empreendimento",
                "unidade",
                "etapa",
                "fgts",
                "status",
                "observacoes",
            ]

            # 1. Extrair nomes únicos de clientes e empreendimentos
            nomes_clientes = set(
                str(row["nome"]).strip()
                for _, row in df.iterrows()
                if pd.notna(row["nome"])
            )
            nomes_empreendimentos = set(
                str(row["empreendimento"]).strip()
                for _, row in df.iterrows()
                if pd.notna(row["empreendimento"])
            )

            # 2. Buscar existentes no banco
            clientes_existentes = {c.nome: c for c in Cliente.objects.filter(nome__in=nomes_clientes)}
            empreendimentos_existentes = {e.nome: e for e in Empreendimento.objects.filter(nome__in=nomes_empreendimentos)}

            # 3. Criar novos clientes em lote
            novos_clientes = [
                Cliente(nome=nome)
                for nome in nomes_clientes
                if nome not in clientes_existentes
            ]
            if novos_clientes:
                Cliente.objects.bulk_create(novos_clientes)
                # Recarregar cache
                clientes_existentes = {c.nome: c for c in Cliente.objects.filter(nome__in=nomes_clientes)}

            # 4. Criar novos empreendimentos em lote
            novos_empreendimentos = [
                Empreendimento(nome=nome)
                for nome in nomes_empreendimentos
                if nome not in empreendimentos_existentes
            ]
            if novos_empreendimentos:
                Empreendimento.objects.bulk_create(novos_empreendimentos)
                # Recarregar cache
                empreendimentos_existentes = {e.nome: e for e in Empreendimento.objects.filter(nome__in=nomes_empreendimentos)}

            # 5. Preparar todas as vendas
            vendas = []
            for _, row in df.iterrows():
                nome_cliente = str(row["nome"]).strip()
                nome_empreendimento = str(row["empreendimento"]).strip()

                cliente = clientes_existentes.get(nome_cliente)
                empreendimento = empreendimentos_existentes.get(nome_empreendimento)

                if not cliente or not empreendimento:
                    continue

                data_venda = pd.to_datetime(str(row["data"]).strip()).date()
                mes_referencia = data_venda.strftime("%Y-%m")

                vendas.append(
                    Venda(
                        cliente=cliente,
                        empreendimento=empreendimento,
                        data_venda=data_venda,
                        mes_referencia=mes_referencia,
                        corretor=(
                            str(row["corretor"]).strip()
                            if pd.notna(row["corretor"])
                            else None
                        ),
                        imobiliaria=(
                            str(row["imobiliaria"]).strip()
                            if pd.notna(row["imobiliaria"])
                            else None
                        ),
                        unidade=(
                            str(row["unidade"]).strip()
                            if pd.notna(row["unidade"])
                            else None
                        ),
                        etapa=(
                            str(row["etapa"]).strip()
                            if pd.notna(row["etapa"])
                            else None
                        ),
                        fgts=(
                            row["fgts"]
                            if pd.notna(row["fgts"]) and isinstance(row["fgts"], (int, float))
                            else None
                        ),
                        observacoes=(
                            str(row["observacoes"]).strip()
                            if pd.notna(row["observacoes"])
                            else None
                        ),
                    )
                )

            # 6. Criar todas as vendas em lote
            Venda.objects.bulk_create(vendas)

            return Response(
                {
                    "message": f"{len(vendas)} vendas importadas com sucesso",
                    "vendas_criadas": len(vendas),
                    "clientes_criados": len(novos_clientes),
                    "empreendimentos_criados": len(novos_empreendimentos),
                },
                status=status.HTTP_201_CREATED,
            )

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
