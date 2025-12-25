import pandas as pd
from io import BytesIO

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser
from django.http import HttpResponse
from django.utils import timezone

from ControleDeRecebimentos.models import Venda, AnaliseEPR


class AnalisarEPRAPIView(APIView):
    """
    POST /import/epr/analisar/
    Analisa arquivo EPR e retorna preview dos clientes encontrados.
    NÃO altera dados no banco - apenas cria registro de análise pendente.
    """

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

            vendas_encontradas = []
            dados_epr = []
            resumo_por_mes = {}

            # Identificar coluna com nome do cliente
            nome_coluna = None
            for col in df.columns:
                if "mutuário" in str(col).lower() or "mutua" in str(col).lower():
                    nome_coluna = col
                    break

            if not nome_coluna:
                # Fallback para coluna que contém "nome"
                for col in df.columns:
                    if "nome" in str(col).lower():
                        nome_coluna = col
                        break

            if not nome_coluna:
                return Response(
                    {"error": "Coluna de nome do cliente não encontrada na planilha EPR"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Coletar nomes únicos da planilha EPR
            nomes_planilha = {}
            for idx, row in df.iterrows():
                nome = str(row[nome_coluna]).strip() if pd.notna(row[nome_coluna]) else None
                if nome and nome.lower() != "nan":
                    nomes_planilha[nome.lower()] = (idx, row)

            # Buscar todas as vendas financiadas pendentes em UMA query
            vendas_por_nome = {}
            for venda in Venda.objects.filter(
                forma_pagamento="FI",
                status="PE"
            ).select_related("cliente", "empreendimento", "tabela_mensal"):
                vendas_por_nome[venda.cliente.nome.lower()] = venda

            # Processar dados
            for nome_lower, (idx, row) in nomes_planilha.items():
                nome_cliente = str(row[nome_coluna]).strip()

                # Buscar venda no dicionário (O(1))
                venda = vendas_por_nome.get(nome_lower)

                if not venda:
                    continue

                # Extrair dados da EPR para esta venda
                # Nota: valor_comissao vem da tabela Venda (importado das outras planilhas),
                # pois a planilha EPR não contém esse valor
                dados_linha = {
                    "venda_id": venda.id,
                    "nome_empreendimento": str(row.get("Nome Empreendimento", "")) if pd.notna(row.get("Nome Empreendimento")) else "",
                    "numero_contrato": str(row.get("Número Contrato", "")) if pd.notna(row.get("Número Contrato")) else "",
                    "nome_mutuario": nome_cliente,
                    "cpf_cnpj": str(row.get("CPF/CNPJ Mutuário", "")) if pd.notna(row.get("CPF/CNPJ Mutuário")) else "",
                    "data_assinatura": str(row.get("Data de Assinatura", "")) if pd.notna(row.get("Data de Assinatura")) else "",
                    "valor_financiamento": float(row.get("Valor de Financiamento", 0)) if pd.notna(row.get("Valor de Financiamento")) else 0,
                    "valor_financiamento_terreno": float(row.get("Valor de Financiamento do Terreno", 0)) if pd.notna(row.get("Valor de Financiamento do Terreno")) else 0,
                    "valor_subsidio": float(row.get("Valor de Desconto Subsídio Complementar", 0)) if pd.notna(row.get("Valor de Desconto Subsídio Complementar")) else 0,
                    "valor_fgts": float(row.get("Valor do FGTS", 0)) if pd.notna(row.get("Valor do FGTS")) else 0,
                    "valor_recursos_proprios": float(row.get("Valor Recursos Próprios", 0)) if pd.notna(row.get("Valor Recursos Próprios")) else 0,
                    "valor_compra_venda": float(row.get("Valor de Compra e Venda", 0)) if pd.notna(row.get("Valor de Compra e Venda")) else 0,
                    "valor_comissao": float(venda.valor_comissao) if venda.valor_comissao else 0,
                    # Dados da venda para o relatório
                    "tabela_mensal_id": venda.tabela_mensal.id if venda.tabela_mensal else None,
                    "mes_referencia": venda.tabela_mensal.mes_referencia if venda.tabela_mensal else None,
                    "empreendimento_sistema": venda.empreendimento.nome if venda.empreendimento else "",
                }

                vendas_encontradas.append(venda.id)
                dados_epr.append(dados_linha)

                # Atualizar resumo por mês
                if venda.tabela_mensal:
                    mes = venda.tabela_mensal.mes_referencia
                    resumo_por_mes[mes] = resumo_por_mes.get(mes, 0) + 1

            if not vendas_encontradas:
                return Response(
                    {
                        "message": "Nenhuma venda pendente encontrada na planilha EPR",
                        "total_linhas_epr": len(df),
                        "vendas_encontradas": 0,
                    },
                    status=status.HTTP_200_OK,
                )

            # Criar registro de análise pendente
            analise = AnaliseEPR.objects.create(
                status="PE",
                vendas_ids=vendas_encontradas,
                dados_epr=dados_epr,
                total_encontradas=len(vendas_encontradas),
                resumo_por_mes=resumo_por_mes,
            )

            # Montar resposta com detalhes por mês
            detalhes_por_mes = {}
            for dados in dados_epr:
                mes = dados.get("mes_referencia")
                if mes:
                    if mes not in detalhes_por_mes:
                        detalhes_por_mes[mes] = []
                    detalhes_por_mes[mes].append({
                        "venda_id": dados["venda_id"],
                        "cliente": dados["nome_mutuario"],
                        "empreendimento": dados["empreendimento_sistema"],
                        "valor_comissao": dados["valor_comissao"],
                    })

            return Response(
                {
                    "analise_id": analise.id,
                    "message": "Análise criada com sucesso. Aguardando confirmação.",
                    "resumo": {
                        "total_linhas_epr": len(df),
                        "vendas_encontradas": len(vendas_encontradas),
                        "por_mes": resumo_por_mes,
                    },
                    "detalhes_por_mes": detalhes_por_mes,
                },
                status=status.HTTP_201_CREATED,
            )

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ConfirmarAnaliseEPRAPIView(APIView):
    """
    POST /import/epr/confirmar/<id>/
    Confirma análise EPR: atualiza vendas para status Faturado.
    """

    def post(self, request, analise_id):
        try:
            analise = AnaliseEPR.objects.get(id=analise_id)
        except AnaliseEPR.DoesNotExist:
            return Response(
                {"error": "Análise não encontrada"},
                status=status.HTTP_404_NOT_FOUND,
            )

        if analise.status != "PE":
            return Response(
                {"error": f"Análise já foi {analise.get_status_display().lower()}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Atualizar vendas para Faturado
        vendas = Venda.objects.filter(id__in=analise.vendas_ids, status="PE")
        total_atualizadas = vendas.update(
            status="FA",
            data_faturamento=timezone.now(),
        )

        # Atualizar análise
        analise.status = "CO"
        analise.confirmado_em = timezone.now()
        analise.save()

        return Response(
            {
                "message": "Faturamento confirmado com sucesso",
                "analise_id": analise.id,
                "vendas_faturadas": total_atualizadas,
                "download_url": f"/export/analise-epr/{analise.id}/",
            },
            status=status.HTTP_200_OK,
        )


class CancelarAnaliseEPRAPIView(APIView):
    """
    POST /import/epr/cancelar/<id>/
    Cancela análise EPR sem alterar dados.
    """

    def post(self, request, analise_id):
        try:
            analise = AnaliseEPR.objects.get(id=analise_id)
        except AnaliseEPR.DoesNotExist:
            return Response(
                {"error": "Análise não encontrada"},
                status=status.HTTP_404_NOT_FOUND,
            )

        if analise.status != "PE":
            return Response(
                {"error": f"Análise já foi {analise.get_status_display().lower()}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        analise.status = "CA"
        analise.save()

        return Response(
            {
                "message": "Análise cancelada",
                "analise_id": analise.id,
            },
            status=status.HTTP_200_OK,
        )


class ExportarAnaliseEPRAPIView(APIView):
    """
    GET /export/analise-epr/<id>/
    Exporta planilha Excel com vendas faturadas da análise.
    Opcional: ?mes=2025-11 para filtrar por mês específico.
    """

    def get(self, request, analise_id):
        try:
            analise = AnaliseEPR.objects.get(id=analise_id)
        except AnaliseEPR.DoesNotExist:
            return Response(
                {"error": "Análise não encontrada"},
                status=status.HTTP_404_NOT_FOUND,
            )

        if analise.status != "CO":
            return Response(
                {"error": "Análise não foi confirmada. Não é possível exportar."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        mes_filtro = request.query_params.get("mes")

        # Filtrar dados por mês se solicitado
        dados = analise.dados_epr
        if mes_filtro:
            dados = [d for d in dados if d.get("mes_referencia") == mes_filtro]

        if not dados:
            return Response(
                {"error": "Nenhum dado encontrado para exportação"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Criar DataFrame para exportação
        df = pd.DataFrame([
            {
                "Nome Empreendimento": d["nome_empreendimento"],
                "Número Contrato": d["numero_contrato"],
                "Nome Mutuário": d["nome_mutuario"],
                "CPF/CNPJ Mutuário": d["cpf_cnpj"],
                "Data de Assinatura": d["data_assinatura"],
                "Valor de Financiamento": d["valor_financiamento"],
                "Valor de Financiamento do Terreno": d["valor_financiamento_terreno"],
                "Valor de Desconto Subsídio Complementar": d["valor_subsidio"],
                "Valor do FGTS": d["valor_fgts"],
                "Valor Recursos Próprios": d["valor_recursos_proprios"],
                "Valor de Compra e Venda": d["valor_compra_venda"],
                "Valor da Comissão": d["valor_comissao"],
            }
            for d in dados
        ])

        # Gerar arquivo Excel
        output = BytesIO()
        with pd.ExcelWriter(output, engine="openpyxl") as writer:
            df.to_excel(writer, index=False, sheet_name="Recebimentos")

        output.seek(0)

        # Nome do arquivo
        if mes_filtro:
            filename = f"{mes_filtro.replace('-', '.')} - Planilha Recebimentos.xlsx"
        else:
            filename = f"Analise_{analise.id} - Planilha Recebimentos.xlsx"

        response = HttpResponse(
            output.read(),
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        response["Content-Disposition"] = f'attachment; filename="{filename}"'

        return response


class ListarAnaliseEPRAPIView(APIView):
    """
    GET /analises-epr/
    Lista todas as análises EPR.
    """

    def get(self, request):
        analises = AnaliseEPR.objects.all().order_by("-created_at")

        status_filtro = request.query_params.get("status")
        if status_filtro:
            analises = analises.filter(status=status_filtro)

        data = [
            {
                "id": a.id,
                "status": a.status,
                "status_display": a.get_status_display(),
                "created_at": a.created_at,
                "confirmado_em": a.confirmado_em,
                "total_encontradas": a.total_encontradas,
                "resumo_por_mes": a.resumo_por_mes,
            }
            for a in analises
        ]

        return Response(data, status=status.HTTP_200_OK)


class DetalharAnaliseEPRAPIView(APIView):
    """
    GET /analises-epr/<id>/
    Retorna detalhes completos de uma análise EPR, incluindo dados para exportação.
    """

    def get(self, request, analise_id):
        try:
            analise = AnaliseEPR.objects.get(id=analise_id)
        except AnaliseEPR.DoesNotExist:
            return Response(
                {"error": "Análise não encontrada"},
                status=status.HTTP_404_NOT_FOUND,
            )

        data = {
            "id": analise.id,
            "status": analise.status,
            "status_display": analise.get_status_display(),
            "created_at": analise.created_at,
            "confirmado_em": analise.confirmado_em,
            "total_encontradas": analise.total_encontradas,
            "resumo_por_mes": analise.resumo_por_mes,
            "dados_epr": analise.dados_epr,
        }

        return Response(data, status=status.HTTP_200_OK)