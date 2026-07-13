package com.novarecruit.backend.controller;

import com.novarecruit.backend.dto.VacanteRequest;
import com.novarecruit.backend.dto.VacanteResponse;
import com.novarecruit.backend.service.VacanteService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/vacantes")
public class VacanteController {

    private static final Logger log = LoggerFactory.getLogger(VacanteController.class);
    private final VacanteService vacanteService;

    public VacanteController(VacanteService vacanteService) {
        this.vacanteService = vacanteService;
    }

    // 1. PUBLICO: Listar todas las vacantes activas en el portal
    @GetMapping
    public ResponseEntity<List<VacanteResponse>> listarActivas() {

        log.info("Listando todas las vacantes activas");
        return ResponseEntity.ok(vacanteService.listarActivas());
    }

    // 1.1 PUBLICO: Obtener detalle de una vacante específica
    @GetMapping("/{id}")
    public ResponseEntity<VacanteResponse> obtenerPorId(@PathVariable Long id) {
        log.info("Consultando detalle de la vacante ID: {}", id);
        return ResponseEntity.ok(vacanteService.obtenerPorId(id));
    }

    // 2. PRIVADO (ADMIN): Publicar una nueva oferta de trabajo
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @PostMapping
    public ResponseEntity<VacanteResponse> crearVacante(
            @RequestBody VacanteRequest request,
            @AuthenticationPrincipal String correoOperador) {

        log.info("Creando nueva vacante...");
        VacanteResponse response = vacanteService.crearVacante(request, correoOperador);

        log.info("Vacante creada con éxito: {}", response.titulo());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // 3. PRIVADO (ADMIN): Cerrar o pausar una vacante (Cambio de estado estilo Trello)
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @PatchMapping("/{id}/estado")
    public ResponseEntity<VacanteResponse> cambiarEstado(
            @PathVariable Long id,
            @RequestParam String nuevoEstado,
            @AuthenticationPrincipal String correoOperador) {
        
        log.info("Cambiando estado de la vacante con ID: {} a {}", id, nuevoEstado);
        VacanteResponse response = vacanteService.cambiarEstado(id, nuevoEstado, correoOperador);
        return ResponseEntity.ok(response);
    }
}