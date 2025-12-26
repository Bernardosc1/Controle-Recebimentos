import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { EditableCell } from "../../components/ui/EditableCell";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  ShoppingCart,
  Clock,
  CheckCircle,
  DollarSign,
  TrendingUp,
  CreditCard,
  Banknote,
  Calendar,
  Filter,
  Search,
  X,
  Pencil,
} from "lucide-react";

interface TabelaDashboard {
  tabela: {
    id: number;
    mes_referencia: string;
  };
  indicadores: {
    total_vendas: number;
    vendas_pendentes: number;
    vendas_faturadas: number;
    total_valor_vendas: number;
    total_comissao: number;
    comissao_pendente: number;
    comissao_faturada: number;
    vendas_a_vista: number;
    vendas_financiadas: number;
  };
}

interface Venda {
  id: number;
  cliente_nome: string;
  empreendimento_nome: string;
  unidade: string;
  forma_pagamento: string;
  forma_pagamento_display: string;
  status: string;
  status_display: string;
  valor_venda: number | null;
  valor_comissao: number | null;
}

export default function TabelaMensalDetalhes() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<TabelaDashboard | null>(null);
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  // Estados dos filtros
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [filtroPagamento, setFiltroPagamento] = useState<string>("todos");
  const [filtroEmpreendimento, setFiltroEmpreendimento] = useState<string>("todos");
  const [filtroBusca, setFiltroBusca] = useState<string>("");

  useEffect(() => {
    carregarDados();
  }, [id]);

  async function carregarDados() {
    try {
      setLoading(true);
      const [dashboardRes, vendasRes] = await Promise.all([
        api.get(`/tabelas-mensais/${id}/dashboard/`),
        api.get(`/vendas/?tabela_mensal=${id}`),
      ]);
      setDashboard(dashboardRes.data);
      setVendas(vendasRes.data);
      setErro("");
    } catch (error) {
      setErro("Erro ao carregar dados da tabela");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  function formatarMes(mesReferencia: string): string {
    const [ano, mes] = mesReferencia.split("-");
    const meses = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    return `${meses[parseInt(mes) - 1]} de ${ano}`;
  }

  function formatarMoeda(valor: number | null): string {
    if (valor === null) return "-";
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function getStatusStyle(status: string) {
    switch (status) {
      case "PE":
        return "bg-amber-100 text-amber-700 border border-amber-200";
      case "FA":
        return "bg-emerald-100 text-emerald-700 border border-emerald-200";
      case "CA":
        return "bg-red-100 text-red-700 border border-red-200";
      default:
        return "bg-slate-100 text-slate-700 border border-slate-200";
    }
  }

  // Lista única de empreendimentos para o filtro
  const empreendimentos = [...new Set(vendas.map((v) => v.empreendimento_nome))].sort();

  // Aplicar filtros
  const vendasFiltradas = vendas.filter((venda) => {
    // Filtro de status
    if (filtroStatus !== "todos" && venda.status !== filtroStatus) {
      return false;
    }

    // Filtro de forma de pagamento
    if (filtroPagamento !== "todos" && venda.forma_pagamento !== filtroPagamento) {
      return false;
    }

    // Filtro de empreendimento
    if (filtroEmpreendimento !== "todos" && venda.empreendimento_nome !== filtroEmpreendimento) {
      return false;
    }

    // Filtro de busca por nome
    if (filtroBusca.trim() !== "") {
      const busca = filtroBusca.toLowerCase();
      if (!venda.cliente_nome.toLowerCase().includes(busca)) {
        return false;
      }
    }

    return true;
  });

  // Verificar se há filtros ativos
  const temFiltrosAtivos =
    filtroStatus !== "todos" ||
    filtroPagamento !== "todos" ||
    filtroEmpreendimento !== "todos" ||
    filtroBusca.trim() !== "";

  // Limpar todos os filtros
  function limparFiltros() {
    setFiltroStatus("todos");
    setFiltroPagamento("todos");
    setFiltroEmpreendimento("todos");
    setFiltroBusca("");
  }

  // Atualizar venda no backend e no estado local
  async function atualizarVenda(
    vendaId: number,
    campo: keyof Venda,
    valor: string | number | null
  ) {
    // Atualizar no backend
    const response = await api.patch(`/vendas/${vendaId}/`, { [campo]: valor });

    // Atualizar no estado local
    setVendas((prev) =>
      prev.map((v) =>
        v.id === vendaId
          ? {
              ...v,
              [campo]: valor,
              // Atualizar campos display se necessário
              ...(campo === "status" && {
                status_display: response.data.status_display,
              }),
              ...(campo === "forma_pagamento" && {
                forma_pagamento_display: response.data.forma_pagamento_display,
              }),
            }
          : v
      )
    );

    // Recarregar dashboard para atualizar indicadores
    const dashboardRes = await api.get(`/tabelas-mensais/${id}/dashboard/`);
    setDashboard(dashboardRes.data);
  }

  // Opções para os selects
  const statusOptions = [
    { value: "PE", label: "Pendente" },
    { value: "FA", label: "Faturado" },
    { value: "CA", label: "Cancelado" },
  ];

  const pagamentoOptions = [
    { value: "AV", label: "À Vista" },
    { value: "FI", label: "Financiado" },
  ];

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="flex items-center gap-4 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="text-lg">Carregando dados...</span>
        </div>
      </div>
    );
  }

  if (erro || !dashboard) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-6">
        <div className="p-6 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-4">
          <AlertCircle className="w-6 h-6 text-red-500" />
          <p className="text-lg text-red-600">{erro || "Tabela não encontrada"}</p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate("/tabelas-mensais")}
          className="rounded-xl px-6 py-3"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Voltar
        </Button>
      </div>
    );
  }

  const { indicadores } = dashboard;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/tabelas-mensais")}
          className="mb-6 -ml-3 text-slate-600 hover:text-slate-800 text-base"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Voltar para Tabelas Mensais
        </Button>

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Calendar className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl xl:text-4xl font-bold text-slate-800">
              {formatarMes(dashboard.tabela.mes_referencia)}
            </h1>
            <p className="text-slate-500 mt-1">
              Detalhes e indicadores do mês
            </p>
          </div>
        </div>
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
                  {indicadores.total_vendas}
                </p>
                <p className="text-xs text-slate-400 mt-1">neste mês</p>
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
                  {indicadores.vendas_pendentes}
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
                  {indicadores.vendas_faturadas}
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
                  {formatarMoeda(indicadores.total_comissao)}
                </p>
                <p className="text-xs text-slate-400 mt-1">valor total do mês</p>
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
                  {formatarMoeda(indicadores.comissao_pendente)}
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
                  {formatarMoeda(indicadores.comissao_faturada)}
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
                <span className="text-lg font-bold text-blue-600">{indicadores.vendas_a_vista}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-violet-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-violet-600" />
                  <span className="text-slate-600 font-medium">Financiado</span>
                </div>
                <span className="text-lg font-bold text-violet-600">{indicadores.vendas_financiadas}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Vendas */}
      <Card className="border-0 shadow-lg shadow-slate-200/50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <CardTitle className="text-lg text-slate-800">Vendas do Mês</CardTitle>
                <p className="text-sm text-slate-500">
                  {temFiltrosAtivos
                    ? `${vendasFiltradas.length} de ${vendas.length} vendas`
                    : `${vendas.length} ${vendas.length === 1 ? "venda encontrada" : "vendas encontradas"}`}
                  <span className="ml-2 text-blue-500">
                    <Pencil className="w-3 h-3 inline" /> Clique para editar
                  </span>
                </p>
              </div>
            </div>
            {temFiltrosAtivos && (
              <Button
                variant="ghost"
                size="sm"
                onClick={limparFiltros}
                className="text-slate-500 hover:text-slate-700"
              >
                <X className="w-4 h-4 mr-1" />
                Limpar filtros
              </Button>
            )}
          </div>
        </CardHeader>

        {/* Seção de Filtros */}
        <div className="px-6 pb-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-600">Filtros</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Busca por nome */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">
                  Buscar cliente
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={filtroBusca}
                    onChange={(e) => setFiltroBusca(e.target.value)}
                    placeholder="Nome do cliente..."
                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Filtro de Status */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">
                  Status
                </label>
                <select
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="todos">Todos</option>
                  <option value="PE">Pendente</option>
                  <option value="FA">Faturado</option>
                  <option value="CA">Cancelado</option>
                </select>
              </div>

              {/* Filtro de Forma de Pagamento */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">
                  Forma de Pagamento
                </label>
                <select
                  value={filtroPagamento}
                  onChange={(e) => setFiltroPagamento(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="todos">Todas</option>
                  <option value="AV">À Vista</option>
                  <option value="FI">Financiado</option>
                </select>
              </div>

              {/* Filtro de Empreendimento */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">
                  Empreendimento
                </label>
                <select
                  value={filtroEmpreendimento}
                  onChange={(e) => setFiltroEmpreendimento(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="todos">Todos</option>
                  {empreendimentos.map((emp) => (
                    <option key={emp} value={emp}>
                      {emp}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <CardContent>
          {vendas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <ShoppingCart className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-lg font-medium">Nenhuma venda neste mês</p>
              <p className="text-sm">Importe planilhas para adicionar vendas</p>
            </div>
          ) : vendasFiltradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <Filter className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-lg font-medium">Nenhuma venda encontrada</p>
              <p className="text-sm">Ajuste os filtros para ver mais resultados</p>
              <Button
                variant="outline"
                size="sm"
                onClick={limparFiltros}
                className="mt-4"
              >
                Limpar filtros
              </Button>
            </div>
          ) : (
            <div className="overflow-auto max-h-[600px] rounded-xl border border-slate-100">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="text-left py-4 px-4 font-semibold text-slate-600">Cliente</th>
                    <th className="text-left py-4 px-4 font-semibold text-slate-600">Empreendimento</th>
                    <th className="text-left py-4 px-4 font-semibold text-slate-600">Unidade</th>
                    <th className="text-left py-4 px-4 font-semibold text-slate-600">Pagamento</th>
                    <th className="text-right py-4 px-4 font-semibold text-slate-600">Valor</th>
                    <th className="text-right py-4 px-4 font-semibold text-slate-600">Comissão</th>
                    <th className="text-center py-4 px-4 font-semibold text-slate-600">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vendasFiltradas.map((venda) => (
                    <tr key={venda.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-700 truncate block max-w-[180px]">
                          {venda.cliente_nome}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-slate-600 truncate block max-w-[150px]">
                          {venda.empreendimento_nome}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-slate-600">{venda.unidade}</span>
                      </td>
                      {/* Forma de Pagamento - Editável */}
                      <td className="py-3 px-4">
                        <EditableCell
                          value={venda.forma_pagamento}
                          type="select"
                          options={pagamentoOptions}
                          displayValue={venda.forma_pagamento_display || "-"}
                          onSave={async (val) => {
                            await atualizarVenda(venda.id, "forma_pagamento", val);
                          }}
                          className="text-slate-600"
                        />
                      </td>
                      {/* Valor da Venda - Editável */}
                      <td className="py-3 px-4 text-right">
                        <EditableCell
                          value={venda.valor_venda}
                          type="currency"
                          onSave={async (val) => {
                            await atualizarVenda(venda.id, "valor_venda", val);
                          }}
                          className="font-medium text-slate-700 justify-end"
                        />
                      </td>
                      {/* Valor da Comissão - Editável */}
                      <td className="py-3 px-4 text-right">
                        <EditableCell
                          value={venda.valor_comissao}
                          type="currency"
                          onSave={async (val) => {
                            await atualizarVenda(venda.id, "valor_comissao", val);
                          }}
                          className="font-semibold text-violet-600 justify-end"
                        />
                      </td>
                      {/* Status - Editável */}
                      <td className="py-3 px-4 text-center">
                        <EditableCell
                          value={venda.status}
                          type="select"
                          options={statusOptions}
                          displayValue={venda.status_display}
                          onSave={async (val) => {
                            await atualizarVenda(venda.id, "status", val);
                          }}
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyle(venda.status)}`}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
