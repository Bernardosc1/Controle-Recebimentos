import { useEffect, useState } from "react";
import api from "../../services/api";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../../components/ui/card";
import {
  Plus,
  Trash2,
  Calendar,
  Loader2,
  AlertCircle,
  Table,
} from "lucide-react";

interface TabelaMensal {
  id: number;
  mes_referencia: string;
  created_at: string;
}

export default function TabelasMensais() {
  const [tabelas, setTabelas] = useState<TabelaMensal[]>([]);
  const [novoMes, setNovoMes] = useState("");
  const [loading, setLoading] = useState(true);
  const [criando, setCriando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    carregarTabelas();
  }, []);

  async function carregarTabelas() {
    try {
      setLoading(true);
      const response = await api.get("/tabelas-mensais/");
      setTabelas(response.data);
      setErro("");
    } catch (error) {
      setErro("Erro ao carregar tabelas");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function criarTabela(e: React.FormEvent) {
    e.preventDefault();

    if (!novoMes) {
      setErro("Selecione um mês");
      return;
    }

    try {
      setCriando(true);
      await api.post("/tabelas-mensais/", { mes_referencia: novoMes });
      setNovoMes("");
      carregarTabelas();
      setErro("");
    } catch (error: any) {
      setErro(error.response?.data?.error || "Erro ao criar tabela");
    } finally {
      setCriando(false);
    }
  }

  async function excluirTabela(id: number) {
    if (!confirm("Tem certeza que deseja excluir esta tabela?")) {
      return;
    }

    try {
      await api.delete(`/tabelas-mensais/${id}/`);
      carregarTabelas();
    } catch (error: any) {
      setErro(error.response?.data?.error || "Erro ao excluir tabela");
    }
  }

  function formatarMes(mesReferencia: string): string {
    const [ano, mes] = mesReferencia.split("-");
    const meses = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    return `${meses[parseInt(mes) - 1]} ${ano}`;
  }

  function formatarMesAbreviado(mesReferencia: string): string {
    const [ano, mes] = mesReferencia.split("-");
    const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return `${meses[parseInt(mes) - 1]}/${ano}`;
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Tabelas Mensais</h1>
        <p className="text-slate-500 mt-1">Organize as vendas por mês de referência</p>
      </div>

      {/* Card para criar nova tabela */}
      <Card className="mb-6 border-0 shadow-lg shadow-slate-200/50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Plus className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg text-slate-800">Nova Tabela Mensal</CardTitle>
              <CardDescription>
                Crie uma tabela para organizar as vendas de um mês específico
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={criarTabela} className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-600 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Mês de Referência
              </label>
              <input
                type="month"
                value={novoMes}
                onChange={(e) => setNovoMes(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-700"
              />
            </div>
            <Button
              type="submit"
              disabled={criando}
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-blue-500/30 transition-all"
            >
              {criando ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Tabela
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Mensagem de erro */}
      {erro && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-600">{erro}</p>
        </div>
      )}

      {/* Lista de tabelas */}
      <Card className="border-0 shadow-lg shadow-slate-200/50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
              <Table className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <CardTitle className="text-lg text-slate-800">Tabelas Existentes</CardTitle>
              <p className="text-sm text-slate-500">
                {tabelas.length} {tabelas.length === 1 ? "tabela criada" : "tabelas criadas"}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3 text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Carregando tabelas...</span>
              </div>
            </div>
          ) : tabelas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <Calendar className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-lg font-medium">Nenhuma tabela criada</p>
              <p className="text-sm">Crie uma tabela mensal para começar</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tabelas.map((tabela) => (
                <div
                  key={tabela.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <Calendar className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-700">
                        {formatarMesAbreviado(tabela.mes_referencia)}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatarMes(tabela.mes_referencia)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => excluirTabela(tabela.id)}
                    className="text-slate-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}