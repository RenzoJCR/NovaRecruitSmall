import api from "./api.js";

export const evaluacionService = {
  /*
   * Administrador:
   * lista todas las evaluaciones.
   */
  async listarTodas() {
    const response =
      await api.get(
        "/evaluaciones"
      );

    return response.data;
  },

  /*
   * Administrador:
   * crea una evaluación.
   */
  async crear(payload) {
    const response =
      await api.post(
        "/evaluaciones",
        payload
      );

    return response.data;
  },

  /*
   * Administrador:
   * actualiza título, descripción y preguntas.
   */
  async actualizar(
    evaluacionId,
    payload
  ) {
    const response =
      await api.put(
        `/evaluaciones/${evaluacionId}`,
        payload
      );

    return response.data;
  },

  /*
   * Administrador:
   * obtiene evaluación con claves.
   */
  async obtenerPorVacanteAdmin(
    vacanteId
  ) {
    const response =
      await api.get(
        `/evaluaciones/admin/vacante/${vacanteId}`
      );

    return response.data;
  },

  /*
   * Administrador:
   * consulta si todavía puede editarla.
   */
  async esEditable(
    evaluacionId
  ) {
    const response =
      await api.get(
        `/evaluaciones/${evaluacionId}/editable`
      );

    return response.data === true;
  },

  /*
   * Postulante:
   * obtiene evaluación sin claves correctas.
   */
  async obtenerPorVacantePostulante(
    vacanteId
  ) {
    const response =
      await api.get(
        `/evaluaciones/vacante/${vacanteId}`
      );

    return response.data;
  },
};

export default evaluacionService;