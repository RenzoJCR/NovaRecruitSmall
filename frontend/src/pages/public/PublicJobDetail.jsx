import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Briefcase, Calendar, Coins, MapPin, Lock, ArrowLeft, ArrowRight } from "lucide-react";
import { vacanteService } from "../../services/vacanteService";

function PublicJobDetail() {
  const { id } = useParams();
  const [vacante, setVacante] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarDetalle = async () => {
      try {
        const data = await vacanteService.obtenerPorId(id);
        setVacante(data);
      } catch (error) {
        console.error("Error al traer el detalle de la vacante:", error);
      } finally {
        setLoading(false);
      }
    };
    cargarDetalle();
  }, [id]);

  if (loading) {
    return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center font-bold">Cargando detalles del puesto...</div>;
  }

  if (!vacante) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-3xl font-black text-rose-400">Vacante no encontrada</h1>
        <p className="text-slate-400 mt-2 max-w-md">La oferta laboral solicitada no existe en la base de datos de MySQL o ha sido cerrada.</p>
        <Link to="/" className="mt-6 inline-flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 px-5 py-2.5 rounded-xl font-bold text-sm">
          <ArrowLeft size={16} /> Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white py-12 px-6 selection:bg-emerald-500 selection:text-slate-950">
      <div className="max-w-6xl mx-auto">
        
        {/* Botón superior de retorno */}
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-emerald-400 mb-6 transition-colors">
          <ArrowLeft size={16} /> Volver a la lista de ofertas
        </Link>

        {/* CABECERA PRINCIPAL DEL PUESTO */}
        <div className="bg-white/[0.02] border border-white/10 rounded-[2rem] p-6 lg:p-8 mb-6">
          <span className="inline-block text-xs font-black bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 px-3 py-1 rounded-full uppercase tracking-wider">
            {vacante.areaNombre || "Tecnología"}
          </span>
          <h1 className="text-3xl lg:text-5xl font-black mt-4 tracking-tight">{vacante.titulo}</h1>
          <p className="text-slate-400 text-sm mt-3 max-w-2xl">
            Publicado por el equipo de reclutamiento de NovaTech Solutions. Revisa el perfil requerido a continuación.
          </p>
        </div>

        {/* CONTENIDO DIVIDIDO EN DOS COLUMNAS */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-6 items-start">
          
          {/* Lado Izquierdo: Descripción Detallada */}
          <section className="bg-white/[0.01] border border-white/5 rounded-[2rem] p-6 lg:p-8 backdrop-blur-md">
            <h2 className="text-xl font-black border-b border-white/5 pb-3">Descripción de las funciones</h2>
            <p className="text-slate-300 mt-4 leading-relaxed whitespace-pre-line text-sm lg:text-base">
              {vacante.descripcion}
            </p>
          </section>

          {/* Lado Derecho: Bloque Informativo y Bloqueo de Postulación */}
          <aside className="space-y-6">
            
            {/* Tarjeta de Información de Red */}
            <div className="bg-white/[0.01] border border-white/5 rounded-[2rem] p-6 space-y-3.5">
              <h3 className="text-base font-black text-white uppercase tracking-wider text-xs text-slate-400 mb-4">Ficha técnica del empleo</h3>
              
              <div className="flex items-center gap-3 bg-slate-900/50 border border-white/[0.03] p-3.5 rounded-xl text-sm">
                <Briefcase size={18} className="text-emerald-400" />
                <span className="font-medium">Modalidad: {vacante.modalidad}</span>
              </div>

              <div className="flex items-center gap-3 bg-slate-900/50 border border-white/[0.03] p-3.5 rounded-xl text-sm">
                <MapPin size={18} className="text-emerald-400" />
                <span className="font-medium">Ubicación: Lima, Perú (Presencial/Híbrido)</span>
              </div>

              <div className="flex items-center gap-3 bg-slate-900/50 border border-white/[0.03] p-3.5 rounded-xl text-sm">
                <Coins size={18} className="text-emerald-400" />
                <span className="font-medium">Compensación: S/. {vacante.salario || "No especificado"}</span>
              </div>

              <div className="flex items-center gap-3 bg-slate-900/50 border border-white/[0.03] p-3.5 rounded-xl text-sm">
                <Calendar size={18} className="text-emerald-400" />
                <span className="font-medium text-slate-400">{vacante.estado === "ACTIVA"
                  ? "Publicada"
                  : "Pausada"}<span className="text-emerald-400 font-bold">{vacante.estado}</span></span>
              </div>
            </div>

            {/* Muro de Autenticación Requerido */}
            <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-white/10 rounded-[2rem] p-6 shadow-xl">
              <div className="flex gap-3">
                <Lock size={20} className="text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-black text-sm">¿Deseas aplicar a esta vacante?</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Para registrar tu postulación y acceder a la evaluación técnica, necesitas una cuenta de postulante.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2.5 mt-5">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-600 hover:to-sky-600 text-slate-950 text-xs font-black py-3 rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer"
                >
                  Crear una cuenta nueva
                  <ArrowRight size={14} />
                </Link>

                <Link
                  to="/login"
                  className="border border-white/10 hover:bg-white/5 text-center text-xs font-bold py-3 rounded-xl transition-all"
                >
                  Iniciar sesión como postulante
                </Link>
              </div>
            </div>

          </aside>
        </div>

      </div>
    </div>
  );
}

export default PublicJobDetail;