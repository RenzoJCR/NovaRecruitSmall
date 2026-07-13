import { useCallback, useEffect, useState } from "react";
import { Briefcase, ClipboardCheck, Plus, RefreshCw, Save, Trash2, Eye } from "lucide-react";
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
  preguntas: []
};

const initialPreguntaForm = {
  tipoPregunta: "MULTIPLE",
  enunciado: "",
  opcionA: "",
  opcionB: "",
  opcionC: "",
  opcionD: "",
  respuestaCorrecta: "A"
};

function AdminVacantes() {
  // 1. ESTADOS DE CONTROL DE DATOS (PROVENIENTES DE SPRING BOOT)
  const [vacantes, setVacantes] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

  // 2. ESTADOS DE FORMULARIOS
  const [vacanteForm, setVacanteForm] = useState(initialVacanteForm);
  const [examForm, setExamForm] = useState(initialExamForm);
  const [preguntaForm, setPreguntaForm] = useState(initialPreguntaForm);
  
  // 3. ESTADOS DE CONTROL DE FLUJO DE INTERFAZ (MODALES / VISTAS)
  const [selectedVacante, setSelectedVacante] = useState(null);
  const [showExamModal, setShowExamModal] = useState(false);
  const [viewingExam, setViewingExam] = useState(null);

  const obtenerPuntajePregunta = (indice, totalPreguntas) => {
    if (totalPreguntas <= 0) {
      return 0;
    }

    const puntajeBase = 20 / totalPreguntas;
    const puntajeEnteroBase = Math.floor(puntajeBase);
    const puntosRestantes = 20 % totalPreguntas;

    return puntajeEnteroBase + (indice < puntosRestantes ? 1 : 0);
  };

  const showMessage = (text, type = "info") => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(""), 4000);
  };

  // FUNCIÓN RECEPTORA DE DATOS DE MYSQL
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      // Ejecutamos ambas consultas en paralelo para mayor velocidad
      const [vacantesData, areasData] = await Promise.all([
        vacanteService.listarTodas(),
        areaService.getAll()
      ]);
      setVacantes(vacantesData);
      setAreas(areasData);
    } catch (error) {
      showMessage(error.userMessage || "Error al sincronizar datos con el servidor.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadData]);

  // MANEJO DE CAMBIOS EN FORMULARIO DE VACANTES
  const handleVacanteChange = (e) => {
    const { name, value } = e.target;
    setVacanteForm((prev) => ({ ...prev, [name]: value }));
  };

  // TRIGGER DE ENVÍO DE NUEVA VACANTE (POST /api/vacantes)
  const handleCreateVacante = async (e) => {
    e.preventDefault();
    if (!vacanteForm.areaId || !vacanteForm.titulo.trim() || !vacanteForm.descripcion.trim()) {
      showMessage("Por favor, completa todos los campos obligatorios.", "error");
      return;
    }

    const payload = {
      areaId: Number(vacanteForm.areaId),
      titulo: vacanteForm.titulo.trim(),
      descripcion: vacanteForm.descripcion.trim(),
      modalidad: vacanteForm.modalidad,
      salario: vacanteForm.salario ? Number(vacanteForm.salario) : null
    };

    try {
      await vacanteService.crear(payload);
      showMessage("Oferta laboral publicada con éxito en el portal.", "success");
      setVacanteForm(initialVacanteForm);
      await loadData(); // Refresco instantáneo de la tabla
    } catch (error) {
      showMessage(error.userMessage || "No se pudo publicar la vacante.", "error");
    }
  };

  // CAMBIO DE ESTADO DE LA VACANTE (PATCH /api/vacantes/{id}/estado)
  const handleToggleEstado = async (id, estadoActual) => {
    const nuevoEstado = estadoActual === "ACTIVA" ? "CERRADA" : "ACTIVA";
    try {
      await vacanteService.cambiarEstado(id, nuevoEstado);
      showMessage(`Vacante actualizada a estado ${nuevoEstado}.`, "success");
      await loadData();
    } catch (error) {
      showMessage(error.userMessage || "No se pudo cambiar el estado.", "error");
    }
  };

  // LÓGICA INTERNA: AGREGAR PREGUNTA AL ARRAY TEMPORAL EN MEMORIA CLIENTE
  const addPreguntaToExam = () => {
    if (!preguntaForm.enunciado.trim()) {
      showMessage("El enunciado de la pregunta es obligatorio.", "error");
      return;
    }
    
    // Si es Opción Múltiple, obligamos a llenar las alternativas core
    if (preguntaForm.tipoPregunta === "MULTIPLE" && (!preguntaForm.opcionA.trim() || !preguntaForm.opcionB.trim())) {
      showMessage("Las preguntas de opción múltiple requieren al menos las opciones A y B.", "error");
      return;
    }

    // Clonamos el formulario para limpiar y formatear los datos que irán al backend
    const preguntaFinal = { ...preguntaForm };

    // Si es Verdadero/Falso, inyectamos los valores reales para pasar el @NotBlank de Java
    if (preguntaFinal.tipoPregunta === "VERDADERO_FALSO") {
      preguntaFinal.opcionA = "VERDADERO";
      preguntaFinal.opcionB = "FALSO";
      preguntaFinal.opcionC = "N/A"; // Valor de escape seguro
      preguntaFinal.opcionD = "N/A"; // Valor de escape seguro
    } else {
      // Si es múltiple, aseguramos que ninguna viaje como cadena vacía pura si se dejaron en blanco
      preguntaFinal.opcionC = preguntaFinal.opcionC.trim() || "N/A";
      preguntaFinal.opcionD = preguntaFinal.opcionD.trim() || "N/A";
    }

    // Insertamos la pregunta formateada en el borrador del examen
    setExamForm((prev) => ({
      ...prev,
      preguntas: [...prev.preguntas, preguntaFinal]
    }));
    
    // Reseteamos el formulario de la pregunta dejando listo el estado inicial seguro
    setPreguntaForm(initialPreguntaForm);
    showMessage("Pregunta añadida al borrador del examen.", "success");
  };

  // DISPARADOR DE ENVÍO DE EXAMEN (POST /api/evaluaciones)
  const handleSaveExam = async () => {
    if (!examForm.titulo.trim() || examForm.preguntas.length === 0) {
      showMessage("El examen debe tener un título y al menos una pregunta.", "error");
      return;
    }

    const payload = {
      vacanteId: Number(selectedVacante.id),
      titulo: examForm.titulo.trim(),
      descripcion: examForm.descripcion.trim() || null,
      preguntas: examForm.preguntas
    };

    try {
      await evaluacionService.crear(payload);
      showMessage("Evaluación técnica enlazada correctamente a la vacante.", "success");
      setShowExamModal(false);
      setExamForm(initialExamForm);
      setSelectedVacante(null);
      await loadData(); // Refresco de la tabla para reflejar el examen enlazado
    } catch (error) {
      showMessage(error.userMessage || "Error al registrar el examen en MySQL.", "error");
    }
  };

  // CARGAR EXAMEN EN MODO LECTURA (GET /api/evaluaciones/vacante/{id})
  const handleViewExam = async (vacanteId) => {
    try {
      const examData = await evaluacionService.obtenerPorVacante(vacanteId);
      const normalizedExam = Array.isArray(examData) ? examData[0] ?? null : examData;
      setViewingExam(normalizedExam);
    } catch (error) {
      showMessage(error.userMessage || "Esta vacante aún no cuenta con un examen configurado.", "info");
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader 
        title="Gestión de Vacantes y Exámenes" 
        description="Publica ofertas laborales y diseña evaluaciones técnicas dinámicas de selección." 
      />

      {message && (
        <div className={`border rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${
          messageType === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : 
          messageType === "error" ? "bg-rose-50 border-rose-200 text-rose-700" : "bg-sky-50 border-sky-200 text-sky-700"
        }`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6 items-start">
        
        {/* COLUMNA IZQUIERDA: PIPELINE DE VACANTES PUBLICADAS */}
        <main className="space-y-4">
          <div className="flex justify-end bg-white border border-slate-200 rounded-2xl p-3 shadow-sm">
            <button onClick={loadData} className="inline-flex items-center gap-2 border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-sm font-black cursor-pointer">
              <RefreshCw size={16} /> Actualizar Panel
            </button>
          </div>

          {loading ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 font-bold text-sm shadow-sm animate-pulse">
              Consultando catálogo relacional en MySQL...
            </div>
          ) : vacantes.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm text-slate-400">
              No hay vacantes registradas en el sistema. Publica la primera usando el bloque lateral.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {vacantes.map((vacante) => (
                <div key={vacante.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-rose-300 transition-all grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-center">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-block text-[10px] font-black bg-rose-50 text-rose-600 border border-rose-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {vacante.areaNombre}
                      </span>
                      <span className={`inline-block text-[10px] font-black px-2 py-0.5 rounded-full border ${
                        vacante.estado === "ACTIVA" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"
                      }`}>
                        {vacante.estado}
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mt-2 tracking-tight">{vacante.titulo}</h3>
                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">{vacante.descripcion}</p>
                    <div className="text-xs font-bold text-slate-400 mt-3 flex gap-4">
                      <span>Modalidad: <strong className="text-slate-600">{vacante.modalidad}</strong></span>
                      <span>Compensación: <strong className="text-slate-600">S/. {vacante.salario || "Confidencial"}</strong></span>
                    </div>
                  </div>

                  {/* SECCIÓN DE ACCIONES COMBINADAS (VACANTE + EXAMEN) */}
                  <div className="flex flex-wrap md:flex-col gap-2 justify-end">
                    <button
                      onClick={() => { setSelectedVacante(vacante); setShowExamModal(true); }}
                      className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black px-3 py-2 rounded-xl transition-all cursor-pointer"
                    >
                      <ClipboardCheck size={14} /> Configurar Examen
                    </button>
                    <button
                      onClick={() => handleViewExam(vacante.id)}
                      className="inline-flex items-center gap-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl transition-all cursor-pointer"
                    >
                      <Eye size={14} /> Ver Preguntas
                    </button>
                    <button
                      onClick={() => handleToggleEstado(vacante.id, vacante.estado)}
                      className={`inline-flex items-center justify-center text-xs font-bold px-3 py-2 rounded-xl transition-all cursor-pointer border ${
                        vacante.estado === "ACTIVA" ? "border-rose-200 text-rose-600 hover:bg-rose-50" : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                      }`}
                    >
                      {vacante.estado === "ACTIVA" ? "Pausar Vacante" : "Activar Vacante"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* SUB-PANEL OPCIONAL: VISUALIZADOR DE PREGUNTAS DEL EXAMEN SELECCIONADO */}
          {viewingExam && (
            <div className="bg-slate-900 text-white border border-slate-800 rounded-2xl p-5 shadow-lg relative mt-6">
              <button onClick={() => setViewingExam(null)} className="absolute top-4 right-4 text-xs font-bold text-slate-400 hover:text-white cursor-pointer">Cerrar vista</button>
              <p className="text-xs font-black text-rose-400 uppercase tracking-wider">Examen oficial enlazado</p>
              <h4 className="text-2xl font-black mt-1 tracking-tight">{viewingExam.titulo}</h4>
              <p className="text-sm text-slate-400 mt-1">{viewingExam.descripcion || "Sin descripción adicional."}</p>
              
              <div className="mt-4 space-y-3.5 border-t border-slate-800 pt-4">
                {viewingExam.preguntas?.length > 0 ? (
                  viewingExam.preguntas.map((p, idx) => (
                    <div key={p.id || idx} className="bg-slate-950 border border-white/5 p-3.5 rounded-xl">
                      <p className="text-sm font-black">
                        <span className="text-rose-400">P{idx + 1}:</span> {p.enunciado}
                      </p>
                      <span className="inline-flex mt-2 text-[10px] font-black uppercase tracking-wider bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md">
                        Valor: {obtenerPuntajePregunta(idx, viewingExam.preguntas.length)} pts
                      </span>
                      {p.tipoPregunta === "MULTIPLE" && (
                        <div className="grid grid-cols-2 gap-2 mt-2.5 text-xs text-slate-400 font-medium">
                          <p>A) {p.opcionA}</p>
                          <p>B) {p.opcionB}</p>
                          <p>C) {p.opcionC}</p>
                          <p>D) {p.opcionD}</p>
                        </div>
                      )}
                      <span className="inline-block mt-2 text-[11px] font-black bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-md">
                        Respuesta Correcta: {p.respuestaCorrecta}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="bg-slate-950 border border-white/5 p-4 rounded-xl text-sm text-slate-400">
                    Esta evaluación existe, pero todavía no tiene preguntas registradas.
                  </div>
                )}
              </div>
            </div>
          )}
        </main>

        {/* COLUMNA DERECHA: FORMULARIO DE REQUERIMIENTO DE PERSONAL */}
        <aside>
          <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm sticky top-6">
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Briefcase className="text-rose-600" size={20} />
              Nueva Vacante
            </h2>
            <p className="text-sm text-slate-500 mt-1 mb-5">Publica una nueva plaza en el portal público de reclutamiento.</p>

            <form onSubmit={handleCreateVacante} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Área Tecnológica *</label>
                <select
                  name="areaId"
                  value={vacanteForm.areaId}
                  onChange={handleVacanteChange}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 outline-none bg-white focus:border-rose-500 text-sm font-bold text-slate-800"
                  required
                >
                  <option value="">-- Selecciona una categoría --</option>
                  {areas.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Título del Puesto *</label>
                <input
                  name="titulo"
                  type="text"
                  value={vacanteForm.titulo}
                  onChange={handleVacanteChange}
                  placeholder="Ej: Fullstack Developer Spring/React"
                  className="input-light text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Descripción del Perfil *</label>
                <textarea
                  name="descripcion"
                  value={vacanteForm.descripcion}
                  onChange={handleVacanteChange}
                  placeholder="Requisitos, tecnologías mandatorias y responsabilidades..."
                  className="w-full min-h-24 border border-slate-300 rounded-xl p-3 outline-none focus:border-rose-500 text-sm resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Modalidad</label>
                  <select
                    name="modalidad"
                    value={vacanteForm.modalidad}
                    onChange={handleVacanteChange}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 outline-none bg-white text-sm font-bold text-slate-800"
                  >
                    <option value="REMOTO">Remoto</option>
                    <option value="PRESENCIAL">Presencial</option>
                    <option value="HIBRIDO">Híbrido</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Salario (S/.)</label>
                  <input
                    name="salario"
                    type="number"
                    value={vacanteForm.salario}
                    onChange={handleVacanteChange}
                    placeholder="Monto neto"
                    className="input-light text-sm"
                  />
                </div>
              </div>

              <button type="submit" className="w-full inline-flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-xl text-sm font-black shadow-md cursor-pointer transition-all">
                <Save size={16} /> Publicar Oferta TI
              </button>
            </form>
          </section>
        </aside>
      </div>

      {/* MODAL FLOTANTE: CONSTRUCTOR DINÁMICO DE EXÁMENES TÉCNICOS (MULTIPLE / V o F) */}
      {showExamModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-5">
            <div>
              <span className="text-xs font-black text-rose-600 uppercase tracking-wider">Creador de Evaluaciones</span>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Estructurar examen para: {selectedVacante?.titulo}</h3>
            </div>

            {/* Bloque A: Datos generales de la prueba */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Título de la evaluación (Ej: Examen Core Java)"
                value={examForm.titulo}
                onChange={(e) => setExamForm(prev => ({ ...prev, titulo: e.target.value }))}
                className="input-light text-sm"
              />
              <input
                type="text"
                placeholder="Indicaciones cortas (Ej: Duración 20 min)"
                value={examForm.descripcion}
                onChange={(e) => setExamForm(prev => ({ ...prev, descripcion: e.target.value }))}
                className="input-light text-sm"
              />
            </div>

            {/* Bloque B: Constructor dinámico de la pregunta */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Inyectar Pregunta al Banco</span>
                <select
                  value={preguntaForm.tipoPregunta}
                  onChange={(e) => setPreguntaForm(prev => ({ ...prev, tipoPregunta: e.target.value, opcionA: "", opcionB: "", opcionC: "", opcionD: "" }))}
                  className="border border-slate-300 rounded-xl px-2 py-1 text-xs font-black text-slate-700 bg-white"
                >
                  <option value="MULTIPLE">Opción Múltiple</option>
                  <option value="VERDADERO_FALSO">Verdadero o Falso</option>
                </select>
              </div>

              <input
                type="text"
                placeholder="Enunciado técnico (Ej: ¿Qué es una anotación @Service en Spring?)"
                value={preguntaForm.enunciado}
                onChange={(e) => setPreguntaForm(prev => ({ ...prev, enunciado: e.target.value }))}
                className="input-light text-sm"
              />

              {preguntaForm.tipoPregunta === "MULTIPLE" ? (
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="Alternativa A" value={preguntaForm.opcionA} onChange={(e) => setPreguntaForm(prev => ({ ...prev, opcionA: e.target.value }))} className="input-light text-xs" />
                  <input type="text" placeholder="Alternativa B" value={preguntaForm.opcionB} onChange={(e) => setPreguntaForm(prev => ({ ...prev, opcionB: e.target.value }))} className="input-light text-xs" />
                  <input type="text" placeholder="Alternativa C" value={preguntaForm.opcionC} onChange={(e) => setPreguntaForm(prev => ({ ...prev, opcionC: e.target.value }))} className="input-light text-xs" />
                  <input type="text" placeholder="Alternativa D" value={preguntaForm.opcionD} onChange={(e) => setPreguntaForm(prev => ({ ...prev, opcionD: e.target.value }))} className="input-light text-xs" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-600 text-center py-1">
                  <div className="bg-white border border-slate-200 p-2 rounded-xl">Opción A: VERDADERO</div>
                  <div className="bg-white border border-slate-200 p-2 rounded-xl">Opción B: FALSO</div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600">Alternativa Correcta:</span>
                  <select
                    value={preguntaForm.respuestaCorrecta}
                    onChange={(e) => setPreguntaForm(prev => ({ ...prev, respuestaCorrecta: e.target.value }))}
                    className="border border-slate-300 rounded-xl px-3 py-1 text-xs font-black text-slate-800 bg-white"
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    {preguntaForm.tipoPregunta === "MULTIPLE" && (
                      <>
                        <option value="C">C</option>
                        <option value="D">D</option>
                      </>
                    )}
                  </select>
                </div>

                <button type="button" onClick={addPreguntaToExam} className="inline-flex items-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-black px-3 py-2 rounded-xl transition-all cursor-pointer">
                  <Plus size={14} /> Cargar Pregunta
                </button>
              </div>
            </div>

            {/* Lista en tiempo real de preguntas agregadas en memoria */}
            <div className="space-y-2">
              <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Preguntas agregadas ({examForm.preguntas.length})</p>
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                {examForm.preguntas.map((p, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs flex justify-between items-center">
                    <p className="font-bold text-slate-700 truncate max-w-[85%]"><span className="text-rose-600 font-black">Q{idx + 1}:</span> {p.enunciado} (Clave: {p.respuestaCorrecta})</p>
                    <button type="button" onClick={() => setExamForm(prev => ({ ...prev, preguntas: prev.preguntas.filter((_, i) => i !== idx) }))} className="text-rose-500 hover:text-rose-700 cursor-pointer"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            </div>

            {/* Botones de Control de Cierre del Modal */}
            <div className="flex gap-2 border-t border-slate-100 pt-4 justify-end">
              <button type="button" onClick={() => { setShowExamModal(false); setExamForm(initialExamForm); }} className="border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold cursor-pointer">
                Cancelar
              </button>
              <button type="button" onClick={handleSaveExam} className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-xl text-sm font-black shadow-md cursor-pointer transition-colors">
                Guardar Examen Oficial
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminVacantes;