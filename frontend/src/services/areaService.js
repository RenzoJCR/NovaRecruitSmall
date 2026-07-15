import api from "./api.js";

export const areaService = {
  /*
   * Administración:
   * obtiene áreas activas e inactivas.
   */
  async getAll() {
    const response =
      await api.get("/areas");

    return response.data;
  },

  /*
   * Formularios de vacantes:
   * obtiene solamente áreas activas.
   */
  async getActive() {
    const response =
      await api.get("/areas/activas");

    return response.data;
  },

  async create(areaData) {
    const response =
      await api.post(
        "/areas",
        areaData
      );

    return response.data;
  },

  async update(
    areaId,
    areaData
  ) {
    const response =
      await api.put(
        `/areas/${areaId}`,
        areaData
      );

    return response.data;
  },

  async changeStatus(
    areaId,
    activo
  ) {
    const response =
      await api.patch(
        `/areas/${areaId}/estado`,
        null,
        {
          params: {
            activo,
          },
        }
      );

    return response.data;
  },
};