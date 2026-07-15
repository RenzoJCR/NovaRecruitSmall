import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  MapPin,
  Coins,
  CheckCircle,
  Send,
  Sparkles,
  Search,
  FilterX,
} from 'lucide-react';

import SectionHeader from '../../components/ui/SectionHeader';
import { vacanteService } from '../../services/vacanteService';
import postulacionService from '../../services/postulacionService';

export default function ApplicantVacantes() {
  const [vacantes, setVacantes] = useState([]);
  const [misPostulaciones, setMisPostulaciones] =
    useState([]);

  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState(null);
  const [message, setMessage] = useState('');

  // FILTROS
  const [busqueda, setBusqueda] = useState('');
  const [filtroArea, setFiltroArea] = useState('TODAS');
  const [filtroModalidad, setFiltroModalidad] =
    useState('TODAS');

  const [
    filtroDisponibilidad,
    setFiltroDisponibilidad,
  ] = useState('TODAS');

  const sincronizarCatalogo = async () => {
    try {
      setLoading(true);

      const [
        listaVacantes,
        listaMisPostulaciones,
      ] = await Promise.all([
        vacanteService.listarTodas(),
        postulacionService.listarMisPostulaciones(),
      ]);

      setVacantes(
        Array.isArray(listaVacantes)
          ? listaVacantes
          : []
      );

      setMisPostulaciones(
        Array.isArray(listaMisPostulaciones)
          ? listaMisPostulaciones
          : []
      );
    } catch (err) {
      console.error(
        'Error al sincronizar catálogo laboral:',
        err
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    sincronizarCatalogo();
  }, []);

  const handlePostular = async (vacanteId) => {
    const confirmado = window.confirm(
      '¿Deseas registrar tu postulación a esta vacante TI? Tu perfil será enlazado de inmediato.'
    );

    if (!confirmado) {
      return;
    }

    try {
      setApplyingId(vacanteId);

      await postulacionService.registrarPostulacion(
        vacanteId
      );

      setMessage(
        '¡Postulación registrada con éxito! El examen técnico ha sido habilitado en tu Panel.'
      );

      setTimeout(() => {
        setMessage('');
      }, 4500);

      await sincronizarCatalogo();
    } catch (err) {
      alert(
        err.userMessage ||
          'Ya cuentas con una postulación activa para esta vacante.'
      );
    } finally {
      setApplyingId(null);
    }
  };

  const yaPostuloAVacante = (vacanteId) => {
    return misPostulaciones.some(
      (postulacion) =>
        postulacion.vacanteId === vacanteId
    );
  };

  const areasDisponibles = useMemo(() => {
    const areas = vacantes
      .map((vacante) => vacante.areaNombre)
      .filter(
        (area) =>
          typeof area === 'string' &&
          area.trim() !== ''
      );

    return [...new Set(areas)].sort(
      (areaA, areaB) =>
        areaA.localeCompare(areaB, 'es')
    );
  }, [vacantes]);

  const vacantesFiltradas = useMemo(() => {
    const textoBusqueda =
      busqueda.trim().toLowerCase();

    return vacantes.filter((vacante) => {
      const yaPostulo =
        misPostulaciones.some(
          (postulacion) =>
            postulacion.vacanteId ===
            vacante.id
        );

      const coincideBusqueda =
        textoBusqueda === '' ||
        (vacante.titulo || '')
          .toLowerCase()
          .includes(textoBusqueda) ||
        (vacante.descripcion || '')
          .toLowerCase()
          .includes(textoBusqueda) ||
        (vacante.areaNombre || '')
          .toLowerCase()
          .includes(textoBusqueda);

      const coincideArea =
        filtroArea === 'TODAS' ||
        vacante.areaNombre === filtroArea;

      const coincideModalidad =
        filtroModalidad === 'TODAS' ||
        vacante.modalidad ===
          filtroModalidad;

      const coincideDisponibilidad =
        filtroDisponibilidad === 'TODAS' ||
        (filtroDisponibilidad ===
          'DISPONIBLES' &&
          !yaPostulo) ||
        (filtroDisponibilidad ===
          'POSTULADAS' &&
          yaPostulo);

      return (
        coincideBusqueda &&
        coincideArea &&
        coincideModalidad &&
        coincideDisponibilidad
      );
    });
  }, [
    vacantes,
    misPostulaciones,
    busqueda,
    filtroArea,
    filtroModalidad,
    filtroDisponibilidad,
  ]);

  const filtrosActivos =
    busqueda.trim() !== '' ||
    filtroArea !== 'TODAS' ||
    filtroModalidad !== 'TODAS' ||
    filtroDisponibilidad !== 'TODAS';

  const limpiarFiltros = () => {
    setBusqueda('');
    setFiltroArea('TODAS');
    setFiltroModalidad('TODAS');
    setFiltroDisponibilidad('TODAS');
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Explorar Vacantes Tecnológicas"
        description="Postula de forma directa a las ofertas activas de NovaTech Solutions y habilita tus pruebas automáticas."
      />

      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-semibold animate-fade-in flex items-center gap-2">
          <Sparkles
            size={16}
            className="text-emerald-500 animate-pulse"
          />

          {message}
        </div>
      )}

      {!loading && vacantes.length > 0 && (
        <section className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
          <div>
            <p className="text-sm font-black text-slate-700 uppercase tracking-wider">
              Catálogo de oportunidades
            </p>

            <p className="text-xs text-slate-400 mt-1">
              Mostrando{' '}
              {vacantesFiltradas.length} de{' '}
              {vacantes.length} vacantes
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr_180px_180px_auto] gap-3">
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
                placeholder="Buscar por puesto, área o descripción..."
                className="w-full border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none focus:border-slate-700"
              />
            </div>

            <select
              value={filtroArea}
              onChange={(event) =>
                setFiltroArea(
                  event.target.value
                )
              }
              className="w-full border border-slate-300 rounded-xl px-3 py-2.5 bg-white text-sm font-bold text-slate-700 outline-none focus:border-slate-700"
            >
              <option value="TODAS">
                Todas las áreas
              </option>

              {areasDisponibles.map(
                (area) => (
                  <option
                    key={area}
                    value={area}
                  >
                    {area}
                  </option>
                )
              )}
            </select>

            <select
              value={filtroModalidad}
              onChange={(event) =>
                setFiltroModalidad(
                  event.target.value
                )
              }
              className="w-full border border-slate-300 rounded-xl px-3 py-2.5 bg-white text-sm font-bold text-slate-700 outline-none focus:border-slate-700"
            >
              <option value="TODAS">
                Toda modalidad
              </option>

              <option value="REMOTO">
                Remoto
              </option>

              <option value="HIBRIDO">
                Híbrido
              </option>

              <option value="PRESENCIAL">
                Presencial
              </option>
            </select>

            <select
              value={filtroDisponibilidad}
              onChange={(event) =>
                setFiltroDisponibilidad(
                  event.target.value
                )
              }
              className="w-full border border-slate-300 rounded-xl px-3 py-2.5 bg-white text-sm font-bold text-slate-700 outline-none focus:border-slate-700"
            >
              <option value="TODAS">
                Todas
              </option>

              <option value="DISPONIBLES">
                Disponibles
              </option>

              <option value="POSTULADAS">
                Ya postuladas
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
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 font-medium animate-pulse">
          Sincronizando bolsa laboral
          activa...
        </div>
      ) : vacantes.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
          No hay requerimientos de personal
          publicados actualmente por RRHH.
        </div>
      ) : vacantesFiltradas.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
          <Search
            size={38}
            className="mx-auto text-slate-300 mb-3"
          />

          <h3 className="text-base font-black text-slate-700">
            No encontramos vacantes
          </h3>

          <p className="text-sm text-slate-400 mt-1">
            Cambia los criterios utilizados o
            limpia los filtros.
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {vacantesFiltradas.map(
            (vacante) => {
              const yaPostulo =
                yaPostuloAVacante(
                  vacante.id
                );

              return (
                <div
                  key={vacante.id}
                  className={`bg-white border rounded-2xl p-6 shadow-sm flex flex-col justify-between transition-all ${
                    yaPostulo
                      ? 'border-slate-200 opacity-80'
                      : 'border-slate-200 hover:border-slate-400'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="inline-block text-[10px] font-black bg-slate-100 text-slate-800 border border-slate-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        {vacante.areaNombre}
                      </span>

                      {yaPostulo && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                          <CheckCircle
                            size={12}
                          />

                          Postulado
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-black text-slate-900 mt-3 tracking-tight">
                      {vacante.titulo}
                    </h3>

                    <p className="text-sm text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                      {vacante.descripcion}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1 text-xs text-slate-500 font-semibold">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={13} />
                        {vacante.modalidad}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Coins size={13} />
                        S/.{' '}
                        {vacante.salario?.toLocaleString(
                          'es-PE'
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handlePostular(
                          vacante.id
                        )
                      }
                      disabled={
                        yaPostulo ||
                        applyingId !== null
                      }
                      className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-black shadow-xs transition-colors ${
                        yaPostulo
                          ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none'
                          : 'bg-slate-900 text-white hover:bg-slate-800 cursor-pointer'
                      }`}
                    >
                      <Send size={12} />

                      {applyingId ===
                      vacante.id
                        ? 'Registrando...'
                        : yaPostulo
                          ? 'Aplicado con éxito'
                          : 'Postular ahora'}
                    </button>
                  </div>
                </div>
              );
            }
          )}
        </div>
      )}
    </div>
  );
}