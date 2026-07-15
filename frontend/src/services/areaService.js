import api from "./api.js";

export const areaService = {
  /*
   * GET /api/areas
   *
   * Lista todas las áreas disponibles.
   */
  async getAll() {
    const response =
      await api.get("/areas");

    return response.data;
  },

  /*
   * POST /api/areas
   *
   * Crea una nueva área tecnológica.
   */
  async create(areaData) {
    const response =
      await api.post(
        "/areas",
        areaData
      );

    return response.data;
  },

  /*
   * PUT /api/areas/{id}
   *
   * Actualiza nombre y descripción.
   */
  async update(areaId, areaData) {
    const response =
      await api.put(
        `/areas/${areaId}`,
        areaData
      );

    return response.data;
  },
};