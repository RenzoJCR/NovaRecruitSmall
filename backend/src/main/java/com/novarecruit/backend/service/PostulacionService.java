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

import java.util.HashMap;
import java.util.HashSet;
import java.util.Set;

import com.novarecruit.backend.dto.RespuestaEvaluacionRequest;
import com.novarecruit.backend.dto.RespuestaPostulanteResponse;
import com.novarecruit.backend.entity.RespuestaPostulante;
import com.novarecruit.backend.mapper.RespuestaPostulanteMapper;
import com.novarecruit.backend.repository.RespuestaPostulanteRepository;

@Service
public class PostulacionService {

    private static final Logger log =
            LoggerFactory.getLogger(PostulacionService.class);

    private static final int PUNTAJE_MAXIMO_EXAMEN = 20;

    private final PostulacionRepository postulacionRepository;
    private final VacanteRepository vacanteRepository;
    private final UsuarioRepository usuarioRepository;
    private final RespuestaPostulanteRepository
            respuestaPostulanteRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public PostulacionService(
            PostulacionRepository postulacionRepository,
            VacanteRepository vacanteRepository,
            UsuarioRepository usuarioRepository,
            RespuestaPostulanteRepository
                    respuestaPostulanteRepository,
            SimpMessagingTemplate messagingTemplate) {

        this.postulacionRepository =
                postulacionRepository;

        this.vacanteRepository =
                vacanteRepository;

        this.usuarioRepository =
                usuarioRepository;

        this.respuestaPostulanteRepository =
                respuestaPostulanteRepository;

        this.messagingTemplate =
                messagingTemplate;
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
     * Registra o corrige la decisión final
     * de una postulación.
     *
     * Estados permitidos como decisión:
     * - CONTRATADO
     * - RECHAZADO
     *
     * No elimina respuestas, puntajes,
     * evaluaciones ni datos históricos.
     */
    @Transactional
    public PostulacionResponse actualizarEstado(
            Long postulacionId,
            String nuevoEstado,
            String correoOperador
    ) {
        if (
                nuevoEstado == null
                        || nuevoEstado.isBlank()
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Debe indicar la decisión final"
            );
        }

        String estadoNormalizado =
                nuevoEstado
                        .trim()
                        .toUpperCase();

        if (
                !"CONTRATADO".equals(
                        estadoNormalizado
                )
                        && !"RECHAZADO".equals(
                        estadoNormalizado
                )
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La decisión debe ser CONTRATADO o RECHAZADO"
            );
        }

        Postulacion postulacion =
                postulacionRepository
                        .findById(postulacionId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Postulación no encontrada"
                                )
                        );

        String estadoAnterior =
                postulacion.getEstado() == null
                        ? ""
                        : postulacion
                        .getEstado()
                        .trim()
                        .toUpperCase();

        /*
         * Un postulante que todavía no rindió
         * su evaluación no puede recibir una
         * decisión final.
         */
        if (
                "POSTULADO".equals(
                        estadoAnterior
                )
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "El candidato debe completar la evaluación antes de registrar una decisión final"
            );
        }

        if (
                estadoAnterior.equals(
                        estadoNormalizado
                )
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "La postulación ya tiene registrada esa decisión"
            );
        }

        postulacion.setEstado(
                estadoNormalizado
        );

        postulacion.setComentariosInternos(
                "Decisión modificada de "
                        + estadoAnterior
                        + " a "
                        + estadoNormalizado
                        + " por: "
                        + correoOperador
        );

        Postulacion guardada =
                postulacionRepository.save(
                        postulacion
                );

        log.info(
                "[DB] Decisión final actualizada. "
                        + "postulacionId={}, estadoAnterior={}, "
                        + "estadoNuevo={}, operador={}",
                guardada.getId(),
                estadoAnterior,
                guardada.getEstado(),
                correoOperador
        );

        String canalPostulante =
                "/topic/user/notificaciones/"
                        + guardada
                        .getUsuario()
                        .getId();

        messagingTemplate.convertAndSend(
                canalPostulante,
                (Object) Map.of(
                        "tipo",
                        "ACTUALIZACION_ESTADO",

                        "mensaje",
                        "La decisión de tu postulación a la vacante '"
                                + guardada
                                .getVacante()
                                .getTitulo()
                                + "' fue actualizada a: "
                                + guardada
                                .getEstado()
                )
        );

        log.info(
                "[WS-SEND] Cambio de decisión notificado. "
                        + "canal={}, postulacionId={}, estado={}",
                canalPostulante,
                guardada.getId(),
                guardada.getEstado()
        );

        return PostulacionMapper.toResponse(
                guardada
        );
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
         * Esta consulta mantiene el bloqueo pesimista
         * implementado en el punto 2.4.
         */
        Postulacion postulacion =
                postulacionRepository
                        .findByIdAndUsuario_Correo(
                                postulacionId,
                                correoPostulante
                        )
                        .orElseThrow(() -> {

                            log.warn(
                                    "[SEGURIDAD] Intento de evaluar "
                                            + "una postulación ajena. "
                                            + "correo={}, postulacionId={}",
                                    correoPostulante,
                                    postulacionId
                            );

                            return new AccessDeniedException(
                                    "La postulación no pertenece "
                                            + "al usuario autenticado"
                            );
                        });

        boolean existenRespuestasNormalizadas =
                respuestaPostulanteRepository
                        .existsByPostulacion_Id(
                                postulacionId
                        );

        boolean yaFueEvaluada =
                existenRespuestasNormalizadas
                        || postulacion.getFechaEvaluacion() != null
                        || postulacion.getPuntajeTecnico() != null
                        || (
                        postulacion.getRespuestasPostulante() != null
                                && !postulacion
                                .getRespuestasPostulante()
                                .isBlank()
                )
                        || "EVALUADO".equalsIgnoreCase(
                        postulacion.getEstado()
                )
                        || "CONTRATADO".equalsIgnoreCase(
                        postulacion.getEstado()
                )
                        || "RECHAZADO".equalsIgnoreCase(
                        postulacion.getEstado()
                );

        if (yaFueEvaluada) {

            log.warn(
                    "[SEGURIDAD] Segundo envío rechazado. "
                            + "correo={}, postulacionId={}",
                    correoPostulante,
                    postulacionId
            );

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "La evaluación ya fue enviada "
                            + "y no puede modificarse"
            );
        }

        Evaluacion evaluacion =
                postulacion
                        .getVacante()
                        .getEvaluacion();

        if (evaluacion == null) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "La vacante no posee un examen configurado"
            );
        }

        List<Pregunta> preguntasOrdenadas =
                new ArrayList<>(
                        evaluacion.getPreguntas()
                );

        preguntasOrdenadas.sort(
                Comparator.comparing(Pregunta::getId)
        );

        if (preguntasOrdenadas.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "La evaluación no posee preguntas configuradas"
            );
        }

        if (
                request == null
                        || request.respuestas() == null
                        || request.respuestas().isEmpty()
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Debe responder todas las preguntas"
            );
        }

        Map<Long, String> respuestasPorPregunta =
                new HashMap<>();

        for (
                RespuestaEvaluacionRequest respuesta
                : request.respuestas()
        ) {

            if (
                    respuesta == null
                            || respuesta.preguntaId() == null
                            || respuesta.respuesta() == null
                            || respuesta.respuesta().isBlank()
            ) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Todas las respuestas deben ser válidas"
                );
            }

            String respuestaNormalizada =
                    respuesta
                            .respuesta()
                            .trim()
                            .toUpperCase();

            String anterior =
                    respuestasPorPregunta.putIfAbsent(
                            respuesta.preguntaId(),
                            respuestaNormalizada
                    );

            if (anterior != null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Una pregunta fue respondida más de una vez"
                );
            }
        }

        Set<Long> preguntasEsperadas =
                new HashSet<>();

        for (Pregunta pregunta : preguntasOrdenadas) {
            preguntasEsperadas.add(
                    pregunta.getId()
            );
        }

        if (!respuestasPorPregunta
                .keySet()
                .equals(preguntasEsperadas)) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Debe responder todas las preguntas "
                            + "de la evaluación"
            );
        }

        int puntajeBase =
                PUNTAJE_MAXIMO_EXAMEN
                        / preguntasOrdenadas.size();

        int puntosRestantes =
                PUNTAJE_MAXIMO_EXAMEN
                        % preguntasOrdenadas.size();

        int puntajeTotal = 0;

        List<RespuestaPostulante> respuestasGuardar =
                new ArrayList<>();

        for (
                int indice = 0;
                indice < preguntasOrdenadas.size();
                indice++
        ) {

            Pregunta pregunta =
                    preguntasOrdenadas.get(indice);

            String respuestaSeleccionada =
                    respuestasPorPregunta.get(
                            pregunta.getId()
                    );

            validarAlternativa(
                    pregunta,
                    respuestaSeleccionada
            );

            int puntajeAsignado =
                    puntajeBase
                            + (
                            indice < puntosRestantes
                                    ? 1
                                    : 0
                    );

            boolean correcta =
                    pregunta.getRespuestaCorrecta() != null
                            && pregunta
                            .getRespuestaCorrecta()
                            .trim()
                            .equalsIgnoreCase(
                                    respuestaSeleccionada
                            );

            int puntajeObtenido =
                    correcta
                            ? puntajeAsignado
                            : 0;

            puntajeTotal += puntajeObtenido;

            RespuestaPostulante respuesta =
                    new RespuestaPostulante();

            respuesta.setPostulacion(postulacion);
            respuesta.setPregunta(pregunta);

            respuesta.setRespuestaSeleccionada(
                    respuestaSeleccionada
            );

            respuesta.setCorrecta(correcta);

            respuesta.setPuntajeAsignado(
                    puntajeAsignado
            );

            respuesta.setPuntajeObtenido(
                    puntajeObtenido
            );

            respuestasGuardar.add(respuesta);
        }

        /*
         * Se guarda una fila por pregunta.
         */
        respuestaPostulanteRepository.saveAll(
                respuestasGuardar
        );

        /*
         * La antigua columna permanece temporalmente,
         * pero las nuevas evaluaciones ya no guardan JSON.
         */
        postulacion.setRespuestasPostulante(null);
        postulacion.setPuntajeTecnico(puntajeTotal);
        postulacion.setEstado("EVALUADO");
        postulacion.setFechaEvaluacion(
                LocalDateTime.now()
        );

        Postulacion guardada =
                postulacionRepository.save(postulacion);

        log.info(
                "[DB] Evaluación normalizada guardada. "
                        + "postulacionId={}, respuestas={}, "
                        + "puntaje={}/20",
                guardada.getId(),
                respuestasGuardar.size(),
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
                                + " completó la evaluación de '"
                                + guardada
                                .getVacante()
                                .getTitulo()
                                + "' con "
                                + puntajeTotal
                                + " / 20"
                )
        );

        String canalPostulante =
                "/topic/user/notificaciones/"
                        + guardada
                        .getUsuario()
                        .getId();

        messagingTemplate.convertAndSend(
                canalPostulante,
                (Object) Map.of(
                        "tipo",
                        "EVALUACION_CALIFICADA",

                        "mensaje",
                        "Tu evaluación de la vacante '"
                                + guardada
                                .getVacante()
                                .getTitulo()
                                + "' fue calificada con "
                                + puntajeTotal
                                + " / 20"
                )
        );

        log.info(
                "[WS-SEND] Evaluación notificada. "
                        + "postulacionId={}, puntaje={}",
                guardada.getId(),
                puntajeTotal
        );

        return PostulacionMapper.toResponse(
                guardada
        );
    }


    @Transactional(readOnly = true)
    public List<RespuestaPostulanteResponse>
    listarRespuestasAdmin(
            Long postulacionId) {

        postulacionRepository
                .findById(postulacionId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Postulación no encontrada"
                        )
                );

        List<RespuestaPostulante> respuestas =
                respuestaPostulanteRepository
                        .findByPostulacion_IdOrderByPregunta_IdAsc(
                                postulacionId
                        );

        List<RespuestaPostulanteResponse> resultado =
                new ArrayList<>();

        for (
                int indice = 0;
                indice < respuestas.size();
                indice++
        ) {
            resultado.add(
                    RespuestaPostulanteMapper.toResponse(
                            respuestas.get(indice),
                            indice + 1
                    )
            );
        }

        return resultado;
    }

    private void validarAlternativa(
            Pregunta pregunta,
            String respuesta) {

        boolean verdaderoFalso =
                "VERDADERO_FALSO".equalsIgnoreCase(
                        pregunta.getTipoPregunta()
                );

        boolean valida =
                verdaderoFalso
                        ? "A".equals(respuesta)
                        || "B".equals(respuesta)
                        : "A".equals(respuesta)
                        || "B".equals(respuesta)
                        || "C".equals(respuesta)
                        || "D".equals(respuesta);

        if (!valida) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La respuesta de la pregunta "
                            + pregunta.getId()
                            + " no es válida"
            );
        }
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