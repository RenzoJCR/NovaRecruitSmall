import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import evaluacionService from '../../services/evaluacionService';
import postulacionService from '../../services/postulacionService';

export default function RendirExamen() {
  const { id: vacanteId } = useParams();
  const navigate = useNavigate();

  const [evaluacion, setEvaluacion] = useState(null);
  const [postulacionId, setPostulacionId] = useState(null);
  const [respuestas, setRespuestas] = useState({}); // Estructura interna: { [preguntaId]: 'A' | 'B' | ... }
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const obtenerPuntajePregunta = (indice, totalPreguntas) => {
    if (totalPreguntas <= 0) {
      return 0;
    }

    const puntajeBase = 20 / totalPreguntas;
    const puntajeEnteroBase = Math.floor(puntajeBase);
    const puntosRestantes = 20 % totalPreguntas;

    return puntajeEnteroBase + (indice < puntosRestantes ? 1 : 0);
  };

  const inicializarExamen = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Validar la postulación del candidato y obtener el postulacionId real
      const misPostulaciones = await postulacionService.listarMisPostulaciones();
      const postulacionActiva = misPostulaciones.find(p => p.vacanteId === Number(vacanteId));

      if (!postulacionActiva) {
        setError('No se encontró una postulación asociada a esta vacante de empleo.');
        setLoading(false);
        return;
      }

      if (postulacionActiva.estado !== 'POSTULADO') {
        setError(`Ya has rendido esta evaluación técnica previamente. Tu estado actual es: ${postulacionActiva.estado}`);
        setLoading(false);
        return;
      }

      setPostulacionId(postulacionActiva.id);

      // 2. Descargar el examen técnico limpio configurado para esta vacante
      const examenData =
        await evaluacionService.obtenerPorVacantePostulante(
          vacanteId
        );
      if (!examenData || !examenData.preguntas || examenData.preguntas.length === 0) {
        setError('Esta vacante no cuenta con un banco de preguntas activo en este momento.');
        setLoading(false);
        return;
      }

      setEvaluacion(examenData);

      // Inicializar el mapa de respuestas vacío para cada pregunta
      const inicializarRespuestas = {};
      examenData.preguntas.forEach(p => {
        inicializarRespuestas[p.id] = '';
      });
      setRespuestas(inicializarRespuestas);

    } catch (err) {
      console.error('Error al inicializar el examen técnico:', err);
      setError('Ocurrió un error al cargar la evaluación técnica. Por favor, contacta al administrador.');
    } finally {
      setLoading(false);
    }
  }, [vacanteId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      inicializarExamen();
    }, 0);

    return () => clearTimeout(timer);
  }, [inicializarExamen]);

  const handleSeleccionarOpcion = (preguntaId, opcion) => {
    setRespuestas(prev => ({
      ...prev,
      [preguntaId]: opcion
    }));
  };

  const handleSubmitExamen = async (e) => {
    e.preventDefault();

    // Validar que todas las preguntas hayan sido respondidas
    const preguntasSinResponder = evaluacion.preguntas.filter(p => !respuestas[p.id]);
    if (preguntasSinResponder.length > 0) {
      alert(`Por favor, responde todas las preguntas antes de enviar. Te faltan ${preguntasSinResponder.length} por contestar.`);
      return;
    }

    if (!window.confirm('¿Estás seguro de que deseas enviar tus respuestas? Una vez enviado, el sistema autocalificará tu nota sobre 20 en tiempo real de forma irreversible.')) {
      return;
    }

    try {
      setSubmitting(true);

      // Parsear el mapa a un JSON String plano tal como lo espera el ObjectMapper en Spring Boot
      const respuestasJSONString = JSON.stringify(respuestas);

      // Enviar al endpoint de evaluación del Backend
      await postulacionService.enviarExamen(postulacionId, respuestasJSONString);

      alert('¡Evaluación técnica enviada y procesada con éxito!');
      navigate('/applicant/dashboard'); // Redirigir de inmediato al panel histórico para ver la nota calculada
    } catch (err) {
      console.error('Error al enviar el examen:', err);
      alert('Error crítico al procesar la calificación. Inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
        <span className="mt-4 text-slate-600 font-medium">Cargando cuestionario técnico seguro...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-8 p-6 bg-white border border-slate-200 rounded-xl shadow-sm text-center">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto text-red-600 mb-4">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-slate-950 mb-2">Acceso Denegado / No Disponible</h3>
        <p className="text-slate-600 text-sm mb-6 max-w-md mx-auto">{error}</p>
        <button
          onClick={() => navigate('/applicant/dashboard')}
          className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold transition-colors"
        >
          Regresar a mi Panel
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Cabecera Técnica del Examen */}
      <div className="bg-slate-900 text-white p-6 rounded-xl shadow-sm space-y-2">
        <span className="text-[10px] uppercase font-bold tracking-widest bg-slate-800 px-2.5 py-1 rounded border border-slate-700 text-slate-300">
          Entorno de Evaluación Oficial
        </span>
        <h1 className="text-2xl font-extrabold tracking-tight">{evaluacion?.titulo}</h1>
        <p className="text-slate-400 text-sm">{evaluacion?.descripcion}</p>
        <div className="pt-2 flex items-center gap-4 text-xs font-semibold text-slate-300 border-t border-slate-800">
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Duración: {evaluacion?.duracionMinutos} minutos
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Puntaje Máximo: 20.00 Puntos Puros
          </span>
        </div>
      </div>

      {/* Formulario Reactivo */}
      <form onSubmit={handleSubmitExamen} className="space-y-6">
        {evaluacion?.preguntas.map((pregunta, index) => {
          const esVerdaderoFalso = pregunta.tipoPregunta === 'VERDADERO_FALSO';
          const puntajePregunta = obtenerPuntajePregunta(index, evaluacion.preguntas.length);
          
          return (
            <div 
              key={pregunta.id} 
              className={`bg-white border rounded-xl p-6 shadow-sm transition-all ${
                respuestas[pregunta.id] ? 'border-slate-300 ring-1 ring-slate-100' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-slate-100 text-slate-800 text-xs font-bold shrink-0 mt-0.5">
                  {index + 1}
                </span>
                <div className="space-y-4 w-full">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-slate-900 text-base">{pregunta.enunciado}</h3>
                    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
                      {puntajePregunta} pts
                    </span>
                  </div>
                  
                  {/* Opciones de Respuesta */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Opción A */}
                    <button
                      type="button"
                      onClick={() => handleSeleccionarOpcion(pregunta.id, 'A')}
                      className={`flex items-center p-3 text-left border rounded-lg text-sm transition-all font-medium ${
                        respuestas[pregunta.id] === 'A'
                          ? 'border-slate-900 bg-slate-50 text-slate-950 font-bold ring-1 ring-slate-900'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 text-xs font-bold ${
                        respuestas[pregunta.id] === 'A' ? 'bg-slate-900 text-white border-transparent' : 'border-slate-300 text-slate-400 bg-white'
                      }`}>
                        A
                      </span>
                      {pregunta.opcionA || (esVerdaderoFalso ? 'Verdadero' : '')}
                    </button>

                    {/* Opción B */}
                    <button
                      type="button"
                      onClick={() => handleSeleccionarOpcion(pregunta.id, 'B')}
                      className={`flex items-center p-3 text-left border rounded-lg text-sm transition-all font-medium ${
                        respuestas[pregunta.id] === 'B'
                          ? 'border-slate-900 bg-slate-50 text-slate-950 font-bold ring-1 ring-slate-900'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 text-xs font-bold ${
                        respuestas[pregunta.id] === 'B' ? 'bg-slate-900 text-white border-transparent' : 'border-slate-300 text-slate-400 bg-white'
                      }`}>
                        B
                      </span>
                      {pregunta.opcionB || (esVerdaderoFalso ? 'Falso' : '')}
                    </button>

                    {/* Opciones C y D condicionales solo si es de Tipo MULTIPLE */}
                    {!esVerdaderoFalso && pregunta.opcionC && (
                      <button
                        type="button"
                        onClick={() => handleSeleccionarOpcion(pregunta.id, 'C')}
                        className={`flex items-center p-3 text-left border rounded-lg text-sm transition-all font-medium ${
                          respuestas[pregunta.id] === 'C'
                            ? 'border-slate-900 bg-slate-50 text-slate-950 font-bold ring-1 ring-slate-900'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 text-xs font-bold ${
                          respuestas[pregunta.id] === 'C' ? 'bg-slate-900 text-white border-transparent' : 'border-slate-300 text-slate-400 bg-white'
                        }`}>
                          C
                        </span>
                        {pregunta.opcionC}
                      </button>
                    )}

                    {!esVerdaderoFalso && pregunta.opcionD && (
                      <button
                        type="button"
                        onClick={() => handleSeleccionarOpcion(pregunta.id, 'D')}
                        className={`flex items-center p-3 text-left border rounded-lg text-sm transition-all font-medium ${
                          respuestas[pregunta.id] === 'D'
                            ? 'border-slate-900 bg-slate-50 text-slate-950 font-bold ring-1 ring-slate-900'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 text-xs font-bold ${
                          respuestas[pregunta.id] === 'D' ? 'bg-slate-900 text-white border-transparent' : 'border-slate-300 text-slate-400 bg-white'
                        }`}>
                          D
                        </span>
                        {pregunta.opcionD}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Botón de Envío Oficial */}
        <div className="flex items-center justify-end pt-4">
          <button
            type="submit"
            disabled={submitting}
            className={`px-6 py-3 font-bold text-sm text-white rounded-xl shadow-sm transition-colors ${
              submitting 
                ? 'bg-slate-400 cursor-not-allowed' 
                : 'bg-slate-950 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-950'
            }`}
          >
            {submitting ? 'Calificando Examen en MySQL...' : 'Finalizar y Enviar Evaluación'}
          </button>
        </div>
      </form>
    </div>
  );
}