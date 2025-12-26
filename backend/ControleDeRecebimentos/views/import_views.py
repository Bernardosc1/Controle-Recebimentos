import pandas as pd

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser
from django.utils import timezone

from ControleDeRecebimentos.models import Cliente, Empreendimento, Venda, TabelaMensal
from ControleDeRecebimentos.utils import (
    criar_indice_por_nome_cliente,
    encontrar_melhor_match,
)


class ImportAcompanhamentoAPIView(APIView):
    parser_classes = [MultiPartParser]

    def post(self, request):
        file = request.FILES.get("file")
        mes_referencia = request.data.get("mes_referencia")

        if not file:
            return Response(
                {"error": "Nenhum arquivo enviado!"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not mes_referencia:
            return Response(
                {"error": "Mês de referência é obrigatório!"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Obter ou criar a TabelaMensal
        tabela_mensal, created = TabelaMensal.objects.get_or_create(
            mes_referencia=mes_referencia
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
            clientes_existentes = {
                c.nome: c for c in Cliente.objects.filter(nome__in=nomes_clientes)
            }
            empreendimentos_existentes = {
                e.nome: e
                for e in Empreendimento.objects.filter(nome__in=nomes_empreendimentos)
            }

            # 3. Criar novos clientes em lote
            novos_clientes = [
                Cliente(nome=nome)
                for nome in nomes_clientes
                if nome not in clientes_existentes
            ]
            if novos_clientes:
                Cliente.objects.bulk_create(novos_clientes)
                # Recarregar cache
                clientes_existentes = {
                    c.nome: c for c in Cliente.objects.filter(nome__in=nomes_clientes)
                }

            # 4. Criar novos empreendimentos em lote
            novos_empreendimentos = [
                Empreendimento(nome=nome)
                for nome in nomes_empreendimentos
                if nome not in empreendimentos_existentes
            ]
            if novos_empreendimentos:
                Empreendimento.objects.bulk_create(novos_empreendimentos)
                # Recarregar cache
                empreendimentos_existentes = {
                    e.nome: e
                    for e in Empreendimento.objects.filter(
                        nome__in=nomes_empreendimentos
                    )
                }

            # 5. Processar vendas com BULK OPERATIONS (otimizado)
            ano, mes = mes_referencia.split("-")
            ano = int(ano)
            mes = int(mes)

            # Coletar todos os dados válidos primeiro
            dados_vendas = []
            for _, row in df.iterrows():
                try:
                    data_venda = pd.to_datetime(str(row["data"]).strip()).date()
                    if data_venda.year != ano or data_venda.month != mes:
                        continue
                except:
                    continue

                nome_cliente = str(row["nome"]).strip() if pd.notna(row["nome"]) else None
                nome_empreendimento = str(row["empreendimento"]).strip() if pd.notna(row["empreendimento"]) else None

                if not nome_cliente or not nome_empreendimento:
                    continue

                cliente = clientes_existentes.get(nome_cliente)
                empreendimento = empreendimentos_existentes.get(nome_empreendimento)

                if not cliente or not empreendimento:
                    continue

                dados_vendas.append({
                    "cliente": cliente,
                    "empreendimento": empreendimento,
                    "unidade": str(row["unidade"]).strip() if pd.notna(row["unidade"]) else None,
                    "data_venda": data_venda,
                    "corretor": str(row["corretor"]).strip() if pd.notna(row["corretor"]) else None,
                    "imobiliaria": str(row["imobiliaria"]).strip() if pd.notna(row["imobiliaria"]) else None,
                    "etapa": str(row["etapa"]).strip() if pd.notna(row["etapa"]) else None,
                    "fgts": row["fgts"] if pd.notna(row["fgts"]) and isinstance(row["fgts"], (int, float)) else None,
                    "observacoes": str(row["observacoes"]).strip() if pd.notna(row["observacoes"]) else None,
                })

            # Buscar vendas existentes do mês em UMA única query
            vendas_existentes = {}
            for v in Venda.objects.filter(tabela_mensal=tabela_mensal):
                chave = (v.cliente_id, v.empreendimento_id, v.unidade, v.data_venda)
                vendas_existentes[chave] = v

            # Separar em listas: criar vs atualizar
            vendas_para_criar = []
            vendas_para_atualizar = []

            for dados in dados_vendas:
                chave = (
                    dados["cliente"].id,
                    dados["empreendimento"].id,
                    dados["unidade"],
                    dados["data_venda"]
                )

                if chave in vendas_existentes:
                    venda = vendas_existentes[chave]
                    venda.corretor = dados["corretor"]
                    venda.imobiliaria = dados["imobiliaria"]
                    venda.etapa = dados["etapa"]
                    venda.fgts = dados["fgts"]
                    venda.observacoes = dados["observacoes"]
                    vendas_para_atualizar.append(venda)
                else:
                    vendas_para_criar.append(Venda(
                        cliente=dados["cliente"],
                        empreendimento=dados["empreendimento"],
                        unidade=dados["unidade"],
                        data_venda=dados["data_venda"],
                        tabela_mensal=tabela_mensal,
                        corretor=dados["corretor"],
                        imobiliaria=dados["imobiliaria"],
                        etapa=dados["etapa"],
                        fgts=dados["fgts"],
                        observacoes=dados["observacoes"],
                    ))

            # Executar bulk operations (MUITO mais rápido!)
            if vendas_para_criar:
                Venda.objects.bulk_create(vendas_para_criar)

            if vendas_para_atualizar:
                Venda.objects.bulk_update(
                    vendas_para_atualizar,
                    ["corretor", "imobiliaria", "etapa", "fgts", "observacoes"]
                )

            vendas_criadas = len(vendas_para_criar)
            vendas_atualizadas = len(vendas_para_atualizar)

            return Response(
                {
                    "message": f"Importação concluída com sucesso",
                    "vendas_criadas": vendas_criadas,
                    "vendas_atualizadas": vendas_atualizadas,
                    "clientes_criados": len(novos_clientes),
                    "empreendimentos_criados": len(novos_empreendimentos),
                    "tabela_mensal": tabela_mensal.mes_referencia,
                },
                status=status.HTTP_201_CREATED,
            )

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ImportControleGestoresAPIView(APIView):
    parser_classes = [MultiPartParser]

    def _mes_referencia_to_sheet_name(self, mes_referencia):
        """
        Converte mes_referencia (ex: '2025-11') para nome da aba (ex: 'NOV25')
        """
        meses = {
            "01": "JAN",
            "02": "FEV",
            "03": "MAR",
            "04": "ABR",
            "05": "MAI",
            "06": "JUN",
            "07": "JUL",
            "08": "AGO",
            "09": "SET",
            "10": "OUT",
            "11": "NOV",
            "12": "DEZ",
        }

        ano, mes = mes_referencia.split("-")
        ano_curto = ano[2:]  # 2025 -> 25
        nome_mes = meses.get(mes, "")

        return f"{nome_mes}{ano_curto}"

    def post(self, request):
        file = request.FILES.get("file")
        mes_referencia = request.data.get("mes_referencia")

        if not file:
            return Response(
                {"error": "Nenhum arquivo enviado!"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not mes_referencia:
            return Response(
                {"error": "Mês de referência é obrigatório!"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            # Converter mes_referencia para nome da aba
            sheet_name = self._mes_referencia_to_sheet_name(mes_referencia)

            df = pd.read_excel(file, sheet_name=sheet_name, skiprows=1)

            # Função para encontrar coluna por palavras-chave
            def encontrar_coluna(palavras_chave):
                for col in df.columns:
                    col_lower = str(col).lower()
                    for palavra in palavras_chave:
                        if palavra in col_lower:
                            return col
                return None

            # Detectar colunas automaticamente
            col_nome = encontrar_coluna(["nome", "cliente"])
            col_valor = encontrar_coluna(["valor", "imóvel", "imovel", "vgv"])
            col_forma = encontrar_coluna(["forma", "pagamento", "pgto"])

            if not col_nome:
                return Response(
                    {"error": "Coluna de nome do cliente não encontrada na planilha"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Buscar todas as vendas em UMA query e criar índice normalizado
            vendas_por_nome = criar_indice_por_nome_cliente(
                Venda.objects.all().select_related("cliente")
            )

            vendas_para_atualizar = []
            vendas_nao_encontradas = []

            for _, row in df.iterrows():
                nome_cliente = (
                    str(row[col_nome]).strip() if pd.notna(row[col_nome]) else None
                )
                if not nome_cliente or nome_cliente.lower() == "nan":
                    continue

                # Buscar venda com matching por similaridade (threshold 85%)
                venda, score = encontrar_melhor_match(nome_cliente, vendas_por_nome)

                if not venda:
                    vendas_nao_encontradas.append(nome_cliente)
                    continue

                # Mapear forma de pagamento (se coluna existir)
                if col_forma:
                    forma = str(row[col_forma]).upper() if pd.notna(row[col_forma]) else ""
                    if "FIN" in forma:
                        venda.forma_pagamento = "FI"
                    elif "PIX" in forma or "CARTAO" in forma or "VISTA" in forma:
                        venda.forma_pagamento = "AV"
                    elif "QUITADO" in forma or "DESCONTO" in forma:
                        venda.forma_pagamento = "DS"

                # Atualizar valor_venda e calcular comissão (se coluna existir)
                if col_valor and pd.notna(row[col_valor]):
                    valor = row[col_valor]
                    if isinstance(valor, (int, float)):
                        venda.valor_venda = valor
                        venda.valor_comissao = round(valor * 0.00195, 2)

                vendas_para_atualizar.append(venda)

            # Bulk update - MUITO mais rápido!
            if vendas_para_atualizar:
                Venda.objects.bulk_update(
                    vendas_para_atualizar,
                    ["forma_pagamento", "valor_venda", "valor_comissao"]
                )

            return Response(
                {
                    "message": "Importação concluída",
                    "aba_processada": sheet_name,
                    "mes_referencia": mes_referencia,
                    "vendas_atualizadas": len(vendas_para_atualizar),
                    "vendas_nao_encontradas": len(vendas_nao_encontradas),
                    "nao_encontradas": vendas_nao_encontradas[:10],  # Mostra apenas 10
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ImportWebroPayAPIView(APIView):
    parser_classes = [MultiPartParser]

    def post(self, request):
        file = request.FILES.get("file")

        if not file:
            return Response(
                {"error": "Nenhum arquivo enviado!"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            df = pd.read_excel(file)

            # Detectar coluna do pagador automaticamente
            col_pagador = None
            for col in df.columns:
                col_lower = str(col).lower()
                if "pagador" in col_lower or "nome" in col_lower or "cliente" in col_lower:
                    col_pagador = col
                    break

            if not col_pagador:
                return Response(
                    {"error": "Coluna de pagador/nome não encontrada na planilha"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Buscar todas as vendas à vista pendentes e criar índice normalizado
            vendas_por_nome = criar_indice_por_nome_cliente(
                Venda.objects.filter(
                    forma_pagamento="AV",
                    status="PE"
                ).select_related("cliente")
            )

            vendas_para_atualizar = []
            vendas_nao_encontradas = []
            agora = timezone.now()

            for _, row in df.iterrows():
                nome_cliente = (
                    str(row[col_pagador]).strip() if pd.notna(row[col_pagador]) else None
                )
                if not nome_cliente or nome_cliente.lower() == "nan":
                    continue

                # Buscar venda com matching por similaridade (threshold 85%)
                venda, score = encontrar_melhor_match(nome_cliente, vendas_por_nome)

                if not venda:
                    vendas_nao_encontradas.append(nome_cliente)
                    continue

                # Marcar como faturado
                venda.status = "FA"
                venda.data_faturamento = agora
                vendas_para_atualizar.append(venda)

            # Bulk update - MUITO mais rápido!
            if vendas_para_atualizar:
                Venda.objects.bulk_update(
                    vendas_para_atualizar,
                    ["status", "data_faturamento"]
                )

            return Response(
                {
                    "message": "Importação concluída",
                    "vendas_faturadas": len(vendas_para_atualizar),
                    "vendas_nao_encontradas": len(vendas_nao_encontradas),
                    "nao_encontradas": vendas_nao_encontradas[:10],
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ImportEPRAPIView(APIView):
    parser_classes = [MultiPartParser]

    def post(self, request):
        file = request.FILES.get("file")

        if not file:
            return Response(
                {"error": "Nenhum arquivo enviado!"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            # EPR é .xls (formato antigo)
            df = pd.read_excel(file, engine="xlrd")

            vendas_nao_encontradas = []

            # Identificar coluna com nome do cliente (pode variar)
            nome_coluna = None
            for col in df.columns:
                if "nome" in str(col).lower() or "cliente" in str(col).lower():
                    nome_coluna = col
                    break

            if not nome_coluna:
                nome_coluna = df.columns[0]  # Usa primeira coluna como fallback

            # Buscar todas as vendas financiadas pendentes e criar índice normalizado
            vendas_por_nome = criar_indice_por_nome_cliente(
                Venda.objects.filter(
                    forma_pagamento="FI",
                    status="PE"
                ).select_related("cliente")
            )

            vendas_para_atualizar = []
            agora = timezone.now()

            for _, row in df.iterrows():
                nome_cliente = (
                    str(row[nome_coluna]).strip()
                    if pd.notna(row[nome_coluna])
                    else None
                )
                if not nome_cliente:
                    continue

                # Buscar venda com matching por similaridade (threshold 85%)
                venda, score = encontrar_melhor_match(nome_cliente, vendas_por_nome)

                if not venda:
                    vendas_nao_encontradas.append(nome_cliente)
                    continue

                # Marcar como faturado
                venda.status = "FA"
                venda.data_faturamento = agora
                vendas_para_atualizar.append(venda)

            # Bulk update - MUITO mais rápido!
            if vendas_para_atualizar:
                Venda.objects.bulk_update(
                    vendas_para_atualizar,
                    ["status", "data_faturamento"]
                )

            return Response(
                {
                    "message": "Importação concluída",
                    "vendas_faturadas": len(vendas_para_atualizar),
                    "vendas_nao_encontradas": len(vendas_nao_encontradas),
                    "nao_encontradas": vendas_nao_encontradas[:10],
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
