package com.novarecruit.backend.controller;

import com.novarecruit.backend.dto.EvaluacionPostulanteResponse;
import com.novarecruit.backend.dto.EvaluacionRequest;
import com.novarecruit.backend.dto.EvaluacionResponse;
import com.novarecruit.backend.service.EvaluacionService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/evaluaciones")
@RequiredArgsConstructor
public class EvaluacionController {

    private static final Logger log =
            LoggerFactory.getLogger(EvaluacionController.class);

    private final EvaluacionService evaluacionService;

    /*
     * Lista administrativa completa.
     */
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @GetMapping
    public ResponseEntity<List<EvaluacionResponse>>
    listarEvaluaciones() {

        log.info(
                "[EVALUACION] Administrador solicita "
                        + "todas las evaluaciones del sistema"
        );

        return ResponseEntity.ok(
                evaluacionService.listarEvaluaciones()
        );
    }

    /*
     * Endpoint para postulantes.
     * Devuelve el examen sin respuestas correctas.
     */
    @PreAuthorize("hasRole('POSTULANTE')")
    @GetMapping("/vacante/{vacanteId}")
    public ResponseEntity<EvaluacionPostulanteResponse>
    listarParaPostulante(
            @PathVariable Long vacanteId,
            @AuthenticationPrincipal String correoPostulante) {

        log.info(
                "[EVALUACION] Postulante solicita examen seguro. "
                        + "correo={}, vacanteId={}",
                correoPostulante,
                vacanteId
        );

        return ResponseEntity.ok(
                evaluacionService
                        .listarPorVacantePostulante(vacanteId)
        );
    }

    /*
     * Endpoint para administradores.
     * Devuelve el examen incluyendo las respuestas correctas.
     */
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @GetMapping("/admin/vacante/{vacanteId}")
    public ResponseEntity<EvaluacionResponse>
    listarParaAdministrador(
            @PathVariable Long vacanteId,
            @AuthenticationPrincipal String correoAdministrador) {

        log.info(
                "[EVALUACION] Administrador solicita examen completo. "
                        + "correo={}, vacanteId={}",
                correoAdministrador,
                vacanteId
        );

        return ResponseEntity.ok(
                evaluacionService.listarPorVacanteAdmin(vacanteId)
        );
    }

    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public EvaluacionResponse crearEvaluacion(
            @RequestBody EvaluacionRequest request,
            @AuthenticationPrincipal String correoOperador) {

        log.info(
                "[EVALUACION] Registrando evaluación '{}' "
                        + "para vacanteId={} por {}",
                request.titulo(),
                request.vacanteId(),
                correoOperador
        );

        EvaluacionResponse response =
                evaluacionService.crearEvaluacion(
                        request.titulo(),
                        request.descripcion(),
                        request.vacanteId(),
                        request.preguntas(),
                        correoOperador
                );

        log.info(
                "[EVALUACION] Examen guardado en MySQL. "
                        + "evaluacionId={}, vacanteId={}",
                response.id(),
                response.vacanteId()
        );

        return response;
    }
}