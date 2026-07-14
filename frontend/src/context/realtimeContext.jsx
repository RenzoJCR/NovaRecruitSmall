/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import { X } from "lucide-react";
import { useAuth } from "./authContext";
import { crearConexionWebSocket } from "../services/websocketService";

const RealtimeNotificationsContext = createContext(null);

function RealtimeNotificationsProvider({ children }) {
  const { user, token } = useAuth();
  const [ultimoEvento, setUltimoEvento] = useState(null);
  const [toast, setToast] = useState(null);
  const [estadoConexion, setEstadoConexion] = useState("desconectado");

  useEffect(() => {
    if (!token || !user?.id || !user?.rol) {
      return undefined;
    }

    const canal =
      user.rol === "ADMINISTRADOR"
        ? "/topic/admin/notificaciones"
        : `/topic/user/notificaciones/${user.id}`;

    const desconectar = crearConexionWebSocket(
      (evento) => {
        const payload = evento || {};

        setUltimoEvento({
          ...payload,
          recibidoEn: Date.now(),
          canal,
        });

        setToast({
          tipo: payload.tipo || "EVENTO",
          mensaje: payload.mensaje || "Nueva notificación en tiempo real.",
        });
      },
      canal,
      token,
      setEstadoConexion,
    );

    return desconectar;
  }, [token, user?.id, user?.rol]);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = setTimeout(() => {
      setToast(null);
    }, 6000);

    return () => clearTimeout(timer);
  }, [toast]);

  const cerrarNotificacion = () => setToast(null);

  return (
    <RealtimeNotificationsContext.Provider
      value={{
        ultimoEvento,
        toast,
        cerrarNotificacion,
        estadoConexion,
      }}
    >
      {children}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-900/10 animate-slide-in">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                Notificación en vivo
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900 leading-relaxed">
                {toast.mensaje}
              </p>
            </div>
            <button
              type="button"
              onClick={cerrarNotificacion}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Cerrar notificación"
            >
              <X size={16} />
            </button>
          </div>
          <div className="mt-3 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
            {toast.tipo}
          </div>
        </div>
      )}
    </RealtimeNotificationsContext.Provider>
  );
}

function useRealtimeNotifications() {
  const context = useContext(RealtimeNotificationsContext);

  if (!context) {
    throw new Error(
      "useRealtimeNotifications debe utilizarse dentro de RealtimeNotificationsProvider",
    );
  }

  return context;
}

export { RealtimeNotificationsProvider, useRealtimeNotifications };
