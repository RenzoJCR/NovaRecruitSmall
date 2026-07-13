package com.novarecruit.backend.dto;

public record AuthResponse(
    String token, 
    Long userId,
    String nombres,
    String apellidos,
    String correo, 
    String rol           // Indica el rol del usuario (POSTULANTE, RECLUTADOR, ADMIN)
) {}