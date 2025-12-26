import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../../services/api";
import { Button } from "../../components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/ui/card";
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
      if (!id) throw new Error("ID não informado");
      const data = await db.analiseEPR.getById(id);
      setAnalise(data as AnaliseDetalhes | null);
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
      alert(`Download preparado para ${formatarMes(mes)} (Funcionalidade em desenvolvimento)`);
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
      <div className="w-full flex items-center justify-center py-20">
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Carregando detalhes...</span>
        </div>
      </div>
    );
  }

  if (erro || !analise) {
    return (
      <div className="w-full">
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-600">{erro || "Análise não encontrada"}</p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate("/analise-epr")}
          className="rounded-xl"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
      </div>
    );
  }

  const dadosPorMes = getDadosPorMes();
  const mesesOrdenados = Object.keys(dadosPorMes).sort();

  return (
    <div className="w-full">
      {/* Header com botão voltar */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/analise-epr")}
          className="mb-4 -ml-2 text-slate-600 hover:text-slate-800"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Análises
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              Análise EPR #{analise.id}
            </h1>
            <p className="text-slate-500 mt-1">
              Criada em {formatarData(analise.created_at)}
              {analise.confirmado_em && ` • Confirmada em ${formatarData(analise.confirmado_em)}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            <span className="text-emerald-600 font-medium">Confirmada</span>
          </div>
        </div>
      </div>

      {/* Resumo */}
      <Card className="mb-6 border-0 shadow-lg shadow-slate-200/50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <CardTitle className="text-lg text-slate-800">Resumo da Análise</CardTitle>
              <CardDescription>
                {analise.total_encontradas} vendas faturadas em {mesesOrdenados.length} {mesesOrdenados.length === 1 ? "mês" : "meses"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Planilhas por mês - Colapsável */}
      <div className="space-y-3">
        {mesesOrdenados.map((mes) => {
          const dados = dadosPorMes[mes];
          const totalComissao = calcularTotalComissao(dados);
          const isDownloading = downloadingMes === mes;
          const isExpanded = mesesExpandidos.includes(mes);

          return (
            <Card key={mes} className="border-0 shadow-lg shadow-slate-200/50 overflow-hidden">
              {/* Header clicável */}
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => toggleMes(mes)}
              >
                <div className="flex items-center gap-3">
                  {/* Ícone de expandir/colapsar */}
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center transition-transform">
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-slate-500" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-slate-500" />
                    )}
                  </div>
                  {/* Ícone do calendário */}
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  {/* Info do mês */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">
                      {mes === "sem-mes" ? "Sem mês definido" : formatarMes(mes)}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {dados.length} {dados.length === 1 ? "venda" : "vendas"} • Total: <span className="font-semibold text-violet-600">{formatarMoeda(totalComissao)}</span>
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
                  className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-4 py-2 rounded-xl font-medium shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Baixando...
                    </>
                  ) : (
                    <>
                      <FileDown className="w-4 h-4 mr-2" />
                      Baixar Planilha
                    </>
                  )}
                </Button>
              </div>

              {/* Conteúdo colapsável */}
              {isExpanded && (
                <CardContent className="pt-0 pb-4 px-4 animate-fade-in">
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
                        {dados.map((d) => (
                          <tr key={d.venda_id} className="hover:bg-slate-50">
                            <td className="py-3 px-4 text-slate-700">{d.nome_mutuario}</td>
                            <td className="py-3 px-4 text-slate-600">{d.empreendimento_sistema}</td>
                            <td className="py-3 px-4 text-right font-semibold text-violet-600">
                              {formatarMoeda(d.valor_comissao)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-50">
                        <tr>
                          <td colSpan={2} className="py-3 px-4 font-semibold text-slate-700">
                            Total
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-violet-600">
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