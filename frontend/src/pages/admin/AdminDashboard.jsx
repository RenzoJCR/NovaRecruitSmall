import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Users,
  Briefcase,
  Award,
  TrendingUp,
  RefreshCw,
} from "lucide-react";

import SectionHeader from
  "../../components/ui/SectionHeader.jsx";

import { postulacionService } from
  "../../services/postulacionService.js";

import { vacanteService } from
  "../../services/vacanteService.js";

import { useRealtimeNotifications } from
  "../../context/realtimeContext.jsx";

const CHART_WIDTH = 1000;
const CHART_HEIGHT = 320;

/*
 * Lee propiedades devueltas por consultas nativas.
 *
 * Dependiendo del driver, los alias pueden llegar
 * en minúsculas o mayúsculas.
 */
const leerCampo = (
  registro,
  nombre,
  valorDefecto = 0
) => {
  return (
    registro?.[nombre] ??
    registro?.[nombre.toUpperCase()] ??
    valorDefecto
  );
};

const convertirNumero = (
  valor,
  valorDefecto = 0
) => {
  const numero = Number(valor);

  return Number.isFinite(numero)
    ? numero
    : valorDefecto;
};

const crearClaveMes = (
  anio,
  mes
) => {
  return `${anio}-${mes}`;
};

const capitalizar = (texto) => {
  if (!texto) {
    return "";
  }

  return (
    texto.charAt(0).toUpperCase() +
    texto.slice(1)
  );
};

/*
 * Crea siempre los últimos seis meses.
 *
 * Esto permite que un mes sin postulaciones
 * o evaluaciones aparezca igualmente con cero.
 */
const obtenerUltimosSeisMeses = () => {
  const fechaActual = new Date();

  const formateador = new Intl.DateTimeFormat(
    "es-PE",
    {
      month: "short",
      year: "numeric",
    }
  );

  return Array.from(
    { length: 6 },
    (_, indice) => {
      const mesesAnteriores =
        5 - indice;

      const fechaMes = new Date(
        fechaActual.getFullYear(),
        fechaActual.getMonth() -
          mesesAnteriores,
        1
      );

      const anio =
        fechaMes.getFullYear();

      const mes =
        fechaMes.getMonth() + 1;

      const etiqueta = capitalizar(
        formateador
          .format(fechaMes)
          .replace(".", "")
      );

      return {
        anio,
        mes,
        clave: crearClaveMes(
          anio,
          mes
        ),
        fecha: etiqueta,
      };
    }
  );
};

/*
 * Completa la métrica de atracción.
 *
 * Si MySQL no devuelve un mes porque no tuvo
 * postulaciones, se agrega con cantidad cero.
 */
const completarDatosAtraccion = (
  registros
) => {
  const meses =
    obtenerUltimosSeisMeses();

  const cantidadesPorMes =
    new Map();

  (
    Array.isArray(registros)
      ? registros
      : []
  ).forEach((registro) => {
    const anio = convertirNumero(
      leerCampo(registro, "anio")
    );

    const mes = convertirNumero(
      leerCampo(registro, "mes")
    );

    const cantidad =
      convertirNumero(
        leerCampo(
          registro,
          "cantidad"
        )
      );

    cantidadesPorMes.set(
      crearClaveMes(anio, mes),
      cantidad
    );
  });

  return meses.map((mes) => ({
    ...mes,
    cantidad:
      cantidadesPorMes.get(
        mes.clave
      ) ?? 0,
  }));
};

/*
 * Completa la métrica de rendimiento.
 *
 * Cada mes contiene:
 * - Promedio técnico.
 * - Cantidad de evaluaciones procesadas.
 */
const completarDatosRendimiento = (
  registros
) => {
  const meses =
    obtenerUltimosSeisMeses();

  const rendimientoPorMes =
    new Map();

  (
    Array.isArray(registros)
      ? registros
      : []
  ).forEach((registro) => {
    const anio = convertirNumero(
      leerCampo(registro, "anio")
    );

    const mes = convertirNumero(
      leerCampo(registro, "mes")
    );

    const promedio =
      convertirNumero(
        leerCampo(
          registro,
          "promedio"
        )
      );

    const evaluaciones =
      convertirNumero(
        leerCampo(
          registro,
          "evaluaciones"
        )
      );

    rendimientoPorMes.set(
      crearClaveMes(anio, mes),
      {
        promedio,
        evaluaciones,
      }
    );
  });

  return meses.map((mes) => {
    const datosMes =
      rendimientoPorMes.get(
        mes.clave
      );

    return {
      ...mes,
      promedio:
        datosMes?.promedio ?? 0,
      evaluaciones:
        datosMes?.evaluaciones ??
        0,
    };
  });
};

function LineChartCard({
  title,
  accentClassName,
  icon,
  data,
  valueKey,
  valueLabel,
  yMax,
  yTickFormatter,
}) {
  const safeData =
    Array.isArray(data)
      ? data
      : [];

  const points = safeData.map(
    (item, index) => {
      const denominator =
        Math.max(
          safeData.length - 1,
          1
        );

      const x =
        (index / denominator) *
        CHART_WIDTH;

      const rawValue =
        convertirNumero(
          item?.[valueKey]
        );

      const normalized =
        yMax > 0
          ? rawValue / yMax
          : 0;

      const y =
        CHART_HEIGHT -
        Math.max(
          12,
          normalized *
            (CHART_HEIGHT - 44)
        );

      return {
        ...item,
        x,
        y,
        rawValue,
      };
    }
  );

  const linePath = points
    .map(
      (point, index) =>
        `${
          index === 0 ? "M" : "L"
        } ${point.x.toFixed(
          2
        )} ${point.y.toFixed(2)}`
    )
    .join(" ");

  const areaPath =
    points.length > 0
      ? `${linePath} L ${CHART_WIDTH} ${CHART_HEIGHT} L 0 ${CHART_HEIGHT} Z`
      : "";

  const colorPrincipal =
    accentClassName === "emerald"
      ? "#059669"
      : "#e11d48";

  const colorPunto =
    accentClassName === "emerald"
      ? "#10b981"
      : "#f43f5e";

  const formatValue = (value) => {
    if (
      !Number.isFinite(value)
    ) {
      return "0";
    }

    return valueLabel ===
      "promedio"
      ? value.toFixed(1)
      : `${value}`;
  };

  return (
    <section className="bg-white border border-slate-200 rounded-[2rem] p-5 sm:p-6 shadow-sm space-y-4 min-w-0 overflow-hidden">
      <div className="flex items-center gap-2">
        {icon}

        <h3 className="text-xs font-black text-slate-500 uppercase tracking-tight">
          {title}
        </h3>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3 sm:p-4 min-w-0 overflow-hidden">
        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400 mb-3">
          <span>0</span>

          <span>
            {yTickFormatter(yMax)}
          </span>
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
              <linearGradient
                id={`${valueKey}-line-gradient`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor={colorPunto}
                  stopOpacity="0.18"
                />

                <stop
                  offset="100%"
                  stopColor={colorPunto}
                  stopOpacity="0.02"
                />
              </linearGradient>
            </defs>

            {[0.25, 0.5, 0.75, 1].map(
              (ratio) => {
                const y =
                  CHART_HEIGHT -
                  ratio *
                    (
                      CHART_HEIGHT -
                      44
                    );

                return (
                  <line
                    key={ratio}
                    x1="0"
                    y1={y}
                    x2={CHART_WIDTH}
                    y2={y}
                    stroke="#e2e8f0"
                    strokeWidth="2"
                    strokeDasharray="8 10"
                  />
                );
              }
            )}

            {points.length > 0 && (
              <>
                <path
                  d={areaPath}
                  fill={`url(#${valueKey}-line-gradient)`}
                />

                <path
                  d={linePath}
                  fill="none"
                  stroke={colorPrincipal}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                <path
                  d={linePath}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.65"
                />

                {points.map(
                  (point) => (
                    <g key={point.clave}>
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r="11"
                        fill="#fff"
                        opacity="0.9"
                      />

                      <circle
                        cx={point.x}
                        cy={point.y}
                        r="6"
                        fill={colorPunto}
                      />
                    </g>
                  )
                )}
              </>
            )}
          </svg>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400">
            <span className="truncate">
              {safeData[0]?.fecha ||
                "Sin datos"}
            </span>

            <span className="truncate text-right">
              {safeData[
                safeData.length - 1
              ]?.fecha || "Sin datos"}
            </span>
          </div>

          <div className="overflow-x-auto pb-1">
            <div className="inline-flex gap-2 min-w-max pr-2">
              {points.map(
                (point) => (
                  <div
                    key={`${point.clave}-chip`}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-black text-slate-700 shadow-sm whitespace-nowrap"
                  >
                    <span className="text-slate-400 uppercase tracking-wider mr-2">
                      {point.fecha}
                    </span>

                    <span
                      className={
                        accentClassName ===
                        "emerald"
                          ? "text-emerald-700"
                          : "text-rose-700"
                      }
                    >
                      {formatValue(
                        point.rawValue
                      )}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function AdminDashboard() {
  const [loading, setLoading] =
    useState(true);

  const [
    totalVacantes,
    setTotalVacantes,
  ] = useState(0);

  const [
    datosAtraccion,
    setDatosAtraccion,
  ] = useState([]);

  const [
    datosRendimiento,
    setDatosRendimiento,
  ] = useState([]);

  const { ultimoEvento } =
    useRealtimeNotifications();

  const loadDashboardData =
    useCallback(async () => {
      try {
        setLoading(true);

        const [
          vacantes,
          atraccion,
          rendimiento,
        ] = await Promise.all([
          vacanteService.listarTodas(),
          postulacionService
            .getMetricaAtraccion(),
          postulacionService
            .getMetricaRendimiento(),
        ]);

        setTotalVacantes(
          Array.isArray(vacantes)
            ? vacantes.length
            : 0
        );

        setDatosAtraccion(
          completarDatosAtraccion(
            atraccion
          )
        );

        setDatosRendimiento(
          completarDatosRendimiento(
            rendimiento
          )
        );
      } catch (error) {
        console.error(
          "Error al recopilar métricas relacionales:",
          error
        );

        /*
         * Aunque falle la consulta, mantenemos
         * los seis meses visibles con valor cero.
         */
        setDatosAtraccion(
          completarDatosAtraccion([])
        );

        setDatosRendimiento(
          completarDatosRendimiento([])
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadDashboardData();
    }, 0);

    return () =>
      clearTimeout(timer);
  }, [loadDashboardData]);

  useEffect(() => {
    const tiposQueRecalcular = [
      "NUEVA_POSTULACION",
      "EVALUACION_CALIFICADA",
      "ACTUALIZACION_ESTADO",
    ];

    if (
      tiposQueRecalcular.includes(
        ultimoEvento?.tipo
      )
    ) {
      const timer = setTimeout(() => {
        loadDashboardData();
      }, 0);

      return () =>
        clearTimeout(timer);
    }
  }, [
    ultimoEvento,
    loadDashboardData,
  ]);

  const totalPostulacionesAcumuladas =
    datosAtraccion.reduce(
      (total, item) =>
        total +
        convertirNumero(
          item.cantidad
        ),
      0
    );

  const totalExamenesRendidos =
    datosRendimiento.reduce(
      (total, item) =>
        total +
        convertirNumero(
          item.evaluaciones
        ),
      0
    );

  /*
   * Promedio general ponderado:
   *
   * No promediamos directamente los promedios
   * mensuales, porque cada mes puede tener una
   * cantidad diferente de evaluaciones.
   */
  const sumaNotasPonderadas =
    datosRendimiento.reduce(
      (total, item) =>
        total +
        convertirNumero(
          item.promedio
        ) *
          convertirNumero(
            item.evaluaciones
          ),
      0
    );

  const promedioTecnicoGeneral =
    totalExamenesRendidos > 0
      ? sumaNotasPonderadas /
        totalExamenesRendidos
      : 0;

  const maxCantidadAtraccion =
    Math.max(
      ...datosAtraccion.map(
        (item) =>
          convertirNumero(
            item.cantidad
          )
      ),
      1
    );

  return (
    <div className="space-y-6 min-w-0">
      <SectionHeader
        title="Panel de Analítica de Selección"
        description="Indicadores mensuales de atracción de talento y rendimiento técnico durante los últimos seis meses."
      />

      <div className="flex justify-end bg-white border border-slate-200 rounded-2xl p-3 shadow-sm">
        <button
          type="button"
          onClick={loadDashboardData}
          disabled={loading}
          className="inline-flex items-center gap-2 border border-slate-300 hover:bg-slate-50 disabled:opacity-50 text-slate-700 px-4 py-2 rounded-xl text-sm font-black cursor-pointer transition-colors"
        >
          <RefreshCw
            size={15}
            className={
              loading
                ? "animate-spin"
                : ""
            }
          />

          Recalcular métricas
        </button>
      </div>

      {/* KPI SUPERIORES */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 min-w-0">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <Briefcase size={22} />
          </div>

          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-wider">
              Ofertas publicadas
            </p>

            <p className="text-3xl font-black text-slate-900 mt-0.5">
              {totalVacantes} plazas
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <Users size={22} />
          </div>

          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-wider">
              Atracción últimos 6 meses
            </p>

            <p className="text-3xl font-black text-slate-900 mt-0.5">
              {
                totalPostulacionesAcumuladas
              }{" "}
              postulantes
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Award size={22} />
          </div>

          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-wider">
              Evaluaciones procesadas
            </p>

            <p className="text-3xl font-black text-slate-900 mt-0.5">
              {
                totalExamenesRendidos
              }{" "}
              exámenes
            </p>

            <p className="text-xs font-bold text-purple-600 mt-1">
              Promedio general:{" "}
              {promedioTecnicoGeneral.toFixed(
                1
              )}{" "}
              / 20
            </p>
          </div>
        </div>
      </section>

      {/* DOS MÉTRICAS MENSUALES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0">
        {loading ? (
          <section className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm space-y-4 min-w-0 overflow-hidden">
            <div className="flex items-center gap-2">
              <TrendingUp
                size={18}
                className="text-rose-600"
              />

              <h3 className="text-xs font-black text-slate-500 uppercase tracking-tight">
                Volumen de Atracción TI
                (Postulaciones por Mes)
              </h3>
            </div>

            <div className="h-72 flex items-center justify-center text-xs font-bold text-slate-400 animate-pulse">
              Procesando serie mensual...
            </div>
          </section>
        ) : (
          <LineChartCard
            title="Volumen de Atracción TI (Postulaciones por Mes)"
            accentClassName="rose"
            icon={
              <TrendingUp
                size={18}
                className="text-rose-600"
              />
            }
            data={datosAtraccion}
            valueKey="cantidad"
            valueLabel="cantidad"
            yMax={
              maxCantidadAtraccion
            }
            yTickFormatter={(value) =>
              `${value}`
            }
          />
        )}

        {loading ? (
          <section className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm space-y-4 min-w-0 overflow-hidden">
            <div className="flex items-center gap-2">
              <Award
                size={18}
                className="text-emerald-600"
              />

              <h3 className="text-xs font-black text-slate-500 uppercase tracking-tight">
                Índice de Aptitud Técnica
                (Promedio Mensual sobre 20)
              </h3>
            </div>

            <div className="h-72 flex items-center justify-center text-xs font-bold text-slate-400 animate-pulse">
              Calculando promedios
              mensuales...
            </div>
          </section>
        ) : (
          <LineChartCard
            title="Índice de Aptitud Técnica (Promedio Mensual sobre 20)"
            accentClassName="emerald"
            icon={
              <Award
                size={18}
                className="text-emerald-600"
              />
            }
            data={datosRendimiento}
            valueKey="promedio"
            valueLabel="promedio"
            yMax={20}
            yTickFormatter={(value) =>
              `${Number(
                value
              ).toFixed(0)}`
            }
          />
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;