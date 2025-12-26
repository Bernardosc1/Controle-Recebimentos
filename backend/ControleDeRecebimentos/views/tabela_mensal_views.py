from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Sum, Q

from ControleDeRecebimentos.models import TabelaMensal, Venda
from ControleDeRecebimentos.Serializers.TabelaMensal import TabelaMensalSerializer


class TabelaMensalListCreateAPIView(APIView):
    def get(self, request):
        tabelas = TabelaMensal.objects.all().order_by('-mes_referencia')
        serializer = TabelaMensalSerializer(tabelas, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = TabelaMensalSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class TabelaMensalDetailAPIView(APIView):
    def get(self, request, pk):
        try:
            tabela = TabelaMensal.objects.get(pk=pk)
        except TabelaMensal.DoesNotExist:
            return Response(
                {"error": "Tabela mensal não encontrada"},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = TabelaMensalSerializer(tabela)
        return Response(serializer.data)

    def delete(self, request, pk):
        try:
            tabela = TabelaMensal.objects.get(pk=pk)
        except TabelaMensal.DoesNotExist:
            return Response(
                {"error": "Tabela mensal não encontrada"},
                status=status.HTTP_404_NOT_FOUND
            )
        tabela.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class TabelaMensalDashboardAPIView(APIView):
    """
    GET /tabelas-mensais/<id>/dashboard/
    Retorna indicadores e estatísticas de uma tabela mensal específica.
    """

    def get(self, request, pk):
        try:
            tabela = TabelaMensal.objects.get(pk=pk)
        except TabelaMensal.DoesNotExist:
            return Response(
                {"error": "Tabela mensal não encontrada"},
                status=status.HTTP_404_NOT_FOUND
            )

        vendas = Venda.objects.filter(tabela_mensal=tabela)

        # Estatísticas de quantidade
        total_vendas = vendas.count()
        vendas_pendentes = vendas.filter(status="PE").count()
        vendas_faturadas = vendas.filter(status="FA").count()

        # Valores agregados
        totais = vendas.aggregate(
            total_valor_vendas=Sum("valor_venda"),
            total_comissao=Sum("valor_comissao"),
            comissao_pendente=Sum("valor_comissao", filter=Q(status="PE")),
            comissao_faturada=Sum("valor_comissao", filter=Q(status="FA")),
        )

        # Por forma de pagamento
        a_vista = vendas.filter(forma_pagamento="AV").count()
        financiado = vendas.filter(forma_pagamento="FI").count()

        return Response({
            "tabela": {
                "id": tabela.id,
                "mes_referencia": tabela.mes_referencia,
            },
            "indicadores": {
                "total_vendas": total_vendas,
                "vendas_pendentes": vendas_pendentes,
                "vendas_faturadas": vendas_faturadas,
                "total_valor_vendas": totais["total_valor_vendas"] or 0,
                "total_comissao": totais["total_comissao"] or 0,
                "comissao_pendente": totais["comissao_pendente"] or 0,
                "comissao_faturada": totais["comissao_faturada"] or 0,
                "vendas_a_vista": a_vista,
                "vendas_financiadas": financiado,
            },
        })
