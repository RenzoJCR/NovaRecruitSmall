import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  RefreshCw,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Radio,
  Search,
  FilterX,
  X,
} from "lucide-react";

import SectionHeader from "../../components/ui/SectionHeader.jsx";
import { postulacionService } from "../../services/postulacionService.js";
import { useRealtimeNotifications } from "../../context/realtimeContext.jsx";

import RespuestasEvaluacion from
  "../../components/admin/RespuestasEvaluacion.jsx";

function AdminPostulaciones() {
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

  const [message, setMessage] =
    useState("");

  const [messageType, setMessageType] =
    useState("info");

  const [
    websocketAlerts,
    setWebsocketAlerts,
  ] = useState([]);

  // FILTROS DEL MISMO PIPELINE
  const [busqueda, setBusqueda] =
    useState("");

  const [filtroVacante, setFiltroVacante] =
    useState("TODAS");

  const [filtroEstado, setFiltroEstado] =
    useState("TODOS");

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

  const cerrarExpediente = () => {
    setSelectedPostulacion(null);
  };

  /*
   * Mientras el modal esté abierto se bloquea
   * el desplazamiento de la página principal.
   *
   * También se permite cerrarlo con Escape.
   */
  useEffect(() => {
    if (!selectedPostulacion) {
      return undefined;
    }

    const cerrarConEscape = (event) => {
      if (event.key === "Escape") {
        cerrarExpediente();
      }
    };

    const overflowAnterior =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    window.addEventListener(
      "keydown",
      cerrarConEscape
    );

    return () => {
      document.body.style.overflow =
        overflowAnterior;

      window.removeEventListener(
        "keydown",
        cerrarConEscape
      );
    };
  }, [selectedPostulacion]);

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

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPostulaciones();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadPostulaciones]);

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

    /*
  * Cuenta otros candidatos ya contratados
  * para la misma vacante.
  *
  * Se excluye la postulación actual.
  */
  const contarOtrosContratados = (
    postulacionActual
  ) => {
    return postulaciones.filter(
      (postulacion) =>
        postulacion.id !==
          postulacionActual.id &&
        Number(postulacion.vacanteId) ===
          Number(
            postulacionActual.vacanteId
          ) &&
        postulacion.estado ===
          "CONTRATADO"
    ).length;
  };

  /*
  * Registra o corrige una decisión final.
  *
  * No cambia automáticamente el estado
  * de ningún otro candidato.
  */
  const handleDecisionChange = async (
    postulacion,
    decisionDestino
  ) => {
    if (
      !postulacion ||
      updatingId !== null
    ) {
      return;
    }

    const estadoActual =
      postulacion.estado;

    let mensajeConfirmacion = "";

    if (
      decisionDestino ===
      "CONTRATADO"
    ) {
      const otrosContratados =
        contarOtrosContratados(
          postulacion
        );

      mensajeConfirmacion =
        `¿Confirmas la contratación de ${postulacion.usuarioNombre}?`;

      if (otrosContratados > 0) {
        mensajeConfirmacion +=
          `\n\nAdvertencia: esta vacante ya tiene ${otrosContratados} candidato${otrosContratados === 1 ? "" : "s"} contratado${otrosContratados === 1 ? "" : "s"}.`;

        mensajeConfirmacion +=
          "\n\nLos demás candidatos no serán rechazados ni modificados automáticamente.";
      }
    } else {
      mensajeConfirmacion =
        estadoActual === "CONTRATADO"
          ? `¿Confirmas cambiar la decisión de CONTRATADO a RECHAZADO para ${postulacion.usuarioNombre}?\n\nLa evaluación y el puntaje técnico se conservarán.`
          : `¿Confirmas rechazar la postulación de ${postulacion.usuarioNombre}?`;
    }

    const confirmado =
      window.confirm(
        mensajeConfirmacion
      );

    if (!confirmado) {
      return;
    }

    try {
      setUpdatingId(
        postulacion.id
      );

      const updatedRecord =
        await postulacionService
          .actualizarEstado(
            postulacion.id,
            decisionDestino
          );

      const textoDecision =
        decisionDestino ===
        "CONTRATADO"
          ? "CONTRATADO"
          : "RECHAZADO";

      showMessage(
        estadoActual ===
          "CONTRATADO" ||
          estadoActual ===
            "RECHAZADO"
          ? `La decisión fue cambiada correctamente a: ${textoDecision}.`
          : `La decisión final fue registrada como: ${textoDecision}.`,
        "success"
      );

      setPostulaciones((prev) =>
        prev.map((item) =>
          item.id ===
          postulacion.id
            ? updatedRecord
            : item
        )
      );

      if (
        selectedPostulacion?.id ===
        postulacion.id
      ) {
        setSelectedPostulacion(
          updatedRecord
        );
      }
    } catch (error) {
      console.error(
        "Error al actualizar la decisión:",
        error
      );

      showMessage(
        error.userMessage ||
          error.response?.data
            ?.message ||
          "No se pudo actualizar la decisión final.",
        "error"
      );
    } finally {
      setUpdatingId(null);
    }
  };

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

  const vacantesDisponibles =
    useMemo(() => {
      const vacantesUnicas = new Map();

      postulaciones.forEach(
        (postulacion) => {
          if (
            postulacion.vacanteId &&
            postulacion.vacanteTitulo
          ) {
            vacantesUnicas.set(
              String(
                postulacion.vacanteId
              ),
              postulacion.vacanteTitulo
            );
          }
        }
      );

      return Array.from(
        vacantesUnicas.entries()
      )
        .map(([id, titulo]) => ({
          id,
          titulo,
        }))
        .sort((a, b) =>
          a.titulo.localeCompare(
            b.titulo,
            "es"
          )
        );
    }, [postulaciones]);

  const postulacionesFiltradas =
    useMemo(() => {
      const texto =
        busqueda
          .trim()
          .toLowerCase();

      return postulaciones.filter(
        (postulacion) => {
          const coincideBusqueda =
            texto === "" ||
            (
              postulacion.usuarioNombre ||
              ""
            )
              .toLowerCase()
              .includes(texto) ||
            (
              postulacion.usuarioCorreo ||
              ""
            )
              .toLowerCase()
              .includes(texto) ||
            (
              postulacion.vacanteTitulo ||
              ""
            )
              .toLowerCase()
              .includes(texto);

          const coincideVacante =
            filtroVacante === "TODAS" ||
            String(
              postulacion.vacanteId
            ) === filtroVacante;

          const coincideEstado =
            filtroEstado === "TODOS" ||
            postulacion.estado ===
              filtroEstado;

          return (
            coincideBusqueda &&
            coincideVacante &&
            coincideEstado
          );
        }
      );
    }, [
      postulaciones,
      busqueda,
      filtroVacante,
      filtroEstado,
    ]);

  const filtrosActivos =
    busqueda.trim() !== "" ||
    filtroVacante !== "TODAS" ||
    filtroEstado !== "TODOS";

  const limpiarFiltros = () => {
    setBusqueda("");
    setFiltroVacante("TODAS");
    setFiltroEstado("TODOS");
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
        <main className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <div>
                <p className="text-sm font-black text-slate-700 uppercase tracking-wider">
                  Postulaciones registradas
                  en MySQL
                </p>

                <p className="text-xs text-slate-400 mt-1">
                  Mostrando{" "}
                  {
                    postulacionesFiltradas.length
                  }{" "}
                  de {postulaciones.length}{" "}
                  postulaciones
                </p>
              </div>

              <button
                type="button"
                onClick={loadPostulaciones}
                className="inline-flex items-center justify-center gap-2 border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-sm font-black cursor-pointer"
              >
                <RefreshCw size={16} />
                Actualizar registros
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr_auto] gap-3">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  value={busqueda}
                  onChange={(event) =>
                    setBusqueda(
                      event.target.value
                    )
                  }
                  placeholder="Buscar por nombre, correo o vacante..."
                  className="w-full border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 outline-none focus:border-rose-500 text-sm"
                />
              </div>

              <select
                value={filtroVacante}
                onChange={(event) =>
                  setFiltroVacante(
                    event.target.value
                  )
                }
                className="w-full border border-slate-300 rounded-xl px-3 py-2.5 outline-none bg-white focus:border-rose-500 text-sm font-bold text-slate-700"
              >
                <option value="TODAS">
                  Todas las vacantes
                </option>

                {vacantesDisponibles.map(
                  (vacante) => (
                    <option
                      key={vacante.id}
                      value={vacante.id}
                    >
                      {vacante.titulo}
                    </option>
                  )
                )}
              </select>

              <select
                value={filtroEstado}
                onChange={(event) =>
                  setFiltroEstado(
                    event.target.value
                  )
                }
                className="w-full border border-slate-300 rounded-xl px-3 py-2.5 outline-none bg-white focus:border-rose-500 text-sm font-bold text-slate-700"
              >
                <option value="TODOS">
                  Todos los estados
                </option>

                <option value="POSTULADO">
                  Postulado
                </option>

                <option value="EVALUADO">
                  Evaluado
                </option>

                <option value="CONTRATADO">
                  Contratado
                </option>

                <option value="RECHAZADO">
                  Rechazado
                </option>
              </select>

              <button
                type="button"
                onClick={limpiarFiltros}
                disabled={!filtrosActivos}
                title="Limpiar filtros"
                className="inline-flex items-center justify-center gap-2 border border-slate-300 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 px-3 py-2.5 rounded-xl text-xs font-black cursor-pointer"
              >
                <FilterX size={16} />
                Limpiar
              </button>
            </div>
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
          ) : postulacionesFiltradas.length ===
            0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
              <Search
                size={34}
                className="mx-auto text-slate-300 mb-3"
              />

              <p className="font-black text-slate-600">
                No se encontraron
                postulaciones
              </p>

              <p className="text-sm text-slate-400 mt-1">
                Cambia o limpia los filtros
                utilizados.
              </p>
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
                {postulacionesFiltradas.map(
                  (postulacion) => (
                    <div
                      key={postulacion.id}
                      className="grid grid-cols-1 lg:grid-cols-[1.5fr_1.5fr_1fr_auto] gap-3 lg:gap-4 px-5 py-4 items-center hover:bg-slate-50/40 transition-colors"
                    >
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
                            <Clock size={14} />

                            <span>
                              Examen pendiente
                            </span>
                          </div>
                        )}
                      </div>

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
                          <FileText size={14} />
                          Revisar expediente
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>
            </section>
          )}
        </main>

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

      {/* MODAL DEL EXPEDIENTE */}
      {selectedPostulacion && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-700/35 backdrop-blur-sm p-3 sm:p-6 animate-fade-in"
          onMouseDown={cerrarExpediente}
          role="presentation"
        >
          <section
            className="relative w-full max-w-5xl max-h-[92vh] overflow-y-auto bg-slate-800 text-white rounded-3xl shadow-2xl border border-slate-600"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-expediente"
          >
            {/* CABECERA FIJA DEL MODAL */}
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 bg-slate-800/95 backdrop-blur-md border-b border-slate-700 px-5 sm:px-7 py-5 rounded-t-3xl">
              <div>
                <span className="text-[10px] font-black text-rose-400 uppercase tracking-wider">
                  Expediente de evaluación
                  técnica
                </span>

                <h4
                  id="titulo-expediente"
                  className="text-xl sm:text-2xl font-black mt-1 tracking-tight"
                >
                  {
                    selectedPostulacion.usuarioNombre
                  }
                </h4>

                <p className="text-xs text-slate-400 mt-1">
                  {
                    selectedPostulacion.vacanteTitulo
                  }
                </p>
              </div>

              <button
                type="button"
                onClick={cerrarExpediente}
                className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                aria-label="Cerrar expediente"
                title="Cerrar expediente"
              >
                <X size={19} />
              </button>
            </div>

            <div className="p-5 sm:p-7 space-y-6">
              {/* DATOS DEL PROCESO */}
              <div className="bg-slate-900 border border-white/10 rounded-2xl p-4 sm:p-5">
                <p className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-4">
                  Datos del proceso
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                  <p>
                    <strong className="text-slate-400">
                      Candidato:
                    </strong>{" "}
                    {
                      selectedPostulacion.usuarioNombre
                    }
                  </p>

                  <p>
                    <strong className="text-slate-400">
                      Correo:
                    </strong>{" "}
                    {
                      selectedPostulacion.usuarioCorreo
                    }
                  </p>

                  <p>
                    <strong className="text-slate-400">
                      Puesto:
                    </strong>{" "}
                    {
                      selectedPostulacion.vacanteTitulo
                    }
                  </p>

                  <p>
                    <strong className="text-slate-400">
                      Área:
                    </strong>{" "}
                    {
                      selectedPostulacion.vacanteAreaNombre
                    }
                  </p>

                  <p>
                    <strong className="text-slate-400">
                      Estado:
                    </strong>{" "}
                    <span
                      className={`inline-flex border px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${getBadgeStyles(
                        selectedPostulacion.estado
                      )}`}
                    >
                      {
                        selectedPostulacion.estado
                      }
                    </span>
                  </p>

                  <p>
                    <strong className="text-slate-400">
                      Fecha de postulación:
                    </strong>{" "}
                    {selectedPostulacion.fechaPostulacion
                      ? new Date(
                          selectedPostulacion.fechaPostulacion
                        ).toLocaleString(
                          "es-PE"
                        )
                      : "No disponible"}
                  </p>

                  <p>
                    <strong className="text-slate-400">
                      Nota técnica:
                    </strong>{" "}
                    {selectedPostulacion.puntajeTecnico !==
                    null
                      ? `${selectedPostulacion.puntajeTecnico} / 20`
                      : "Evaluación pendiente"}
                  </p>

                  <p>
                    <strong className="text-slate-400">
                      Fecha de evaluación:
                    </strong>{" "}
                    {selectedPostulacion.fechaEvaluacion
                      ? new Date(
                          selectedPostulacion.fechaEvaluacion
                        ).toLocaleString(
                          "es-PE"
                        )
                      : "Todavía no evaluado"}
                  </p>
                </div>
              </div>

              {/* RESPUESTAS DEL EXAMEN */}
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
              <div className="border-t border-slate-800 pt-5">
                {selectedPostulacion.estado ===
                "EVALUADO" ? (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <span className="text-xs font-bold text-slate-400 sm:mr-auto">
                      Decisión final del proceso:
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        handleDecisionChange(
                          selectedPostulacion,
                          "RECHAZADO"
                        )
                      }
                      disabled={
                        updatingId !== null
                      }
                      className="inline-flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black px-4 py-2.5 rounded-xl cursor-pointer transition-colors"
                    >
                      <XCircle size={14} />

                      {updatingId ===
                      selectedPostulacion.id
                        ? "Actualizando..."
                        : "Rechazar candidato"}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleDecisionChange(
                          selectedPostulacion,
                          "CONTRATADO"
                        )
                      }
                      disabled={
                        updatingId !== null
                      }
                      className="inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black px-4 py-2.5 rounded-xl cursor-pointer transition-colors"
                    >
                      <CheckCircle
                        size={14}
                      />

                      {updatingId ===
                      selectedPostulacion.id
                        ? "Actualizando..."
                        : "Confirmar contratación"}
                    </button>
                  </div>
                ) : selectedPostulacion.estado ===
                  "POSTULADO" ? (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                    <p className="text-sm text-amber-300 font-semibold">
                      El candidato todavía debe
                      completar la evaluación
                      técnica.
                    </p>
                  </div>
                ) : (
                  <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="sm:mr-auto">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-wider">
                          Decisión actual
                        </p>

                        <p className="text-sm text-slate-300 font-semibold mt-1">
                          El proceso está finalizado como:{" "}

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

                        <p className="text-xs text-slate-500 mt-1">
                          Puedes corregir esta decisión.
                          La evaluación y el puntaje no
                          serán eliminados.
                        </p>
                      </div>

                      {selectedPostulacion.estado ===
                      "CONTRATADO" ? (
                        <button
                          type="button"
                          onClick={() =>
                            handleDecisionChange(
                              selectedPostulacion,
                              "RECHAZADO"
                            )
                          }
                          disabled={
                            updatingId !== null
                          }
                          className="inline-flex items-center justify-center gap-1.5 border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 disabled:opacity-50 disabled:cursor-not-allowed text-rose-300 text-xs font-black px-4 py-2.5 rounded-xl cursor-pointer transition-colors"
                        >
                          <XCircle size={14} />

                          {updatingId ===
                          selectedPostulacion.id
                            ? "Actualizando..."
                            : "Cambiar decisión a rechazado"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            handleDecisionChange(
                              selectedPostulacion,
                              "CONTRATADO"
                            )
                          }
                          disabled={
                            updatingId !== null
                          }
                          className="inline-flex items-center justify-center gap-1.5 border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed text-emerald-300 text-xs font-black px-4 py-2.5 rounded-xl cursor-pointer transition-colors"
                        >
                          <CheckCircle size={14} />

                          {updatingId ===
                          selectedPostulacion.id
                            ? "Actualizando..."
                            : "Cambiar decisión a contratado"}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default AdminPostulaciones;