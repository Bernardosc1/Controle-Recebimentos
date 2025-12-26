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


class VendaDetailAPIView(APIView):
    """
    GET/PATCH/DELETE /vendas/<id>/
    Endpoint para operações em uma venda específica.
    """

    def get_object(self, pk):
        try:
            return Venda.objects.select_related(
                "cliente", "empreendimento", "tabela_mensal"
            ).get(pk=pk)
        except Venda.DoesNotExist:
            return None

    def get(self, request, pk):
        venda = self.get_object(pk)
        if not venda:
            return Response(
                {"error": "Venda não encontrada"},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = VendaSerializer(venda)
        return Response(serializer.data)

    def patch(self, request, pk):
        """
        Atualização parcial de uma venda.
        Usado para edição inline na tabela.
        """
        venda = self.get_object(pk)
        if not venda:
            return Response(
                {"error": "Venda não encontrada"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Campos permitidos para edição inline
        campos_permitidos = [
            "valor_venda",
            "valor_comissao",
            "forma_pagamento",
            "status",
        ]

        # Filtrar apenas campos permitidos
        dados = {k: v for k, v in request.data.items() if k in campos_permitidos}

        if not dados:
            return Response(
                {"error": "Nenhum campo válido para atualização"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Se status mudar para Faturado, registrar data
        if dados.get("status") == "FA" and venda.status != "FA":
            dados["data_faturamento"] = timezone.now().date()

        serializer = VendaSerializer(venda, data=dados, partial=True)
        if serializer.is_valid(raise_exception=True):
            serializer.save()
            return Response(serializer.data)

    def delete(self, request, pk):
        venda = self.get_object(pk)
        if not venda:
            return Response(
                {"error": "Venda não encontrada"},
                status=status.HTTP_404_NOT_FOUND
            )
        venda.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


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

        vendas.update(status="FA", data_faturamento=timezone.now().date())

        return Response(
            {"message": f"{total} vendas faturadas com sucesso"},
            status=status.HTTP_200_OK,
        )
