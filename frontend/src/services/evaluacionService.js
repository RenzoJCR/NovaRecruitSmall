import api from "./api";

export const evaluacionService = {
  // ADMIN: registra la prueba con sus respuestas correctas.
  crear: async (payload) => {
    const response = await api.post("/evaluaciones", payload);
    return response.data;
  },

  // POSTULANTE: obtiene el examen sin respuestaCorrecta.
  obtenerPorVacantePostulante: async (vacanteId) => {
    const response = await api.get(
      `/evaluaciones/vacante/${vacanteId}`
    );

    return response.data;
  },

  // ADMIN: obtiene el examen completo con sus claves.
  obtenerPorVacanteAdmin: async (vacanteId) => {
    const response = await api.get(
      `/evaluaciones/admin/vacante/${vacanteId}`
    );

    return response.data;
  },
};

export default evaluacionService;