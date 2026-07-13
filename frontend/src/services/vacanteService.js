import api from "./api";

export const vacanteService = {
  // Consume GET /api/vacantes (Público)
  listarTodas: async () => {
    const response = await api.get("/vacantes");
    return response.data; // Devuelve la lista de vacantes reales
  },

  // Consume GET /api/vacantes/{id} (Público)
  obtenerPorId: async (id) => {
    const response = await api.get(`/vacantes/${id}`);
    return response.data; // Devuelve el detalle de una vacante específica
  },

  // Consume POST /api/vacantes (ADMIN)
  crear: async (payload) => {
    const response = await api.post("/vacantes", payload);
    return response.data;
  },

  // Consume PATCH /api/vacantes/{id}/estado (ADMIN)
  cambiarEstado: async (id, nuevoEstado) => {
    const response = await api.patch(`/vacantes/${id}/estado`, null, {
      params: { nuevoEstado },
    });
    return response.data;
  }
};