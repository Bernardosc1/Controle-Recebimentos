from django.db import models


class TabelaMensal(models.Model):
    mes_referencia = models.CharField(max_length=7, unique=True)  # "2024-10"
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.mes_referencia
