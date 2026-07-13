import api from "./api";

export const evaluacionService = {
  // 1. Registrar una nueva prueba técnica con sus preguntas y respuestas correctas (ADMIN)
  crear: async (payload) => {
    const response = await api.post("/evaluaciones", payload);
    return response.data;
  },

  // 2. Descargar el examen limpio asociado a la oferta laboral (POSTULANTE / ADMIN)
  obtenerPorVacante: async (vacanteId) => {
    const response = await api.get(`/evaluaciones/vacante/${vacanteId}`);
    return response.data;
  }
};

export default evaluacionService;