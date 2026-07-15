import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Briefcase,
  ClipboardCheck,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  Eye,
  Search,
  FilterX,
} from "lucide-react";

import SectionHeader from "../../components/ui/SectionHeader.jsx";
import { vacanteService } from "../../services/vacanteService.js";
import { areaService } from "../../services/areaService.js";
import { evaluacionService } from "../../services/evaluacionService.js";

const initialVacanteForm = {
  areaId: "",
  titulo: "",
  descripcion: "",
  modalidad: "REMOTO",
  salario: "",
};

const initialExamForm = {
  titulo: "",
  descripcion: "",
  preguntas: [],
};

const initialPreguntaForm = {
  tipoPregunta: "MULTIPLE",
  enunciado: "",
  opcionA: "",
  opcionB: "",
  opcionC: "",
  opcionD: "",
  respuestaCorrecta: "A",
};

function AdminVacantes() {
  const [vacantes, setVacantes] =
    useState([]);

  const [areas, setAreas] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [message, setMessage] =
    useState("");

  const [messageType, setMessageType] =
    useState("info");

  const [vacanteForm, setVacanteForm] =
    useState(initialVacanteForm);

  const [examForm, setExamForm] =
    useState(initialExamForm);

  const [
    preguntaForm,
    setPreguntaForm,
  ] = useState(initialPreguntaForm);

  const [
    selectedVacante,
    setSelectedVacante,
  ] = useState(null);

  const [
    showExamModal,
    setShowExamModal,
  ] = useState(false);

  const [viewingExam, setViewingExam] =
    useState(null);

  // FILTROS
  const [
    busquedaVacante,
    setBusquedaVacante,
  ] = useState("");

  const [
    filtroEstadoVacante,
    setFiltroEstadoVacante,
  ] = useState("TODAS");

  const obtenerPuntajePregunta = (
    indice,
    totalPreguntas
  ) => {
    if (totalPreguntas <= 0) {
      return 0;
    }

    const puntajeBase =
      20 / totalPreguntas;

    const puntajeEnteroBase =
      Math.floor(puntajeBase);

    const puntosRestantes =
      20 % totalPreguntas;

    return (
      puntajeEnteroBase +
      (indice < puntosRestantes
        ? 1
        : 0)
    );
  };

  const showMessage = (
    text,
    type = "info"
  ) => {
    setMessage(text);
    setMessageType(type);

    setTimeout(() => {
      setMessage("");
    }, 4000);
  };

  const getEstadoVacanteLabel = (
    estado
  ) => {
    return estado === "ACTIVA"
      ? "Publicada"
      : "Pausada";
  };

  const loadData =
    useCallback(async () => {
      try {
        setLoading(true);

        const [vacantesData, areasData] = await Promise.all([
          vacanteService.listarAdmin(),
          areaService.getActive(),
        ]);

        setVacantes(
          Array.isArray(vacantesData)
            ? vacantesData
            : []
        );

        setAreas(
          Array.isArray(areasData)
            ? areasData
            : []
        );
      } catch (error) {
        console.error(
          "Error al cargar la administración de vacantes:",
          error
        );

        setVacantes([]);
        setAreas([]);

        setMessage(
          error.userMessage ||
            error.response?.data
              ?.message ||
            "No se pudieron sincronizar las vacantes y áreas con el servidor."
        );

        setMessageType("error");
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleVacanteChange = (
    event
  ) => {
    const { name, value } =
      event.target;

    setVacanteForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateVacante = async (e) => {
    e.preventDefault();

    if (
      !vacanteForm.areaId ||
      !vacanteForm.titulo.trim() ||
      !vacanteForm.descripcion.trim()
    ) {
      showMessage(
        "Por favor, completa todos los campos obligatorios.",
        "error"
      );

      return;
    }

    /*
    * Comprobación adicional en el frontend:
    * el área seleccionada debe continuar dentro
    * del listado de áreas activas.
    */
    const areaSeleccionada = areas.find(
      (area) =>
        Number(area.id) ===
        Number(vacanteForm.areaId)
    );

    if (!areaSeleccionada) {
      showMessage(
        "El área seleccionada ya no está activa. Actualiza el formulario y selecciona otra área.",
        "error"
      );

      setVacanteForm((prev) => ({
        ...prev,
        areaId: "",
      }));

      await loadData();
      return;
    }

    const payload = {
      areaId: Number(
        vacanteForm.areaId
      ),

      titulo:
        vacanteForm.titulo.trim(),

      descripcion:
        vacanteForm.descripcion.trim(),

      modalidad:
        vacanteForm.modalidad,

      salario:
        vacanteForm.salario
          ? Number(
              vacanteForm.salario
            )
          : null,
    };

    try {
      await vacanteService.crear(
        payload
      );

      showMessage(
        "Oferta laboral publicada con éxito en el portal.",
        "success"
      );

      setVacanteForm(
        initialVacanteForm
      );

      await loadData();
    } catch (error) {
      showMessage(
        error.userMessage ||
          error.response?.data?.message ||
          "No se pudo publicar la vacante.",
        "error"
      );
    }
  };

  const handleToggleEstado = async (
    vacanteId,
    estadoActual
  ) => {
    const nuevoEstado =
      estadoActual === "ACTIVA"
        ? "CERRADA"
        : "ACTIVA";

    try {
      await vacanteService
        .cambiarEstado(
          vacanteId,
          nuevoEstado
        );

      showMessage(
        nuevoEstado === "ACTIVA"
          ? "La vacante fue activada correctamente."
          : "La vacante fue pausada correctamente.",
        "success"
      );

      await loadData();
    } catch (error) {
      console.error(
        "Error al cambiar el estado de la vacante:",
        error
      );

      showMessage(
        error.userMessage ||
          error.response?.data
            ?.message ||
          "No se pudo cambiar el estado de la vacante.",
        "error"
      );
    }
  };

  const addPreguntaToExam = () => {
    if (
      !preguntaForm.enunciado.trim()
    ) {
      showMessage(
        "El enunciado de la pregunta es obligatorio.",
        "error"
      );

      return;
    }

    if (
      preguntaForm.tipoPregunta ===
        "MULTIPLE" &&
      (
        !preguntaForm.opcionA.trim() ||
        !preguntaForm.opcionB.trim()
      )
    ) {
      showMessage(
        "Las preguntas de opción múltiple requieren al menos las opciones A y B.",
        "error"
      );

      return;
    }

    const preguntaFinal = {
      ...preguntaForm,
    };

    if (
      preguntaFinal.tipoPregunta ===
      "VERDADERO_FALSO"
    ) {
      preguntaFinal.opcionA =
        "VERDADERO";

      preguntaFinal.opcionB =
        "FALSO";

      preguntaFinal.opcionC =
        "N/A";

      preguntaFinal.opcionD =
        "N/A";
    } else {
      preguntaFinal.opcionC =
        preguntaFinal.opcionC
          .trim() || "N/A";

      preguntaFinal.opcionD =
        preguntaFinal.opcionD
          .trim() || "N/A";
    }

    setExamForm((prev) => ({
      ...prev,
      preguntas: [
        ...prev.preguntas,
        preguntaFinal,
      ],
    }));

    setPreguntaForm(
      initialPreguntaForm
    );

    showMessage(
      "Pregunta añadida al borrador del examen.",
      "success"
    );
  };

  const handleSaveExam = async () => {
    if (
      !examForm.titulo.trim() ||
      examForm.preguntas.length === 0
    ) {
      showMessage(
        "El examen debe tener un título y al menos una pregunta.",
        "error"
      );

      return;
    }

    const payload = {
      vacanteId: Number(
        selectedVacante.id
      ),
      titulo:
        examForm.titulo.trim(),
      descripcion:
        examForm.descripcion.trim() ||
        null,
      preguntas:
        examForm.preguntas,
    };

    try {
      await evaluacionService.crear(
        payload
      );

      showMessage(
        "Evaluación técnica enlazada correctamente a la vacante.",
        "success"
      );

      setShowExamModal(false);
      setExamForm(initialExamForm);
      setSelectedVacante(null);

      await loadData();
    } catch (error) {
      showMessage(
        error.userMessage ||
          "Error al registrar el examen en MySQL.",
        "error"
      );
    }
  };

  const handleViewExam = async (
    vacanteId
  ) => {
    try {
      const examData =
        await evaluacionService
          .obtenerPorVacanteAdmin(
            vacanteId
          );

      const normalizedExam =
        Array.isArray(examData)
          ? examData[0] ?? null
          : examData;

      setViewingExam(
        normalizedExam
      );
    } catch (error) {
      showMessage(
        error.userMessage ||
          "Esta vacante aún no cuenta con un examen configurado.",
        "info"
      );
    }
  };

  const vacantesFiltradas =
    useMemo(() => {
      const texto =
        busquedaVacante
          .trim()
          .toLowerCase();

      return vacantes.filter(
        (vacante) => {
          const coincideBusqueda =
            texto === "" ||
            (
              vacante.titulo || ""
            )
              .toLowerCase()
              .includes(texto) ||
            (
              vacante.areaNombre || ""
            )
              .toLowerCase()
              .includes(texto) ||
            (
              vacante.modalidad || ""
            )
              .toLowerCase()
              .includes(texto) ||
            (
              vacante.descripcion || ""
            )
              .toLowerCase()
              .includes(texto);

          const coincideEstado =
            filtroEstadoVacante ===
              "TODAS" ||
            vacante.estado ===
              filtroEstadoVacante;

          return (
            coincideBusqueda &&
            coincideEstado
          );
        }
      );
    }, [
      vacantes,
      busquedaVacante,
      filtroEstadoVacante,
    ]);

  const filtrosActivos =
    busquedaVacante.trim() !== "" ||
    filtroEstadoVacante !== "TODAS";

  const limpiarFiltros = () => {
    setBusquedaVacante("");
    setFiltroEstadoVacante(
      "TODAS"
    );
  };

  const noHayAreasActivas =
    !loading && areas.length === 0;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Gestión de Vacantes y Exámenes"
        description="Publica ofertas laborales y diseña evaluaciones técnicas dinámicas de selección."
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-sm font-black text-slate-700 uppercase tracking-wider">
                  Vacantes registradas
                </p>

                <p className="text-xs text-slate-400 mt-1">
                  Mostrando{" "}
                  {
                    vacantesFiltradas.length
                  }{" "}
                  de {vacantes.length}{" "}
                  vacantes
                </p>
              </div>

              <button
                type="button"
                onClick={loadData}
                className="inline-flex items-center justify-center gap-2 border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-sm font-black cursor-pointer"
              >
                <RefreshCw size={16} />
                Actualizar panel
              </button>
            </div>

            {/* FILTROS DE LA MISMA VISTA */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_220px_auto] gap-3">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  value={
                    busquedaVacante
                  }
                  onChange={(event) =>
                    setBusquedaVacante(
                      event.target.value
                    )
                  }
                  placeholder="Buscar por puesto, área, modalidad o descripción..."
                  className="w-full border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 outline-none focus:border-rose-500 text-sm"
                />
              </div>

              <select
                value={
                  filtroEstadoVacante
                }
                onChange={(event) =>
                  setFiltroEstadoVacante(
                    event.target.value
                  )
                }
                className="w-full border border-slate-300 rounded-xl px-3 py-2.5 outline-none bg-white focus:border-rose-500 text-sm font-bold text-slate-700"
              >
                <option value="TODAS">
                  Todas las vacantes
                </option>

                <option value="ACTIVA">
                  Publicadas
                </option>

                <option value="CERRADA">
                  Pausadas
                </option>
              </select>

              <button
                type="button"
                onClick={limpiarFiltros}
                disabled={!filtrosActivos}
                className="inline-flex items-center justify-center gap-2 border border-slate-300 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 px-3 py-2.5 rounded-xl text-xs font-black cursor-pointer"
              >
                <FilterX size={16} />
                Limpiar
              </button>
            </div>
          </div>

          {loading ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 font-bold text-sm shadow-sm animate-pulse">
              Consultando catálogo
              relacional en MySQL...
            </div>
          ) : vacantes.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm text-slate-400">
              No hay vacantes registradas
              en el sistema. Publica la
              primera usando el bloque
              lateral.
            </div>
          ) : vacantesFiltradas.length ===
            0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
              <Search
                size={34}
                className="mx-auto text-slate-300 mb-3"
              />

              <p className="font-black text-slate-600">
                No se encontraron vacantes
              </p>

              <p className="text-sm text-slate-400 mt-1">
                Cambia o limpia los filtros
                utilizados.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {vacantesFiltradas.map(
                (vacante) => (
                  <div
                    key={vacante.id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-rose-300 transition-all grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-center"
                  >
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-block text-[10px] font-black bg-rose-50 text-rose-600 border border-rose-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {
                            vacante.areaNombre
                          }
                        </span>

                        <span
                          className={`inline-block text-[10px] font-black px-2 py-0.5 rounded-full border ${
                            vacante.estado ===
                            "ACTIVA"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-slate-100 text-slate-500 border-slate-200"
                          }`}
                        >
                          {getEstadoVacanteLabel(
                            vacante.estado
                          )}
                        </span>
                      </div>

                      <h3 className="text-xl font-black text-slate-900 mt-2 tracking-tight">
                        {vacante.titulo}
                      </h3>

                      <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                        {
                          vacante.descripcion
                        }
                      </p>

                      <div className="text-xs font-bold text-slate-400 mt-3 flex flex-wrap gap-4">
                        <span>
                          Modalidad:{" "}
                          <strong className="text-slate-600">
                            {
                              vacante.modalidad
                            }
                          </strong>
                        </span>

                        <span>
                          Compensación:{" "}
                          <strong className="text-slate-600">
                            S/.{" "}
                            {vacante.salario ||
                              "Confidencial"}
                          </strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap md:flex-col gap-2 justify-end">
                      {vacante.evaluacionId ? (
                        <button
                          type="button"
                          onClick={() =>
                            handleViewExam(
                              vacante.id
                            )
                          }
                          className="inline-flex items-center gap-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl transition-all cursor-pointer"
                        >
                          <Eye size={14} />
                          Ver preguntas
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedVacante(
                              vacante
                            );

                            setShowExamModal(
                              true
                            );
                          }}
                          className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black px-3 py-2 rounded-xl transition-all cursor-pointer"
                        >
                          <ClipboardCheck
                            size={14}
                          />
                          Configurar examen
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          handleToggleEstado(
                            vacante.id,
                            vacante.estado
                          )
                        }
                        className={`inline-flex items-center justify-center text-xs font-bold px-3 py-2 rounded-xl transition-all cursor-pointer border ${
                          vacante.estado ===
                          "ACTIVA"
                            ? "border-rose-200 text-rose-600 hover:bg-rose-50"
                            : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                        }`}
                      >
                        {vacante.estado ===
                        "ACTIVA"
                          ? "Pausar publicación"
                          : "Volver a publicar"}
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          )}

          {viewingExam && (
            <div className="bg-slate-900 text-white border border-slate-800 rounded-2xl p-5 shadow-lg relative mt-6">
              <button
                type="button"
                onClick={() =>
                  setViewingExam(null)
                }
                className="absolute top-4 right-4 text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
              >
                Cerrar vista
              </button>

              <p className="text-xs font-black text-rose-400 uppercase tracking-wider">
                Examen oficial enlazado
              </p>

              <h4 className="text-2xl font-black mt-1 tracking-tight">
                {viewingExam.titulo}
              </h4>

              <p className="text-sm text-slate-400 mt-1">
                {viewingExam.descripcion ||
                  "Sin descripción adicional."}
              </p>

              <div className="mt-4 space-y-3.5 border-t border-slate-800 pt-4">
                {viewingExam.preguntas
                  ?.length > 0 ? (
                  viewingExam.preguntas.map(
                    (pregunta, index) => (
                      <div
                        key={
                          pregunta.id ||
                          index
                        }
                        className="bg-slate-950 border border-white/5 p-3.5 rounded-xl"
                      >
                        <p className="text-sm font-black">
                          <span className="text-rose-400">
                            P{index + 1}:
                          </span>{" "}
                          {
                            pregunta.enunciado
                          }
                        </p>

                        <span className="inline-flex mt-2 text-[10px] font-black uppercase tracking-wider bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md">
                          Valor:{" "}
                          {obtenerPuntajePregunta(
                            index,
                            viewingExam
                              .preguntas
                              .length
                          )}{" "}
                          pts
                        </span>

                        {pregunta.tipoPregunta ===
                          "MULTIPLE" && (
                          <div className="grid grid-cols-2 gap-2 mt-2.5 text-xs text-slate-400 font-medium">
                            <p>
                              A){" "}
                              {
                                pregunta.opcionA
                              }
                            </p>

                            <p>
                              B){" "}
                              {
                                pregunta.opcionB
                              }
                            </p>

                            <p>
                              C){" "}
                              {
                                pregunta.opcionC
                              }
                            </p>

                            <p>
                              D){" "}
                              {
                                pregunta.opcionD
                              }
                            </p>
                          </div>
                        )}

                        <span className="inline-block mt-2 text-[11px] font-black bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-md">
                          Respuesta correcta:{" "}
                          {
                            pregunta.respuestaCorrecta
                          }
                        </span>
                      </div>
                    )
                  )
                ) : (
                  <div className="bg-slate-950 border border-white/5 p-4 rounded-xl text-sm text-slate-400">
                    Esta evaluación existe,
                    pero todavía no tiene
                    preguntas registradas.
                  </div>
                )}
              </div>
            </div>
          )}
        </main>

        <aside>
          <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm sticky top-6">
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Briefcase
                className="text-rose-600"
                size={20}
              />

              Nueva vacante
            </h2>

            <p className="text-sm text-slate-500 mt-1 mb-5">
              Publica una nueva plaza en
              el portal público de
              reclutamiento.
            </p>

            <form
              onSubmit={
                handleCreateVacante
              }
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                  Área tecnológica *
                </label>

                <select
                  name="areaId"
                  value={vacanteForm.areaId}
                  onChange={handleVacanteChange}
                  disabled={
                    loading ||
                    noHayAreasActivas
                  }
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 outline-none bg-white focus:border-rose-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-sm font-bold text-slate-800"
                  required
                >
                  <option value="">
                    {loading
                      ? "Cargando áreas activas..."
                      : noHayAreasActivas
                        ? "No existen áreas activas"
                        : "-- Selecciona un área activa --"}
                  </option>

                  {areas.map((area) => (
                    <option
                      key={area.id}
                      value={area.id}
                    >
                      {area.nombre}
                    </option>
                  ))}
                </select>

                {noHayAreasActivas ? (
                  <p className="text-[11px] text-rose-600 font-semibold mt-2">
                    No puedes publicar vacantes porque no existen áreas activas. Activa o registra un área tecnológica primero.
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-400 mt-1">
                    Solo se muestran áreas tecnológicas activas.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                  Título del puesto *
                </label>

                <input
                  name="titulo"
                  type="text"
                  value={
                    vacanteForm.titulo
                  }
                  onChange={
                    handleVacanteChange
                  }
                  placeholder="Ej: Fullstack Developer Spring/React"
                  className="input-light text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                  Descripción del perfil *
                </label>

                <textarea
                  name="descripcion"
                  value={
                    vacanteForm.descripcion
                  }
                  onChange={
                    handleVacanteChange
                  }
                  placeholder="Requisitos, tecnologías mandatorias y responsabilidades..."
                  className="w-full min-h-24 border border-slate-300 rounded-xl p-3 outline-none focus:border-rose-500 text-sm resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                    Modalidad
                  </label>

                  <select
                    name="modalidad"
                    value={
                      vacanteForm.modalidad
                    }
                    onChange={
                      handleVacanteChange
                    }
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 outline-none bg-white text-sm font-bold text-slate-800"
                  >
                    <option value="REMOTO">
                      Remoto
                    </option>

                    <option value="PRESENCIAL">
                      Presencial
                    </option>

                    <option value="HIBRIDO">
                      Híbrido
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                    Salario (S/.)
                  </label>

                  <input
                    name="salario"
                    type="number"
                    value={
                      vacanteForm.salario
                    }
                    onChange={
                      handleVacanteChange
                    }
                    placeholder="Monto neto"
                    className="input-light text-sm"
                  />
                </div>
              </div>

                <button
                  type="submit"
                  disabled={
                    loading ||
                    noHayAreasActivas
                  }
                  className="w-full inline-flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl text-sm font-black shadow-md cursor-pointer transition-all"
                >
                  <Save size={16} />

                  {noHayAreasActivas
                    ? "Sin áreas disponibles"
                    : "Publicar oferta TI"}
                </button>
            </form>
          </section>
        </aside>
      </div>

      {showExamModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-5">
            <div>
              <span className="text-xs font-black text-rose-600 uppercase tracking-wider">
                Creador de evaluaciones
              </span>

              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                Estructurar examen para:{" "}
                {
                  selectedVacante?.titulo
                }
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Título de la evaluación"
                value={examForm.titulo}
                onChange={(event) =>
                  setExamForm((prev) => ({
                    ...prev,
                    titulo:
                      event.target.value,
                  }))
                }
                className="input-light text-sm"
              />

              <input
                type="text"
                placeholder="Indicaciones cortas"
                value={
                  examForm.descripcion
                }
                onChange={(event) =>
                  setExamForm((prev) => ({
                    ...prev,
                    descripcion:
                      event.target.value,
                  }))
                }
                className="input-light text-sm"
              />
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-slate-500 uppercase tracking-wider">
                  Agregar pregunta
                </span>

                <select
                  value={
                    preguntaForm.tipoPregunta
                  }
                  onChange={(event) =>
                    setPreguntaForm(
                      (prev) => ({
                        ...prev,
                        tipoPregunta:
                          event.target
                            .value,
                        opcionA: "",
                        opcionB: "",
                        opcionC: "",
                        opcionD: "",
                        respuestaCorrecta:
                          "A",
                      })
                    )
                  }
                  className="border border-slate-300 rounded-xl px-2 py-1 text-xs font-black text-slate-700 bg-white"
                >
                  <option value="MULTIPLE">
                    Opción múltiple
                  </option>

                  <option value="VERDADERO_FALSO">
                    Verdadero o falso
                  </option>
                </select>
              </div>

              <input
                type="text"
                placeholder="Enunciado técnico"
                value={
                  preguntaForm.enunciado
                }
                onChange={(event) =>
                  setPreguntaForm(
                    (prev) => ({
                      ...prev,
                      enunciado:
                        event.target.value,
                    })
                  )
                }
                className="input-light text-sm"
              />

              {preguntaForm.tipoPregunta ===
              "MULTIPLE" ? (
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Alternativa A"
                    value={
                      preguntaForm.opcionA
                    }
                    onChange={(event) =>
                      setPreguntaForm(
                        (prev) => ({
                          ...prev,
                          opcionA:
                            event.target
                              .value,
                        })
                      )
                    }
                    className="input-light text-xs"
                  />

                  <input
                    type="text"
                    placeholder="Alternativa B"
                    value={
                      preguntaForm.opcionB
                    }
                    onChange={(event) =>
                      setPreguntaForm(
                        (prev) => ({
                          ...prev,
                          opcionB:
                            event.target
                              .value,
                        })
                      )
                    }
                    className="input-light text-xs"
                  />

                  <input
                    type="text"
                    placeholder="Alternativa C"
                    value={
                      preguntaForm.opcionC
                    }
                    onChange={(event) =>
                      setPreguntaForm(
                        (prev) => ({
                          ...prev,
                          opcionC:
                            event.target
                              .value,
                        })
                      )
                    }
                    className="input-light text-xs"
                  />

                  <input
                    type="text"
                    placeholder="Alternativa D"
                    value={
                      preguntaForm.opcionD
                    }
                    onChange={(event) =>
                      setPreguntaForm(
                        (prev) => ({
                          ...prev,
                          opcionD:
                            event.target
                              .value,
                        })
                      )
                    }
                    className="input-light text-xs"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-600 text-center py-1">
                  <div className="bg-white border border-slate-200 p-2 rounded-xl">
                    Opción A: VERDADERO
                  </div>

                  <div className="bg-white border border-slate-200 p-2 rounded-xl">
                    Opción B: FALSO
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600">
                    Alternativa correcta:
                  </span>

                  <select
                    value={
                      preguntaForm.respuestaCorrecta
                    }
                    onChange={(event) =>
                      setPreguntaForm(
                        (prev) => ({
                          ...prev,
                          respuestaCorrecta:
                            event.target
                              .value,
                        })
                      )
                    }
                    className="border border-slate-300 rounded-xl px-3 py-1 text-xs font-black text-slate-800 bg-white"
                  >
                    <option value="A">
                      A
                    </option>

                    <option value="B">
                      B
                    </option>

                    {preguntaForm.tipoPregunta ===
                      "MULTIPLE" && (
                      <>
                        <option value="C">
                          C
                        </option>

                        <option value="D">
                          D
                        </option>
                      </>
                    )}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={
                    addPreguntaToExam
                  }
                  className="inline-flex items-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-black px-3 py-2 rounded-xl transition-all cursor-pointer"
                >
                  <Plus size={14} />
                  Cargar pregunta
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-black text-slate-400 uppercase tracking-wider">
                Preguntas agregadas (
                {examForm.preguntas.length}
                )
              </p>

              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                {examForm.preguntas.map(
                  (pregunta, index) => (
                    <div
                      key={index}
                      className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs flex justify-between items-center"
                    >
                      <p className="font-bold text-slate-700 truncate max-w-[85%]">
                        <span className="text-rose-600 font-black">
                          P{index + 1}:
                        </span>{" "}
                        {
                          pregunta.enunciado
                        }{" "}
                        (Clave:{" "}
                        {
                          pregunta.respuestaCorrecta
                        }
                        )
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          setExamForm(
                            (prev) => ({
                              ...prev,
                              preguntas:
                                prev.preguntas.filter(
                                  (
                                    _,
                                    posicion
                                  ) =>
                                    posicion !==
                                    index
                                ),
                            })
                          )
                        }
                        className="text-rose-500 hover:text-rose-700 cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="flex gap-2 border-t border-slate-100 pt-4 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowExamModal(false);
                  setExamForm(
                    initialExamForm
                  );
                  setSelectedVacante(
                    null
                  );
                }}
                className="border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSaveExam}
                className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-xl text-sm font-black shadow-md cursor-pointer transition-colors"
              >
                Guardar examen oficial
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminVacantes;