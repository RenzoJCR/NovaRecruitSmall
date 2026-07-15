import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  RefreshCw,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Radio,
} from "lucide-react";

import SectionHeader from "../../components/ui/SectionHeader.jsx";

import {
  postulacionService,
} from "../../services/postulacionService.js";

import {
  useRealtimeNotifications,
} from "../../context/realtimeContext.jsx";

import RespuestasEvaluacion from
  "../../components/admin/RespuestasEvaluacion.jsx";

function AdminPostulaciones() {
  // ESTADOS DE CONTROL DEL PIPELINE.
  const [postulaciones, setPostulaciones] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [
    selectedPostulacion,
    setSelectedPostulacion,
  ] = useState(null);

  const [updatingId, setUpdatingId] =
    useState(null);

  const { ultimoEvento } =
    useRealtimeNotifications();

  // ALERTAS DE PANTALLA.
  const [message, setMessage] =
    useState("");

  const [messageType, setMessageType] =
    useState("info");

  // EVENTOS RECIBIDOS POR WEBSOCKET.
  const [
    websocketAlerts,
    setWebsocketAlerts,
  ] = useState([]);

  const showMessage = (
    text,
    type = "info"
  ) => {
    setMessage(text);
    setMessageType(type);

    setTimeout(() => {
      setMessage("");
    }, 4050);
  };

  // CARGA DE POSTULACIONES DESDE SPRING BOOT.
  const loadPostulaciones =
    useCallback(async () => {
      try {
        setLoading(true);

        const data =
          await postulacionService
            .listarTodas();

        setPostulaciones(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (error) {
        console.error(
          "Error al cargar postulaciones:",
          error
        );

        showMessage(
          error.userMessage ||
            error.response?.data?.message ||
            "Error al sincronizar el listado con MySQL.",
          "error"
        );
      } finally {
        setLoading(false);
      }
    }, []);

  // CARGA INICIAL DEL PIPELINE.
  useEffect(() => {
    const timer = setTimeout(() => {
      loadPostulaciones();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadPostulaciones]);

  // ACTUALIZACIÓN DEL PIPELINE MEDIANTE WEBSOCKET.
  useEffect(() => {
    if (!ultimoEvento?.tipo) {
      return;
    }

    const tiposRelevantes = [
      "NUEVA_POSTULACION",
      "EVALUACION_CALIFICADA",
      "ACTUALIZACION_ESTADO",
    ];

    if (
      !tiposRelevantes.includes(
        ultimoEvento.tipo
      )
    ) {
      return;
    }

    const timer = setTimeout(() => {
      setWebsocketAlerts((prev) => [
        {
          id: Date.now(),
          tipo: ultimoEvento.tipo,
          mensaje: ultimoEvento.mensaje,
        },
        ...prev.slice(0, 4),
      ]);

      loadPostulaciones();
    }, 0);

    return () => clearTimeout(timer);
  }, [
    ultimoEvento,
    loadPostulaciones,
  ]);

  // CAMBIO DEL ESTADO FINAL DE LA POSTULACIÓN.
  const handleUpdatePhase = async (
    id,
    faseDestino
  ) => {
    try {
      setUpdatingId(id);

      const updatedRecord =
        await postulacionService
          .actualizarEstado(
            id,
            faseDestino
          );

      showMessage(
        `El proceso del candidato fue actualizado a: ${faseDestino}.`,
        "success"
      );

      setPostulaciones((prev) =>
        prev.map((postulacion) =>
          postulacion.id === id
            ? updatedRecord
            : postulacion
        )
      );

      if (
        selectedPostulacion?.id === id
      ) {
        setSelectedPostulacion(
          updatedRecord
        );
      }
    } catch (error) {
      console.error(
        "Error al actualizar postulación:",
        error
      );

      showMessage(
        error.userMessage ||
          error.response?.data?.message ||
          "No se pudo actualizar la fase del pipeline.",
        "error"
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // ESTILOS VISUALES POR ESTADO.
  const getBadgeStyles = (estado) => {
    switch (estado) {
      case "POSTULADO":
        return (
          "bg-sky-50 text-sky-700 " +
          "border-sky-200"
        );

      case "EVALUADO":
        return (
          "bg-purple-50 text-purple-700 " +
          "border-purple-200"
        );

      case "CONTRATADO":
        return (
          "bg-emerald-50 text-emerald-700 " +
          "border-emerald-200"
        );

      case "RECHAZADO":
        return (
          "bg-rose-50 text-rose-700 " +
          "border-rose-200"
        );

      default:
        return (
          "bg-slate-50 text-slate-600 " +
          "border-slate-200"
        );
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Pipeline de Candidatos TI"
        description="Evalúa perfiles, audita las notas de exámenes técnicos y gestiona los estados de contratación en tiempo real."
      />

      {message && (
        <div
          className={`border rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${
            messageType === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : messageType === "error"
                ? "bg-rose-50 border-rose-200 text-rose-700"
                : "bg-sky-50 border-sky-200 text-sky-700"
          }`}
        >
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6 items-start">
        {/* PANEL IZQUIERDO */}
        <main className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <p className="text-sm font-black text-slate-500 uppercase tracking-wider">
              Postulaciones registradas en
              MySQL
            </p>

            <button
              type="button"
              onClick={loadPostulaciones}
              className="inline-flex items-center justify-center gap-2 border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-sm font-black cursor-pointer"
            >
              <RefreshCw size={16} />
              Actualizar registros
            </button>
          </div>

          {loading ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 font-bold text-sm shadow-sm animate-pulse">
              Consultando base de datos
              relacional...
            </div>
          ) : postulaciones.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 shadow-sm">
              Ningún desarrollador ha
              postulado todavía a las
              vacantes de NovaRecruit.
            </div>
          ) : (
            <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="hidden lg:grid grid-cols-[1.5fr_1.5fr_1fr_auto] gap-4 px-5 py-3.5 bg-slate-50 border-b border-slate-200 text-xs font-black text-slate-500 uppercase tracking-wider">
                <span>
                  Desarrollador / Correo
                </span>

                <span>
                  Plaza solicitada
                </span>

                <span>
                  Evaluación técnica
                </span>

                <span className="text-right">
                  Acciones
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {postulaciones.map(
                  (postulacion) => (
                    <div
                      key={postulacion.id}
                      className="grid grid-cols-1 lg:grid-cols-[1.5fr_1.5fr_1fr_auto] gap-3 lg:gap-4 px-5 py-4 items-center hover:bg-slate-50/40 transition-colors"
                    >
                      {/* DATOS DEL POSTULANTE */}
                      <div>
                        <p className="font-black text-slate-900 tracking-tight">
                          {
                            postulacion.usuarioNombre
                          }
                        </p>

                        <span className="text-xs text-slate-500">
                          {
                            postulacion.usuarioCorreo
                          }
                        </span>
                      </div>

                      {/* VACANTE Y ESTADO */}
                      <div>
                        <p className="text-sm font-bold text-slate-800 leading-tight">
                          {
                            postulacion.vacanteTitulo
                          }
                        </p>

                        <span
                          className={`inline-block text-[9px] font-black border px-2 py-0.5 rounded-full mt-1 uppercase tracking-wider ${getBadgeStyles(
                            postulacion.estado
                          )}`}
                        >
                          {
                            postulacion.estado
                          }
                        </span>
                      </div>

                      {/* NOTA TÉCNICA */}
                      <div>
                        {postulacion.puntajeTecnico !==
                        null ? (
                          <div className="text-sm">
                            <p className="font-black text-slate-900">
                              {
                                postulacion.puntajeTecnico
                              }{" "}
                              / 20 pts
                            </p>

                            <span className="text-[10px] text-slate-400 font-bold uppercase">
                              Calificado
                            </span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 text-slate-400 text-xs font-bold">
                            <Clock
                              size={14}
                            />

                            <span>
                              Examen pendiente
                            </span>
                          </div>
                        )}
                      </div>

                      {/* ABRIR EXPEDIENTE */}
                      <div className="text-right">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedPostulacion(
                              postulacion
                            )
                          }
                          className="inline-flex items-center gap-1.5 border border-slate-300 hover:border-rose-300 hover:text-rose-600 text-slate-700 text-xs font-black px-3 py-2 rounded-xl transition-all cursor-pointer"
                        >
                          <FileText
                            size={14}
                          />

                          Revisar expediente
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>
            </section>
          )}

          {/* EXPEDIENTE DEL CANDIDATO */}
          {selectedPostulacion && (
            <section className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl space-y-5 border border-slate-800 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] font-black text-rose-400 uppercase tracking-wider">
                    Expediente de evaluación
                    técnica
                  </span>

                  <h4 className="text-2xl font-black mt-0.5 tracking-tight">
                    {
                      selectedPostulacion.usuarioNombre
                    }
                  </h4>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedPostulacion(
                      null
                    )
                  }
                  className="text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
                >
                  Cerrar expediente
                </button>
              </div>

              {/* DATOS GENERALES */}
              <div className="bg-slate-950 border border-white/5 rounded-2xl p-4">
                <p className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-3">
                  Datos del proceso
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <p>
                    <strong>
                      Correo:
                    </strong>{" "}
                    {
                      selectedPostulacion.usuarioCorreo
                    }
                  </p>

                  <p>
                    <strong>
                      Puesto:
                    </strong>{" "}
                    {
                      selectedPostulacion.vacanteTitulo
                    }
                  </p>

                  <p>
                    <strong>
                      Área:
                    </strong>{" "}
                    {
                      selectedPostulacion.vacanteAreaNombre
                    }
                  </p>

                  <p>
                    <strong>
                      Estado:
                    </strong>{" "}
                    {
                      selectedPostulacion.estado
                    }
                  </p>

                  <p>
                    <strong>
                      Fecha de postulación:
                    </strong>{" "}
                    {new Date(
                      selectedPostulacion.fechaPostulacion
                    ).toLocaleString(
                      "es-PE"
                    )}
                  </p>

                  <p>
                    <strong>
                      Nota técnica:
                    </strong>{" "}
                    {selectedPostulacion.puntajeTecnico !==
                    null
                      ? `${selectedPostulacion.puntajeTecnico} / 20`
                      : "Evaluación pendiente"}
                  </p>
                </div>
              </div>

              {/* RESPUESTAS NORMALIZADAS */}
              <RespuestasEvaluacion
                postulacionId={
                  selectedPostulacion.id
                }
                estado={
                  selectedPostulacion.estado
                }
                puntajeTecnico={
                  selectedPostulacion.puntajeTecnico
                }
              />

              {/* DECISIÓN FINAL */}
              <div className="border-t border-slate-800 pt-4">
                {selectedPostulacion.estado ===
                "EVALUADO" ? (
                  <div className="flex flex-wrap gap-2 justify-end">
                    <span className="text-xs font-bold text-slate-400 flex items-center mr-auto">
                      Decisión final:
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        handleUpdatePhase(
                          selectedPostulacion.id,
                          "RECHAZADO"
                        )
                      }
                      disabled={
                        updatingId !== null
                      }
                      className="inline-flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-black px-4 py-2.5 rounded-xl cursor-pointer transition-colors"
                    >
                      <XCircle
                        size={14}
                      />

                      Rechazar candidato
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleUpdatePhase(
                          selectedPostulacion.id,
                          "CONTRATADO"
                        )
                      }
                      disabled={
                        updatingId !== null
                      }
                      className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-black px-4 py-2.5 rounded-xl cursor-pointer transition-colors"
                    >
                      <CheckCircle
                        size={14}
                      />

                      Confirmar contratación
                    </button>
                  </div>
                ) : selectedPostulacion.estado ===
                  "POSTULADO" ? (
                  <p className="text-sm text-amber-300 font-semibold">
                    El candidato todavía debe
                    completar la evaluación
                    técnica.
                  </p>
                ) : (
                  <p className="text-sm text-slate-300 font-semibold">
                    Proceso finalizado con
                    estado:{" "}

                    <span
                      className={
                        selectedPostulacion.estado ===
                        "CONTRATADO"
                          ? "text-emerald-400"
                          : "text-rose-400"
                      }
                    >
                      {
                        selectedPostulacion.estado
                      }
                    </span>
                  </p>
                )}
              </div>
            </section>
          )}
        </main>

        {/* CONSOLA WEBSOCKET */}
        <aside>
          <section className="bg-slate-950 border border-slate-800 text-slate-200 rounded-2xl p-4 shadow-md sticky top-6 space-y-4">
            <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
              <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Radio
                  size={15}
                  className="text-rose-500 animate-ping"
                />

                Mensajería WebSocket
              </h3>

              <span className="text-[9px] font-black bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded-full border border-rose-500/20">
                STOMP/WS
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Consola conectada al broker de
              Spring Boot. Los eventos se
              reciben sin actualizar el
              navegador.
            </p>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {websocketAlerts.length ===
              0 ? (
                <div className="bg-slate-900/80 border border-white/5 p-3 rounded-xl">
                  <p className="text-xs text-slate-500">
                    Esperando nuevos eventos...
                  </p>
                </div>
              ) : (
                websocketAlerts.map(
                  (alerta) => (
                    <div
                      key={alerta.id}
                      className="bg-slate-900/80 border border-white/5 p-3 rounded-xl space-y-1 animate-slide-in"
                    >
                      <div className="flex justify-between items-center text-[10px] font-black">
                        <span
                          className={
                            alerta.tipo ===
                            "EVALUACION_CALIFICADA"
                              ? "text-purple-400"
                              : alerta.tipo ===
                                  "NUEVA_POSTULACION"
                                ? "text-sky-400"
                                : "text-emerald-400"
                          }
                        >
                          {alerta.tipo}
                        </span>

                        <span className="text-slate-500">
                          Ahora
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 font-medium leading-tight">
                        {alerta.mensaje}
                      </p>
                    </div>
                  )
                )
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

export default AdminPostulaciones;