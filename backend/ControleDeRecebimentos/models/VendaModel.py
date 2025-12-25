from django.db import models
from django.conf import settings
from ControleDeRecebimentos.models import Cliente, Empreendimento, TabelaMensal


class Venda(models.Model):
    class FormaPagamento(models.TextChoices):
        AVISTA = "AV", "À Vista"
        FINANCIADO = "FI", "Financiado"
        DESCONTO = "DS", "Desconto"

    class Status(models.TextChoices):
        PENDENTE = "PE", "Pendente"
        FATURADO = "FA", "Faturado"

    # Campos obrigatórios
    tabela_mensal = models.ForeignKey(
        TabelaMensal, on_delete=models.CASCADE, related_name="vendas"
    )
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE)
    empreendimento = models.ForeignKey(Empreendimento, on_delete=models.CASCADE)
    data_venda = models.DateField()
    status = models.CharField(
        max_length=2, choices=Status.choices, default=Status.PENDENTE
    )
    created_at = models.DateTimeField(auto_now_add=True)

    # Campos opcionais (podem vir da planilha)
    valor_venda = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True
    )
    forma_pagamento = models.CharField(
        max_length=2, choices=FormaPagamento.choices, null=True, blank=True
    )
    corretor = models.CharField(max_length=200, null=True, blank=True)
    imobiliaria = models.CharField(max_length=200, null=True, blank=True)
    unidade = models.CharField(max_length=100, null=True, blank=True)
    etapa = models.CharField(max_length=50, null=True, blank=True)
    fgts = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    observacoes = models.TextField(null=True, blank=True)
    valor_comissao = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True
    )
    data_faturamento = models.DateField(null=True, blank=True)

    class Meta:
        # Uma venda é única pela combinação desses campos
        unique_together = ["cliente", "empreendimento", "unidade", "data_venda"]

    def __str__(self):
        return f"{self.cliente.nome} - {self.empreendimento.nome}"
