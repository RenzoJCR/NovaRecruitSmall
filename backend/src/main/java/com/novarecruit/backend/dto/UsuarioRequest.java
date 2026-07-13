package com.novarecruit.backend.dto;

public record UsuarioRequest(
    String nombres,
    String apellidos,
    String correo,
    String password, // Opcional en actualizaciones
    String rol,      // 'ADMINISTRADOR' o 'POSTULANTE'
    String cvUrl
) {}