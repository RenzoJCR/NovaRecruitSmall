import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { RealtimeNotificationsProvider, useRealtimeNotifications } from "../../context/realtimeContext";

function ConnectionBadge() {
  const { estadoConexion } = useRealtimeNotifications();

  const label =
    estadoConexion === "conectado"
      ? "WebSocket activo"
      : estadoConexion === "reconectando"
        ? "Reconectando"
        : estadoConexion === "error"
          ? "Error de conexión"
          : "Conectando";

  const tone =
    estadoConexion === "conectado"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : estadoConexion === "reconectando"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : estadoConexion === "error"
          ? "border-rose-200 bg-rose-50 text-rose-700"
          : "border-slate-200 bg-white text-slate-500";

  const dotTone =
    estadoConexion === "conectado"
      ? "bg-emerald-500"
      : estadoConexion === "reconectando"
        ? "bg-amber-500"
        : estadoConexion === "error"
          ? "bg-rose-500"
          : "bg-slate-400";

  return (
    <div className={`fixed top-4 right-4 z-50 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] shadow-lg backdrop-blur ${tone}`}>
      <span className={`h-2 w-2 rounded-full ${dotTone}`} />
      {label}
    </div>
  );
}

function DashboardLayout() {
  return (
    <RealtimeNotificationsProvider>
      <ConnectionBadge />
      <div className="min-h-screen bg-slate-50 flex">
        {/* Componente Fijo de Navegación Lateral */}
        <Sidebar />

        {/* Área de Trabajo Desplazable */}
        <main className="flex-1 overflow-y-auto h-screen p-8 lg:p-12">
          <div className="max-w-7xl mx-auto">
            {/* El componente Outlet actúa como un "proyector" dinámico de las sub-rutas */}
            <Outlet />
          </div>
        </main>
      </div>
    </RealtimeNotificationsProvider>
  );
}

export default DashboardLayout;