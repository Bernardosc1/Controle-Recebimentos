from django.test import TestCase
from django.db import IntegrityError
from rest_framework.test import APITestCase
from rest_framework import status

from ControleDeRecebimentos.models import TabelaMensal, Cliente, Empreendimento, Venda


class TabelaMensalModelTestCase(TestCase):
    def test_create_tabela_mensal(self):
        tabela = TabelaMensal.objects.create(
            mes_referencia="2025-12",
        )

        self.assertEqual(tabela.mes_referencia, "2025-12")
        self.assertIsNotNone(tabela.created_at)

    def test_mes_referencia_unique(self):
        TabelaMensal.objects.create(mes_referencia="2025-12")

        with self.assertRaises(IntegrityError):
            TabelaMensal.objects.create(mes_referencia="2025-12")


class TabelaMensalAPITestCase(APITestCase):
    def setUp(self):
        self.url = '/tabelas-mensais/'
        self.tabela = TabelaMensal.objects.create(mes_referencia="2024-10")

    def test_list_tabelas_mensais(self):
        TabelaMensal.objects.create(mes_referencia="2024-11")

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_create_tabela_mensal(self):
        payload = {"mes_referencia": "2024-12"}

        response = self.client.post(self.url, payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['mes_referencia'], "2024-12")

    def test_get_tabela_mensal_detail(self):
        response = self.client.get(f"{self.url}{self.tabela.id}/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['mes_referencia'], "2024-10")

    def test_delete_tabela_mensal(self):
        response = self.client.delete(f"{self.url}{self.tabela.id}/")

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(TabelaMensal.objects.filter(id=self.tabela.id).exists())

    def test_total_vendas_count(self):
        cliente = Cliente.objects.create(nome="João")
        empreendimento = Empreendimento.objects.create(nome="Residencial A")

        Venda.objects.create(
            tabela_mensal=self.tabela,
            cliente=cliente,
            empreendimento=empreendimento,
            data_venda="2024-10-15",
        )
        Venda.objects.create(
            tabela_mensal=self.tabela,
            cliente=cliente,
            empreendimento=empreendimento,
            unidade="101",
            data_venda="2024-10-16",
        )

        response = self.client.get(f"{self.url}{self.tabela.id}/")

        self.assertEqual(response.data['total_vendas'], 2)
