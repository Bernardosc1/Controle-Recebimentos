from rest_framework import serializers
from ControleDeRecebimentos.models.ClienteModel import Cliente

class ClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cliente
        fields = ['id', 'nome', 'cpf', 'created_at']
        read_only_fields = ['id', 'created_at']