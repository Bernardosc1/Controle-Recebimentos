import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../services/api";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../../components/ui/card";
import {
  ShoppingCart,
  Clock,
  CheckCircle,
  DollarSign,
  TrendingUp,
  CreditCard,
  Banknote,
  ArrowRight,
  Upload,
  FileSearch,
  Loader2,
} from "lucide-react";

interface DashboardData {
  total_vendas: number;
  vendas_pendentes: number;
  vendas_faturadas: number;
  total_valor_vendas: number;
  total_comissao: number;
  comissao_pendente: number;
  comissao_faturada: number;
  vendas_a_vista: number;
  vendas_financiadas: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [dados, setDados] = useState<DashboardData>({
    total_vendas: 0,
    vendas_pendentes: 0,
    vendas_faturadas: 0,
    total_valor_vendas: 0,
    total_comissao: 0,
    comissao_pendente: 0,
    comissao_faturada: 0,
    vendas_a_vista: 0,
    vendas_financiadas: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
      const vendas = await db.vendas.list();

      let totalVendas = 0;
      let vendasPendentes = 0;
      let vendasFaturadas = 0;
      let totalValor = 0;
      let totalComissao = 0;
      let comissaoPendente = 0;
      let comissaoFaturada = 0;
      let vendasAVista = 0;
      let vendasFinanciadas = 0;

      if (vendas) {
        totalVendas = vendas.length;
        vendas.forEach((venda: any) => {
          if (venda.status === 'PE') vendasPendentes++;
          if (venda.status === 'FA') vendasFaturadas++;
          if (venda.valor_venda) totalValor += venda.valor_venda;
          if (venda.valor_comissao) {
            totalComissao += venda.valor_comissao;
            if (venda.status === 'PE') comissaoPendente += venda.valor_comissao;
            if (venda.status === 'FA') comissaoFaturada += venda.valor_comissao;
          }
          if (venda.forma_pagamento === 'AV') vendasAVista++;
          if (venda.forma_pagamento === 'FI') vendasFinanciadas++;
        });
      }

      setDados({
        total_vendas: totalVendas,
        vendas_pendentes: vendasPendentes,
        vendas_faturadas: vendasFaturadas,
        total_valor_vendas: totalValor,
        total_comissao: totalComissao,
        comissao_pendente: comissaoPendente,
        comissao_faturada: comissaoFaturada,
        vendas_a_vista: vendasAVista,
        vendas_financiadas: vendasFinanciadas,
      });
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
    } finally {
      setLoading(false);
    }
  }

  function formatarMoeda(valor: number): string {
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  if (loading) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3 text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-lg">Carregando dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500 mt-1">Visão geral das suas comissões</p>
      </div>

      {/* Grid de Cards - Estatísticas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Card 1: Total de Vendas */}
        <Card className="border-0 shadow-lg shadow-slate-200/50 hover:shadow-xl transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Total de Vendas</p>
                <p className="text-3xl font-bold text-slate-800">
                  {dados?.total_vendas || 0}
                </p>
                <p className="text-xs text-slate-400 mt-1">vendas cadastradas</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <ShoppingCart className="w-7 h-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Pendentes */}
        <Card className="border-0 shadow-lg shadow-slate-200/50 hover:shadow-xl transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Pendentes</p>
                <p className="text-3xl font-bold text-amber-500">
                  {dados?.vendas_pendentes || 0}
                </p>
                <p className="text-xs text-slate-400 mt-1">aguardando faturamento</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30">
                <Clock className="w-7 h-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Faturadas */}
        <Card className="border-0 shadow-lg shadow-slate-200/50 hover:shadow-xl transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Faturadas</p>
                <p className="text-3xl font-bold text-emerald-500">
                  {dados?.vendas_faturadas || 0}
                </p>
                <p className="text-xs text-slate-400 mt-1">já recebidas</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <CheckCircle className="w-7 h-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Comissão Total */}
        <Card className="border-0 shadow-lg shadow-slate-200/50 hover:shadow-xl transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Comissão Total</p>
                <p className="text-2xl font-bold text-violet-600">
                  {formatarMoeda(dados?.total_comissao || 0)}
                </p>
                <p className="text-xs text-slate-400 mt-1">valor total</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/30">
                <DollarSign className="w-7 h-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Segunda linha - Detalhes de comissão */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Comissão Pendente */}
        <Card className="border-0 shadow-lg shadow-slate-200/50 hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-amber-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Comissão Pendente</p>
                <p className="text-2xl font-bold text-amber-600">
                  {formatarMoeda(dados?.comissao_pendente || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comissão Faturada */}
        <Card className="border-0 shadow-lg shadow-slate-200/50 hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-emerald-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Comissão Recebida</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {formatarMoeda(dados?.comissao_faturada || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Por Forma de Pagamento */}
        <Card className="border-0 shadow-lg shadow-slate-200/50 hover:shadow-xl transition-shadow duration-300">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-slate-500 mb-4">Por Forma de Pagamento</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Banknote className="w-5 h-5 text-blue-600" />
                  <span className="text-slate-600 font-medium">À Vista</span>
                </div>
                <span className="text-lg font-bold text-blue-600">{dados?.vendas_a_vista || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-violet-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-violet-600" />
                  <span className="text-slate-600 font-medium">Financiado</span>
                </div>
                <span className="text-lg font-bold text-violet-600">{dados?.vendas_financiadas || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Card de ações rápidas */}
      <Card className="border-0 shadow-lg shadow-slate-200/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl text-slate-800">Ações Rápidas</CardTitle>
          <CardDescription>
            Acesse as principais funcionalidades do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => navigate("/vendas")}
              className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <ShoppingCart className="w-5 h-5 text-blue-600" />
                </div>
                <span className="font-medium text-slate-700">Ver Vendas</span>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
            </button>

            <button
              onClick={() => navigate("/importar")}
              className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                  <Upload className="w-5 h-5 text-emerald-600" />
                </div>
                <span className="font-medium text-slate-700">Importar Planilha</span>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
            </button>

            <button
              onClick={() => navigate("/analise-epr")}
              className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center group-hover:bg-violet-200 transition-colors">
                  <FileSearch className="w-5 h-5 text-violet-600" />
                </div>
                <span className="font-medium text-slate-700">Análise EPR</span>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-violet-600 group-hover:translate-x-1 transition-all" />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
