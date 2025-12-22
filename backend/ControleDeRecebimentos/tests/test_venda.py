from rest_framework import status
from rest_framework.test import APITestCase
from factory import Factory, Faker, build, faker

from ControleDeRecebimentos.models import Cliente, Empreendimento

class VendaAPIViewTestCase(APITestCase):
    def setUp(self):
        self.url = '/vendas/'
        
        # Cria dependências no banco de teste
        self.cliente = Cliente.objects.create(nome='João Silva')
        self.empreendimento = Empreendimento.objects.create(nome='Residencial Parque')

    def test_create_venda(self):
        payload = {
            'cliente': self.cliente.id,
            'empreendimento': self.empreendimento.id,
            'valor_venda': '150000.00',
            'data_venda': '2024-06-15',
            'mes_referencia': '2024-06',
            'forma_pagamento': 'FI',
            'status': 'PE',
        }
        
        response = self.client.post(self.url, payload, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['cliente'], self.cliente.id)
        self.assertEqual(response.data['valor_venda'], '150000.00')