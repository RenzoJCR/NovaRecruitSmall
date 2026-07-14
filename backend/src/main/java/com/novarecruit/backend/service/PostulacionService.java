package com.novarecruit.backend.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
import com.novarecruit.backend.repository.VacanteRepository; // WebSocket para notificaciones en tiempo real 

@Service
public class PostulacionService {

    private static final Logger log = LoggerFactory.getLogger(PostulacionService.class);
    private static final int PUNTAJE_MAXIMO_EXAMEN = 20;

    private final PostulacionRepository postulacionRepository;
    private final VacanteRepository vacanteRepository;
    private final UsuarioRepository usuarioRepository;
    private final ObjectMapper objectMapper; // Proveído nativamente por spring-boot-starter-web
    private final SimpMessagingTemplate messagingTemplate; // Inyección de dependencia para WebSocket

    public PostulacionService(PostulacionRepository postulacionRepository, VacanteRepository vacanteRepository, 
                              UsuarioRepository usuarioRepository, ObjectMapper objectMapper, SimpMessagingTemplate messagingTemplate) {
        this.postulacionRepository = postulacionRepository;
        this.vacanteRepository = vacanteRepository;
        this.usuarioRepository = usuarioRepository;
        this.objectMapper = objectMapper;
        this.messagingTemplate = messagingTemplate;
    }

    @Transactional
    public PostulacionResponse registrarPostulacion(PostulacionRequest request, String correoPostulante) {
        Usuario usuario = usuarioRepository.findByCorreo(correoPostulante)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        PostulacionResponse respuesta = registrarPostulacion(request.vacanteId(), usuario.getId());

        String canalAdmin = "/topic/admin/notificaciones";
        messagingTemplate.convertAndSend(canalAdmin, (Object) Map.of(
                "tipo", "NUEVA_POSTULACION",
                "mensaje", "El candidato " + usuario.getNombres()
                        + " ha postulado a la vacante ID: " + request.vacanteId()
        ));

        log.info("[WS-SEND] Evento NUEVA_POSTULACION enviado: canal={}, postulacionId={}, userId={}, vacanteId={}",
                canalAdmin, respuesta.id(), usuario.getId(), request.vacanteId());

        return respuesta;

    }

    @Transactional
    public PostulacionResponse registrarPostulacion(Long vacanteId, Long usuarioId) {
        if (postulacionRepository.existsByUsuarioIdAndVacanteId(usuarioId, vacanteId)) {
            throw new RuntimeException("Ya cuentas con una postulación en curso para esta vacante");
        }

        Vacante vacante = vacanteRepository.findById(vacanteId).orElseThrow(() -> new RuntimeException("Vacante no encontrada"));
        Usuario usuario = usuarioRepository.findById(usuarioId).orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        Postulacion postulacion = new Postulacion();
        postulacion.setUsuario(usuario);
        postulacion.setVacante(vacante);

        return PostulacionMapper.toResponse(postulacionRepository.save(postulacion));
    }

    @Transactional(readOnly = true)
    public List<PostulacionResponse> listarPorPostulante(String correoPostulante) {
        Usuario usuario = usuarioRepository.findByCorreo(correoPostulante)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        return postulacionRepository.findByUsuarioId(usuario.getId())
                .stream()
                .map(PostulacionMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PostulacionResponse> listarTodas() {
        return postulacionRepository.findAll()
                .stream()
                .map(PostulacionMapper::toResponse)
                .toList();
    }

    @Transactional
    public PostulacionResponse actualizarEstado(Long postulacionId, String nuevoEstado, String correoOperador) {
        Postulacion postulacion = postulacionRepository.findById(postulacionId)
                .orElseThrow(() -> new RuntimeException("Postulación no encontrada"));

        postulacion.setEstado(nuevoEstado.toUpperCase().trim());
        postulacion.setComentariosInternos("Última actualización de estado por: " + correoOperador);

        Postulacion guardada = postulacionRepository.save(postulacion);

        String canalPostulante = "/topic/user/notificaciones/" + guardada.getUsuario().getId();
        messagingTemplate.convertAndSend(canalPostulante, (Object) Map.of(
                "tipo", "ACTUALIZACION_ESTADO",
                "mensaje", "Tu postulación a la vacante '" + guardada.getVacante().getTitulo()
                        + "' ha sido actualizada a: " + guardada.getEstado()
        ));

        log.info("[WS-SEND] Evento ACTUALIZACION_ESTADO enviado: canal={}, postulacionId={}, estado={}",
                canalPostulante, guardada.getId(), guardada.getEstado());

        return PostulacionMapper.toResponse(guardada);
    }

    @Transactional
    public PostulacionResponse calificarEvaluacion(Long postulacionId, EvaluarRequest request) {
        Postulacion postulacion = postulacionRepository.findById(postulacionId)
                .orElseThrow(() -> new RuntimeException("Postulación no encontrada"));

        Evaluacion evaluacion = postulacion.getVacante().getEvaluacion();
        if (evaluacion == null) {
            throw new RuntimeException("La vacante no posee un examen configurado");
        }

        List<Pregunta> preguntasOrdenadas = new ArrayList<>(evaluacion.getPreguntas());
        preguntasOrdenadas.sort(Comparator.comparing(Pregunta::getId));

        if (preguntasOrdenadas.isEmpty()) {
            throw new RuntimeException("La vacante no posee preguntas configuradas");
        }

        int puntajeTotal = 0;
        int puntajeBase = PUNTAJE_MAXIMO_EXAMEN / preguntasOrdenadas.size();
        int puntosRestantes = PUNTAJE_MAXIMO_EXAMEN % preguntasOrdenadas.size();

        try {
            // Parsea el JSON String plano enviado por React (ej: {"1":"A","2":"C"})
            JsonNode respuestasJson = objectMapper.readTree(request.respuestasPostulante());
            
            // Evaluamos cada pregunta oficial contra el mapa del alumno
            for (int indice = 0; indice < preguntasOrdenadas.size(); indice++) {
                Pregunta pregunta = preguntasOrdenadas.get(indice);
                int puntajePregunta = puntajeBase + (indice < puntosRestantes ? 1 : 0);
                String idPreguntaStr = String.valueOf(pregunta.getId());
                if (respuestasJson.has(idPreguntaStr)) {
                    String respuestaAlumno = respuestasJson.get(idPreguntaStr).asText();
                    if (pregunta.getRespuestaCorrecta().equalsIgnoreCase(respuestaAlumno)) {
                        puntajeTotal += puntajePregunta; // Reparto automático sobre 20 puntos exactos
                    }
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Error al procesar la sintaxis del examen técnico");
        }

        // Actualizamos el estado transaccional y fijamos ejes de métricas temporales
        postulacion.setRespuestasPostulante(request.respuestasPostulante());
        postulacion.setPuntajeTecnico(puntajeTotal);
        postulacion.setEstado("EVALUADO");
        postulacion.setFechaEvaluacion(LocalDateTime.now());

        Postulacion guardada = postulacionRepository.save(postulacion);

        String canalAdmin = "/topic/admin/notificaciones";
        messagingTemplate.convertAndSend(canalAdmin, (Object) Map.of(
                "tipo", "EVALUACION_CALIFICADA",
                "mensaje", "El candidato " + guardada.getUsuario().getNombres()
                        + " ha completado la evaluación técnica de la vacante '"
                        + guardada.getVacante().getTitulo() + "' con un puntaje de: " + puntajeTotal
        ));

        String canalPostulante = "/topic/user/notificaciones/" + guardada.getUsuario().getId();
        messagingTemplate.convertAndSend(canalPostulante, (Object) Map.of(
                "tipo", "EVALUACION_CALIFICADA",
                "mensaje", "Tu evaluación técnica de la vacante '"
                        + guardada.getVacante().getTitulo() + "' fue calificada con: "
                        + puntajeTotal + " / 20"
        ));

        log.info("[WS-SEND] Evento EVALUACION_CALIFICADA enviado: postulacionId={}, puntaje={}, canales=[{}, {}]",
                guardada.getId(), puntajeTotal, canalAdmin, canalPostulante);

        return PostulacionMapper.toResponse(guardada);
    }

    // ACCESOS EXPUESTOS PARA LAS GRÁFICAS DE SERIES DE TIEMPO
    @Transactional(readOnly = true)
    public List<Map<String, Object>> obtenerDatosMétricaAtracción() {
        return postulacionRepository.obtenerMetricaAtraccionTiempo();
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> obtenerDatosMétricaRendimiento() {
        return postulacionRepository.obtenerMetricaRendimientoTiempo();
    }
}