from django.urls import reverse

from rest_framework import status
from rest_framework.test import APITestCase

from django.contrib.auth import get_user_model
from factory import Factory, Faker, build

# Pega o modelo de usuário que está ativo no projeto (o seu modelo customizado)
User = get_user_model()

class ClienteFactory(Factory):
    class Meta:
        # Usamos 'dict' porque estamos construindo um payload para a API
        model = dict
    
    nome = Faker('name', locale='pt-BR')

class RegisterAPIViewTestCase(APITestCase):
    def setUp(self):
        # O nome da URL de registro é 'register', conforme definido em urls.py
        self.url = '/clientes/'
        

    def test_create_cliente(self):
        # 1. Usa factory.build() para gerar um DICIONÁRIO a partir da UserFactory
        payload = build(dict, FACTORY_CLASS=ClienteFactory)
        response = self.client.post(self.url, payload, format='json')

        # 3. Verificar se o status code é 201 CREATED
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['nome'], payload['nome'])