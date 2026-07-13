import { useCallback, useEffect, useState } from "react";
import { Users, Briefcase, Award, TrendingUp, RefreshCw } from "lucide-react";
import SectionHeader from "../../components/ui/SectionHeader.jsx";
import { postulacionService } from "../../services/postulacionService.js";
import { vacanteService } from "../../services/vacanteService.js";
import { useRealtimeNotifications } from "../../context/realtimeContext.jsx";

const CHART_WIDTH = 1000;
const CHART_HEIGHT = 320;

function LineChartCard({ title, accentClassName, icon, data, valueKey, valueLabel, yMax, yTickFormatter }) {
  const safeData = data || [];

  const points = safeData.map((item, index) => {
    const denominator = Math.max(safeData.length - 1, 1);
    const x = (index / denominator) * CHART_WIDTH;
    const rawValue = Number(item?.[valueKey] ?? 0);
    const normalized = yMax > 0 ? rawValue / yMax : 0;
    const y = CHART_HEIGHT - Math.max(12, normalized * (CHART_HEIGHT - 44));

    return {
      ...item,
      x,
      y,
      rawValue,
    };
  });

  const linePath = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(" ");
  const areaPath = points.length
    ? `${linePath} L ${CHART_WIDTH} ${CHART_HEIGHT} L 0 ${CHART_HEIGHT} Z`
    : "";

  const formatValue = (value) => {
    if (!Number.isFinite(value)) {
      return "0";
    }

    return valueLabel === "promedio" ? value.toFixed(1) : `${value}`;
  };

  return (
    <section className="bg-white border border-slate-200 rounded-[2rem] p-5 sm:p-6 shadow-sm space-y-4 min-w-0 overflow-hidden">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-base font-black text-slate-900 uppercase tracking-tight text-xs text-slate-500">{title}</h3>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3 sm:p-4 min-w-0 overflow-hidden">
        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400 mb-3">
          <span>0</span>
          <span>{yTickFormatter(yMax)}</span>
        </div>

        <div className="relative w-full overflow-hidden rounded-2xl bg-white ring-1 ring-slate-100">
          <svg
            viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
            className="block h-52 sm:h-64 w-full"
            role="img"
            aria-label={title}
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id={`${valueKey}-line-gradient`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={accentClassName === "emerald" ? "#10b981" : "#f43f5e"} stopOpacity="0.18" />
                <stop offset="100%" stopColor={accentClassName === "emerald" ? "#10b981" : "#f43f5e"} stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {[0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = CHART_HEIGHT - ratio * (CHART_HEIGHT - 44);
              return (
                <g key={ratio}>
                  <line x1="0" y1={y} x2={CHART_WIDTH} y2={y} stroke="#e2e8f0" strokeWidth="2" strokeDasharray="8 10" />
                </g>
              );
            })}

            {points.length > 0 && (
              <>
                <path d={areaPath} fill={`url(#${valueKey}-line-gradient)`} />
                <path d={linePath} fill="none" stroke={accentClassName === "emerald" ? "#059669" : "#e11d48"} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
                <path d={linePath} fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.65" />

                {points.map((point, index) => (
                  <g key={`${point.fecha}-${index}`}>
                    <circle cx={point.x} cy={point.y} r="11" fill="#fff" opacity="0.9" />
                    <circle cx={point.x} cy={point.y} r="6" fill={accentClassName === "emerald" ? "#10b981" : "#f43f5e"} />
                  </g>
                ))}
              </>
            )}
          </svg>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400">
            <span className="truncate">{safeData[0]?.fecha || "Sin datos"}</span>
            <span className="truncate text-right">{safeData[safeData.length - 1]?.fecha || "Sin datos"}</span>
          </div>

          <div className="overflow-x-auto pb-1">
            <div className="inline-flex gap-2 min-w-max pr-2">
              {points.map((point, index) => (
                <div key={`${point.fecha}-chip-${index}`} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-black text-slate-700 shadow-sm whitespace-nowrap">
                  <span className="text-slate-400 uppercase tracking-wider mr-2">{point.fecha}</span>
                  <span className={accentClassName === "emerald" ? "text-emerald-700" : "text-rose-700"}>{formatValue(point.rawValue)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [totalVacantes, setTotalVacantes] = useState(0);
  const { ultimoEvento } = useRealtimeNotifications();
  
  // ESTADOS DE SERIES DE TIEMPO REALES (PROVENIENTES DE REPOSITORY DE JAVA)
  const [datosAtraccion, setDatosAtraccion] = useState([]);
  const [datosRendimiento, setDatosRendimiento] = useState([]);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [vacantes, atraccion, rendimiento] = await Promise.all([
        vacanteService.listarTodas(),
        postulacionService.getMetricaAtraccion(),
        postulacionService.getMetricaRendimiento()
      ]);
      
      setTotalVacantes(vacantes.length);
      // Seteamos las series de tiempo puras de la base de datos
      setDatosAtraccion(atraccion);
      setDatosRendimiento(rendimiento);
    } catch (error) {
      console.error("Error al recopilar métricas relacionales:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadDashboardData();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadDashboardData]);

  useEffect(() => {
    const tiposQueRecalcular = ["NUEVA_POSTULACION", "EVALUACION_CALIFICADA", "ACTUALIZACION_ESTADO"];

    if (tiposQueRecalcular.includes(ultimoEvento?.tipo)) {
      const timer = setTimeout(() => {
        loadDashboardData();
      }, 0);

      return () => clearTimeout(timer);
    }
  }, [ultimoEvento, loadDashboardData]);

  // Sumatorias para las tarjetas informativas superiores
  const totalPostulacionesAcumuladas = datosAtraccion.reduce((sum, item) => sum + (item.cantidad || 0), 0);
  const totalExamenesRendidos = datosRendimiento.length;
  const maxCantidadAtraccion = Math.max(...datosAtraccion.map((item) => item.cantidad || 0), 1);
  const maxPromedioRendimiento = Math.max(...datosRendimiento.map((item) => item.promedio || 0), 20);

  return (
    <div className="space-y-6 min-w-0">
      <SectionHeader 
        title="Panel de Analítica de Selección" 
        description="Monitoreo en tiempo real de los flujos de atracción de talento e indicadores de rendimiento técnico globales." 
      />

      {/* BOTÓN INDEPENDIENTE DE REFRESCO DE DATOS */}
      <div className="flex justify-end bg-white border border-slate-200 rounded-2xl p-3 shadow-sm">
        <button onClick={loadDashboardData} className="inline-flex items-center gap-2 border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-sm font-black cursor-pointer transition-colors">
          <RefreshCw size={15} /> Recalcular Métricas
        </button>
      </div>

      {/* SECCIÓN KPI CARD SUPERIORES */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 min-w-0">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center"><Briefcase size={22} /></div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Ofertas Publicadas</p>
            <p className="text-3xl font-black text-slate-900 mt-0.5">{totalVacantes} plazas</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center"><Users size={22} /></div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Atracción Total</p>
            <p className="text-3xl font-black text-slate-900 mt-0.5">{totalPostulacionesAcumuladas} postulantes</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center"><Award size={22} /></div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Evaluaciones Procesadas</p>
            <p className="text-3xl font-black text-slate-900 mt-0.5">{totalExamenesRendidos} exámenes</p>
          </div>
        </div>
      </section>

      {/* SECCIÓN ANALÍTICA DE DOS GRÁFICOS DE SERIES DE TIEMPO (CONTEOS Y PROMEDIOS PUROS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0">
        
        {/* GRÁFICO 1: VOLUMEN DE ATRACCIÓN (SERIE DE TIEMPO DE CONTEOS PUROS) */}
        
          {loading ? (
            <section className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm space-y-4 min-w-0 overflow-hidden">
              <div className="flex items-center gap-2">
                <TrendingUp size={18} className="text-rose-600" />
                <h3 className="text-base font-black text-slate-900 uppercase tracking-tight text-xs text-slate-500">Volumen de Atracción TI (Postulaciones por Día)</h3>
              </div>
              <div className="h-72 flex items-center justify-center text-xs font-bold text-slate-400 animate-pulse">Procesando serie de tiempo...</div>
            </section>
          ) : datosAtraccion.length === 0 ? (
            <section className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm space-y-4 min-w-0 overflow-hidden">
              <div className="flex items-center gap-2">
                <TrendingUp size={18} className="text-rose-600" />
                <h3 className="text-base font-black text-slate-900 uppercase tracking-tight text-xs text-slate-500">Volumen de Atracción TI (Postulaciones por Día)</h3>
              </div>
              <div className="h-72 flex items-center justify-center text-xs text-slate-400">Sin registros históricos de postulación en MySQL.</div>
            </section>
          ) : (
            <LineChartCard
              title="Volumen de Atracción TI (Postulaciones por Día)"
              accentClassName="rose"
              icon={<TrendingUp size={18} className="text-rose-600" />}
              data={datosAtraccion}
              valueKey="cantidad"
              valueLabel="cantidad"
              yMax={maxCantidadAtraccion}
              yTickFormatter={(value) => `${value}`}
            />
          )}

        {/* GRÁFICO 2: RENDIMIENTO TÉCNICO VIGESIMAL (SERIE DE TIEMPO DE NOTAS PROMEDIO) */}
        
          {loading ? (
            <section className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm space-y-4 min-w-0 overflow-hidden">
              <div className="flex items-center gap-2">
                <Award size={18} className="text-emerald-600" />
                <h3 className="text-base font-black text-slate-900 uppercase tracking-tight text-xs text-slate-500">Índice de Aptitud Técnica (Promedio de Notas sobre 20)</h3>
              </div>
              <div className="h-72 flex items-center justify-center text-xs font-bold text-slate-400 animate-pulse">Calculando promedios vigesimales...</div>
            </section>
          ) : datosRendimiento.length === 0 ? (
            <section className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm space-y-4 min-w-0 overflow-hidden">
              <div className="flex items-center gap-2">
                <Award size={18} className="text-emerald-600" />
                <h3 className="text-base font-black text-slate-900 uppercase tracking-tight text-xs text-slate-500">Índice de Aptitud Técnica (Promedio de Notas sobre 20)</h3>
              </div>
              <div className="h-72 flex items-center justify-center text-xs text-slate-400">Sin exámenes rendidos en el histórico de MySQL.</div>
            </section>
          ) : (
            <LineChartCard
              title="Índice de Aptitud Técnica (Promedio de Notas sobre 20)"
              accentClassName="emerald"
              icon={<Award size={18} className="text-emerald-600" />}
              data={datosRendimiento}
              valueKey="promedio"
              valueLabel="promedio"
              yMax={Math.max(maxPromedioRendimiento, 20)}
              yTickFormatter={(value) => `${Number(value).toFixed(0)}`}
            />
          )}

      </div>
    </div>
  );
}

export default AdminDashboard;