import { useEffect, useState } from 'react';
import { MapPin, Coins, CheckCircle, Send, Sparkles } from 'lucide-react';
import SectionHeader from '../../components/ui/SectionHeader';
import { vacanteService } from '../../services/vacanteService';
import postulacionService from '../../services/postulacionService';

export default function ApplicantVacantes() {
  const [vacantes, setVacantes] = useState([]);
  const [misPostulaciones, setMisPostulaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState(null);
  const [message, setMessage] = useState('');

  const sincronizarCatalogo = async () => {
    try {
      setLoading(true);
      const [listaVacantes, listaMisPostulaciones] = await Promise.all([
        vacanteService.listarTodas(),
        postulacionService.listarMisPostulaciones()
      ]);
      setVacantes(listaVacantes);
      setMisPostulaciones(listaMisPostulaciones);
    } catch (err) {
      console.error('Error al sincronizar catálogo laboral:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    sincronizarCatalogo();
  }, []);

  const handlePostular = async (vacanteId) => {
    if (!window.confirm('¿Deseas registrar tu postulación a esta vacante TI? Tu perfil será enlazado de inmediato.')) return;
    
    try {
      setApplyingId(vacanteId);
      await postulacionService.registrarPostulacion(vacanteId);
      setMessage('¡Postulación registrada con éxito! El examen técnico ha sido habilitado en tu Panel.');
      setTimeout(() => setMessage(''), 4500);
      await sincronizarCatalogo(); // Recargar estados y pintar los bloqueos de postulación
    } catch (err) {
      alert(err.userMessage || 'Ya cuentas con una postulación activa para esta vacante.');
    } finally {
      setApplyingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Explorar Vacantes Tecnológicas" description="Postula de forma directa a las ofertas activas de NovaTech Solutions y habilita tus pruebas automáticas." />

      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-semibold animate-fade-in flex items-center gap-2">
          <Sparkles size={16} className="text-emerald-500 animate-pulse" />
          {message}
        </div>
      )}

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 font-medium animate-pulse">Sincronizando bolsa laboral activa...</div>
      ) : vacantes.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">No hay requerimientos de personal publicados actualmente por RRHH.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {vacantes.map(vacante => {
            // Validamos de forma cruzada si el ID físico de la vacante ya existe en el array de mis aplicaciones
            const yaPostulo = misPostulaciones.some(p => p.vacanteId === vacante.id);

            return (
              <div key={vacante.id} className={`bg-white border rounded-2xl p-6 shadow-sm flex flex-col justify-between transition-all ${yaPostulo ? 'border-slate-200 opacity-80' : 'border-slate-200 hover:border-slate-400'}`}>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="inline-block text-[10px] font-black bg-slate-100 text-slate-800 border border-slate-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">{vacante.areaNombre}</span>
                    {yaPostulo && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                        <CheckCircle size={12} /> Postulado
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mt-3 tracking-tight">{vacante.titulo}</h3>
                  <p className="text-sm text-slate-500 mt-2 line-clamp-3 leading-relaxed">{vacante.descripcion}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="space-y-1 text-xs text-slate-500 font-semibold">
                    <div className="flex items-center gap-1.5"><MapPin size={13} /> {vacante.modalidad}</div>
                    <div className="flex items-center gap-1.5"><Coins size={13} /> S/. {vacante.salario?.toLocaleString('es-PE')}</div>
                  </div>

                  <button
                    onClick={() => handlePostular(vacante.id)}
                    disabled={yaPostulo || applyingId !== null}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black shadow-xs transition-colors cursor-pointer ${
                      yaPostulo 
                        ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none' 
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    <Send size={12} />
                    {applyingId === vacante.id ? 'Registrando...' : yaPostulo ? 'Aplicado con éxito' : 'Postular Ahora'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}