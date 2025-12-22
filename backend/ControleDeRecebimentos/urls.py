"""
URL configuration for ControleDeRecebimentos project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path

from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from ControleDeRecebimentos.views.user_views import RegisterAPIView
from ControleDeRecebimentos.views.empreendimento_views import EmpreendimentoAPIView
from ControleDeRecebimentos.views.cliente_views import ClienteAPIView
from ControleDeRecebimentos.views.venda_views import VendaAPIView


urlpatterns = [
    path("admin/", admin.site.urls),
    path("token/", TokenObtainPairView.as_view()),
    path("token/refresh/", TokenRefreshView.as_view()),
    path("register/", RegisterAPIView.as_view(), name="register"),
    path("empreendimentos/", EmpreendimentoAPIView.as_view(), name="empreendimentos"),
    path("clientes/", ClienteAPIView.as_view(), name="clientes"),
    path("vendas/", VendaAPIView.as_view(), name="vendas"),
]
