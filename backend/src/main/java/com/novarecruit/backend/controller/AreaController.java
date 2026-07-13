package com.novarecruit.backend.controller;

import com.novarecruit.backend.dto.AreaRequest;
import com.novarecruit.backend.dto.AreaResponse;
import com.novarecruit.backend.service.AreaService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;


@PreAuthorize("hasRole('ADMINISTRADOR')")
@RestController
@RequestMapping("/api/areas")
public class AreaController {

    private static final Logger log = LoggerFactory.getLogger(AreaController.class);
    private final AreaService areaService;

    public AreaController(AreaService areaService) {
        this.areaService = areaService;
    }

    // 1. PRIVADO (ADMIN): Listar todas las áreas registradas
    @GetMapping
    public ResponseEntity<List<AreaResponse>> listarTodas() {

        log.info("Listando todas las áreas tecnológicas");
        return ResponseEntity.ok(areaService.listarTodas());
    }

    // 2. PRIVADO (ADMIN): Crear una nueva área tecnológica
    @PostMapping
    public ResponseEntity<AreaResponse> crearArea(
            @RequestBody AreaRequest request,
            @AuthenticationPrincipal String correoOperador) {

        log.info("Creando nueva área tecnológica");
        AreaResponse response = areaService.crearArea(request, correoOperador);

        log.info("Área tecnológica creada con éxito: {}", response.nombre());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
}
