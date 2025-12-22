from django.db import models
from django.conf import settings
from ControleDeRecebimentos.models import Cliente, Empreendimento


class Venda(models.Model):
    class FormaPagamento(models.TextChoices):
        AVISTA = 'AV', 'À Vista'
        FINANCIADO = 'FI', 'Financiado'
    
    class Status(models.TextChoices):
        PENDENTE = 'PE', 'Pendente'
        FATURADO = 'FA', 'Faturado'
        
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE)
    empreendimento = models.ForeignKey(Empreendimento, on_delete=models.CASCADE)
    valor_venda = models.DecimalField(max_digits=12, decimal_places=2)
    data_venda = models.DateField()
    mes_referencia = models.CharField(max_length=7)  # "2024-06"
    forma_pagamento = models.CharField(max_length=2, choices=FormaPagamento.choices)
    status = models.CharField(max_length=2, choices=Status.choices, default=Status.PENDENTE)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f'{self.cliente.nome} - {self.empreendimento.nome}'