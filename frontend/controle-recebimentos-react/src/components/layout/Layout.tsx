import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";

/**
 * Layout - Estrutura principal que envolve as páginas autenticadas
 */
export function Layout() {
  return (
    <div className="flex w-full min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 gap-4">
      {/* Sidebar fixa à esquerda */}
      <Sidebar />

      {/* Área de conteúdo principal */}
      <main className="flex-1 p-8 overflow-auto min-w-0">
        <div className="animate-fade-in w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}