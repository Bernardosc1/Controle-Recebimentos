from rest_framework import serializers
from ControleDeRecebimentos.models import TabelaMensal


class TabelaMensalSerializer(serializers.ModelSerializer):
    total_vendas = serializers.SerializerMethodField()

    class Meta:
        model = TabelaMensal
        fields = ["id", "mes_referencia", "created_at", "total_vendas"]
        read_only_fields = ["id", "created_at", "total_vendas"]

    def get_total_vendas(self, obj):
        return obj.vendas.count()
