from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from ControleDeRecebimentos.Serializers.User.UserSerializer import UserSerializer



class RegisterAPIView(APIView):
    """
    View para registrar um novo usuário.
    """
    def post(self, request):
        # 1. Passa os dados recebidos para o serializer
        serializer = UserSerializer(data=request.data)

        # 2. Valida os dados. Se não forem válidos, lança uma exceção.
        serializer.is_valid(raise_exception=True)

        # 3. Salva o novo usuário (chama o método `create` do serializer)
        serializer.save()

        # 4. Retorna os dados do usuário criado (sem a senha) e o status 201
        return Response(serializer.data, status=status.HTTP_201_CREATED)

