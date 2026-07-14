import axios from "axios";

const TOKEN_KEY = "novarecruit_token";
const USER_KEY = "novarecruit_user";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "http://localhost:8080/api",

  headers: {
    "Content-Type": "application/json",
  },
});

/*
 * Antes de cada solicitud, Axios agrega automáticamente
 * el JWT almacenado en el navegador.
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/*
 * Procesamiento centralizado de errores del backend.
 */
api.interceptors.response.use(
  (response) => response,

  (error) => {
    const status = error.response?.status;
    const data = error.response?.data;

    /*
     * Spring puede devolver el texto en:
     * - message
     * - detail
     *
     * Si no existe, dejamos userMessage en null
     * para que cada pantalla use su propio mensaje.
     */
    error.userMessage =
      data?.message ||
      data?.detail ||
      null;

    /*
     * Solo se elimina la sesión ante un 401 real:
     * token ausente, inválido o vencido.
     *
     * Los errores 404, 409, 400 y 403
     * no deben cerrar la sesión.
     */
    if (status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);

      window.dispatchEvent(
        new Event("novarecruit:unauthorized")
      );
    }

    return Promise.reject(error);
  }
);

export default api;