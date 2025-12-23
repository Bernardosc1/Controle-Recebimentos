from rest_framework import serializers
from ControleDeRecebimentos.models import Venda


class VendaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Venda
        fields = [
            "id",
            "cliente",
            "empreendimento",
            "data_venda",
            "mes_referencia",
            "status",
            "created_at",
            # Campos opcionais
            "valor_venda",
            "forma_pagamento",
            "corretor",
            "imobiliaria",
            "unidade",
            "etapa",
            "fgts",
            "observacoes",
        ]
        read_only_fields = ["id", "created_at"]
