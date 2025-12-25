from rest_framework import serializers
from ControleDeRecebimentos.models import Venda


class VendaSerializer(serializers.ModelSerializer):
    # Campos extras para exibir nomes (somente leitura)
    cliente_nome = serializers.CharField(source="cliente.nome", read_only=True)
    empreendimento_nome = serializers.CharField(
        source="empreendimento.nome", read_only=True
    )

    # Campos para exibir valores legíveis de choices
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    forma_pagamento_display = serializers.CharField(
        source="get_forma_pagamento_display", read_only=True
    )

    class Meta:
        model = Venda
        fields = [
            "id",
            "tabela_mensal",
            "cliente",
            "cliente_nome",
            "empreendimento",
            "empreendimento_nome",
            "data_venda",
            "status",
            "status_display",
            "created_at",
            # Campos opcionais
            "valor_venda",
            "forma_pagamento",
            "forma_pagamento_display",
            "corretor",
            "imobiliaria",
            "unidade",
            "etapa",
            "fgts",
            "observacoes",
            "valor_comissao",
            "data_faturamento",
        ]
        read_only_fields = ["id", "created_at"]
