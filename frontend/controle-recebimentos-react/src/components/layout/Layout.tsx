import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";

/**
 * Layout - Estrutura principal que envolve as páginas autenticadas
 */
export function Layout() {
  return (
    <div className="flex w-full min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Sidebar fixa à esquerda */}
      <Sidebar />

      {/* Área de conteúdo principal */}
      <main className="flex-1 overflow-auto min-w-0">
        <div className="animate-fade-in w-full h-full py-8 px-8 lg:py-12 lg:px-12 xl:py-16 xl:pl-16 xl:pr-24 2xl:pr-32">
          <Outlet />
        </div>
      </main>
    </div>
  );
}