from django.urls import reverse

from rest_framework import status
from rest_framework.test import APITestCase

from django.contrib.auth import get_user_model
from factory import Factory, Faker, build

# Pega o modelo de usuário que está ativo no projeto (o seu modelo customizado)
User = get_user_model()

class UserFactory(Factory):
    class Meta:
        # Usamos 'dict' porque estamos construindo um payload para a API
        model = dict
    
    first_name = Faker('first_name', locale='pt-BR')
    last_name = Faker('last_name', locale='pt-BR')
    email = Faker('email')
    password = Faker('password')
    user_type = 'DIR'

class RegisterAPIViewTestCase(APITestCase):
    def setUp(self) -> None:
        # O nome da URL de registro é 'register', conforme definido em urls.py
        self.url = reverse("register")
        

    def test_register_user(self):
        # 1. Usa factory.build() para gerar um DICIONÁRIO a partir da UserFactory
        payload = build(dict, FACTORY_CLASS=UserFactory)
        
        response = self.client.post(self.url, payload, format='json')

        # 3. Verificar se o status code é 201 CREATED
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # 4. Verificar se os campos corretos foram retornados (sem a senha)
        self.assertEqual(response.data['email'], payload['email'])
        self.assertNotIn('password', response.data)
        self.assertTrue('id' in response.data)