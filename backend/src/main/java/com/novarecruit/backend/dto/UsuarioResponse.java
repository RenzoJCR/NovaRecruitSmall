package com.novarecruit.backend.dto;

import java.time.LocalDateTime;

public record UsuarioResponse(
    Long id,
    String nombres,
    String apellidos,
    String nombreCompleto, // Concatenado dinámicamente para facilitar las tablas de React
    String correo,
    String rol,
    String cvUrl,
    boolean activo,        // Mapea el estado lógico del usuario
    LocalDateTime fechaCreacion
) {}