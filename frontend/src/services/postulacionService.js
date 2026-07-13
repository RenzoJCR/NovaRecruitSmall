import api from "./api";

export const postulacionService = {
  // 1. Proceso de Negocio 1: Candidato aplica a un empleo (POSTULANTE)
  registrarPostulacion: async (vacanteId) => {
    // Mandamos el Record PostulacionRequest que espera tu backend
    const response = await api.post("/postulaciones", { vacanteId });
    return response.data;
  },

  // 2. Cargar el historial del postulante logueado (POSTULANTE)
  listarMisPostulaciones: async () => {
    const response = await api.get("/postulaciones/mis-postulaciones");
    return response.data;
  },

  // 3. Cargar todas las aplicaciones del sistema para el pipeline (ADMIN)
  listarTodas: async () => {
    const response = await api.get("/postulaciones");
    return response.data;
  },

  // 4. Cambiar fase del candidato: Aprobar, Rechazar, Contratar (ADMIN)
  actualizarEstado: async (id, nuevoEstado) => {
    const response = await api.patch(`/postulaciones/${id}/estado`, null, {
      params: { nuevoEstado }
    });
    return response.data;
  },

  // 5. Proceso de Negocio 2: Enviar y autocalificar examen en vivo (POSTULANTE)
  enviarExamen: async (postulacionId, respuestasJSONString) => {
    // Mandamos el Record EvaluarRequest con el String JSON estructurado
    const response = await api.post(`/postulaciones/${postulacionId}/evaluar`, {
      respuestasPostulante: respuestasJSONString
    });
    return response.data;
  },

  // 6. Métricas de Atracción y Rendimiento (ADMIN)

  async getMetricaAtraccion() {
    const response = await api.get("/postulaciones/metrica-atraccion");
    return response.data; // [{ fecha: "2026-07-10", cantidad: 4 }]
  },
  async getMetricaRendimiento() {
    const response = await api.get("/postulaciones/metrica-rendimiento");
    return response.data; // [{ fecha: "2026-07-11", promedio: 14.5 }]
  }

};

export default postulacionService;