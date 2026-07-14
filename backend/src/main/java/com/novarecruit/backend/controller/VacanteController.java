package com.novarecruit.backend.controller;

import com.novarecruit.backend.dto.VacanteRequest;
import com.novarecruit.backend.dto.VacanteResponse;
import com.novarecruit.backend.service.VacanteService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vacantes")
public class VacanteController {

    private static final Logger log =
            LoggerFactory.getLogger(VacanteController.class);

    private final VacanteService vacanteService;

    public VacanteController(
            VacanteService vacanteService) {

        this.vacanteService = vacanteService;
    }

    /*
     * Público:
     * solamente devuelve vacantes activas.
     */
    @GetMapping
    public ResponseEntity<List<VacanteResponse>>
    listarActivas() {

        log.info(
                "[VACANTE] Solicitud pública "
                        + "de vacantes activas"
        );

        return ResponseEntity.ok(
                vacanteService.listarActivas()
        );
    }

    /*
     * Administrador:
     * devuelve vacantes activas y cerradas.
     */
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @GetMapping("/admin")
    public ResponseEntity<List<VacanteResponse>>
    listarTodasAdmin(
            @AuthenticationPrincipal
            String correoAdministrador) {

        log.info(
                "[VACANTE] Administrador solicita "
                        + "el catálogo completo. correo={}",
                correoAdministrador
        );

        return ResponseEntity.ok(
                vacanteService.listarTodasAdmin()
        );
    }

    /*
     * Público:
     * solo permite consultar el detalle si está activa.
     */
    @GetMapping("/{id}")
    public ResponseEntity<VacanteResponse>
    obtenerActivaPorId(
            @PathVariable Long id) {

        log.info(
                "[VACANTE] Consultando detalle público. "
                        + "vacanteId={}",
                id
        );

        return ResponseEntity.ok(
                vacanteService.obtenerActivaPorId(id)
        );
    }

    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @PostMapping
    public ResponseEntity<VacanteResponse>
    crearVacante(
            @RequestBody VacanteRequest request,
            @AuthenticationPrincipal
            String correoOperador) {

        log.info(
                "[VACANTE] Administrador inicia "
                        + "registro de vacante. "
                        + "correo={}, titulo='{}'",
                correoOperador,
                request.titulo()
        );

        VacanteResponse response =
                vacanteService.crearVacante(
                        request,
                        correoOperador
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @PatchMapping("/{id}/estado")
    public ResponseEntity<VacanteResponse>
    cambiarEstado(
            @PathVariable Long id,
            @RequestParam String nuevoEstado,
            @AuthenticationPrincipal
            String correoOperador) {

        log.info(
                "[VACANTE] Administrador solicita "
                        + "cambio de estado. "
                        + "correo={}, vacanteId={}, nuevoEstado={}",
                correoOperador,
                id,
                nuevoEstado
        );

        return ResponseEntity.ok(
                vacanteService.cambiarEstado(
                        id,
                        nuevoEstado,
                        correoOperador
                )
        );
    }
}