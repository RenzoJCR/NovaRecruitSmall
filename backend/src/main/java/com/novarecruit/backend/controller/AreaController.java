package com.novarecruit.backend.controller;

import com.novarecruit.backend.dto.AreaRequest;
import com.novarecruit.backend.dto.AreaResponse;
import com.novarecruit.backend.service.AreaService;

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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@PreAuthorize("hasRole('ADMINISTRADOR')")
@RestController
@RequestMapping("/api/areas")
public class AreaController {

    private static final Logger log =
            LoggerFactory.getLogger(
                    AreaController.class
            );

    private final AreaService areaService;

    public AreaController(
            AreaService areaService
    ) {
        this.areaService = areaService;
    }

    /*
     * GET /api/areas
     *
     * Devuelve áreas activas e inactivas
     * para la pantalla administrativa.
     */
    @GetMapping
    public ResponseEntity<List<AreaResponse>>
    listarTodas() {

        log.info(
                "Listando todas las áreas tecnológicas"
        );

        return ResponseEntity.ok(
                areaService.listarTodas()
        );
    }

    /*
     * GET /api/areas/activas
     *
     * Se usará en los formularios de vacantes.
     */
    @GetMapping("/activas")
    public ResponseEntity<List<AreaResponse>>
    listarActivas() {

        log.info(
                "Listando áreas tecnológicas activas"
        );

        return ResponseEntity.ok(
                areaService.listarActivas()
        );
    }

    @PostMapping
    public ResponseEntity<AreaResponse>
    crearArea(
            @RequestBody AreaRequest request,
            @AuthenticationPrincipal
            String correoOperador
    ) {
        log.info(
                "Creando nueva área tecnológica"
        );

        AreaResponse response =
                areaService.crearArea(
                        request,
                        correoOperador
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<AreaResponse>
    actualizarArea(
            @PathVariable Long id,
            @RequestBody AreaRequest request,
            @AuthenticationPrincipal
            String correoOperador
    ) {
        log.info(
                "Actualizando área ID {} por {}",
                id,
                correoOperador
        );

        return ResponseEntity.ok(
                areaService.actualizarArea(
                        id,
                        request
                )
        );
    }

    /*
     * PATCH /api/areas/{id}/estado?activo=false
     */
    @PatchMapping("/{id}/estado")
    public ResponseEntity<AreaResponse>
    cambiarEstado(
            @PathVariable Long id,
            @RequestParam boolean activo,
            @AuthenticationPrincipal
            String correoOperador
    ) {
        log.info(
                "Cambiando estado del área ID {} a {} por {}",
                id,
                activo,
                correoOperador
        );

        return ResponseEntity.ok(
                areaService.cambiarEstado(
                        id,
                        activo
                )
        );
    }
}