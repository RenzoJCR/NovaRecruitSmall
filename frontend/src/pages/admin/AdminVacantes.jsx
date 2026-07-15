import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Briefcase,
  CheckCircle2,
  CircleHelp,
  ClipboardCheck,
  Eye,
  FilterX,
  ListChecks,
  LockKeyhole,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  X,
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
  id: null,
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
  // DATOS PRINCIPALES
  const [vacantes, setVacantes] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);

  // MENSAJES
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] =
    useState("info");

  // CREACIÓN Y EDICIÓN DE VACANTES
  const [vacanteForm, setVacanteForm] =
    useState(initialVacanteForm);

  const [
    editingVacanteId,
    setEditingVacanteId,
  ] = useState(null);

  const [
    savingVacante,
    setSavingVacante,
  ] = useState(false);

  // FILTROS
  const [
    busquedaVacante,
    setBusquedaVacante,
  ] = useState("");

  const [
    filtroEstadoVacante,
    setFiltroEstadoVacante,
  ] = useState("TODAS");

  const [
    filtroAreaVacante,
    setFiltroAreaVacante,
  ] = useState("TODAS");

  const [
    filtroModalidadVacante,
    setFiltroModalidadVacante,
  ] = useState("TODAS");

  const [
    filtroEvaluacionVacante,
    setFiltroEvaluacionVacante,
  ] = useState("TODAS");

  // MODAL DE EVALUACIÓN
  const [
    showExamModal,
    setShowExamModal,
  ] = useState(false);

  const [
    selectedVacante,
    setSelectedVacante,
  ] = useState(null);

  /*
   * CREATE: crear una evaluación.
   * EDIT: editar una evaluación no respondida.
   * READ: consultar una evaluación respondida.
   */
  const [examMode, setExamMode] =
    useState("CREATE");

  const [examForm, setExamForm] =
    useState(initialExamForm);

  const [
    preguntaForm,
    setPreguntaForm,
  ] = useState(initialPreguntaForm);

  const [
    editingQuestionIndex,
    setEditingQuestionIndex,
  ] = useState(null);

  const [
    loadingExam,
    setLoadingExam,
  ] = useState(false);

  const [
    savingExam,
    setSavingExam,
  ] = useState(false);

  const [examLocked, setExamLocked] =
    useState(false);

  const [examDirty, setExamDirty] =
    useState(false);

  const showMessage = (
    text,
    type = "info"
  ) => {
    setMessage(text);
    setMessageType(type);

    window.setTimeout(() => {
      setMessage("");
    }, 4500);
  };

  const getEstadoVacanteLabel = (
    estado
  ) =>
    estado === "ACTIVA"
      ? "Publicada"
      : "Pausada";

  const obtenerPuntajePregunta = (
    indice,
    totalPreguntas
  ) => {
    if (totalPreguntas <= 0) {
      return 0;
    }

    const puntajeBase = Math.floor(
      20 / totalPreguntas
    );

    const puntosRestantes =
      20 % totalPreguntas;

    return (
      puntajeBase +
      (indice < puntosRestantes
        ? 1
        : 0)
    );
  };

  // CARGA DE VACANTES Y ÁREAS ACTIVAS
  const loadData = useCallback(
    async () => {
      try {
        setLoading(true);

        const [
          vacantesData,
          areasData,
        ] = await Promise.all([
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
          "Error al cargar vacantes:",
          error
        );

        setVacantes([]);
        setAreas([]);

        setMessage(
          error.userMessage ||
            error.response?.data
              ?.message ||
            "No se pudieron sincronizar las vacantes y áreas."
        );

        setMessageType("error");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  // BLOQUEAR SCROLL CUANDO EL MODAL ESTÁ ABIERTO
  useEffect(() => {
    if (!showExamModal) {
      return undefined;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [showExamModal]);

  // VACANTE QUE ACTUALMENTE SE ESTÁ EDITANDO
  const vacanteEnEdicion = useMemo(
    () => {
      if (
        editingVacanteId === null
      ) {
        return null;
      }

      return (
        vacantes.find(
          (vacante) =>
            vacante.id ===
            editingVacanteId
        ) || null
      );
    },
    [vacantes, editingVacanteId]
  );

  /*
   * Para crear una vacante solo mostramos
   * áreas activas.
   *
   * Si una vacante ya pertenece a un área
   * posteriormente desactivada, permitimos
   * conservar esa área durante la edición.
   */
  const areasFormulario = useMemo(
    () => {
      if (!vacanteEnEdicion) {
        return areas;
      }

      const contieneAreaActual =
        areas.some(
          (area) =>
            Number(area.id) ===
            Number(
              vacanteEnEdicion.areaId
            )
        );

      if (contieneAreaActual) {
        return areas;
      }

      return [
        {
          id: vacanteEnEdicion.areaId,
          nombre:
            `${vacanteEnEdicion.areaNombre} (área actual inactiva)`,
          activo: false,
        },
        ...areas,
      ];
    },
    [areas, vacanteEnEdicion]
  );

  // FILTROS DE VACANTES
  const areasDisponiblesFiltro =
    useMemo(() => {
      const areasUnicas =
        new Map();

      vacantes.forEach((vacante) => {
        if (
          vacante.areaId &&
          vacante.areaNombre
        ) {
          areasUnicas.set(
            String(vacante.areaId),
            {
              id: String(
                vacante.areaId
              ),
              nombre:
                vacante.areaNombre,
            }
          );
        }
      });

      return Array.from(
        areasUnicas.values()
      ).sort((areaA, areaB) =>
        areaA.nombre.localeCompare(
          areaB.nombre
        )
      );
    }, [vacantes]);

  const vacantesFiltradas = useMemo(
    () => {
      const texto =
        busquedaVacante
          .trim()
          .toLowerCase();

      return vacantes.filter(
        (vacante) => {
          const coincideBusqueda =
            texto === "" ||
            (vacante.titulo || "")
              .toLowerCase()
              .includes(texto) ||
            (vacante.areaNombre || "")
              .toLowerCase()
              .includes(texto) ||
            (vacante.modalidad || "")
              .toLowerCase()
              .includes(texto) ||
            (vacante.descripcion || "")
              .toLowerCase()
              .includes(texto);

          const coincideEstado =
            filtroEstadoVacante ===
              "TODAS" ||
            vacante.estado ===
              filtroEstadoVacante;

          const coincideArea =
            filtroAreaVacante ===
              "TODAS" ||
            String(vacante.areaId) ===
              filtroAreaVacante;

          const coincideModalidad =
            filtroModalidadVacante ===
              "TODAS" ||
            vacante.modalidad ===
              filtroModalidadVacante;

          const tieneEvaluacion =
            vacante.evaluacionId !==
              null &&
            vacante.evaluacionId !==
              undefined;

          const coincideEvaluacion =
            filtroEvaluacionVacante ===
              "TODAS" ||
            (
              filtroEvaluacionVacante ===
                "CON_EVALUACION" &&
              tieneEvaluacion
            ) ||
            (
              filtroEvaluacionVacante ===
                "SIN_EVALUACION" &&
              !tieneEvaluacion
            );

          return (
            coincideBusqueda &&
            coincideEstado &&
            coincideArea &&
            coincideModalidad &&
            coincideEvaluacion
          );
        }
      );
    },
    [
      vacantes,
      busquedaVacante,
      filtroEstadoVacante,
      filtroAreaVacante,
      filtroModalidadVacante,
      filtroEvaluacionVacante,
    ]
  );

  const filtrosActivos =
    busquedaVacante.trim() !== "" ||
    filtroEstadoVacante !==
      "TODAS" ||
    filtroAreaVacante !==
      "TODAS" ||
    filtroModalidadVacante !==
      "TODAS" ||
    filtroEvaluacionVacante !==
      "TODAS";

  const limpiarFiltros = () => {
      setBusquedaVacante("");
      setFiltroEstadoVacante(
        "TODAS"
      );
      setFiltroAreaVacante(
        "TODAS"
      );
      setFiltroModalidadVacante(
        "TODAS"
      );
      setFiltroEvaluacionVacante(
        "TODAS"
      );
    };

  const noHayAreasActivas =
    !loading && areas.length === 0;

  const formularioVacanteBloqueado =
    loading ||
    (noHayAreasActivas &&
      editingVacanteId === null);

  // FORMULARIO DE VACANTE
  const handleVacanteChange = (
    event
  ) => {
    const { name, value } =
      event.target;

    setVacanteForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const iniciarEdicionVacante = (
    vacante
  ) => {
    setEditingVacanteId(
      vacante.id
    );

    setVacanteForm({
      areaId: String(
        vacante.areaId
      ),
      titulo:
        vacante.titulo || "",
      descripcion:
        vacante.descripcion || "",
      modalidad:
        vacante.modalidad ||
        "REMOTO",
      salario:
        vacante.salario ?? "",
    });

    setTimeout(() => {
      document
        .getElementById(
          "vacante-form-panel"
        )
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 0);
  };

  const cancelarEdicionVacante =
    () => {
      setEditingVacanteId(null);
      setVacanteForm(
        initialVacanteForm
      );
    };

  const handleSubmitVacante =
    async (event) => {
      event.preventDefault();

      if (
        !vacanteForm.areaId ||
        !vacanteForm.titulo.trim() ||
        !vacanteForm.descripcion.trim()
      ) {
        showMessage(
          "Completa todos los campos obligatorios de la vacante.",
          "error"
        );

        return;
      }

      const areaActivaSeleccionada =
        areas.find(
          (area) =>
            Number(area.id) ===
            Number(
              vacanteForm.areaId
            )
        );

      const conservaAreaActual =
        vacanteEnEdicion &&
        Number(
          vacanteEnEdicion.areaId
        ) ===
          Number(
            vacanteForm.areaId
          );

      if (
        !areaActivaSeleccionada &&
        !conservaAreaActual
      ) {
        showMessage(
          "El área seleccionada ya no está activa.",
          "error"
        );

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
          vacanteForm.salario !== ""
            ? Number(
                vacanteForm.salario
              )
            : null,
      };

      try {
        setSavingVacante(true);

        if (
          editingVacanteId !== null
        ) {
          await vacanteService.actualizar(
            editingVacanteId,
            payload
          );

          showMessage(
            "Vacante actualizada correctamente.",
            "success"
          );
        } else {
          await vacanteService.crear(
            payload
          );

          showMessage(
            "Vacante publicada correctamente.",
            "success"
          );
        }

        setEditingVacanteId(null);
        setVacanteForm(
          initialVacanteForm
        );

        await loadData();
      } catch (error) {
        showMessage(
          error.userMessage ||
            error.response?.data
              ?.message ||
            (editingVacanteId !== null
              ? "No se pudo actualizar la vacante."
              : "No se pudo publicar la vacante."),
          "error"
        );
      } finally {
        setSavingVacante(false);
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
      await vacanteService.cambiarEstado(
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
      showMessage(
        error.userMessage ||
          error.response?.data
            ?.message ||
          "No se pudo cambiar el estado de la vacante.",
        "error"
      );
    }
  };

  // REINICIAR ESTADOS DEL MODAL
  const limpiarEditorEvaluacion =
    () => {
      setSelectedVacante(null);
      setExamMode("CREATE");
      setExamForm(initialExamForm);
      setPreguntaForm(
        initialPreguntaForm
      );
      setEditingQuestionIndex(null);
      setExamLocked(false);
      setExamDirty(false);
      setLoadingExam(false);
      setSavingExam(false);
    };

  const cerrarModalEvaluacion = (
    force = false
  ) => {
    if (
      !force &&
      examDirty &&
      !examLocked
    ) {
      const confirmed =
        window.confirm(
          "Hay cambios sin guardar. ¿Deseas cerrar el editor?"
        );

      if (!confirmed) {
        return;
      }
    }

    setShowExamModal(false);
    limpiarEditorEvaluacion();
  };

  // CREAR EVALUACIÓN
  const abrirNuevaEvaluacion = (
    vacante
  ) => {
    setSelectedVacante(
      vacante
    );

    setExamMode("CREATE");
    setExamLocked(false);
    setExamForm(initialExamForm);
    setPreguntaForm(
      initialPreguntaForm
    );
    setEditingQuestionIndex(null);
    setExamDirty(false);
    setShowExamModal(true);
  };

  // VER O EDITAR EVALUACIÓN EXISTENTE
  const abrirEvaluacionExistente =
    async (vacante) => {
      setSelectedVacante(
        vacante
      );

      setShowExamModal(true);
      setLoadingExam(true);
      setExamDirty(false);
      setPreguntaForm(
        initialPreguntaForm
      );
      setEditingQuestionIndex(null);

      try {
        const [
          examenData,
          editable,
        ] = await Promise.all([
          evaluacionService
            .obtenerPorVacanteAdmin(
              vacante.id
            ),

          evaluacionService.esEditable(
            vacante.evaluacionId
          ),
        ]);

        const examenNormalizado =
          Array.isArray(examenData)
            ? examenData[0] ?? null
            : examenData;

        if (!examenNormalizado) {
          throw new Error(
            "Evaluación no encontrada"
          );
        }

        setExamForm({
          id: examenNormalizado.id,
          titulo:
            examenNormalizado.titulo ||
            "",
          descripcion:
            examenNormalizado
              .descripcion || "",
          preguntas:
            Array.isArray(
              examenNormalizado.preguntas
            )
              ? examenNormalizado
                  .preguntas
                  .map((pregunta) => ({
                    ...pregunta,
                  }))
              : [],
        });

        setExamLocked(!editable);

        setExamMode(
          editable ? "EDIT" : "READ"
        );
      } catch (error) {
        setShowExamModal(false);
        limpiarEditorEvaluacion();

        showMessage(
          error.userMessage ||
            error.response?.data
              ?.message ||
            "No se pudo cargar la evaluación.",
          "error"
        );
      } finally {
        setLoadingExam(false);
      }
    };

  // CAMPOS GENERALES DEL EXAMEN
  const handleExamFieldChange = (
    event
  ) => {
    const { name, value } =
      event.target;

    setExamForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setExamDirty(true);
  };

  // CAMPOS DEL EDITOR DE PREGUNTA
  const handlePreguntaChange = (
    event
  ) => {
    const { name, value } =
      event.target;

    if (name === "tipoPregunta") {
      setPreguntaForm({
        ...initialPreguntaForm,
        tipoPregunta: value,
      });
    } else {
      setPreguntaForm(
        (previous) => ({
          ...previous,
          [name]: value,
        })
      );
    }

    setExamDirty(true);
  };

  const preguntaBorradorTieneDatos =
    () =>
      Boolean(
        preguntaForm.enunciado.trim() ||
          preguntaForm.opcionA.trim() ||
          preguntaForm.opcionB.trim() ||
          preguntaForm.opcionC.trim() ||
          preguntaForm.opcionD.trim()
      );

  /*
   * Valida la pregunta actual y devuelve
   * una pregunta normalizada.
   */
  const construirPreguntaBorrador =
    () => {
      const enunciado =
        preguntaForm.enunciado.trim();

      if (!enunciado) {
        return {
          error:
            "Escribe el enunciado de la pregunta.",
        };
      }

      if (
        preguntaForm.tipoPregunta ===
        "VERDADERO_FALSO"
      ) {
        if (
          !["A", "B"].includes(
            preguntaForm
              .respuestaCorrecta
          )
        ) {
          return {
            error:
              "Selecciona A o B como respuesta correcta.",
          };
        }

        return {
          pregunta: {
            tipoPregunta:
              "VERDADERO_FALSO",
            enunciado,
            opcionA: "VERDADERO",
            opcionB: "FALSO",
            opcionC: "N/A",
            opcionD: "N/A",
            respuestaCorrecta:
              preguntaForm
                .respuestaCorrecta,
          },
        };
      }

      const opcionA =
        preguntaForm.opcionA.trim();

      const opcionB =
        preguntaForm.opcionB.trim();

      const opcionC =
        preguntaForm.opcionC.trim();

      const opcionD =
        preguntaForm.opcionD.trim();

      if (!opcionA) {
        return {
          error:
            "Completa la alternativa A.",
        };
      }

      if (!opcionB) {
        return {
          error:
            "Completa la alternativa B.",
        };
      }

      if (
        preguntaForm
          .respuestaCorrecta ===
          "C" &&
        !opcionC
      ) {
        return {
          error:
            "La clave es C, pero la alternativa C está vacía.",
        };
      }

      if (
        preguntaForm
          .respuestaCorrecta ===
          "D" &&
        !opcionD
      ) {
        return {
          error:
            "La clave es D, pero la alternativa D está vacía.",
        };
      }

      return {
        pregunta: {
          tipoPregunta: "MULTIPLE",
          enunciado,
          opcionA,
          opcionB,
          opcionC:
            opcionC || "N/A",
          opcionD:
            opcionD || "N/A",
          respuestaCorrecta:
            preguntaForm
              .respuestaCorrecta,
        },
      };
    };

  // AGREGAR O ACTUALIZAR PREGUNTA LOCALMENTE
  const agregarOActualizarPregunta =
    () => {
      if (examLocked) {
        return;
      }

      const resultado =
        construirPreguntaBorrador();

      if (resultado.error) {
        showMessage(
          resultado.error,
          "error"
        );

        return;
      }

      setExamForm((previous) => {
        const preguntas =
          [...previous.preguntas];

        if (
          editingQuestionIndex !==
          null
        ) {
          preguntas[
            editingQuestionIndex
          ] = resultado.pregunta;
        } else {
          preguntas.push(
            resultado.pregunta
          );
        }

        return {
          ...previous,
          preguntas,
        };
      });

      showMessage(
        editingQuestionIndex !== null
          ? "Pregunta actualizada en el examen."
          : "Pregunta agregada al examen.",
        "success"
      );

      setPreguntaForm(
        initialPreguntaForm
      );

      setEditingQuestionIndex(null);
      setExamDirty(true);
    };

  const editarPregunta = (
    pregunta,
    index
  ) => {
    if (examLocked) {
      return;
    }

    setEditingQuestionIndex(index);

    setPreguntaForm({
      tipoPregunta:
        pregunta.tipoPregunta ||
        "MULTIPLE",

      enunciado:
        pregunta.enunciado || "",

      opcionA:
        pregunta.opcionA === "N/A"
          ? ""
          : pregunta.opcionA || "",

      opcionB:
        pregunta.opcionB === "N/A"
          ? ""
          : pregunta.opcionB || "",

      opcionC:
        pregunta.opcionC === "N/A"
          ? ""
          : pregunta.opcionC || "",

      opcionD:
        pregunta.opcionD === "N/A"
          ? ""
          : pregunta.opcionD || "",

      respuestaCorrecta:
        pregunta.respuestaCorrecta ||
        "A",
    });

    setTimeout(() => {
      document
        .getElementById(
          "editor-pregunta"
        )
        ?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
    }, 0);
  };

  const cancelarEdicionPregunta =
    () => {
      setPreguntaForm(
        initialPreguntaForm
      );

      setEditingQuestionIndex(null);
    };

  const eliminarPregunta = (
    index
  ) => {
    if (examLocked) {
      return;
    }

    setExamForm((previous) => ({
      ...previous,
      preguntas:
        previous.preguntas.filter(
          (_, position) =>
            position !== index
        ),
    }));

    if (
      editingQuestionIndex === index
    ) {
      cancelarEdicionPregunta();
    } else if (
      editingQuestionIndex !== null &&
      editingQuestionIndex > index
    ) {
      setEditingQuestionIndex(
        editingQuestionIndex - 1
      );
    }

    setExamDirty(true);
  };

  /*
   * Guardar evaluación.
   *
   * Si existe una pregunta completa en el
   * editor que todavía no fue agregada,
   * se añadirá automáticamente.
   */
  const handleSaveExam = async () => {
    if (
      examLocked ||
      savingExam ||
      loadingExam
    ) {
      return;
    }

    const titulo =
      examForm.titulo.trim();

    if (!titulo) {
      showMessage(
        "Escribe el título de la evaluación.",
        "error"
      );

      return;
    }

    let preguntasFinales =
      [...examForm.preguntas];

    if (
      preguntaBorradorTieneDatos()
    ) {
      const resultado =
        construirPreguntaBorrador();

      if (resultado.error) {
        showMessage(
          `Tienes una pregunta sin terminar: ${resultado.error}`,
          "error"
        );

        return;
      }

      if (
        editingQuestionIndex !==
        null
      ) {
        preguntasFinales[
          editingQuestionIndex
        ] = resultado.pregunta;
      } else {
        preguntasFinales.push(
          resultado.pregunta
        );
      }
    }

    if (
      preguntasFinales.length === 0
    ) {
      showMessage(
        "La evaluación debe contener al menos una pregunta.",
        "error"
      );

      return;
    }

    const preguntasPayload =
      preguntasFinales.map(
        (pregunta) => ({
          tipoPregunta:
            pregunta.tipoPregunta,
          enunciado:
            pregunta.enunciado.trim(),
          opcionA:
            pregunta.opcionA,
          opcionB:
            pregunta.opcionB,
          opcionC:
            pregunta.opcionC,
          opcionD:
            pregunta.opcionD,
          respuestaCorrecta:
            pregunta.respuestaCorrecta,
        })
      );

    const payload = {
      vacanteId: Number(
        selectedVacante.id
      ),
      titulo,
      descripcion:
        examForm.descripcion
          .trim() || null,
      preguntas:
        preguntasPayload,
    };

    try {
      setSavingExam(true);

      if (examMode === "CREATE") {
        await evaluacionService.crear(
          payload
        );

        showMessage(
          "Evaluación creada correctamente.",
          "success"
        );
      } else {
        await evaluacionService.actualizar(
          examForm.id,
          payload
        );

        showMessage(
          "Evaluación actualizada correctamente.",
          "success"
        );
      }

      cerrarModalEvaluacion(true);
      await loadData();
    } catch (error) {
      showMessage(
        error.userMessage ||
          error.response?.data
            ?.message ||
          (examMode === "CREATE"
            ? "No se pudo crear la evaluación."
            : "No se pudo actualizar la evaluación."),
        "error"
      );
    } finally {
      setSavingExam(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Gestión de Vacantes y Evaluaciones"
        description="Publica vacantes, edita su información y administra sus evaluaciones técnicas."
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
          {/* FILTROS */}
          <section className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-sm font-black text-slate-700 uppercase tracking-wider">
                  Vacantes registradas
                </p>

                <p className="text-xs text-slate-400 mt-1">
                  Mostrando{" "}
                  {vacantesFiltradas.length}{" "}
                  de {vacantes.length}{" "}
                  vacantes
                </p>
              </div>

              <button
                type="button"
                onClick={loadData}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 border border-slate-300 hover:bg-slate-50 disabled:opacity-50 text-slate-700 px-4 py-2 rounded-xl text-sm font-black cursor-pointer"
              >
                <RefreshCw
                  size={16}
                  className={
                    loading
                      ? "animate-spin"
                      : ""
                  }
                />

                Actualizar panel
              </button>
            </div>

            <div className="space-y-3">
              {/* BÚSQUEDA PRINCIPAL */}
              <div className="grid grid-cols-1 md:grid-cols-[1fr_220px_auto] gap-3">
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="text"
                    value={busquedaVacante}
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
                    Todos los estados
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

              {/* FILTROS ADICIONALES */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <select
                  value={
                    filtroAreaVacante
                  }
                  onChange={(event) =>
                    setFiltroAreaVacante(
                      event.target.value
                    )
                  }
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 outline-none bg-white focus:border-rose-500 text-sm font-bold text-slate-700"
                >
                  <option value="TODAS">
                    Todas las áreas
                  </option>

                  {areasDisponiblesFiltro.map(
                    (area) => (
                      <option
                        key={area.id}
                        value={area.id}
                      >
                        {area.nombre}
                      </option>
                    )
                  )}
                </select>

                <select
                  value={
                    filtroModalidadVacante
                  }
                  onChange={(event) =>
                    setFiltroModalidadVacante(
                      event.target.value
                    )
                  }
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 outline-none bg-white focus:border-rose-500 text-sm font-bold text-slate-700"
                >
                  <option value="TODAS">
                    Todas las modalidades
                  </option>

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

                <select
                  value={
                    filtroEvaluacionVacante
                  }
                  onChange={(event) =>
                    setFiltroEvaluacionVacante(
                      event.target.value
                    )
                  }
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 outline-none bg-white focus:border-rose-500 text-sm font-bold text-slate-700"
                >
                  <option value="TODAS">
                    Todas las evaluaciones
                  </option>

                  <option value="CON_EVALUACION">
                    Con evaluación
                  </option>

                  <option value="SIN_EVALUACION">
                    Sin evaluación
                  </option>
                </select>
              </div>
            </div>
          </section>

          {/* LISTADO DE VACANTES */}
          {loading ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 font-bold text-sm shadow-sm animate-pulse">
              Consultando catálogo en
              MySQL...
            </div>
          ) : vacantes.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 shadow-sm">
              No hay vacantes registradas.
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
                Cambia o limpia los filtros.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {vacantesFiltradas.map(
                (vacante) => (
                  <article
                    key={vacante.id}
                    className={`bg-white border rounded-2xl p-5 shadow-sm transition-all grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-center ${
                      editingVacanteId ===
                      vacante.id
                        ? "border-sky-400 ring-2 ring-sky-100"
                        : "border-slate-200 hover:border-rose-300"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-block text-[10px] font-black bg-rose-50 text-rose-600 border border-rose-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {vacante.areaNombre}
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

                        {vacante.evaluacionId ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full">
                            <CheckCircle2
                              size={11}
                            />
                            Con evaluación
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                            <CircleHelp
                              size={11}
                            />
                            Sin evaluación
                          </span>
                        )}
                      </div>

                      <h3 className="text-xl font-black text-slate-900 mt-2 tracking-tight">
                        {vacante.titulo}
                      </h3>

                      <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                        {vacante.descripcion}
                      </p>

                      <div className="text-xs font-bold text-slate-400 mt-3 flex flex-wrap gap-4">
                        <span>
                          Modalidad:{" "}
                          <strong className="text-slate-600">
                            {vacante.modalidad}
                          </strong>
                        </span>

                        <span>
                          Compensación:{" "}
                          <strong className="text-slate-600">
                            S/.{" "}
                            {vacante.salario ??
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
                            abrirEvaluacionExistente(
                              vacante
                            )
                          }
                          className="inline-flex items-center justify-center gap-1.5 border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-black px-3 py-2 rounded-xl cursor-pointer"
                        >
                          <Eye size={14} />
                          Ver evaluación
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            abrirNuevaEvaluacion(
                              vacante
                            )
                          }
                          className="inline-flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black px-3 py-2 rounded-xl cursor-pointer"
                        >
                          <ClipboardCheck
                            size={14}
                          />
                          Configurar evaluación
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          iniciarEdicionVacante(
                            vacante
                          )
                        }
                        disabled={
                          savingVacante
                        }
                        className="inline-flex items-center justify-center gap-1.5 border border-sky-200 bg-sky-50 hover:bg-sky-100 disabled:opacity-50 text-sky-700 text-xs font-black px-3 py-2 rounded-xl cursor-pointer"
                      >
                        <Pencil size={14} />
                        Editar vacante
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleToggleEstado(
                            vacante.id,
                            vacante.estado
                          )
                        }
                        className={`inline-flex items-center justify-center text-xs font-bold px-3 py-2 rounded-xl cursor-pointer border ${
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
                  </article>
                )
              )}
            </div>
          )}
        </main>

        {/* FORMULARIO DE VACANTE */}
        <aside id="vacante-form-panel">
          <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm sticky top-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  {editingVacanteId !==
                  null ? (
                    <Pencil
                      className="text-sky-600"
                      size={20}
                    />
                  ) : (
                    <Briefcase
                      className="text-rose-600"
                      size={20}
                    />
                  )}

                  {editingVacanteId !==
                  null
                    ? "Editar vacante"
                    : "Nueva vacante"}
                </h2>

                <p className="text-sm text-slate-500 mt-1 mb-5">
                  {editingVacanteId !==
                  null
                    ? "Modifica los datos de la vacante seleccionada."
                    : "Publica una nueva plaza en el portal."}
                </p>
              </div>

              {editingVacanteId !==
                null && (
                <button
                  type="button"
                  onClick={
                    cancelarEdicionVacante
                  }
                  disabled={
                    savingVacante
                  }
                  title="Cancelar edición"
                  className="w-9 h-9 inline-flex items-center justify-center border border-slate-300 rounded-xl text-slate-500 cursor-pointer disabled:opacity-50"
                >
                  <X size={17} />
                </button>
              )}
            </div>

            <form
              onSubmit={
                handleSubmitVacante
              }
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase mb-2">
                  Área tecnológica *
                </label>

                <select
                  name="areaId"
                  value={
                    vacanteForm.areaId
                  }
                  onChange={
                    handleVacanteChange
                  }
                  disabled={
                    formularioVacanteBloqueado
                  }
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 bg-white text-sm font-bold disabled:bg-slate-100 disabled:text-slate-400"
                  required
                >
                  <option value="">
                    {loading
                      ? "Cargando áreas..."
                      : noHayAreasActivas &&
                          editingVacanteId ===
                            null
                        ? "No existen áreas activas"
                        : "Selecciona un área"}
                  </option>

                  {areasFormulario.map(
                    (area) => (
                      <option
                        key={area.id}
                        value={area.id}
                      >
                        {area.nombre}
                      </option>
                    )
                  )}
                </select>

                {vacanteEnEdicion &&
                  !areas.some(
                    (area) =>
                      Number(area.id) ===
                      Number(
                        vacanteEnEdicion.areaId
                      )
                  ) && (
                    <p className="text-[11px] text-amber-600 font-semibold mt-2">
                      El área actual está
                      inactiva. Puedes
                      conservarla o cambiarla
                      por un área activa.
                    </p>
                  )}
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase mb-2">
                  Título *
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
                  maxLength={150}
                  placeholder="Ej: Fullstack Developer"
                  className="input-light text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase mb-2">
                  Descripción *
                </label>

                <textarea
                  name="descripcion"
                  value={
                    vacanteForm.descripcion
                  }
                  onChange={
                    handleVacanteChange
                  }
                  placeholder="Requisitos, tecnologías y responsabilidades..."
                  className="w-full min-h-24 border border-slate-300 rounded-xl p-3 text-sm resize-none outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase mb-2">
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
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 bg-white text-sm font-bold"
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
                  <label className="block text-xs font-black text-slate-700 uppercase mb-2">
                    Salario
                  </label>

                  <input
                    name="salario"
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      vacanteForm.salario
                    }
                    onChange={
                      handleVacanteChange
                    }
                    placeholder="Monto"
                    className="input-light text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={
                  formularioVacanteBloqueado ||
                  savingVacante
                }
                className={`w-full inline-flex items-center justify-center gap-2 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl text-sm font-black ${
                  editingVacanteId !==
                  null
                    ? "bg-sky-600 hover:bg-sky-700"
                    : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                <Save size={16} />

                {savingVacante
                  ? "Guardando..."
                  : editingVacanteId !==
                      null
                    ? "Guardar cambios"
                    : noHayAreasActivas
                      ? "Sin áreas disponibles"
                      : "Publicar oferta TI"}
              </button>

              {editingVacanteId !==
                null && (
                <button
                  type="button"
                  onClick={
                    cancelarEdicionVacante
                  }
                  disabled={
                    savingVacante
                  }
                  className="w-full border border-slate-300 hover:bg-slate-50 rounded-xl px-4 py-2.5 text-sm font-black text-slate-600 cursor-pointer disabled:opacity-50"
                >
                  Cancelar edición
                </button>
              )}
            </form>
          </section>
        </aside>
      </div>

      {/* MODAL DE EVALUACIÓN */}
      {showExamModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-800/50 backdrop-blur-sm p-3 sm:p-5"
          onMouseDown={() =>
            cerrarModalEvaluacion()
          }
        >
          <section
            className="w-full max-w-6xl max-h-[94vh] overflow-y-auto bg-slate-50 rounded-3xl shadow-2xl border border-slate-300"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
            role="dialog"
            aria-modal="true"
          >
            <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 px-5 sm:px-7 py-5 rounded-t-3xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-[10px] font-black text-rose-600 uppercase tracking-wider">
                    Gestión de evaluación
                  </span>

                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                    {selectedVacante?.titulo}
                  </h3>

                  <p className="text-xs text-slate-500 mt-1">
                    {examMode === "CREATE"
                      ? "Crea el examen técnico de esta vacante."
                      : examLocked
                        ? "Consulta el examen registrado."
                        : "Revisa y modifica el examen registrado."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    cerrarModalEvaluacion()
                  }
                  disabled={savingExam}
                  title="Cerrar evaluación"
                  className="shrink-0 w-10 h-10 inline-flex items-center justify-center border border-slate-300 rounded-xl text-slate-500 hover:bg-slate-100 disabled:opacity-50 cursor-pointer"
                >
                  <X size={19} />
                </button>
              </div>
            </header>

            {loadingExam ? (
              <div className="p-16 text-center text-slate-500 font-bold animate-pulse">
                Cargando evaluación...
              </div>
            ) : (
              <div className="p-5 sm:p-7 space-y-5">
                {examLocked && (
                  <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl">
                    <LockKeyhole
                      size={20}
                      className="shrink-0 mt-0.5"
                    />

                    <div>
                      <p className="font-black text-sm">
                        Evaluación bloqueada
                      </p>

                      <p className="text-xs mt-1 leading-relaxed">
                        Esta evaluación ya fue
                        respondida al menos una
                        vez. Puede consultarse,
                        pero no modificarse.
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 xl:grid-cols-[0.95fr_1.05fr] gap-5 items-start">
                  <div className="space-y-5">
                    {/* INFORMACIÓN GENERAL */}
                    <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <ClipboardCheck
                          size={18}
                          className="text-rose-600"
                        />

                        <h4 className="font-black text-slate-900">
                          Información del examen
                        </h4>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-black text-slate-700 uppercase mb-2">
                            Título *
                          </label>

                          <input
                            name="titulo"
                            type="text"
                            value={
                              examForm.titulo
                            }
                            onChange={
                              handleExamFieldChange
                            }
                            disabled={examLocked}
                            maxLength={150}
                            placeholder="Ej: Evaluación técnica de Java"
                            className="input-light text-sm disabled:bg-slate-100 disabled:text-slate-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-black text-slate-700 uppercase mb-2">
                            Indicaciones o descripción
                          </label>

                          <textarea
                            name="descripcion"
                            value={
                              examForm.descripcion
                            }
                            onChange={
                              handleExamFieldChange
                            }
                            disabled={examLocked}
                            placeholder="Ej: Responde todas las preguntas. Solo existe una alternativa correcta."
                            className="w-full min-h-24 border border-slate-300 rounded-xl p-3 text-sm resize-none disabled:bg-slate-100 disabled:text-slate-500"
                          />
                        </div>
                      </div>
                    </section>

                    {/* EDITOR DE PREGUNTA */}
                    {!examLocked && (
                      <section
                        id="editor-pregunta"
                        className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              {editingQuestionIndex !==
                              null ? (
                                <Pencil
                                  size={18}
                                  className="text-sky-600"
                                />
                              ) : (
                                <Plus
                                  size={18}
                                  className="text-sky-600"
                                />
                              )}

                              <h4 className="font-black text-slate-900">
                                {editingQuestionIndex !==
                                null
                                  ? `Editar pregunta ${editingQuestionIndex + 1}`
                                  : "Nueva pregunta"}
                              </h4>
                            </div>

                            <p className="text-xs text-slate-500 mt-1">
                              Completa la pregunta y
                              agrégala al examen.
                            </p>
                          </div>

                          <select
                            name="tipoPregunta"
                            value={
                              preguntaForm.tipoPregunta
                            }
                            onChange={
                              handlePreguntaChange
                            }
                            className="border border-slate-300 rounded-xl px-3 py-2 text-xs font-black text-slate-700 bg-white"
                          >
                            <option value="MULTIPLE">
                              Opción múltiple
                            </option>

                            <option value="VERDADERO_FALSO">
                              Verdadero o falso
                            </option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-black text-slate-700 uppercase mb-2">
                            Enunciado *
                          </label>

                          <textarea
                            name="enunciado"
                            value={
                              preguntaForm.enunciado
                            }
                            onChange={
                              handlePreguntaChange
                            }
                            placeholder="Escribe la pregunta técnica..."
                            className="w-full min-h-20 border border-slate-300 rounded-xl p-3 text-sm resize-none"
                          />
                        </div>

                        {preguntaForm.tipoPregunta ===
                        "MULTIPLE" ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[
                              [
                                "opcionA",
                                "Alternativa A *",
                              ],
                              [
                                "opcionB",
                                "Alternativa B *",
                              ],
                              [
                                "opcionC",
                                "Alternativa C",
                              ],
                              [
                                "opcionD",
                                "Alternativa D",
                              ],
                            ].map(
                              ([
                                name,
                                label,
                              ]) => (
                                <div key={name}>
                                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1.5">
                                    {label}
                                  </label>

                                  <input
                                    name={name}
                                    type="text"
                                    value={
                                      preguntaForm[
                                        name
                                      ]
                                    }
                                    onChange={
                                      handlePreguntaChange
                                    }
                                    className="input-light text-xs"
                                  />
                                </div>
                              )
                            )}
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center text-xs font-black text-emerald-700">
                              A: VERDADERO
                            </div>

                            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-center text-xs font-black text-rose-700">
                              B: FALSO
                            </div>
                          </div>
                        )}

                        <div>
                          <label className="block text-xs font-black text-slate-700 uppercase mb-2">
                            Respuesta correcta *
                          </label>

                          <select
                            name="respuestaCorrecta"
                            value={
                              preguntaForm.respuestaCorrecta
                            }
                            onChange={
                              handlePreguntaChange
                            }
                            className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-black bg-white"
                          >
                            <option value="A">
                              Alternativa A
                            </option>

                            <option value="B">
                              Alternativa B
                            </option>

                            {preguntaForm.tipoPregunta ===
                              "MULTIPLE" && (
                              <>
                                <option value="C">
                                  Alternativa C
                                </option>

                                <option value="D">
                                  Alternativa D
                                </option>
                              </>
                            )}
                          </select>
                        </div>

                        <button
                          type="button"
                          onClick={
                            agregarOActualizarPregunta
                          }
                          className="w-full inline-flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-3 rounded-xl text-sm font-black cursor-pointer shadow-sm"
                        >
                          {editingQuestionIndex !==
                          null ? (
                            <Pencil size={16} />
                          ) : (
                            <Plus size={16} />
                          )}

                          {editingQuestionIndex !==
                          null
                            ? "Actualizar pregunta"
                            : "Agregar pregunta al examen"}
                        </button>

                        {editingQuestionIndex !==
                          null && (
                          <button
                            type="button"
                            onClick={
                              cancelarEdicionPregunta
                            }
                            className="w-full border border-slate-300 hover:bg-slate-50 rounded-xl px-4 py-2.5 text-xs font-black text-slate-600 cursor-pointer"
                          >
                            Cancelar edición de pregunta
                          </button>
                        )}

                        <p className="text-[11px] text-slate-400 text-center">
                          Una pregunta completa que
                          quede en este editor se
                          agregará automáticamente al
                          guardar la evaluación.
                        </p>
                      </section>
                    )}
                  </div>

                  {/* BANCO DE PREGUNTAS */}
                  <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <ListChecks
                            size={18}
                            className="text-purple-600"
                          />

                          <h4 className="font-black text-slate-900">
                            Preguntas del examen
                          </h4>
                        </div>

                        <p className="text-xs text-slate-500 mt-1">
                          {
                            examForm.preguntas
                              .length
                          }{" "}
                          pregunta
                          {examForm.preguntas
                            .length === 1
                            ? ""
                            : "s"}
                        </p>
                      </div>

                      <span className="text-xs font-black bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1.5 rounded-full">
                        Total: 20 pts
                      </span>
                    </div>

                    {examForm.preguntas
                      .length === 0 ? (
                      <div className="border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center">
                        <CircleHelp
                          size={34}
                          className="mx-auto text-slate-300"
                        />

                        <p className="text-sm font-black text-slate-500 mt-3">
                          Todavía no hay preguntas
                        </p>

                        <p className="text-xs text-slate-400 mt-1">
                          Utiliza el editor para
                          agregar la primera.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
                        {examForm.preguntas.map(
                          (
                            pregunta,
                            index
                          ) => (
                            <article
                              key={
                                pregunta.id ||
                                `${pregunta.enunciado}-${index}`
                              }
                              className={`border rounded-2xl p-4 ${
                                editingQuestionIndex ===
                                index
                                  ? "border-sky-400 bg-sky-50/50"
                                  : "border-slate-200 bg-slate-50/60"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[10px] font-black bg-slate-900 text-white px-2 py-1 rounded-full">
                                      P{index + 1}
                                    </span>

                                    <span className="text-[10px] font-black bg-purple-50 text-purple-700 border border-purple-200 px-2 py-1 rounded-full">
                                      {obtenerPuntajePregunta(
                                        index,
                                        examForm
                                          .preguntas
                                          .length
                                      )}{" "}
                                      pts
                                    </span>

                                    <span className="text-[10px] font-black text-slate-500">
                                      {pregunta.tipoPregunta ===
                                      "VERDADERO_FALSO"
                                        ? "Verdadero/Falso"
                                        : "Opción múltiple"}
                                    </span>
                                  </div>

                                  <p className="text-sm font-black text-slate-900 mt-3 leading-relaxed">
                                    {
                                      pregunta.enunciado
                                    }
                                  </p>
                                </div>

                                {!examLocked && (
                                  <div className="flex gap-1 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        editarPregunta(
                                          pregunta,
                                          index
                                        )
                                      }
                                      title="Editar pregunta"
                                      className="w-8 h-8 inline-flex items-center justify-center border border-sky-200 text-sky-600 bg-sky-50 hover:bg-sky-100 rounded-lg cursor-pointer"
                                    >
                                      <Pencil
                                        size={14}
                                      />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        eliminarPregunta(
                                          index
                                        )
                                      }
                                      title="Eliminar pregunta"
                                      className="w-8 h-8 inline-flex items-center justify-center border border-rose-200 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg cursor-pointer"
                                    >
                                      <Trash2
                                        size={14}
                                      />
                                    </button>
                                  </div>
                                )}
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-xs">
                                {[
                                  [
                                    "A",
                                    pregunta.opcionA,
                                  ],
                                  [
                                    "B",
                                    pregunta.opcionB,
                                  ],
                                  [
                                    "C",
                                    pregunta.opcionC,
                                  ],
                                  [
                                    "D",
                                    pregunta.opcionD,
                                  ],
                                ]
                                  .filter(
                                    ([
                                      ,
                                      value,
                                    ]) =>
                                      value &&
                                      value !==
                                        "N/A"
                                  )
                                  .map(
                                    ([
                                      letter,
                                      value,
                                    ]) => (
                                      <div
                                        key={
                                          letter
                                        }
                                        className={`border rounded-xl px-3 py-2 ${
                                          pregunta.respuestaCorrecta ===
                                          letter
                                            ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-black"
                                            : "bg-white border-slate-200 text-slate-600"
                                        }`}
                                      >
                                        {letter}){" "}
                                        {value}
                                      </div>
                                    )
                                  )}
                              </div>

                              <p className="text-[11px] font-black text-emerald-700 mt-3">
                                Respuesta correcta:{" "}
                                {
                                  pregunta.respuestaCorrecta
                                }
                              </p>
                            </article>
                          )
                        )}
                      </div>
                    )}
                  </section>
                </div>

                {/* PIE DEL MODAL */}
                <footer className="sticky bottom-0 bg-slate-50/95 backdrop-blur-md border-t border-slate-200 pt-5 flex flex-col sm:flex-row sm:items-center gap-3">
                  <p className="text-xs text-slate-500 sm:mr-auto">
                    {examLocked
                      ? "Modo de consulta: no se realizarán cambios."
                      : "Revisa el título, las indicaciones y las preguntas antes de guardar."}
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      cerrarModalEvaluacion()
                    }
                    disabled={savingExam}
                    className="border border-slate-300 hover:bg-white text-slate-700 px-5 py-2.5 rounded-xl text-sm font-black cursor-pointer disabled:opacity-50"
                  >
                    {examLocked
                      ? "Cerrar"
                      : "Cancelar"}
                  </button>

                  {!examLocked && (
                    <button
                      type="button"
                      onClick={
                        handleSaveExam
                      }
                      disabled={
                        savingExam ||
                        loadingExam ||
                        (examMode ===
                          "EDIT" &&
                          !examDirty)
                      }
                      className="inline-flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl text-sm font-black cursor-pointer"
                    >
                      <Save size={16} />

                      {savingExam
                        ? "Guardando evaluación..."
                        : examMode ===
                            "CREATE"
                          ? "Guardar evaluación"
                          : !examDirty
                            ? "Sin cambios"
                            : "Guardar cambios"}
                    </button>
                  )}
                </footer>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

export default AdminVacantes;