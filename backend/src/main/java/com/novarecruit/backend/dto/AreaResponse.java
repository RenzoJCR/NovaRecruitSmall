package com.novarecruit.backend.dto;

public record AreaResponse(
        Long id,
        String nombre,
        String descripcion,
        boolean activo
) {
}