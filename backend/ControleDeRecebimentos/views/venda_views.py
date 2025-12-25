from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone

from ControleDeRecebimentos.models import Venda
from ControleDeRecebimentos.Serializers.Venda.VendaSerializer import VendaSerializer


class VendaAPIView(APIView):
    def get(self, request):
        vendas = Venda.objects.select_related(
            "cliente", "empreendimento", "tabela_mensal"
        ).all()

        tabela_mensal = request.query_params.get("tabela_mensal")
        cliente = request.query_params.get("cliente")
        empreendimento = request.query_params.get("empreendimento")
        venda_status = request.query_params.get("venda_status")

        if tabela_mensal:
            vendas = vendas.filter(tabela_mensal_id=tabela_mensal)

        if cliente:
            vendas = vendas.filter(cliente_id=cliente)

        if empreendimento:
            vendas = vendas.filter(empreendimento_id=empreendimento)

        if venda_status:
            vendas = vendas.filter(status=venda_status)

        serializer = VendaSerializer(vendas, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = VendaSerializer(data=request.data)
        if serializer.is_valid(raise_exception=True):
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)


class FaturarVendasAPIView(APIView):
    def post(self, request):
        ids = request.data.get("ids", [])

        if not ids:
            return Response(
                {"error": "Nenhum ID informado"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        vendas = Venda.objects.filter(id__in=ids, status="PE")
        total = vendas.count()

        if total == 0:
            return Response(
                {"error": "Nenhuma venda pendente encontrada"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        vendas.update(status="FA", data_faturamento=timezone.now())

        return Response(
            {"message": f"{total} vendas faturadas com sucesso"},
            status=status.HTTP_200_OK,
        )
