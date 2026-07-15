import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  useNavigate,
} from 'react-router-dom';

import {
  Search,
  FilterX,
} from 'lucide-react';

import SectionHeader from '../../components/ui/SectionHeader';
import postulacionService from '../../services/postulacionService';

import {
  useRealtimeNotifications,
} from '../../context/realtimeContext';

export default function ApplicantDashboard() {
  const [postulaciones, setPostulaciones] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState(null);

  // FILTROS
  const [busqueda, setBusqueda] =
    useState('');

  const [filtroEstado, setFiltroEstado] =
    useState('TODOS');

  const [
    filtroEvaluacion,
    setFiltroEvaluacion,
  ] = useState('TODAS');

  const { ultimoEvento } =
    useRealtimeNotifications();

  const navigate = useNavigate();

  const cargarMisPostulaciones =
    useCallback(async () => {
      try {
        setLoading(true);

        const data =
          await postulacionService
            .listarMisPostulaciones();

        setPostulaciones(
          Array.isArray(data)
            ? data
            : []
        );

        setError(null);
      } catch (err) {
        console.error(
          'Error al recuperar historial de postulaciones:',
          err
        );

        setError(
          'No se pudo cargar tu historial de postulaciones. Por favor, reintenta más tarde.'
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      cargarMisPostulaciones();
    }, 0);

    return () =>
      clearTimeout(timer);
  }, [cargarMisPostulaciones]);

  useEffect(() => {
    if (!ultimoEvento?.tipo) {
      return;
    }

    const tiposQueRequierenRefresco = [
      'ACTUALIZACION_ESTADO',
      'EVALUACION_CALIFICADA',
    ];

    if (
      tiposQueRequierenRefresco.includes(
        ultimoEvento.tipo
      )
    ) {
      const timer = setTimeout(() => {
        cargarMisPostulaciones();
      }, 0);

      return () =>
        clearTimeout(timer);
    }
  }, [
    ultimoEvento,
    cargarMisPostulaciones,
  ]);

  const tieneEvaluacion = (
    postulacion
  ) => {
    return Boolean(
      postulacion.vacanteEvaluacionId
    );
  };

  const yaRindioEvaluacion = (
    postulacion
  ) => {
    return (
      postulacion.fechaEvaluacion !=
        null ||
      postulacion.puntajeTecnico !=
        null ||
      postulacion.estado ===
        'EVALUADO' ||
      postulacion.estado ===
        'CONTRATADO' ||
      postulacion.estado ===
        'RECHAZADO'
    );
  };

  const postulacionesFiltradas =
    useMemo(() => {
      const textoBusqueda =
        busqueda.trim().toLowerCase();

      return postulaciones.filter(
        (postulacion) => {
          const poseeEvaluacion =
            Boolean(
              postulacion
                .vacanteEvaluacionId
            );

          const evaluacionCompletada =
            postulacion.fechaEvaluacion !=
              null ||
            postulacion.puntajeTecnico !=
              null ||
            postulacion.estado ===
              'EVALUADO' ||
            postulacion.estado ===
              'CONTRATADO' ||
            postulacion.estado ===
              'RECHAZADO';

          const coincideBusqueda =
            textoBusqueda === '' ||
            (
              postulacion.vacanteTitulo ||
              ''
            )
              .toLowerCase()
              .includes(textoBusqueda) ||
            (
              postulacion
                .vacanteDescripcion || ''
            )
              .toLowerCase()
              .includes(textoBusqueda) ||
            (
              postulacion
                .vacanteAreaNombre || ''
            )
              .toLowerCase()
              .includes(textoBusqueda) ||
            (
              postulacion
                .vacanteModalidad || ''
            )
              .toLowerCase()
              .includes(textoBusqueda);

          const coincideEstado =
            filtroEstado === 'TODOS' ||
            postulacion.estado ===
              filtroEstado;

          const coincideEvaluacion =
            filtroEvaluacion ===
              'TODAS' ||
            (filtroEvaluacion ===
              'PENDIENTE' &&
              poseeEvaluacion &&
              !evaluacionCompletada) ||
            (filtroEvaluacion ===
              'COMPLETADA' &&
              evaluacionCompletada) ||
            (filtroEvaluacion ===
              'SIN_EXAMEN' &&
              !poseeEvaluacion);

          return (
            coincideBusqueda &&
            coincideEstado &&
            coincideEvaluacion
          );
        }
      );
    }, [
      postulaciones,
      busqueda,
      filtroEstado,
      filtroEvaluacion,
    ]);

  const filtrosActivos =
    busqueda.trim() !== '' ||
    filtroEstado !== 'TODOS' ||
    filtroEvaluacion !== 'TODAS';

  const limpiarFiltros = () => {
    setBusqueda('');
    setFiltroEstado('TODOS');
    setFiltroEvaluacion('TODAS');
  };

  const renderEstadoBadge = (
    estado
  ) => {
    const configs = {
      POSTULADO: {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
        label: 'Postulado',
      },
      EVALUADO: {
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        border: 'border-purple-200',
        label: 'Evaluado',
      },
      CONTRATADO: {
        bg: 'bg-green-50',
        text: 'text-green-700',
        border: 'border-green-200',
        label: 'Contratado',
      },
      RECHAZADO: {
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200',
        label: 'Rechazado',
      },
    };

    const config =
      configs[estado] || {
        bg: 'bg-gray-50',
        text: 'text-gray-700',
        border: 'border-gray-200',
        label: estado,
      };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border}`}
      >
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Mi Panel de Candidato"
        description="Gestiona tus aplicaciones activas, revisa tus evaluaciones técnicas y haz seguimiento a tu proceso en tiempo real."
      />

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {!loading &&
        postulaciones.length > 0 && (
          <section className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
            <div>
              <p className="text-sm font-black text-slate-700 uppercase tracking-wider">
                Historial de procesos
              </p>

              <p className="text-xs text-slate-400 mt-1">
                Mostrando{' '}
                {
                  postulacionesFiltradas.length
                }{' '}
                de {postulaciones.length}{' '}
                postulaciones
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_220px_220px_auto] gap-3">
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
                  placeholder="Buscar por vacante, área o modalidad..."
                  className="w-full border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none focus:border-slate-700"
                />
              </div>

              <select
                value={filtroEstado}
                onChange={(event) =>
                  setFiltroEstado(
                    event.target.value
                  )
                }
                className="w-full border border-slate-300 rounded-xl px-3 py-2.5 bg-white text-sm font-bold text-slate-700 outline-none focus:border-slate-700"
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

              <select
                value={filtroEvaluacion}
                onChange={(event) =>
                  setFiltroEvaluacion(
                    event.target.value
                  )
                }
                className="w-full border border-slate-300 rounded-xl px-3 py-2.5 bg-white text-sm font-bold text-slate-700 outline-none focus:border-slate-700"
              >
                <option value="TODAS">
                  Toda evaluación
                </option>

                <option value="PENDIENTE">
                  Examen pendiente
                </option>

                <option value="COMPLETADA">
                  Examen completado
                </option>

                <option value="SIN_EXAMEN">
                  Sin examen asignado
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
          </section>
        )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800" />

          <span className="ml-3 text-slate-600 font-medium">
            Cargando tus postulaciones...
          </span>
        </div>
      ) : postulaciones.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-xl p-12 text-center shadow-sm">
          <svg
            className="mx-auto h-12 w-12 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
            />
          </svg>

          <h3 className="mt-4 text-lg font-medium text-slate-900">
            No registras postulaciones
          </h3>

          <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto">
            Aún no has aplicado a ninguna
            vacante TI. Explora nuestro
            catálogo vivo de ofertas para
            comenzar.
          </p>
        </div>
      ) : postulacionesFiltradas.length ===
        0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
          <Search
            size={38}
            className="mx-auto text-slate-300 mb-3"
          />

          <h3 className="text-base font-black text-slate-700">
            No encontramos postulaciones
          </h3>

          <p className="text-sm text-slate-400 mt-1">
            Cambia los filtros utilizados
            para consultar otros procesos.
          </p>

          <button
            type="button"
            onClick={limpiarFiltros}
            className="mt-4 inline-flex items-center gap-2 border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-xs font-black"
          >
            <FilterX size={15} />
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Vacante TI
                  </th>

                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Área
                  </th>

                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Modalidad / Salario
                  </th>

                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Fecha Aplicación
                  </th>

                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Estado
                  </th>

                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Aptitud Técnica
                  </th>

                  <th className="px-6 py-3.5 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-slate-200 text-sm text-slate-700">
                {postulacionesFiltradas.map(
                  (postulacion) => {
                    const poseeEvaluacion =
                      tieneEvaluacion(
                        postulacion
                      );

                    const evaluacionRendida =
                      yaRindioEvaluacion(
                        postulacion
                      );

                    return (
                      <tr
                        key={postulacion.id}
                        className="hover:bg-slate-50/70 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-semibold text-slate-900">
                            {postulacion.vacanteTitulo ||
                              'N/A'}
                          </div>

                          <div className="text-xs text-slate-500 truncate max-w-xs">
                            {
                              postulacion.vacanteDescripcion
                            }
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                          {postulacion.vacanteAreaNombre ||
                            'Área General'}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-slate-900 font-medium">
                            {
                              postulacion.vacanteModalidad
                            }
                          </div>

                          <div className="text-xs text-slate-500">
                            S/.{' '}
                            {postulacion.vacanteSalario?.toLocaleString(
                              'es-PE'
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                          {postulacion.fechaPostulacion
                            ? new Date(
                                postulacion.fechaPostulacion
                              ).toLocaleDateString(
                                'es-PE'
                              )
                            : '---'}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          {renderEstadoBadge(
                            postulacion.estado
                          )}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          {evaluacionRendida &&
                          postulacion.puntajeTecnico !=
                            null ? (
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900 text-base">
                                {Number(
                                  postulacion.puntajeTecnico
                                ).toFixed(2)}
                              </span>

                              <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
                                sobre 20.00
                              </span>
                            </div>
                          ) : poseeEvaluacion ? (
                            <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              Pendiente
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 italic">
                              Sin examen
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {postulacion.estado ===
                            'POSTULADO' &&
                          poseeEvaluacion ? (
                            <button
                              type="button"
                              onClick={() =>
                                navigate(
                                  `/applicant/examen/${postulacion.vacanteId}`
                                )
                              }
                              className="inline-flex items-center justify-center px-3 py-1.5 border border-transparent text-xs font-semibold rounded-lg text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-sm"
                            >
                              Rendir examen
                            </button>
                          ) : postulacion.estado ===
                              'POSTULADO' &&
                            !poseeEvaluacion ? (
                            <span className="text-xs text-amber-600 font-medium">
                              Esperando examen
                            </span>
                          ) : postulacion.estado ===
                            'EVALUADO' ? (
                            <span className="text-xs text-purple-600 font-semibold">
                              Evaluación completada
                            </span>
                          ) : postulacion.estado ===
                            'CONTRATADO' ? (
                            <span className="text-xs text-emerald-600 font-semibold">
                              Candidato contratado
                            </span>
                          ) : postulacion.estado ===
                            'RECHAZADO' ? (
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
                  }
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}