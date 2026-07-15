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

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/evaluaciones")
@RequiredArgsConstructor
public class EvaluacionController {

    private static final Logger log =
            LoggerFactory.getLogger(
                    EvaluacionController.class
            );

    private final EvaluacionService evaluacionService;

    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @GetMapping
    public ResponseEntity<List<EvaluacionResponse>>
    listarEvaluaciones() {

        return ResponseEntity.ok(
                evaluacionService
                        .listarEvaluaciones()
        );
    }

    /*
     * Postulante:
     * examen sin claves correctas.
     */
    @PreAuthorize("hasRole('POSTULANTE')")
    @GetMapping("/vacante/{vacanteId}")
    public ResponseEntity<EvaluacionPostulanteResponse>
    listarParaPostulante(
            @PathVariable Long vacanteId,
            @AuthenticationPrincipal
            String correoPostulante
    ) {
        log.info(
                "[EVALUACION] Postulante solicita examen. "
                        + "correo={}, vacanteId={}",
                correoPostulante,
                vacanteId
        );

        return ResponseEntity.ok(
                evaluacionService
                        .listarPorVacantePostulante(
                                vacanteId,
                                correoPostulante
                        )
        );
    }

    /*
     * Administrador:
     * examen completo con claves.
     */
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @GetMapping("/admin/vacante/{vacanteId}")
    public ResponseEntity<EvaluacionResponse>
    listarParaAdministrador(
            @PathVariable Long vacanteId,
            @AuthenticationPrincipal
            String correoAdministrador
    ) {
        log.info(
                "[EVALUACION] Administrador solicita examen. "
                        + "correo={}, vacanteId={}",
                correoAdministrador,
                vacanteId
        );

        return ResponseEntity.ok(
                evaluacionService
                        .listarPorVacanteAdmin(
                                vacanteId
                        )
        );
    }

    /*
     * Indica si la evaluación puede editarse.
     */
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @GetMapping("/{evaluacionId}/editable")
    public ResponseEntity<Boolean>
    comprobarEdicion(
            @PathVariable
            Long evaluacionId,
            @AuthenticationPrincipal
            String correoAdministrador
    ) {
        boolean editable =
                evaluacionService
                        .puedeEditarEvaluacion(
                                evaluacionId
                        );

        log.info(
                "[EVALUACION] Consultando edición. "
                        + "correo={}, evaluacionId={}, editable={}",
                correoAdministrador,
                evaluacionId,
                editable
        );

        return ResponseEntity.ok(
                editable
        );
    }

    /*
     * Crear evaluación.
     */
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public EvaluacionResponse crearEvaluacion(
            @RequestBody
            EvaluacionRequest request,
            @AuthenticationPrincipal
            String correoOperador
    ) {
        log.info(
                "[EVALUACION] Creando evaluación '{}' "
                        + "para vacanteId={} por {}",
                request.titulo(),
                request.vacanteId(),
                correoOperador
        );

        return evaluacionService
                .crearEvaluacion(
                        request.titulo(),
                        request.descripcion(),
                        request.vacanteId(),
                        request.preguntas(),
                        correoOperador
                );
    }

    /*
     * Editar evaluación.
     *
     * El backend rechazará la operación si
     * existe al menos una respuesta.
     */
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @PutMapping("/{evaluacionId}")
    public ResponseEntity<EvaluacionResponse>
    actualizarEvaluacion(
            @PathVariable
            Long evaluacionId,
            @RequestBody
            EvaluacionRequest request,
            @AuthenticationPrincipal
            String correoOperador
    ) {
        log.info(
                "[EVALUACION] Actualizando evaluación. "
                        + "evaluacionId={}, vacanteId={}, operador={}",
                evaluacionId,
                request.vacanteId(),
                correoOperador
        );

        return ResponseEntity.ok(
                evaluacionService
                        .actualizarEvaluacion(
                                evaluacionId,
                                request.titulo(),
                                request.descripcion(),
                                request.vacanteId(),
                                request.preguntas(),
                                correoOperador
                        )
        );
    }
}