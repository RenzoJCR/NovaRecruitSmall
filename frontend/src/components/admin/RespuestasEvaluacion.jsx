import {
  CheckCircle2,
  LoaderCircle,
  XCircle,
} from "lucide-react";

import { useEffect, useState } from "react";

import { postulacionService } from
  "../../services/postulacionService.js";

function RespuestasEvaluacion({
  postulacionId,
  estado,
  puntajeTecnico,
}) {
  const [respuestas, setRespuestas] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    let activo = true;

    const cargarRespuestas = async () => {
      if (
        !postulacionId
        || estado === "POSTULADO"
      ) {
        return;
      }

      try {
        setLoading(true);
        setError("");

        const data =
          await postulacionService
            .obtenerRespuestasAdmin(
              postulacionId
            );

        if (activo) {
          setRespuestas(
            Array.isArray(data)
              ? data
              : []
          );
        }
      } catch (err) {
        console.error(
          "Error al consultar respuestas:",
          err
        );

        if (activo) {
          setError(
            err.userMessage
              || "No se pudieron cargar las respuestas."
          );
        }
      } finally {
        if (activo) {
          setLoading(false);
        }
      }
    };

    cargarRespuestas();

    return () => {
      activo = false;
    };
  }, [postulacionId, estado]);

  if (estado === "POSTULADO") {
    return (
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-sm text-amber-300">
        El candidato todavía no ha completado
        la evaluación.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <LoaderCircle
          size={16}
          className="animate-spin"
        />
        Cargando respuestas...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 text-sm text-rose-300">
        {error}
      </div>
    );
  }

  if (respuestas.length === 0) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-sm text-slate-400">
        Esta evaluación pertenece al formato
        anterior y no posee respuestas
        normalizadas para mostrar.
      </div>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-black uppercase tracking-wider text-slate-400">
          Respuestas de la evaluación
        </p>

        <span className="text-sm font-black text-white">
          Nota: {puntajeTecnico ?? 0} / 20
        </span>
      </div>

      {respuestas.map((respuesta) => (
        <article
          key={respuesta.id}
          className={`border rounded-xl p-4 ${
            respuesta.correcta
              ? "bg-emerald-500/5 border-emerald-500/20"
              : "bg-rose-500/5 border-rose-500/20"
          }`}
        >
          <div className="flex items-start gap-3">
            {respuesta.correcta ? (
              <CheckCircle2
                size={19}
                className="text-emerald-400 mt-0.5 shrink-0"
              />
            ) : (
              <XCircle
                size={19}
                className="text-rose-400 mt-0.5 shrink-0"
              />
            )}

            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-white">
                P{respuesta.numeroPregunta}.{" "}
                {respuesta.enunciado}
              </p>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-950/60 rounded-lg p-3">
                  <span className="block text-slate-500 font-bold mb-1">
                    Respuesta del candidato
                  </span>

                  <span className="text-slate-200">
                    {respuesta.respuestaSeleccionada}){" "}
                    {respuesta.respuestaSeleccionadaTexto}
                  </span>
                </div>

                <div className="bg-slate-950/60 rounded-lg p-3">
                  <span className="block text-slate-500 font-bold mb-1">
                    Respuesta correcta
                  </span>

                  <span className="text-slate-200">
                    {respuesta.respuestaCorrecta}){" "}
                    {respuesta.respuestaCorrectaTexto}
                  </span>
                </div>
              </div>

              <p className="mt-3 text-xs font-black text-slate-400">
                Puntaje:{" "}
                {respuesta.puntajeObtenido}
                {" / "}
                {respuesta.puntajeAsignado}
              </p>
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}

export default RespuestasEvaluacion;