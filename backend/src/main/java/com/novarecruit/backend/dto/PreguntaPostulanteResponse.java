package com.novarecruit.backend.dto;

public record PreguntaPostulanteResponse(
        Long id,
        String tipoPregunta,
        String enunciado,
        String opcionA,
        String opcionB,
        String opcionC,
        String opcionD
) {}