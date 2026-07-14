import axios from "axios";

const TOKEN_KEY = "novarecruit_token";
const USER_KEY = "novarecruit_user";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const mensajeServidor =
      error.response?.data?.message ||
      "Ocurrió un error inesperado en el sistema.";

    error.userMessage = mensajeServidor;

    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      window.dispatchEvent(new Event("novarecruit:unauthorized"));
    }

    return Promise.reject(error);
  },
);

export default api;
