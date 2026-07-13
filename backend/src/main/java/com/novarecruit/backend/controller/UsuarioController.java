package com.novarecruit.backend.controller;

import java.util.List;

import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.novarecruit.backend.dto.UsuarioRequest;
import com.novarecruit.backend.dto.UsuarioResponse;
import com.novarecruit.backend.service.UsuarioService;

import lombok.RequiredArgsConstructor;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@PreAuthorize("hasRole('ADMINISTRADOR')") // Solo los administradores pueden acceder a estas rutas
@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
public class UsuarioController {

    private static final Logger log = LoggerFactory.getLogger(UsuarioController.class);
    private final UsuarioService usuarioService;

    // Solo accesible por administradores para ver el listado de control
    @GetMapping
    public ResponseEntity<List<UsuarioResponse>> listarUsuarios() {

        log.info("Listando todos los usuarios registrados");
        return ResponseEntity.ok(usuarioService.listarTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UsuarioResponse> obtenerPorId(@PathVariable Long id) {

        log.info("Obteniendo usuario con ID: {}", id);
        return ResponseEntity.ok(usuarioService.obtenerPorId(id));
    }

    @PostMapping
    public ResponseEntity<UsuarioResponse> crearUsuario(
            @RequestBody UsuarioRequest request,
            @AuthenticationPrincipal String correoOperador) { // Captura quién audita

        log.info("Creando nuevo usuario con correo: {}", request.correo());
        return ResponseEntity.status(HttpStatus.CREATED).body(usuarioService.crearUsuario(request, correoOperador));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UsuarioResponse> actualizarUsuario(
            @PathVariable Long id,
            @RequestBody UsuarioRequest request,
            @AuthenticationPrincipal String correoOperador) {

        log.info("Actualizando usuario con ID: {}", id);
        return ResponseEntity.ok(usuarioService.actualizarUsuario(id, request, correoOperador));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> desactivarUsuario(@PathVariable Long id, @AuthenticationPrincipal String correoOperador) {
        log.info("Desactivando usuario con ID: {}", id);
        usuarioService.desactivarUsuario(id, correoOperador);

        log.info("Usuario exitosamente desactivado con ID: {}", id);
        return ResponseEntity.noContent().build();
    }
    
    @PatchMapping("/{id}/reactivar")
    public ResponseEntity<UsuarioResponse> reactivarUsuario(@PathVariable Long id) {

        log.info("Reactivando usuario con ID: {}", id);
        return ResponseEntity.ok(usuarioService.reactivarUsuario(id));
    }
}