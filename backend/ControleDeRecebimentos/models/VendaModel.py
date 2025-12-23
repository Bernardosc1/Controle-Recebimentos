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
        
    # Campos obrigatórios
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE)
    empreendimento = models.ForeignKey(Empreendimento, on_delete=models.CASCADE)
    data_venda = models.DateField()
    mes_referencia = models.CharField(max_length=7)  # "2024-06"
    status = models.CharField(max_length=2, choices=Status.choices, default=Status.PENDENTE)
    created_at = models.DateTimeField(auto_now_add=True)

    # Campos opcionais (podem vir da planilha)
    valor_venda = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    forma_pagamento = models.CharField(max_length=2, choices=FormaPagamento.choices, null=True, blank=True)
    corretor = models.CharField(max_length=200, null=True, blank=True)
    imobiliaria = models.CharField(max_length=200, null=True, blank=True)
    unidade = models.CharField(max_length=100, null=True, blank=True)
    etapa = models.CharField(max_length=50, null=True, blank=True)
    fgts = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    observacoes = models.TextField(null=True, blank=True)
    
    def __str__(self):
        return f'{self.cliente.nome} - {self.empreendimento.nome}'