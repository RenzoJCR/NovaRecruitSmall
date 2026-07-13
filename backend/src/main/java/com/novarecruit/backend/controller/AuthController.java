package com.novarecruit.backend.controller;

import com.novarecruit.backend.dto.AuthResponse;
import com.novarecruit.backend.dto.LoginRequest;
import com.novarecruit.backend.dto.RegistroRequest;
import com.novarecruit.backend.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController // 1. Le dice a Spring que esta clase expone endpoints REST en formato JSON
@RequestMapping("/api/auth") // 2. La URL base perimetral para este controlador
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);
    private final AuthService authService;

    // Inyección de dependencias por constructor
    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // Endpoint para el Autoregistro de candidatos independientes (Postulantes)
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> registrarPostulante(@RequestBody RegistroRequest request) {

        log.info("Registrando postulante con el correo: {}", request.correo());
        // @RequestBody mapea automáticamente el JSON entrante hacia nuestro Record inmutable
        AuthResponse response = authService.registrarPostulante(request);
        
        log.info("Postulante registrado con éxito: {}", request.correo());
        // Devolvemos un código HTTP 200 OK envolviendo la respuesta segura con el JWT real
        return ResponseEntity.ok(response);
    }

    // Endpoint central para el inicio de sesión del Administrador y el Postulante
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {

        log.info("Iniciando sesión con el correo: {}", request.correo());
        // Extraemos las credenciales del Record e invocamos la verificación lógica
        AuthResponse response = authService.login(request.correo(), request.password());
        
        log.info("Sesión iniciada con éxito: {}", request.correo());
        return ResponseEntity.ok(response);
    }
}