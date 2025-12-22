from rest_framework import serializers
from ControleDeRecebimentos.models import Empreendimento

class EmpreendimentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Empreendimento
        fields = ['id', 'nome', 'created_at']
        read_only_fields = ['id', 'created_at']