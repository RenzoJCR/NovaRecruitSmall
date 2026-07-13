import { useCallback, useEffect, useState } from "react";
import { RefreshCw, FileText, CheckCircle, XCircle, Clock, Radio } from "lucide-react";
import SectionHeader from "../../components/ui/SectionHeader.jsx";
import { postulacionService } from "../../services/postulacionService.js";
import { useRealtimeNotifications } from "../../context/realtimeContext.jsx";

function AdminPostulaciones() {
  // ESTADOS DE CONTROL DE PIPELINE (PROVENIENTES DE SPRING BOOT)
  const [postulaciones, setPostulaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPostulacion, setSelectedPostulacion] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const { ultimoEvento } = useRealtimeNotifications();

  // ALERTAS DE PANTALLA
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

  // CENTRAL DE WEBSOCKETS EN MEMORIA CLIENTE (Simulación interactiva para la defensa)
  const [websocketAlerts, setWebsocketAlerts] = useState([]);

  const showMessage = (text, type = "info") => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(""), 4050);
  };

  // CARGA DE DATOS DESDE POSTULACIONCONTROLLER DE JAVA
  const loadPostulaciones = useCallback(async () => {
    try {
      setLoading(true);
      const data = await postulacionService.listarTodas(); // Consume GET /api/postulaciones
      setPostulaciones(data);
    } catch (error) {
      showMessage(error.userMessage || "Error al sincronizar el listado con MySQL.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  // EFECTO DE ARRANQUE E INTEGRACIÓN WEBSOCKET CON TU BACKEND
  useEffect(() => {
    const timer = setTimeout(() => {
      loadPostulaciones(); // Carga inicial de MySQL
    }, 0);

    return () => clearTimeout(timer);
  }, [loadPostulaciones]);

  useEffect(() => {
    if (!ultimoEvento?.tipo) {
      return;
    }

    const tiposRelevantes = ["NUEVA_POSTULACION", "EVALUACION_CALIFICADA", "ACTUALIZACION_ESTADO"];

    if (!tiposRelevantes.includes(ultimoEvento.tipo)) {
      return;
    }

    const timer = setTimeout(() => {
      setWebsocketAlerts((prev) => [
        { id: Date.now(), tipo: ultimoEvento.tipo, mensaje: ultimoEvento.mensaje },
        ...prev.slice(0, 4)
      ]);

      loadPostulaciones();
    }, 0);

    return () => clearTimeout(timer);
  }, [ultimoEvento, loadPostulaciones]);

  // TRANSICIÓN DE ESTADOS CORE: CAMBIAR pipeline (PATCH /api/postulaciones/{id}/estado)
  const handleUpdatePhase = async (id, faseDestino) => {
    try {
      setUpdatingId(id);
      const updatedRecord = await postulacionService.actualizarEstado(id, faseDestino);
      showMessage(`Candidato promovido exitosamente a la fase: ${faseDestino}`, "success");
      
      // Actualizamos la lista local en memoria para evitar llamadas innecesarias al servidor
      setPostulaciones(prev => prev.map(p => p.id === id ? updatedRecord : p));
      if (selectedPostulacion && selectedPostulacion.id === id) {
        setSelectedPostulacion(updatedRecord);
      }
    } catch (error) {
      showMessage(error.userMessage || "No se pudo actualizar la fase del pipeline.", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  // ESTILOS VISUALES SEGÚN EL ESTADO DE RECRUITMENT DE JAVA
  const getBadgeStyles = (estado) => {
    switch (estado) {
      case "POSTULADO": return "bg-sky-50 text-sky-700 border-sky-200";
      case "EVALUADO": return "bg-purple-50 text-purple-700 border-purple-200";
      case "CONTRATADO": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "RECHAZADO": return "bg-rose-50 text-rose-700 border-rose-200";
      default: return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader 
        title="Pipeline de Candidatos TI" 
        description="Evalúa perfiles, audita las notas de exámenes técnicos y gestiona los estados de contratación en tiempo real."
      />

      {message && (
        <div className={`border rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${
          messageType === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : 
          messageType === "error" ? "bg-rose-50 border-rose-200 text-rose-700" : "bg-sky-50 border-sky-200 text-sky-700"
        }`}>
          {message}
        </div>
      )}

      {/* DISEÑO EN DOS COLUMNAS: CONTROL DE PIPELINE + CONSOLA WEBSOCKET INTERNA */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6 items-start">
        
        {/* PANEL IZQUIERDO: SEGUIMIENTO DE POSTULACIONES Y DETALLE DE NOTAS */}
        <main className="space-y-4">
          <div className="flex justify-between items-center bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <p className="text-sm font-black text-slate-500 uppercase tracking-wider">Postulaciones Registradas en MySQL</p>
            <button onClick={loadPostulaciones} className="inline-flex items-center gap-2 border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-sm font-black cursor-pointer">
              <RefreshCw size={16} /> Actualizar Registros
            </button>
          </div>

          {loading ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 font-bold text-sm shadow-sm animate-pulse">
              Consultando base de datos relacional...
            </div>
          ) : postulaciones.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 shadow-sm">
              Ningún desarrollador ha postulado todavía a las vacantes de NovaRecruit.
            </div>
          ) : (
            <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              {/* Encabezado Ocultable */}
              <div className="hidden lg:grid grid-cols-[1.5fr_1.5fr_1fr_auto] gap-4 px-5 py-3.5 bg-slate-50 border-b border-slate-200 text-xs font-black text-slate-500 uppercase tracking-wider">
                <span>Desarrollador / Correo</span>
                <span>Plaza Solicitada</span>
                <span>Evaluación Técnica</span>
                <span className="text-right">Acciones</span>
              </div>

              {/* Pintado dinámico mediante bucle .map() */}
              <div className="divide-y divide-slate-100">
                {postulaciones.map((p) => (
                  <div key={p.id} className="grid grid-cols-1 lg:grid-cols-[1.5fr_1.5fr_1fr_auto] gap-3 lg:gap-4 px-5 py-4 items-center hover:bg-slate-50/40 transition-colors">
                    
                    {/* Columna 1: Datos del Postulante */}
                    <div>
                      <p className="font-black text-slate-900 tracking-tight">{p.usuarioNombre}</p>
                      <span className="text-xs text-slate-500">{p.id} · ID Postulante: {p.usuarioId}</span>
                    </div>

                    {/* Columna 2: Vacante */}
                    <div>
                      <p className="text-sm font-bold text-slate-800 leading-tight">{p.vacanteTitulo}</p>
                      <span className={`inline-block text-[9px] font-black border px-2 py-0.5 rounded-full mt-1 uppercase tracking-wider ${getBadgeStyles(p.estado)}`}>
                        {p.estado}
                      </span>
                    </div>

                    {/* Columna 3: Nota Técnica (Exigido en la Sustentación) */}
                    <div>
                      {p.puntajeTecnico !== null ? (
                        <div className="text-sm">
                          <p className="font-black text-slate-900">{p.puntajeTecnico} / 20 pts</p>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Calificado</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 text-slate-400 text-xs font-bold">
                          <Clock size={14} />
                          <span>Examen Pendiente</span>
                        </div>
                      )}
                    </div>

                    {/* Columna 4: Botón de Apertura de Ficha Técnica */}
                    <div className="text-right">
                      <button
                        onClick={() => setSelectedPostulacion(p)}
                        className="inline-flex items-center gap-1.5 border border-slate-300 hover:border-rose-300 hover:text-rose-600 text-slate-700 text-xs font-black px-3 py-2 rounded-xl transition-all cursor-pointer"
                      >
                        <FileText size={14} /> Revisar Expediente
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            </section>
          )}

          {/* FICHA TÉCNICA DINÁMICA: SE EXPANDE AL DETECTAR SELECCIÓN */}
          {selectedPostulacion && (
            <section className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl space-y-4 border border-slate-800 animate-fade-in">
              <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] font-black text-rose-400 uppercase tracking-wider">Expediente de Auditoría Estricta</span>
                  <h4 className="text-2xl font-black mt-0.5 tracking-tight">{selectedPostulacion.usuarioNombre}</h4>
                </div>
                <button onClick={() => setSelectedPostulacion(null)} className="text-xs font-bold text-slate-400 hover:text-white cursor-pointer">Cerrar Expediente</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div className="space-y-2">
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-wider">Detalles de la Aplicación</p>
                  <p><strong>Puesto:</strong> {selectedPostulacion.vacanteTitulo}</p>
                  <p><strong>Fecha Postulación:</strong> {new Date(selectedPostulacion.fechaPostulacion).toLocaleString()}</p>
                  <p><strong>Historial Log Backend:</strong> <span className="text-sky-400 text-xs italic">{selectedPostulacion.comentariosInternos || "Sin registros de auditoría previos."}</span></p>
                </div>

                <div className="space-y-2 bg-slate-950 border border-white/5 p-4 rounded-2xl">
                  <p className="text-rose-400 font-black text-xs uppercase tracking-wider flex items-center gap-1">
                    <Radio size={14} className="animate-pulse" /> Respuestas en MySQL (JSON String)
                  </p>
                  <code className="block bg-slate-900 p-2.5 rounded-xl text-xs text-emerald-400 font-mono overflow-x-auto whitespace-pre-wrap mt-2">
                    {selectedPostulacion.respuestasPostulante || '{"mensaje": "El candidato aún no ha rendido el examen"}'}
                  </code>
                </div>
              </div>

              {/* CONTROL DE CAMBIO DE ESTADOS (Mapea directo al PATCH del Service) */}
              <div className="border-t border-slate-800 pt-4 flex flex-wrap gap-2 justify-end">
                <span className="text-xs font-bold text-slate-400 flex items-center mr-auto">Cambiar Fase:</span>
                <button
                  onClick={() => handleUpdatePhase(selectedPostulacion.id, "RECHAZADO")}
                  disabled={updatingId !== null}
                  className="inline-flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black px-4 py-2.5 rounded-xl cursor-pointer transition-colors"
                >
                  <XCircle size={14} /> Rechazar Candidato
                </button>
                <button
                  onClick={() => handleUpdatePhase(selectedPostulacion.id, "CONTRATADO")}
                  disabled={updatingId !== null}
                  className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-4 py-2.5 rounded-xl cursor-pointer transition-colors"
                >
                  <CheckCircle size={14} /> Confirmar Contratación
                </button>
              </div>
            </section>
          )}
        </main>

        {/* PANEL DE NOTIFICACIONES WEBSOCKET (CONCENTRA EL INTERÉS DEL PROFESOR) */}
        <aside>
          <section className="bg-slate-950 border border-slate-800 text-slate-200 rounded-2xl p-4 shadow-md sticky top-6 space-y-4">
            <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
              <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Radio size={15} className="text-rose-500 animate-ping" />
                Mensajería WebSocket
              </h3>
              <span className="text-[9px] font-black bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded-full border border-rose-500/20">STOMP/WS</span>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed">
              Consola de escucha bidireccional conectada al broker de Spring Boot. Los eventos capturados se listan a continuación sin refrescar el navegador:
            </p>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {websocketAlerts.map((alert) => (
                <div key={alert.id} className="bg-slate-900/80 border border-white/5 p-3 rounded-xl space-y-1 animate-slide-in">
                  <div className="flex justify-between items-center text-[10px] font-black">
                    <span className={alert.tipo === "EXAMEN_COMPLETADO" ? "text-purple-400" : alert.tipo === "NUEVA_POSTULACION" ? "text-sky-400" : "text-emerald-400"}>
                      {alert.tipo}
                    </span>
                    <span className="text-slate-500">Ahora</span>
                  </div>
                  <p className="text-xs text-slate-300 font-medium leading-tight">{alert.mensaje}</p>
                </div>
              ))}
            </div>
          </section>
        </aside>

      </div>
    </div>
  );
}

export default AdminPostulaciones;