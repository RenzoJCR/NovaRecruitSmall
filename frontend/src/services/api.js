import axios from "axios";

// 1. Configuramos la URL base hacia tu servidor Spring Boot
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// 2. INTERCEPTOR DE PETICIÓN: Añade el token (JWT) automáticamente si existe
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("novarecruit_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`; // El formato exacto que pide Spring Security
  }
  return config;
});

// 3. INTERCEPTOR DE RESPUESTA: Captura errores del backend y los traduce a texto legible
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si el backend nos manda un mensaje de error detallado, lo extraemos
    const mensajeServidor = error.response?.data?.message || "Ocurrió un error inesperado en el sistema.";
    error.userMessage = mensajeServidor; // Se lo inyectamos al error para que la pantalla lo pinte en una alerta
    return Promise.reject(error);
  }
);

export default api;