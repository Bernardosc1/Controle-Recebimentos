import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import {
  ArrowLeft,
  FileDown,
  Loader2,
  AlertCircle,
  Calendar,
  FileSpreadsheet,
  CheckCircle,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

interface AnaliseDetalhes {
  id: number;
  status: string;
  status_display: string;
  created_at: string;
  confirmado_em: string | null;
  total_encontradas: number;
  resumo_por_mes: Record<string, number>;
  dados_epr: Array<{
    venda_id: number;
    nome_mutuario: string;
    empreendimento_sistema: string;
    valor_comissao: number;
    mes_referencia: string | null;
  }>;
}

export default function AnaliseEPRDetalhes() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [analise, setAnalise] = useState<AnaliseDetalhes | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [downloadingMes, setDownloadingMes] = useState<string | null>(null);
  const [mesesExpandidos, setMesesExpandidos] = useState<string[]>([]);

  useEffect(() => {
    carregarAnalise();
  }, [id]);

  function toggleMes(mes: string) {
    setMesesExpandidos((prev) =>
      prev.includes(mes) ? prev.filter((m) => m !== mes) : [...prev, mes]
    );
  }

  async function carregarAnalise() {
    try {
      setLoading(true);
      const response = await api.get(`/analises-epr/${id}/`);
      setAnalise(response.data);
      setErro("");
    } catch (error) {
      setErro("Erro ao carregar detalhes da análise");
      console.error(error);
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

  function formatarMes(mesReferencia: string): string {
    const [ano, mes] = mesReferencia.split("-");
    const meses = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    return `${meses[parseInt(mes) - 1]} de ${ano}`;
  }

  function formatarMoeda(valor: number): string {
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  async function handleDownload(mes: string) {
    setDownloadingMes(mes);
    try {
      const response = await api.get(`/export/analise-epr/${id}/?mes=${mes}`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${mes.replace("-", ".")} - Planilha Recebimentos.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erro ao baixar planilha:", error);
      setErro("Erro ao baixar planilha");
    } finally {
      setDownloadingMes(null);
    }
  }

  // Agrupar dados por mês
  function getDadosPorMes() {
    if (!analise?.dados_epr) return {};

    const porMes: Record<string, typeof analise.dados_epr> = {};

    for (const dado of analise.dados_epr) {
      const mes = dado.mes_referencia || "sem-mes";
      if (!porMes[mes]) {
        porMes[mes] = [];
      }
      porMes[mes].push(dado);
    }

    return porMes;
  }

  function calcularTotalComissao(dados: AnaliseDetalhes["dados_epr"]): number {
    return dados.reduce((total, d) => total + (d.valor_comissao || 0), 0);
  }

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="flex items-center gap-4 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="text-lg">Carregando detalhes...</span>
        </div>
      </div>
    );
  }

  if (erro || !analise) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-6">
        <div className="p-6 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-4">
          <AlertCircle className="w-6 h-6 text-red-500" />
          <p className="text-lg text-red-600">{erro || "Análise não encontrada"}</p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate("/analise-epr")}
          className="rounded-xl px-6 py-3"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Voltar
        </Button>
      </div>
    );
  }

  const dadosPorMes = getDadosPorMes();
  const mesesOrdenados = Object.keys(dadosPorMes).sort();
  const totalGeral = mesesOrdenados.reduce((acc, mes) => acc + calcularTotalComissao(dadosPorMes[mes]), 0);

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="mb-12">
        <Button
          variant="ghost"
          onClick={() => navigate("/analise-epr")}
          className="mb-8 -ml-3 text-slate-600 hover:text-slate-800 text-base"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Voltar para Análises
        </Button>

        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div>
            <h1 className="text-4xl xl:text-5xl font-bold text-slate-800 mb-3">
              Análise EPR #{analise.id}
            </h1>
            <p className="text-lg text-slate-500">
              Criada em {formatarData(analise.created_at)}
              {analise.confirmado_em && ` • Confirmada em ${formatarData(analise.confirmado_em)}`}
            </p>
          </div>
          <div className="flex items-center gap-3 bg-emerald-50 px-5 py-3 rounded-2xl shrink-0">
            <CheckCircle className="w-6 h-6 text-emerald-500" />
            <span className="text-lg text-emerald-600 font-semibold">Confirmada</span>
          </div>
        </div>
      </div>

      {/* Resumo com cards de métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Card className="border-0 shadow-xl shadow-slate-200/50 rounded-2xl">
          <CardContent className="p-8">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center">
                <FileSpreadsheet className="w-8 h-8 text-violet-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500 uppercase tracking-wide font-medium">Total de Vendas</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">{analise.total_encontradas}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl shadow-slate-200/50 rounded-2xl">
          <CardContent className="p-8">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center">
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500 uppercase tracking-wide font-medium">Meses</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">{mesesOrdenados.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl shadow-slate-200/50 rounded-2xl">
          <CardContent className="p-8">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500 uppercase tracking-wide font-medium">Total Comissões</p>
                <p className="text-2xl xl:text-3xl font-bold text-emerald-600 mt-1">{formatarMoeda(totalGeral)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Título da seção */}
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Planilhas por Mês</h2>

      {/* Planilhas por mês - Colapsável */}
      <div className="space-y-5 flex-1">
        {mesesOrdenados.map((mes) => {
          const dados = dadosPorMes[mes];
          const totalComissao = calcularTotalComissao(dados);
          const isDownloading = downloadingMes === mes;
          const isExpanded = mesesExpandidos.includes(mes);

          return (
            <Card key={mes} className="border-0 shadow-xl shadow-slate-200/50 overflow-hidden rounded-2xl">
              {/* Header clicável */}
              <div
                className="flex flex-col lg:flex-row lg:items-center justify-between p-10 xl:p-8 cursor-pointer hover:bg-slate-50/80 transition-colors gap-10"
                onClick={() => toggleMes(mes)}
              >
                <div className="flex items-center gap-5">
                  {/* Ícone de expandir/colapsar */}
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                    {isExpanded ? (
                      <ChevronDown className="w-6 h-6 text-slate-500" />
                    ) : (
                      <ChevronRight className="w-6 h-6 text-slate-500" />
                    )}
                  </div>
                  {/* Ícone do calendário */}
                  <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center">
                    <Calendar className="w-7 h-7 text-blue-600" />
                  </div>
                  {/* Info do mês */}
                  <div>
                    <h3 className="text-xl xl:text-2xl font-bold text-slate-800">
                      {mes === "sem-mes" ? "Sem mês definido" : formatarMes(mes)}
                    </h3>
                    <p className="text-base text-slate-500 mt-1">
                      {dados.length} {dados.length === 1 ? "venda" : "vendas"} • Total: <span className="font-bold text-violet-600">{formatarMoeda(totalComissao)}</span>
                    </p>
                  </div>
                </div>
                {/* Botão de download */}
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(mes);
                  }}
                  disabled={isDownloading || mes === "sem-mes"}
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-8 py-3 rounded-xl font-semibold shadow-xl shadow-blue-500/30 transition-all disabled:opacity-50 text-base mr-6"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Baixando...
                    </>
                  ) : (
                    <>
                      <FileDown className="w-5 h-5 mr-2" />
                      Baixar Planilha
                    </>
                  )}
                </Button>
              </div>

              {/* Conteúdo colapsável */}
              {isExpanded && (
                <CardContent className="pt-0 pb-8 px-6 xl:px-8 animate-fade-in">
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="text-left py-5 px-6 font-bold text-slate-700 text-base">Cliente</th>
                          <th className="text-left py-5 px-6 font-bold text-slate-700 text-base">Empreendimento</th>
                          <th className="text-right py-5 px-6 font-bold text-slate-700 text-base">Comissão</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {dados.map((d) => (
                          <tr key={d.venda_id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-5 px-6 text-slate-700 text-base">{d.nome_mutuario}</td>
                            <td className="py-5 px-6 text-slate-600 text-base">{d.empreendimento_sistema}</td>
                            <td className="py-5 px-6 text-right font-bold text-violet-600 text-base">
                              {formatarMoeda(d.valor_comissao)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-100">
                        <tr>
                          <td colSpan={2} className="py-5 px-6 font-bold text-slate-800 text-base">
                            Total do Mês
                          </td>
                          <td className="py-5 px-6 text-right font-bold text-violet-600 text-lg">
                            {formatarMoeda(totalComissao)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}