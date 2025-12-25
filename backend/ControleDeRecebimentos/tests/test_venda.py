from rest_framework import status
from rest_framework.test import APITestCase
from factory import Factory, Faker, build, faker

from ControleDeRecebimentos.models import Cliente, Empreendimento, TabelaMensal


class VendaAPIViewTestCase(APITestCase):
    def setUp(self):
        self.url = "/vendas/"

        # Cria dependências no banco de teste
        self.cliente = Cliente.objects.create(nome="João Silva")
        self.empreendimento = Empreendimento.objects.create(nome="Residencial Parque")
        self.tabela_mensal = TabelaMensal.objects.create(mes_referencia="2024-06")

    def test_create_venda(self):
        payload = {
            "tabela_mensal": self.tabela_mensal.id,
            "cliente": self.cliente.id,
            "empreendimento": self.empreendimento.id,
            "valor_venda": "150000.00",
            "data_venda": "2024-06-15",
            "forma_pagamento": "FI",
            "status": "PE",
        }

        response = self.client.post(self.url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["cliente"], self.cliente.id)
        self.assertEqual(response.data["valor_venda"], "150000.00")

    def test_list_vendas(self):
        from ControleDeRecebimentos.models import Venda

        Venda.objects.create(
            tabela_mensal=self.tabela_mensal,
            cliente=self.cliente,
            empreendimento=self.empreendimento,
            data_venda="2024-06-15",
        )

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_filter_vendas_by_tabela_mensal(self):
        from ControleDeRecebimentos.models import Venda

        tabela2 = TabelaMensal.objects.create(mes_referencia="2024-07")

        Venda.objects.create(
            tabela_mensal=self.tabela_mensal,
            cliente=self.cliente,
            empreendimento=self.empreendimento,
            data_venda="2024-06-15",
        )
        Venda.objects.create(
            tabela_mensal=tabela2,
            cliente=self.cliente,
            empreendimento=self.empreendimento,
            data_venda="2024-07-15",
        )

        response = self.client.get(f"{self.url}?tabela_mensal={self.tabela_mensal.id}")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["tabela_mensal"], self.tabela_mensal.id)

    def test_filter_vendas_by_status(self):
        from ControleDeRecebimentos.models import Venda

        Venda.objects.create(
            tabela_mensal=self.tabela_mensal,
            cliente=self.cliente,
            empreendimento=self.empreendimento,
            data_venda="2024-06-15",
            status="PE",
        )
        Venda.objects.create(
            tabela_mensal=self.tabela_mensal,
            cliente=self.cliente,
            empreendimento=self.empreendimento,
            data_venda="2024-06-16",
            status="FA",
        )

        response = self.client.get(f"{self.url}?venda_status=PE")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["status"], "PE")
