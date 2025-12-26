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
from ControleDeRecebimentos.views.venda_views import (
    VendaAPIView,
    VendaDetailAPIView,
    FaturarVendasAPIView,
)
from ControleDeRecebimentos.views.import_views import (
    ImportAcompanhamentoAPIView,
    ImportControleGestoresAPIView,
    ImportWebroPayAPIView,
    ImportEPRAPIView,
)
from ControleDeRecebimentos.views.tabela_mensal_views import (
    TabelaMensalListCreateAPIView,
    TabelaMensalDetailAPIView,
    TabelaMensalDashboardAPIView,
)
from ControleDeRecebimentos.views.dashboard_views import (
    DashboardAPIView,
    DashboardPorMesAPIView,
)
from ControleDeRecebimentos.views.analise_epr_views import (
    AnalisarEPRAPIView,
    ConfirmarAnaliseEPRAPIView,
    CancelarAnaliseEPRAPIView,
    ExportarAnaliseEPRAPIView,
    ListarAnaliseEPRAPIView,
    DetalharAnaliseEPRAPIView,
)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("token/", TokenObtainPairView.as_view()),
    path("token/refresh/", TokenRefreshView.as_view()),
    path("register/", RegisterAPIView.as_view(), name="register"),
    path("empreendimentos/", EmpreendimentoAPIView.as_view(), name="empreendimentos"),
    path("clientes/", ClienteAPIView.as_view(), name="clientes"),
    path("vendas/faturar/", FaturarVendasAPIView.as_view(), name="faturar_vendas"),
    path("vendas/", VendaAPIView.as_view(), name="vendas"),
    path("vendas/<int:pk>/", VendaDetailAPIView.as_view(), name="venda_detail"),
    path(
        "import/acompanhamento/",
        ImportAcompanhamentoAPIView.as_view(),
        name="import_acompanhamento",
    ),
    path(
        "import/controle-gestores/",
        ImportControleGestoresAPIView.as_view(),
        name="import_controle_gestores",
    ),
    path(
        "import/webropay/",
        ImportWebroPayAPIView.as_view(),
        name="import_webropay",
    ),
    path(
        "import/epr/",
        ImportEPRAPIView.as_view(),
        name="import_epr",
    ),
    path(
        "tabelas-mensais/",
        TabelaMensalListCreateAPIView.as_view(),
        name="tabelas_mensais",
    ),
    path(
        "tabelas-mensais/<int:pk>/",
        TabelaMensalDetailAPIView.as_view(),
        name="tabela_mensal_detail",
    ),
    path(
        "tabelas-mensais/<int:pk>/dashboard/",
        TabelaMensalDashboardAPIView.as_view(),
        name="tabela_mensal_dashboard",
    ),
    path("dashboard/", DashboardAPIView.as_view(), name="dashboard"),
    path("dashboard/mes/", DashboardPorMesAPIView.as_view(), name="dashboard_mes"),
    # Análise EPR
    path(
        "import/epr/analisar/",
        AnalisarEPRAPIView.as_view(),
        name="analisar_epr",
    ),
    path(
        "import/epr/confirmar/<int:analise_id>/",
        ConfirmarAnaliseEPRAPIView.as_view(),
        name="confirmar_epr",
    ),
    path(
        "import/epr/cancelar/<int:analise_id>/",
        CancelarAnaliseEPRAPIView.as_view(),
        name="cancelar_epr",
    ),
    path(
        "export/analise-epr/<int:analise_id>/",
        ExportarAnaliseEPRAPIView.as_view(),
        name="exportar_epr",
    ),
    path(
        "analises-epr/",
        ListarAnaliseEPRAPIView.as_view(),
        name="listar_analises_epr",
    ),
    path(
        "analises-epr/<int:analise_id>/",
        DetalharAnaliseEPRAPIView.as_view(),
        name="detalhar_analise_epr",
    ),
]
