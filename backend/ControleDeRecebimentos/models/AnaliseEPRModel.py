from django.db import models


class AnaliseEPR(models.Model):
    STATUS_CHOICES = [
        ("PE", "Pendente"),
        ("CO", "Confirmado"),
        ("CA", "Cancelado"),
    ]

    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=2, choices=STATUS_CHOICES, default="PE")
    confirmado_em = models.DateTimeField(null=True, blank=True)

    # IDs das vendas encontradas (para atualizar status depois)
    vendas_ids = models.JSONField(default=list)

    # Dados completos da EPR para geração da planilha
    # Estrutura: [{"venda_id": 1, "dados_epr": {...}}, ...]
    dados_epr = models.JSONField(default=list)

    # Resumo para exibição rápida
    total_encontradas = models.IntegerField(default=0)

    # Resumo por mês: {"2025-11": 10, "2025-10": 5}
    resumo_por_mes = models.JSONField(default=dict)

    class Meta:
        verbose_name = "Análise EPR"
        verbose_name_plural = "Análises EPR"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Análise EPR #{self.id} - {self.get_status_display()} ({self.total_encontradas} vendas)"