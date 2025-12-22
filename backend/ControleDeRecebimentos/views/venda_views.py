from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from ControleDeRecebimentos.Serializers.Venda.VendaSerializer import VendaSerializer


class VendaAPIView(APIView):
    def post(self, request):
        serializer = VendaSerializer(data=request.data)
        if serializer.is_valid(raise_exception=True):
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
