import api from "./api";

export const vacanteService = {
  // Público y postulantes: solo vacantes activas.
  listarTodas: async () => {
    const response = await api.get("/vacantes");
    return response.data;
  },

  // Administrador: vacantes activas y cerradas.
  listarAdmin: async () => {
    const response = await api.get("/vacantes/admin");
    return response.data;
  },

  // Público: detalle de una vacante activa.
  obtenerPorId: async (id) => {
    const response = await api.get(`/vacantes/${id}`);
    return response.data;
  },

  // Administrador: crear vacante.
  crear: async (payload) => {
    const response = await api.post("/vacantes", payload);
    return response.data;
  },

  // Administrador: activar o cerrar vacante.
  cambiarEstado: async (id, nuevoEstado) => {
    const response = await api.patch(
      `/vacantes/${id}/estado`,
      null,
      {
        params: {
          nuevoEstado,
        },
      }
    );

    return response.data;
  },
};

export default vacanteService;