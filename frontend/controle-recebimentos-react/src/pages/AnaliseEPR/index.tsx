import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../services/api";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../../components/ui/card";
import {
  Upload,
  CheckCircle,
  XCircle,
  FileDown,
  Clock,
  Loader2,
  FileSearch,
  AlertCircle,
  History,
} from "lucide-react";

interface AnalisePreview {
  analise_id: number;
  message: string;
  resumo: {
    total_linhas_epr: number;
    vendas_encontradas: number;
    por_mes: Record<string, number>;
  };
  detalhes_por_mes: Record<string, Array<{
    venda_id: number;
    cliente: string;
    empreendimento: string;
    valor_comissao: number;
  }>>;
}

interface AnaliseHistorico {
  id: number;
  status: string;
  status_display: string;
  created_at: string;
  confirmado_em: string | null;
  total_encontradas: number;
  resumo_por_mes: Record<string, number>;
}

export default function AnaliseEPR() {
  const navigate = useNavigate();
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [preview, setPreview] = useState<AnalisePreview | null>(null);
  const [historico, setHistorico] = useState<AnaliseHistorico[]>([]);
  const [loadingHistorico, setLoadingHistorico] = useState(true);

  useEffect(() => {
    carregarHistorico();
  }, []);

  async function carregarHistorico() {
    try {
      setLoadingHistorico(true);
      const data = await db.analiseEPR.list();
      setHistorico(data as AnaliseHistorico[] || []);
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
    } finally {
      setLoadingHistorico(false);
    }
  }

  async function handleAnalisar() {
    if (!arquivo) return;

    try {
      setLoading(true);
      setErro("");
      setPreview(null);

      setPreview({
        analise_id: Date.now(),
        message: "Análise preparada (Funcionalidade em desenvolvimento)",
        resumo: {
          total_linhas_epr: 0,
          vendas_encontradas: 0,
          por_mes: {},
        },
        detalhes_por_mes: {},
      });
    } catch (error: any) {
      setErro(error.message || "Erro ao analisar arquivo");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmar() {
    if (!preview) return;

    try {
      setLoading(true);

      setPreview(null);
      setArquivo(null);
      carregarHistorico();

      const input = document.getElementById("arquivo-epr") as HTMLInputElement;
      if (input) input.value = "";
    } catch (error: any) {
      setErro(error.message || "Erro ao confirmar");
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelar() {
    if (!preview) return;

    try {
      setLoading(true);

      setPreview(null);
      setArquivo(null);
      carregarHistorico();

      const input = document.getElementById("arquivo-epr") as HTMLInputElement;
      if (input) input.value = "";
    } catch (error: any) {
      setErro(error.message || "Erro ao cancelar");
    } finally {
      setLoading(false);
    }
  }

  function formatarData(data: string): string {
    return new Date(data).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatarMoeda(valor: number): string {
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function getStatusStyle(status: string): string {
    switch (status) {
      case "PE":
        return "bg-amber-100 text-amber-700 border border-amber-200";
      case "CO":
        return "bg-emerald-100 text-emerald-700 border border-emerald-200";
      case "CA":
        return "bg-red-100 text-red-700 border border-red-200";
      default:
        return "bg-slate-100 text-slate-700 border border-slate-200";
    }
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Análise EPR</h1>
        <p className="text-slate-500 mt-1">Analise e fature vendas financiadas através do arquivo EPR</p>
      </div>

      {/* Card de Upload */}
      <Card className="mb-6 border-0 shadow-lg shadow-slate-200/50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
              <FileSearch className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <CardTitle className="text-lg text-slate-800">Analisar Arquivo EPR</CardTitle>
              <CardDescription>
                Faça upload do arquivo EPR (.xls) para visualizar as vendas que serão faturadas
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Arquivo EPR
              </label>
              <input
                id="arquivo-epr"
                type="file"
                accept=".xls,.xlsx"
                onChange={(e) => {
                  setArquivo(e.target.files?.[0] || null);
                  setPreview(null);
                  setErro("");
                }}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all text-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-violet-100 file:text-violet-700 file:font-medium hover:file:bg-violet-200 file:cursor-pointer"
              />
            </div>
            <Button
              onClick={handleAnalisar}
              disabled={!arquivo || loading}
              className="bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-700 hover:to-violet-600 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-violet-500/30 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analisando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Analisar
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Erro */}
      {erro && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-600">{erro}</p>
        </div>
      )}

      {/* Preview da Análise */}
      {preview && (
        <Card className="mb-6 border-0 shadow-lg shadow-slate-200/50 bg-gradient-to-br from-blue-50 to-white animate-fade-in">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg text-slate-800">Preview - Aguardando Confirmação</CardTitle>
                <CardDescription>
                  {preview.resumo.vendas_encontradas} vendas encontradas de {preview.resumo.total_linhas_epr} linhas no arquivo
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Resumo por mês */}
            <div className="mb-6">
              <h4 className="font-medium text-slate-700 mb-3">Resumo por Mês:</h4>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(preview.resumo.por_mes).map(([mes, qtd]) => (
                  <span
                    key={mes}
                    className="px-4 py-2 bg-white border border-blue-100 text-blue-700 rounded-xl text-sm font-medium shadow-sm"
                  >
                    {mes}: {qtd} {qtd === 1 ? "venda" : "vendas"}
                  </span>
                ))}
              </div>
            </div>

            {/* Detalhes */}
            {Object.entries(preview.detalhes_por_mes).map(([mes, vendas]) => (
              <div key={mes} className="mb-6">
                <h4 className="font-semibold text-slate-700 mb-3">{mes}</h4>
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left py-3 px-4 font-semibold text-slate-600">Cliente</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-600">Empreendimento</th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-600">Comissão</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {vendas.map((v) => (
                        <tr key={v.venda_id} className="hover:bg-slate-50">
                          <td className="py-3 px-4 text-slate-700">{v.cliente}</td>
                          <td className="py-3 px-4 text-slate-600">{v.empreendimento}</td>
                          <td className="py-3 px-4 text-right font-semibold text-violet-600">
                            {formatarMoeda(v.valor_comissao)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </CardContent>
          <CardFooter className="gap-4 pt-2">
            <Button
              onClick={handleConfirmar}
              disabled={loading}
              className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-emerald-500/30 transition-all"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Confirmar Faturamento
            </Button>
            <Button
              variant="outline"
              onClick={handleCancelar}
              disabled={loading}
              className="border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 px-6 py-3 rounded-xl transition-all"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Histórico */}
      <Card className="border-0 shadow-lg shadow-slate-200/50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
              <History className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <CardTitle className="text-lg text-slate-800">Histórico de Análises</CardTitle>
              <p className="text-sm text-slate-500">
                {historico.length} {historico.length === 1 ? "análise realizada" : "análises realizadas"}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingHistorico ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3 text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Carregando histórico...</span>
              </div>
            </div>
          ) : historico.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <History className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-lg font-medium">Nenhuma análise realizada</p>
              <p className="text-sm">Faça upload de um arquivo EPR para começar</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left py-4 px-4 font-semibold text-slate-600">ID</th>
                    <th className="text-left py-4 px-4 font-semibold text-slate-600">Data</th>
                    <th className="text-left py-4 px-4 font-semibold text-slate-600">Vendas</th>
                    <th className="text-center py-4 px-4 font-semibold text-slate-600">Status</th>
                    <th className="text-right py-4 px-4 font-semibold text-slate-600">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {historico.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-4">
                        <span className="font-medium text-slate-700">#{item.id}</span>
                      </td>
                      <td className="py-4 px-4 text-slate-600">{formatarData(item.created_at)}</td>
                      <td className="py-4 px-4">
                        <span className="font-semibold text-violet-600">{item.total_encontradas}</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyle(item.status)}`}>
                          {item.status_display}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        {item.status === "CO" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/analise-epr/${item.id}`)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                          >
                            <FileDown className="w-4 h-4 mr-1" />
                            Relatórios
                          </Button>
                        )}
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