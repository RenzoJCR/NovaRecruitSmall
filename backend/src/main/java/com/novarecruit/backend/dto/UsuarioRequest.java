package com.novarecruit.backend.dto;

public record UsuarioRequest(
        String nombres,
        String apellidos,
        String correo,
        String password,
        String rol
) {}