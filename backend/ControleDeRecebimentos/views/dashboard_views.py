from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Sum, Count, Q

from ControleDeRecebimentos.models import Venda, TabelaMensal


class DashboardAPIView(APIView):
    def get(self, request):
        # Estatísticas gerais
        total_vendas = Venda.objects.count()
        vendas_pendentes = Venda.objects.filter(status="PE").count()
        vendas_faturadas = Venda.objects.filter(status="FA").count()

        # Valores
        totais = Venda.objects.aggregate(
            total_valor_vendas=Sum("valor_venda"),
            total_comissao=Sum("valor_comissao"),
            comissao_pendente=Sum("valor_comissao", filter=Q(status="PE")),
            comissao_faturada=Sum("valor_comissao", filter=Q(status="FA")),
        )

        # Por forma de pagamento
        a_vista = Venda.objects.filter(forma_pagamento="AV").count()
        financiado = Venda.objects.filter(forma_pagamento="FI").count()

        return Response(
            {
                "total_vendas": total_vendas,
                "vendas_pendentes": vendas_pendentes,
                "vendas_faturadas": vendas_faturadas,
                "total_valor_vendas": totais["total_valor_vendas"] or 0,
                "total_comissao": totais["total_comissao"] or 0,
                "comissao_pendente": totais["comissao_pendente"] or 0,
                "comissao_faturada": totais["comissao_faturada"] or 0,
                "vendas_a_vista": a_vista,
                "vendas_financiadas": financiado,
            }
        )


class DashboardPorMesAPIView(APIView):
    def get(self, request):
        tabelas = TabelaMensal.objects.all().order_by("-mes_referencia")

        resultado = []
        for tabela in tabelas:
            vendas = Venda.objects.filter(tabela_mensal=tabela)

            totais = vendas.aggregate(
                total_vendas=Count("id"),
                pendentes=Count("id", filter=Q(status="PE")),
                faturadas=Count("id", filter=Q(status="FA")),
                total_comissao=Sum("valor_comissao"),
                comissao_faturada=Sum("valor_comissao", filter=Q(status="FA")),
            )

            resultado.append(
                {
                    "mes_referencia": tabela.mes_referencia,
                    "tabela_id": tabela.id,
                    "total_vendas": totais["total_vendas"] or 0,
                    "pendentes": totais["pendentes"] or 0,
                    "faturadas": totais["faturadas"] or 0,
                    "total_comissao": totais["total_comissao"] or 0,
                    "comissao_faturada": totais["comissao_faturada"] or 0,
                }
            )

        return Response(resultado)
