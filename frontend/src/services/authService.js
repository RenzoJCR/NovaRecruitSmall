import api from "./api";

export const authService = {
  // Envía el correo y clave al endpoint público de Spring Boot
  login: async (correo, password) => {
    const response = await api.post("/auth/login", { correo, password });
    return response.data; // Retorna el DTO ideal: { token, id, nombres, correo, rol }
  },

  // Envía el formulario de registro de nuevos postulantes
  register: async (nombres, apellidos, correo, password) => {
    const response = await api.post("/auth/register", { nombres, apellidos, correo, password });
    return response.data;
  }
};