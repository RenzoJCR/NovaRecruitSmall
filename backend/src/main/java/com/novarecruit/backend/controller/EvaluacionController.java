package com.novarecruit.backend.controller;

import com.novarecruit.backend.dto.EvaluacionRequest;
import com.novarecruit.backend.dto.EvaluacionResponse;
import com.novarecruit.backend.service.EvaluacionService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

@RestController
@RequestMapping("/api/evaluaciones")
@RequiredArgsConstructor
public class EvaluacionController {

    private static final Logger log = LoggerFactory.getLogger(EvaluacionController.class);
    private final EvaluacionService evaluacionService;

    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @GetMapping
    public ResponseEntity<List<EvaluacionResponse>> listarEvaluaciones() {

        log.info("Listando todas las evaluaciones del sistema.");
        return ResponseEntity.ok(evaluacionService.listarEvaluaciones());
    }

    @PreAuthorize("hasAnyRole('ADMINISTRADOR','POSTULANTE')")
    @GetMapping("/vacante/{vacanteId}")
    public ResponseEntity<EvaluacionResponse> listarPorVacante(@PathVariable Long vacanteId) {

        log.info("Buscando exámenes enlazados a la vacante con ID: {}", vacanteId);
        return ResponseEntity.ok(evaluacionService.listarPorVacante(vacanteId));
    }

    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public EvaluacionResponse crearEvaluacion(
            @RequestBody EvaluacionRequest request,
            @AuthenticationPrincipal String correoOperador) {

        log.info("Registrando nueva evaluación: '{}' para la vacante ID: {} bajo la auditoría del líder técnico ID: {}", 
                request.titulo(), request.vacanteId(), correoOperador);
        
        EvaluacionResponse response = evaluacionService.crearEvaluacion(
                request.titulo(),
                request.descripcion(),
                request.vacanteId(),
                request.preguntas(),
                correoOperador);
        
        log.info("Examen guardado con éxito en MySQL. ID asignado: {}", response.id());
        return response;
    }
}