package com.novarecruit.backend.dto;

import java.time.LocalDateTime;

public record UsuarioResponse(
        Long id,
        String nombres,
        String apellidos,
        String nombreCompleto,
        String correo,
        String rol,
        boolean activo,
        LocalDateTime fechaCreacion
) {}