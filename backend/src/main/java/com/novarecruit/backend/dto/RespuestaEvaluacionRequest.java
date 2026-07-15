package com.novarecruit.backend.dto;

public record RespuestaEvaluacionRequest(
        Long preguntaId,
        String respuesta
) {
}