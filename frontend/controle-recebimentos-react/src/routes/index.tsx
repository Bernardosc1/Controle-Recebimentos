import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import PrivateRoute from "../components/PrivateRoute";
import { Layout } from "../components/layout";

// Importar as páginas
import Login from "../pages/Login";
import Home from "../pages/Home";
import Dashboard from "../pages/Dashboard";
import TabelasMensais from "../pages/TabelasMensais";
import Vendas from "../pages/Vendas";
import Importar from "../pages/Importar";
import AnaliseEPR from "../pages/AnaliseEPR";
import AnaliseEPRDetalhes from "../pages/AnaliseEPRDetalhes";


/**
 * AppRoutes - Configuração de todas as rotas do sistema
 *
 * Estrutura:
 * - /login → Página de login (pública)
 * - /cadastro → Página de cadastro (pública)
 * - / → Redireciona para /dashboard
 * - /dashboard → Dashboard (protegida)
 * - /tabelas-mensais → Tabelas Mensais (protegida)
 * - /vendas → Vendas (protegida)
 * - /importar → Importação (protegida)
 * - /analise-epr → Análise EPR (protegida)
 *
 * O Layout envolve todas as rotas protegidas, fornecendo a sidebar
 */
function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rotas públicas (sem layout) */}
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Home />} />

        {/* Rotas protegidas (com layout) */}
        <Route
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          {/* Redireciona / para /dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Páginas do sistema */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tabelas-mensais" element={<TabelasMensais />} />
          <Route path="/vendas" element={<Vendas />} />
          <Route path="/importar" element={<Importar />} />
          <Route path="/analise-epr" element={<AnaliseEPR />} />
          <Route path="/analise-epr/:id" element={<AnaliseEPRDetalhes />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

/**
 * PlaceholderPage - Página temporária para rotas ainda não implementadas
 * Será substituída pelas páginas reais depois
 */
function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">{title}</h1>
      <p className="text-gray-600">Esta página será implementada em breve.</p>
    </div>
  );
}

export default AppRoutes;
