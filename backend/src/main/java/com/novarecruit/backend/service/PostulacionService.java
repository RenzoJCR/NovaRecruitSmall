package com.novarecruit.backend.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.novarecruit.backend.dto.EvaluarRequest;
import com.novarecruit.backend.dto.PostulacionRequest;
import com.novarecruit.backend.dto.PostulacionResponse;
import com.novarecruit.backend.entity.Evaluacion;
import com.novarecruit.backend.entity.Postulacion;
import com.novarecruit.backend.entity.Pregunta;
import com.novarecruit.backend.entity.Usuario;
import com.novarecruit.backend.entity.Vacante;
import com.novarecruit.backend.mapper.PostulacionMapper;
import com.novarecruit.backend.repository.PostulacionRepository;
import com.novarecruit.backend.repository.UsuarioRepository;
import com.novarecruit.backend.repository.VacanteRepository;

@Service
public class PostulacionService {

    private static final Logger log =
            LoggerFactory.getLogger(PostulacionService.class);

    private static final int PUNTAJE_MAXIMO_EXAMEN = 20;

    private final PostulacionRepository postulacionRepository;
    private final VacanteRepository vacanteRepository;
    private final UsuarioRepository usuarioRepository;
    private final ObjectMapper objectMapper;
    private final SimpMessagingTemplate messagingTemplate;

    public PostulacionService(
            PostulacionRepository postulacionRepository,
            VacanteRepository vacanteRepository,
            UsuarioRepository usuarioRepository,
            ObjectMapper objectMapper,
            SimpMessagingTemplate messagingTemplate) {

        this.postulacionRepository = postulacionRepository;
        this.vacanteRepository = vacanteRepository;
        this.usuarioRepository = usuarioRepository;
        this.objectMapper = objectMapper;
        this.messagingTemplate = messagingTemplate;
    }

    /*
     * Método utilizado por PostulacionController.
     *
     * Recibe el DTO enviado desde React y el correo obtenido
     * del usuario autenticado mediante JWT.
     */
    @Transactional
    public PostulacionResponse registrarPostulacion(
            PostulacionRequest request,
            String correoPostulante) {

        Usuario usuario = usuarioRepository
                .findByCorreo(correoPostulante)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "El usuario autenticado no fue encontrado"
                ));

        log.info(
                "[POSTULACION] Solicitud recibida. "
                        + "correo={}, usuarioId={}, vacanteId={}",
                correoPostulante,
                usuario.getId(),
                request.vacanteId()
        );

        /*
         * Se delega el registro al método que valida:
         * - Que la vacante exista.
         * - Que la vacante esté ACTIVA.
         * - Que el postulante no haya postulado previamente.
         */
        PostulacionResponse response = registrarPostulacion(
                request.vacanteId(),
                usuario.getId()
        );

        /*
         * La notificación se envía solamente después
         * de guardar correctamente la postulación.
         */
        String canalAdmin = "/topic/admin/notificaciones";

        messagingTemplate.convertAndSend(
                canalAdmin,
                (Object) Map.of(
                        "tipo",
                        "NUEVA_POSTULACION",

                        "mensaje",
                        "El candidato "
                                + usuario.getNombres()
                                + " ha postulado a la vacante ID: "
                                + request.vacanteId()
                )
        );

        log.info(
                "[WS-SEND] Evento NUEVA_POSTULACION enviado. "
                        + "canal={}, postulacionId={}, "
                        + "usuarioId={}, vacanteId={}",
                canalAdmin,
                response.id(),
                usuario.getId(),
                request.vacanteId()
        );

        return response;
    }

    /*
     * Método interno encargado de validar la vacante
     * y guardar la postulación en MySQL.
     */
    @Transactional
    public PostulacionResponse registrarPostulacion(
            Long vacanteId,
            Long usuarioId) {

        log.info(
                "[POSTULACION] Validando vacante antes de registrar. "
                        + "vacanteId={}, usuarioId={}",
                vacanteId,
                usuarioId
        );

        Vacante vacante = vacanteRepository
                .findById(vacanteId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "La vacante solicitada no existe"
                ));

        String estadoVacante = vacante.getEstado() == null
                ? ""
                : vacante.getEstado().trim();

        /*
         * Esta validación se ejecuta en el backend.
         * Aunque alguien modifique React o utilice Postman,
         * no podrá postular a una vacante cerrada.
         */
        if (!"ACTIVA".equalsIgnoreCase(estadoVacante)) {

            log.warn(
                    "[SEGURIDAD] Intento de postular a vacante no activa. "
                            + "usuarioId={}, vacanteId={}, estado={}",
                    usuarioId,
                    vacanteId,
                    estadoVacante
            );

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "No se puede postular porque la vacante no está activa"
            );
        }

        if (postulacionRepository.existsByUsuarioIdAndVacanteId(
                usuarioId,
                vacanteId)) {

            log.warn(
                    "[POSTULACION] Postulación duplicada rechazada. "
                            + "usuarioId={}, vacanteId={}",
                    usuarioId,
                    vacanteId
            );

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Ya cuentas con una postulación para esta vacante"
            );
        }

        Usuario usuario = usuarioRepository
                .findById(usuarioId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "El usuario autenticado no fue encontrado"
                ));

        Postulacion postulacion = new Postulacion();
        postulacion.setUsuario(usuario);
        postulacion.setVacante(vacante);

        Postulacion guardada =
                postulacionRepository.save(postulacion);

        log.info(
                "[DB] Postulación guardada en MySQL. "
                        + "postulacionId={}, usuarioId={}, "
                        + "vacanteId={}, estado={}",
                guardada.getId(),
                usuarioId,
                vacanteId,
                guardada.getEstado()
        );

        return PostulacionMapper.toResponse(guardada);
    }

    /*
     * Historial de postulaciones del usuario autenticado.
     */
    @Transactional(readOnly = true)
    public List<PostulacionResponse> listarPorPostulante(
            String correoPostulante) {

        Usuario usuario = usuarioRepository
                .findByCorreo(correoPostulante)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Usuario no encontrado"
                ));

        log.info(
                "[POSTULACION] Consultando historial. "
                        + "correo={}, usuarioId={}",
                correoPostulante,
                usuario.getId()
        );

        return postulacionRepository
                .findByUsuarioId(usuario.getId())
                .stream()
                .map(PostulacionMapper::toResponse)
                .toList();
    }

    /*
     * Listado administrativo de todas las postulaciones.
     */
    @Transactional(readOnly = true)
    public List<PostulacionResponse> listarTodas() {

        log.info(
                "[POSTULACION] Consultando todas "
                        + "las postulaciones del sistema"
        );

        return postulacionRepository
                .findAll()
                .stream()
                .map(PostulacionMapper::toResponse)
                .toList();
    }

    /*
     * Cambio de estado realizado por un administrador.
     */
    @Transactional
    public PostulacionResponse actualizarEstado(
            Long postulacionId,
            String nuevoEstado,
            String correoOperador) {

        Postulacion postulacion = postulacionRepository
                .findById(postulacionId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Postulación no encontrada"
                ));

        String estadoAnterior = postulacion.getEstado();
        String estadoNormalizado = nuevoEstado.toUpperCase().trim();

        postulacion.setEstado(estadoNormalizado);
        postulacion.setComentariosInternos(
                "Última actualización de estado por: "
                        + correoOperador
        );

        Postulacion guardada =
                postulacionRepository.save(postulacion);

        log.info(
                "[DB] Estado de postulación actualizado en MySQL. "
                        + "postulacionId={}, estadoAnterior={}, "
                        + "estadoNuevo={}, operador={}",
                guardada.getId(),
                estadoAnterior,
                guardada.getEstado(),
                correoOperador
        );

        String canalPostulante =
                "/topic/user/notificaciones/"
                        + guardada.getUsuario().getId();

        messagingTemplate.convertAndSend(
                canalPostulante,
                (Object) Map.of(
                        "tipo",
                        "ACTUALIZACION_ESTADO",

                        "mensaje",
                        "Tu postulación a la vacante '"
                                + guardada.getVacante().getTitulo()
                                + "' ha sido actualizada a: "
                                + guardada.getEstado()
                )
        );

        log.info(
                "[WS-SEND] Evento ACTUALIZACION_ESTADO enviado. "
                        + "canal={}, postulacionId={}, estado={}",
                canalPostulante,
                guardada.getId(),
                guardada.getEstado()
        );

        return PostulacionMapper.toResponse(guardada);
    }

    /*
     * Calificación automática del examen.
     *
     * La consulta exige que el ID de la postulación
     * pertenezca al correo autenticado.
     */
    @Transactional
    public PostulacionResponse calificarEvaluacion(
            Long postulacionId,
            EvaluarRequest request,
            String correoPostulante) {

        /*
         * La consulta valida propiedad y bloquea temporalmente
         * la postulación durante la calificación.
         */
        Postulacion postulacion = postulacionRepository
                .findByIdAndUsuario_Correo(
                        postulacionId,
                        correoPostulante
                )
                .orElseThrow(() -> {

                    log.warn(
                            "[SEGURIDAD] Intento de evaluar una "
                                    + "postulación ajena o inexistente. "
                                    + "correo={}, postulacionId={}",
                            correoPostulante,
                            postulacionId
                    );

                    return new AccessDeniedException(
                            "La postulación no pertenece "
                                    + "al usuario autenticado"
                    );
                });

        log.info(
                "[EVALUACION] Propiedad de postulación validada. "
                        + "correo={}, postulacionId={}, vacanteId={}",
                correoPostulante,
                postulacion.getId(),
                postulacion.getVacante().getId()
        );

        /*
         * Una evaluación se considera enviada si existe cualquiera
         * de estos indicadores.
         *
         * Esto también protege registros antiguos que pudieran
         * tener uno de los campos incompletos.
         */
        boolean yaFueEvaluada =
                postulacion.getFechaEvaluacion() != null
                        || postulacion.getPuntajeTecnico() != null
                        || (
                        postulacion.getRespuestasPostulante() != null
                                && !postulacion
                                .getRespuestasPostulante()
                                .isBlank()
                )
                        || "EVALUADO".equalsIgnoreCase(
                        postulacion.getEstado()
                );

        if (yaFueEvaluada) {

            log.warn(
                    "[SEGURIDAD] Segundo envío de evaluación rechazado. "
                            + "correo={}, postulacionId={}, estado={}, "
                            + "fechaEvaluacion={}, puntaje={}",
                    correoPostulante,
                    postulacionId,
                    postulacion.getEstado(),
                    postulacion.getFechaEvaluacion(),
                    postulacion.getPuntajeTecnico()
            );

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "La evaluación ya fue enviada "
                            + "y no puede volver a modificarse"
            );
        }

        Evaluacion evaluacion =
                postulacion.getVacante().getEvaluacion();

        if (evaluacion == null) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "La vacante no posee un examen configurado"
            );
        }

        List<Pregunta> preguntasOrdenadas =
                new ArrayList<>(evaluacion.getPreguntas());

        preguntasOrdenadas.sort(
                Comparator.comparing(Pregunta::getId)
        );

        if (preguntasOrdenadas.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "La evaluación no posee preguntas configuradas"
            );
        }

        if (request == null
                || request.respuestasPostulante() == null
                || request.respuestasPostulante().isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Debe enviar las respuestas de la evaluación"
            );
        }

        int puntajeTotal = 0;

        int puntajeBase =
                PUNTAJE_MAXIMO_EXAMEN
                        / preguntasOrdenadas.size();

        int puntosRestantes =
                PUNTAJE_MAXIMO_EXAMEN
                        % preguntasOrdenadas.size();

        try {
            JsonNode respuestasJson =
                    objectMapper.readTree(
                            request.respuestasPostulante()
                    );

            if (!respuestasJson.isObject()) {
                throw new IllegalArgumentException(
                        "Las respuestas deben tener formato de objeto JSON"
                );
            }

            log.info(
                    "[EVALUACION] Procesando respuestas. "
                            + "postulacionId={}, evaluacionId={}, "
                            + "preguntas={}",
                    postulacionId,
                    evaluacion.getId(),
                    preguntasOrdenadas.size()
            );

            for (int indice = 0;
                 indice < preguntasOrdenadas.size();
                 indice++) {

                Pregunta pregunta =
                        preguntasOrdenadas.get(indice);

                int puntajePregunta =
                        puntajeBase
                                + (
                                indice < puntosRestantes
                                        ? 1
                                        : 0
                        );

                String idPregunta =
                        String.valueOf(pregunta.getId());

                if (!respuestasJson.has(idPregunta)) {
                    continue;
                }

                String respuestaPostulante =
                        respuestasJson
                                .get(idPregunta)
                                .asText()
                                .trim();

                if (
                        pregunta.getRespuestaCorrecta() != null
                                && pregunta
                                .getRespuestaCorrecta()
                                .equalsIgnoreCase(
                                        respuestaPostulante
                                )
                ) {
                    puntajeTotal += puntajePregunta;
                }
            }

        } catch (ResponseStatusException exception) {
            throw exception;

        } catch (Exception exception) {

            log.warn(
                    "[EVALUACION] Formato inválido de respuestas. "
                            + "correo={}, postulacionId={}, error={}",
                    correoPostulante,
                    postulacionId,
                    exception.getMessage()
            );

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El formato de las respuestas "
                            + "del examen no es válido"
            );
        }

        postulacion.setRespuestasPostulante(
                request.respuestasPostulante()
        );

        postulacion.setPuntajeTecnico(puntajeTotal);
        postulacion.setEstado("EVALUADO");
        postulacion.setFechaEvaluacion(LocalDateTime.now());

        Postulacion guardada =
                postulacionRepository.save(postulacion);

        log.info(
                "[DB] Resultado de evaluación guardado en MySQL. "
                        + "postulacionId={}, usuarioId={}, puntaje={}/20",
                guardada.getId(),
                guardada.getUsuario().getId(),
                puntajeTotal
        );

        String canalAdmin =
                "/topic/admin/notificaciones";

        messagingTemplate.convertAndSend(
                canalAdmin,
                (Object) Map.of(
                        "tipo",
                        "EVALUACION_CALIFICADA",

                        "mensaje",
                        "El candidato "
                                + guardada
                                .getUsuario()
                                .getNombres()
                                + " ha completado la evaluación técnica "
                                + "de la vacante '"
                                + guardada
                                .getVacante()
                                .getTitulo()
                                + "' con un puntaje de: "
                                + puntajeTotal
                )
        );

        String canalPostulante =
                "/topic/user/notificaciones/"
                        + guardada.getUsuario().getId();

        messagingTemplate.convertAndSend(
                canalPostulante,
                (Object) Map.of(
                        "tipo",
                        "EVALUACION_CALIFICADA",

                        "mensaje",
                        "Tu evaluación técnica de la vacante '"
                                + guardada
                                .getVacante()
                                .getTitulo()
                                + "' fue calificada con: "
                                + puntajeTotal
                                + " / 20"
                )
        );

        log.info(
                "[WS-SEND] Evento EVALUACION_CALIFICADA enviado. "
                        + "postulacionId={}, puntaje={}, "
                        + "canales=[{}, {}]",
                guardada.getId(),
                puntajeTotal,
                canalAdmin,
                canalPostulante
        );

        return PostulacionMapper.toResponse(guardada);
    }

    /*
     * Datos utilizados por las gráficas actuales.
     * Más adelante se reemplazarán por consultas mensuales.
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>>
    obtenerDatosMétricaAtracción() {

        return postulacionRepository
                .obtenerMetricaAtraccionTiempo();
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>>
    obtenerDatosMétricaRendimiento() {

        return postulacionRepository
                .obtenerMetricaRendimientoTiempo();
    }
}