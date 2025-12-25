from rest_framework import status
from rest_framework.test import APITestCase
from factory import Factory, Faker, build

class EmpreendimentoFactory(Factory):
    class Meta:
        model = dict
    
    nome = Faker('company', locale='pt-BR')  # Gera nome de empresa

class EmpreendimentoAPIViewTestCase(APITestCase):
    def setUp(self):
        self.url = '/empreendimentos/'
        

    def test_create_empreendimento(self):
        payload = build(dict, FACTORY_CLASS=EmpreendimentoFactory)
        
        response = self.client.post(self.url, payload, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['nome'], payload['nome'])
        self.assertIn('id', response.data)