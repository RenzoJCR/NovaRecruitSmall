import api from "./api.js";

export const areaService = {
  // Conecta con GET /api/areas (PRIVADO - ADMIN)
  async getAll() {
    const response = await api.get("/areas");
    return response.data; // Retorna la lista de AreaResponse: [{id, nombre, descripcion}]
  },

  // Conecta con POST /api/areas (PRIVADO - ADMIN)
  async create(areaData) {
    const response = await api.post("/areas", areaData);
    return response.data; // Retorna el AreaResponse creado
  }
};