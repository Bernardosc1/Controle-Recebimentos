import { useState } from "react";
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
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Loader2,
  Calendar,
  File,
  Users,
  CreditCard,
  Banknote,
} from "lucide-react";

const tiposImportacao = [
  {
    id: "acompanhamento",
    nome: "Acompanhamento de Vendas",
    descricao: "Importa clientes, empreendimentos e vendas iniciais",
    endpoint: "/import/acompanhamento/",
    requerMes: true,
    icon: Users,
    color: "blue",
  },
  {
    id: "controle-gestores",
    nome: "Controle Gestores",
    descricao: "Atualiza forma de pagamento e valor das vendas",
    endpoint: "/import/controle-gestores/",
    requerMes: true,
    icon: CreditCard,
    color: "violet",
  },
  {
    id: "webropay",
    nome: "WebroPay",
    descricao: "Fatura vendas à vista encontradas na planilha",
    endpoint: "/import/webropay/",
    requerMes: false,
    icon: Banknote,
    color: "emerald",
  },
];

interface ResultadoImportacao {
  success: boolean;
  message: string;
  detalhes?: Record<string, unknown>;
}

export default function Importar() {
  const [tipoSelecionado, setTipoSelecionado] = useState<string>("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [mesReferencia, setMesReferencia] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<ResultadoImportacao | null>(null);

  function getTipoAtual() {
    return tiposImportacao.find((t) => t.id === tipoSelecionado);
  }

  function handleArquivoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (files && files.length > 0) {
      setArquivo(files[0]);
      setResultado(null);
    }
  }

  async function handleImportar() {
    const tipo = getTipoAtual();

    if (!tipo || !arquivo) {
      return;
    }

    if (tipo.requerMes && !mesReferencia) {
      setResultado({
        success: false,
        message: "Selecione o mês de referência",
      });
      return;
    }

    try {
      setLoading(true);
      setResultado(null);

      const formData = new FormData();
      formData.append("file", arquivo);

      if (tipo.requerMes) {
        formData.append("mes_referencia", mesReferencia);
      }

      const response = await api.post(tipo.endpoint, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setResultado({
        success: true,
        message: response.data.message || "Importação concluída com sucesso!",
        detalhes: response.data,
      });

      setArquivo(null);
      const inputFile = document.getElementById("arquivo") as HTMLInputElement;
      if (inputFile) inputFile.value = "";
    } catch (error: any) {
      setResultado({
        success: false,
        message: error.response?.data?.error || "Erro ao importar arquivo",
        detalhes: error.response?.data,
      });
    } finally {
      setLoading(false);
    }
  }

  function getColorClasses(color: string, isSelected: boolean) {
    const colors: Record<string, { bg: string; icon: string; ring: string; hover: string }> = {
      blue: {
        bg: isSelected ? "bg-blue-50" : "bg-white",
        icon: "bg-blue-100 text-blue-600",
        ring: "ring-blue-500 border-blue-200",
        hover: "hover:border-blue-200",
      },
      violet: {
        bg: isSelected ? "bg-violet-50" : "bg-white",
        icon: "bg-violet-100 text-violet-600",
        ring: "ring-violet-500 border-violet-200",
        hover: "hover:border-violet-200",
      },
      emerald: {
        bg: isSelected ? "bg-emerald-50" : "bg-white",
        icon: "bg-emerald-100 text-emerald-600",
        ring: "ring-emerald-500 border-emerald-200",
        hover: "hover:border-emerald-200",
      },
    };
    return colors[color] || colors.blue;
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Importar Planilhas</h1>
        <p className="text-slate-500 mt-1">Selecione o tipo de importação e envie seu arquivo</p>
      </div>

      {/* Seleção do tipo de importação */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {tiposImportacao.map((tipo) => {
          const IconComponent = tipo.icon;
          const isSelected = tipoSelecionado === tipo.id;
          const colors = getColorClasses(tipo.color, isSelected);

          return (
            <Card
              key={tipo.id}
              className={`cursor-pointer transition-all duration-200 border-0 shadow-lg shadow-slate-200/50 ${colors.bg} ${
                isSelected ? `ring-2 ${colors.ring}` : colors.hover
              }`}
              onClick={() => {
                setTipoSelecionado(tipo.id);
                setResultado(null);
              }}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors.icon}`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base text-slate-800 mb-1">
                      {tipo.nome}
                    </CardTitle>
                    <CardDescription className="text-sm">{tipo.descricao}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      {/* Formulário de upload */}
      {tipoSelecionado && (
        <Card className="border-0 shadow-lg shadow-slate-200/50 animate-fade-in">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                <Upload className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <CardTitle className="text-lg text-slate-800">Upload de Arquivo</CardTitle>
                <CardDescription>
                  Selecione o arquivo Excel (.xlsx ou .xls) para importar
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {/* Campo de mês */}
              {getTipoAtual()?.requerMes && (
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Mês de Referência
                  </label>
                  <input
                    type="month"
                    value={mesReferencia}
                    onChange={(e) => setMesReferencia(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-700"
                  />
                </div>
              )}

              {/* Campo de arquivo */}
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  <File className="w-4 h-4 inline mr-2" />
                  Arquivo Excel
                </label>
                <div className="relative">
                  <input
                    id="arquivo"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleArquivoChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-100 file:text-blue-700 file:font-medium hover:file:bg-blue-200 file:cursor-pointer"
                  />
                </div>
                {arquivo && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                    <span>{arquivo.name}</span>
                  </div>
                )}
              </div>

              {/* Botão de importar */}
              <Button
                onClick={handleImportar}
                disabled={!arquivo || loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white py-3 rounded-xl font-medium shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 mr-2" />
                    Importar Arquivo
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resultado da importação */}
      {resultado && (
        <Card
          className={`mt-6 border-0 shadow-lg shadow-slate-200/50 animate-fade-in ${
            resultado.success
              ? "bg-gradient-to-br from-emerald-50 to-white"
              : "bg-gradient-to-br from-red-50 to-white"
          }`}
        >
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  resultado.success ? "bg-emerald-100" : "bg-red-100"
                }`}
              >
                {resultado.success ? (
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-red-600" />
                )}
              </div>
              <div className="flex-1">
                <p
                  className={`font-semibold text-lg ${
                    resultado.success ? "text-emerald-700" : "text-red-700"
                  }`}
                >
                  {resultado.success ? "Sucesso!" : "Erro na importação"}
                </p>
                <p
                  className={`mt-1 ${
                    resultado.success ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {resultado.message}
                </p>
                {resultado.detalhes && (
                  <pre className="mt-4 text-sm text-slate-600 bg-white/80 p-4 rounded-xl overflow-auto border border-slate-100">
                    {JSON.stringify(resultado.detalhes, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}