from rest_framework import serializers
from ControleDeRecebimentos.models import Venda


class VendaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Venda
        fields = [
            "id",
            "cliente",
            "empreendimento",
            "valor_venda",
            "data_venda",
            "mes_referencia",
            "forma_pagamento",
            "status",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]
