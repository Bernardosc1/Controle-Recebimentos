import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Table,
  ShoppingCart,
  Upload,
  FileSearch,
  LogOut,
  TrendingUp,
} from "lucide-react";
import { Button } from "../ui/button";

/**
 * Sidebar - Menu lateral de navegação moderno
 */

// Lista de itens do menu
const menuItems = [
  {
    path: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    path: "/tabelas-mensais",
    label: "Tabelas Mensais",
    icon: Table,
  },
  {
    path: "/vendas",
    label: "Vendas",
    icon: ShoppingCart,
  },
  {
    path: "/importar",
    label: "Importar",
    icon: Upload,
  },
  {
    path: "/analise-epr",
    label: "Análise EPR",
    icon: FileSearch,
  },
];

export function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    navigate("/login");
  };

  return (
    <aside className="w-72 min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col shadow-xl">
      {/* Logo/Título */}
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">
              Controle de
            </h1>
            <p className="text-sm text-blue-400 font-medium -mt-1">
              Comissões
            </p>
          </div>
        </div>
      </div>

      {/* Menu de navegação */}
      <nav className="flex-1 p-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-4">
          Menu Principal
        </p>
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30 font-medium"
                      : "text-slate-400 hover:bg-slate-700/50 hover:text-white"
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Botão de logout no rodapé */}
      <div className="p-4 border-t border-slate-700/50">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl py-3"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5" />
          <span>Sair do Sistema</span>
        </Button>
      </div>
    </aside>
  );
}
