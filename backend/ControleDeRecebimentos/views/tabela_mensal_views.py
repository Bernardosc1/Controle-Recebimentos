from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from ControleDeRecebimentos.models import TabelaMensal
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
