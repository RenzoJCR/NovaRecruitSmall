package com.novarecruit.backend.dto;

// El front nos manda un String con formato JSON conteniendo las respuestas (ej: '{"1":"A","2":"B"}')
public record EvaluarRequest(
    String respuestasPostulante
) {}