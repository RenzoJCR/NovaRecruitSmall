import { useState, useEffect } from "react";
import { Link as RouterLink } from "react-router-dom";
import { 
  ArrowRight, Briefcase, Users, ClipboardCheck, 
  Building2, Sparkles, ShieldCheck, Workflow 
} from "lucide-react";
import { vacanteService } from "../../services/vacanteService";

function Home() {
  const [vacantes, setVacantes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargamos las vacantes reales del backend al abrir la página
  useEffect(() => {
    const cargarVacantes = async () => {
      try {
        const data = await vacanteService.listarTodas();
        setVacantes(data);
      } catch (error) {
        console.error("Error al conectar con la API de vacantes:", error);
      } finally {
        setLoading(false);
      }
    };
    cargarVacantes();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-emerald-500 selection:text-slate-950">
      
      {/* SECCIÓN HERO PRINCIPAL */}
      <section className="px-6 py-20 lg:py-28 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
          
          {/* Lado Izquierdo: Textos de Impacto */}
          <div>
            <span className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles size={14} className="text-emerald-400 animate-pulse" />
              NovaTech Solutions · Portal de Reclutamiento
            </span>

            <h1 className="text-5xl lg:text-7xl font-black leading-[1.05] tracking-tight">
              Recluta y conecta talento{" "}
              <span className="bg-linear-to-r from-emerald-400 to-sky-400 bg-clip-text text-transparent">tech</span> con procesos inteligentes.
            </h1>

            <p className="text-slate-400 mt-6 text-lg leading-relaxed max-w-xl">
              NovaRecruit centraliza la publicación de ofertas laborales, la asignación de evaluaciones técnicas automáticas y el seguimiento del pipeline de reclutamiento de software.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <RouterLink
                to="/login"
                className="inline-flex items-center gap-2 bg-linear-to-r from-emerald-500 to-sky-500 hover:from-emerald-600 hover:to-sky-600 px-6 py-3.5 rounded-2xl font-black text-slate-950 shadow-xl shadow-emerald-500/10 transition-transform active:scale-95 cursor-pointer"
              >
                Ver vacantes y comenzar
                <ArrowRight size={18} />
              </RouterLink>
            </div>

            {/* Fila de Tarjetas de Características */}
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white/2 border border-white/5 rounded-2xl p-5 backdrop-blur-md">
                <ShieldCheck className="text-emerald-400 mb-2" size={24} />
                <p className="font-bold text-white">Roles definidos</p>
                <p className="text-xs text-slate-400 mt-1">Aislamiento de seguridad para Administradores y Postulantes.</p>
              </div>

              <div className="bg-white/2 border border-white/5 rounded-2xl p-5 backdrop-blur-md">
                <Workflow className="text-sky-400 mb-2" size={24} />
                <p className="font-bold text-white">Flujo automático</p>
                <p className="text-xs text-slate-400 mt-1">Notificaciones cruzadas bidireccionales por WebSockets.</p>
              </div>

              <div className="bg-white/2 border border-white/5 rounded-2xl p-5 backdrop-blur-md">
                <ClipboardCheck className="text-teal-400 mb-2" size={24} />
                <p className="font-bold text-white">Evaluaciones</p>
                <p className="text-xs text-slate-400 mt-1">Exámenes técnicos interactivos auto-calificables.</p>
              </div>
            </div>
          </div>

          {/* Lado Derecho: Flujo Visual del Proceso */}
          <div className="relative">
            <div className="bg-white/2 border border-white/10 rounded-4xl p-6 lg:p-8 backdrop-blur-xl shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Flujo de selección</p>
                  <h2 className="text-2xl font-black mt-0.5">Proceso NovaRecruit</h2>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <Workflow size={20} />
                </div>
              </div>

              <div className="space-y-3.5">
                {[
                  "Registro seguro de tu perfil de desarrollador",
                  "Postulación directa a la vacante tecnológica",
                  "Asignación automática de examen técnico",
                  "Calificación en tiempo real en la base de datos",
                  "Resultado y alertas de contratación vía web"
                ].map((step, index) => (
                  <div key={index} className="flex gap-4 bg-slate-900/40 p-3.5 rounded-2xl border border-white/3">
                    <span className="w-8 h-8 shrink-0 rounded-xl bg-linear-to-br from-emerald-400 to-sky-400 text-slate-950 flex items-center justify-center font-black text-sm">
                      {index + 1}
                    </span>
                    <p className="text-sm font-medium text-slate-300 flex items-center">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* SECCIÓN MÉTRIQUES / CONTADORES */}
      <section className="px-6 pb-20 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/1 border border-white/5 rounded-2xl p-5 text-center">
            <Briefcase className="mx-auto text-emerald-400 mb-2" size={22} />
            <p className="text-3xl font-black">{loading ? "..." : vacantes.length}</p>
            <p className="text-xs text-slate-400 mt-1 font-bold uppercase">Vacantes activas</p>
          </div>
          <div className="bg-white/1 border border-white/5 rounded-2xl p-5 text-center">
            <Building2 className="mx-auto text-sky-400 mb-2" size={22} />
            <p className="text-3xl font-black">2</p>
            <p className="text-xs text-slate-400 mt-1 font-bold uppercase">Áreas Core TI</p>
          </div>
          <div className="bg-white/1 border border-white/5 rounded-2xl p-5 text-center">
            <Users className="mx-auto text-teal-400 mb-2" size={22} />
            <p className="text-3xl font-black">+150</p>
            <p className="text-xs text-slate-400 mt-1 font-bold uppercase">Postulantes</p>
          </div>
          <div className="bg-white/1 border border-white/5 rounded-2xl p-5 text-center">
            <ClipboardCheck className="mx-auto text-emerald-400 mb-2" size={22} />
            <p className="text-3xl font-black">Disponibles</p>
            <p className="text-xs text-slate-400 mt-1 font-bold uppercase">Evaluaciones</p>
          </div>
        </div>
      </section>

      {/* SECCIÓN: PANEL DE VACANTES DESTACADAS */}
      <section className="px-6 pb-24 max-w-7xl mx-auto">
        <div className="mb-8">
          <p className="text-emerald-400 font-bold text-xs uppercase tracking-wider">Oportunidades laborales</p>
          <h2 className="text-4xl font-black mt-1">Ofertas de empleo actuales</h2>
        </div>

        {loading ? (
          <div className="text-center text-slate-400 py-10 font-bold">Conectando con el servidor MySQL...</div>
        ) : vacantes.length === 0 ? (
          <div className="bg-white/2 border border-white/5 rounded-3xl p-10 text-center text-slate-400">
            No hay vacantes publicadas en este momento. El administrador semillero debe crear la primera oferta desde su panel.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {vacantes.map((job) => (
              <div key={job.id} className="bg-white/2 border border-white/10 rounded-3xl p-6 flex flex-col justify-between hover:border-emerald-500/30 transition-all shadow-lg">
                <div>
                  <span className="inline-block text-[10px] bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                    {job.areaNombre || "Tecnología"}
                  </span>
                  <h3 className="text-xl font-black text-white mt-3">{job.titulo}</h3>
                  <p className="text-sm text-slate-400 mt-2 line-clamp-3 leading-relaxed">{job.descripcion}</p>
                </div>
                
                <div className="mt-6 pt-4 border-t border-white/4 flex items-center justify-between">
                  <div className="text-xs text-slate-400">
                    <span className="font-bold text-sky-400">{job.modalidad}</span> · {job.salario ? `S/. ${job.salario}` : "Sueldo competitivo"}
                  </div>
                  <RouterLink
                    to={`/vacantes/${job.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    Ver detalles <ArrowRight size={14} />
                  </RouterLink>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}

export default Home;