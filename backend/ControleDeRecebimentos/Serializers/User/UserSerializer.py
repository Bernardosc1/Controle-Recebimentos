from rest_framework import serializers

from ControleDeRecebimentos.models.UserModel import User


class UserSerializer(serializers.ModelSerializer):
    # 1. Adiciona o campo de senha, que é write_only (não será retornado na resposta)
    #    e required=True para garantir que seja enviado.
    password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        # 2. Inclui todos os campos necessários para criar um usuário
        fields = [
            'id', 'first_name', 'last_name', 'email', 'user_type',
            'password'
        ]
        # 3. Define campos que são apenas para leitura (não são necessários na criação)
        read_only_fields = ['id']

    def create(self, validated_data):
        """
        4. Sobrescreve o método create para usar o `create_user` do Django,
           que lida corretamente com o hashing da senha.
        """
        user = User.objects.create_user(**validated_data)
        return user