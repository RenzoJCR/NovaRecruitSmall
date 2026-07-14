import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SectionHeader from '../../components/ui/SectionHeader';
import postulacionService from '../../services/postulacionService';
import { useRealtimeNotifications } from '../../context/realtimeContext';

export default function ApplicantDashboard() {
  const [postulaciones, setPostulaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { ultimoEvento } = useRealtimeNotifications();
  const navigate = useNavigate();

  const cargarMisPostulaciones = useCallback(async () => {
    try {
      setLoading(true);
      // El backend extrae el ID o correo directamente del JwtFilter/Contexto del Token
      const data = await postulacionService.listarMisPostulaciones();
      setPostulaciones(data);
      setError(null);
    } catch (err) {
      console.error('Error al recuperar historial de postulaciones:', err);
      setError('No se pudo cargar tu historial de postulaciones. Por favor, reintenta más tarde.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      cargarMisPostulaciones();
    }, 0);

    return () => clearTimeout(timer);
  }, [cargarMisPostulaciones]);

  useEffect(() => {
    if (!ultimoEvento?.tipo) {
      return;
    }

    const tiposQueRequierenRefresco = ['ACTUALIZACION_ESTADO', 'EVALUACION_CALIFICADA'];

    if (tiposQueRequierenRefresco.includes(ultimoEvento.tipo)) {
      const timer = setTimeout(() => {
        cargarMisPostulaciones();
      }, 0);

      return () => clearTimeout(timer);
    }
  }, [ultimoEvento, cargarMisPostulaciones]);

  // Helper estandarizado para renderizar badges planos con la misma paleta del Admin
  const renderEstadoBadge = (estado) => {
    const configs = {
      POSTULADO: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'Postulado' },
      EVALUADO: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', label: 'Evaluado' },
      CONTRATADO: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', label: 'Contratado' },
      RECHAZADO: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: 'Rechazado' },
    };

    const config = configs[estado] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', label: estado };

    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Cabecera Estándar de la Plataforma */}
      <SectionHeader 
        title="Mi Panel de Candidato" 
        description="Gestiona tus aplicaciones activas, revisa tus evaluaciones técnicas y haz seguimiento a tu proceso en tiempo real." 
      />

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800"></div>
          <span className="ml-3 text-slate-600 font-medium">Cargando tus postulaciones...</span>
        </div>
      ) : postulaciones.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-xl p-12 text-center shadow-sm">
          <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-slate-900">No registras postulaciones</h3>
          <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto">
            Aún no has aplicado a ninguna vacante TI. Explora nuestro catálogo vivo de ofertas en la página de inicio para comenzar.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Vacante TI</th>
                  <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Área</th>
                  <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Modalidad / Salario</th>
                  <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha Aplicación</th>
                  <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                  <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Aptitud Técnica</th>
                  <th scope="col" className="px-6 py-3.5 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200 text-sm text-slate-700">
                {postulaciones.map((postulacion) => {
                  const tieneEvaluacion =
                    Boolean(postulacion.vacanteEvaluacionId);

                  const yaRindio =
                    postulacion.fechaEvaluacion !== null ||
                    postulacion.puntajeTecnico !== null ||
                    postulacion.estado === "EVALUADO" ||
                    postulacion.estado === "CONTRATADO" ||
                    postulacion.estado === "RECHAZADO";

                  return (
                    <tr key={postulacion.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Información de la Vacante */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{postulacion.vacanteTitulo || 'N/A'}</div>
                        <div className="text-xs text-slate-500 truncate max-w-xs">{postulacion.vacanteDescripcion}</div>
                      </td>
                      
                      {/* Área */}
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                        {postulacion.vacanteAreaNombre || 'Área General'}
                      </td>

                      {/* Modalidad y Salario */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-slate-900 font-medium">{postulacion.vacanteModalidad}</div>
                        <div className="text-xs text-slate-500">S/. {postulacion.vacanteSalario?.toLocaleString('es-PE')}</div>
                      </td>

                      {/* Fecha de Postulación */}
                      <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                        {postulacion.fechaPostulacion ? new Date(postulacion.fechaPostulacion).toLocaleDateString('es-PE') : '---'}
                      </td>

                      {/* Badge Dinámico de Estado */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {renderEstadoBadge(postulacion.estado)}
                      </td>

                      {/* Nota Vigesimal Pura - Cero Porcentajes */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {yaRindio && postulacion.puntajeTecnico !== null ? (
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 text-base">
                              {Number(postulacion.puntajeTecnico).toFixed(2)}
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">sobre 20.00</span>
                          </div>
                        ) : tieneEvaluacion ? (
                          <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Pendiente
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Sin examen</span>
                        )}
                      </td>

                      {/* Acciones Condicionales */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {postulacion.estado === "POSTULADO" &&
                        tieneEvaluacion ? (
                          <button
                            onClick={() =>
                              navigate(
                                `/applicant/examen/${postulacion.vacanteId}`
                              )
                            }
                            className="inline-flex items-center justify-center px-3 py-1.5 border border-transparent text-xs font-semibold rounded-lg text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-sm"
                          >
                            Rendir Examen
                          </button>
                        ) : postulacion.estado === "POSTULADO" &&
                          !tieneEvaluacion ? (
                          <span className="text-xs text-amber-600 font-medium">
                            Esperando examen
                          </span>
                        ) : postulacion.estado === "EVALUADO" ? (
                          <span className="text-xs text-purple-600 font-semibold">
                            Evaluación completada
                          </span>
                        ) : postulacion.estado === "CONTRATADO" ? (
                          <span className="text-xs text-emerald-600 font-semibold">
                            Candidato contratado
                          </span>
                        ) : postulacion.estado === "RECHAZADO" ? (
                          <span className="text-xs text-rose-600 font-semibold">
                            Proceso finalizado
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}