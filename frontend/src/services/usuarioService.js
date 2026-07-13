import api from "./api";

export const usuarioService = {
  // 1. Listar el control global de cuentas (ADMIN)
  listarTodos: async () => {
    const response = await api.get("/usuarios");
    return response.data;
  },

  // 2. Obtener la ficha de un usuario específico
  obtenerPorId: async (id) => {
    const response = await api.get(`/usuarios/${id}`);
    return response.data;
  },

  // 3. Registrar personal interno de soporte (ADMIN)
  crear: async (payload) => {
    const response = await api.post("/usuarios", payload);
    return response.data;
  },

  // 4. Modificar datos de perfil corporativo
  actualizar: async (id, payload) => {
    const response = await api.put(`/usuarios/${id}`, payload);
    return response.data;
  },

  // 5. Borrado Lógico: Suspender acceso al sistema (DELETE)
  // Desactivar cuenta de usuario
  desactivar: async (id) => {
    await api.delete(`/usuarios/${id}`);
  },

  // 6. Reactivar cuenta inhabilitada (PATCH)
  reactivar: async (id) => {
    const response = await api.patch(`/usuarios/${id}/reactivar`);
    return response.data;
  }
};