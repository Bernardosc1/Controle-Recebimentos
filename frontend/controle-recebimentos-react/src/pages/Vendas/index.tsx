import { useEffect, useState } from "react";
import { db } from "../../services/api";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/card";
import {
  Filter,
  X,
  Loader2,
  ShoppingCart,
  AlertCircle
} from "lucide-react";

interface TabelaMensal {
  id: string;
  mes_referencia: string;
}

interface Venda {
  id: string;
  clientes: { nome: string };
  empreendimentos: { nome: string };
  unidade: string;
  forma_pagamento: string;
  status: string;
  valor_venda: number | null;
  valor_comissao: number | null;
  tabela_mensal_id: string | null;
}

export default function Vendas() {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [tabelas, setTabelas] = useState<TabelaMensal[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const [filtroTabela, setFiltroTabela] = useState<string>("");
  const [filtroStatus, setFiltroStatus] = useState<string>("");

  useEffect(() => {
    carregarTabelas();
    carregarVendas();
  }, []);

  useEffect(() => {
    carregarVendas();
  }, [filtroTabela, filtroStatus]);

  async function carregarTabelas() {
    try {
      const data = await db.tabelasMensais.list();
      setTabelas(data || []);
    } catch (error) {
      console.error("Erro ao carregar tabelas:", error);
    }
  }

  async function carregarVendas() {
    try {
      setLoading(true);
      const filters = {};
      if (filtroTabela) Object.assign(filters, { tabelaMensalId: filtroTabela });
      if (filtroStatus) Object.assign(filters, { status: filtroStatus });

      const data = await db.vendas.list(filters);
      setVendas(data || []);
      setErro("");
    } catch (error) {
      setErro("Erro ao carregar vendas");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  function formatarMoeda(valor: number | null): string {
    if (valor === null) return "-";
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function formatarMes(mesReferencia: string): string {
    const [ano, mes] = mesReferencia.split("-");
    const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
                   "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return `${meses[parseInt(mes) - 1]}/${ano}`;
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

  const temFiltrosAtivos = filtroTabela || filtroStatus;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Vendas</h1>
        <p className="text-slate-500 mt-1">Gerencie todas as vendas cadastradas</p>
      </div>

      {/* Card de Filtros */}
      <Card className="mb-6 border-0 shadow-lg shadow-slate-200/50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Filter className="w-5 h-5 text-blue-600" />
              </div>
              <CardTitle className="text-lg text-slate-800">Filtros</CardTitle>
            </div>
            {temFiltrosAtivos && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFiltroTabela("");
                  setFiltroStatus("");
                }}
                className="text-slate-500 hover:text-slate-700"
              >
                <X className="w-4 h-4 mr-1" />
                Limpar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Tabela Mensal
              </label>
              <select
                value={filtroTabela}
                onChange={(e) => setFiltroTabela(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-700"
              >
                <option value="">Todas</option>
                {tabelas.map((tabela) => (
                  <option key={tabela.id} value={tabela.id}>
                    {formatarMes(tabela.mes_referencia)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Status
              </label>
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-700"
              >
                <option value="">Todos</option>
                <option value="PE">Pendente</option>
                <option value="FA">Faturado</option>
                <option value="CA">Cancelado</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mensagem de erro */}
      {erro && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-600">{erro}</p>
        </div>
      )}

      {/* Tabela de Vendas */}
      <Card className="border-0 shadow-lg shadow-slate-200/50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <CardTitle className="text-lg text-slate-800">Lista de Vendas</CardTitle>
                <p className="text-sm text-slate-500">
                  {vendas.length} {vendas.length === 1 ? "venda encontrada" : "vendas encontradas"}
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3 text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Carregando vendas...</span>
              </div>
            </div>
          ) : vendas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <ShoppingCart className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-lg font-medium">Nenhuma venda encontrada</p>
              <p className="text-sm">Tente ajustar os filtros</p>
            </div>
          ) : (
            <div className="overflow-auto max-h-[900px] rounded-xl border border-slate-100">
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
                  {vendas.map((venda) => (
                    <tr key={venda.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-4">
                        <span className="font-medium text-slate-700 truncate block max-w-[180px]">
                          {venda.clientes?.nome || "-"}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-slate-600 truncate block max-w-[150px]">
                          {venda.empreendimentos?.nome || "-"}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-slate-600">{venda.unidade || "-"}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-slate-600">{venda.forma_pagamento === 'AV' ? 'À Vista' : venda.forma_pagamento === 'FI' ? 'Financiado' : venda.forma_pagamento || "-"}</span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="font-medium text-slate-700">
                          {formatarMoeda(venda.valor_venda)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="font-semibold text-violet-600">
                          {formatarMoeda(venda.valor_comissao)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyle(venda.status)}`}>
                          {venda.status === 'PE' ? 'Pendente' : venda.status === 'FA' ? 'Faturado' : venda.status}
                        </span>
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