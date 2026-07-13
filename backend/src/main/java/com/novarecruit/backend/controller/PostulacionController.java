package com.novarecruit.backend.controller;

import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.novarecruit.backend.dto.PostulacionRequest;
import com.novarecruit.backend.dto.PostulacionResponse;
import com.novarecruit.backend.service.PostulacionService;

@RestController
@RequestMapping("/api/postulaciones")
public class PostulacionController {

    private static final Logger log = LoggerFactory.getLogger(PostulacionController.class);
    private final PostulacionService postulacionService;

    public PostulacionController(PostulacionService postulacionService) {
        this.postulacionService = postulacionService;
    }

    // 1. PRIVADO (POSTULANTE): Enviar una postulación formal hacia una vacante
    @PreAuthorize("hasRole('POSTULANTE')")
    @PostMapping
    public ResponseEntity<PostulacionResponse> registrarPostulacion(
            @RequestBody PostulacionRequest request,
            @AuthenticationPrincipal String correoPostulante) {
        log.info("Candidato: {} postula a la vacante ID: {}", correoPostulante, request.vacanteId());
        
        PostulacionResponse response = postulacionService.registrarPostulacion(request, correoPostulante);
        
        log.info("Registro de aplicación completado con ID: {} - Estado: PENDIENTE", response.id());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // 2. PRIVADO (POSTULANTE): Ver historial propio del candidato logueado
    @PreAuthorize("hasRole('POSTULANTE')")
    @GetMapping("/mis-postulaciones")
    public ResponseEntity<List<PostulacionResponse>> listarMisPostulaciones(@AuthenticationPrincipal String correoPostulante) {
        log.info("Candidato: {} consulta el historial de su pipeline de selección.", correoPostulante);
        return ResponseEntity.ok(postulacionService.listarPorPostulante(correoPostulante));
    }

    // 3. PRIVADO (ADMIN): Listar el global de candidatos para control de RRHH
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @GetMapping
    public ResponseEntity<List<PostulacionResponse>> listarTodas() {
        log.info("Administrador solicita el consolidado nacional de postulaciones del sistema.");
        return ResponseEntity.ok(postulacionService.listarTodas());
    }

    // 4. PRIVADO (ADMIN): Cambiar estado del postulante (Aprobar, Rechazar, Contratado)
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @PatchMapping("/{id}/estado")
    public ResponseEntity<PostulacionResponse> actualizarEstado(
            @PathVariable Long id,
            @RequestParam String nuevoEstado,
            @AuthenticationPrincipal String correoOperador) {
        log.info("Administrador: {} actualiza pipeline de postulación ID: {} al estado: {}", correoOperador, id, nuevoEstado);
        
        PostulacionResponse response = postulacionService.actualizarEstado(id, nuevoEstado, correoOperador);
        return ResponseEntity.ok(response);
    }

    // 5. PRIVADO (POSTULANTE): Enviar y autocalificar el examen técnico en tiempo real
    @PreAuthorize("hasRole('POSTULANTE')")
    @PostMapping("/{id}/evaluar")
    public ResponseEntity<PostulacionResponse> calificarExamen(
            @PathVariable Long id,
            @RequestBody com.novarecruit.backend.dto.EvaluarRequest request) {
        log.info("Postulante envía respuestas para evaluación en postulación ID: {}", id);
        
        PostulacionResponse response = postulacionService.calificarEvaluacion(id, request);
        
        log.info("Evaluación procesada en MySQL. Nota final calculada: {}/20. Estado actualizado a: EVALUADO", response.puntajeTecnico());
        return ResponseEntity.ok(response);
    }

    // 6. PRIVADO (ADMIN): Serie temporal de cantidad de postulaciones por fecha
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @GetMapping("/metrica-atraccion")
    public ResponseEntity<List<Map<String, Object>>> obtenerMetricaAtraccion() {
        log.info("Administrador consulta la métrica temporal de atracción.");
        return ResponseEntity.ok(postulacionService.obtenerDatosMétricaAtracción());
    }

    // 7. PRIVADO (ADMIN): Serie temporal de promedio de puntajes técnicos por fecha
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @GetMapping("/metrica-rendimiento")
    public ResponseEntity<List<Map<String, Object>>> obtenerMetricaRendimiento() {
        log.info("Administrador consulta la métrica temporal de rendimiento técnico.");
        return ResponseEntity.ok(postulacionService.obtenerDatosMétricaRendimiento());
    }
}