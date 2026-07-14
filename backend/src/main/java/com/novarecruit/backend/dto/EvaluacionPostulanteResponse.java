package com.novarecruit.backend.dto;

import java.util.List;

public record EvaluacionPostulanteResponse(
        Long id,
        Long vacanteId,
        String titulo,
        String descripcion,
        List<PreguntaPostulanteResponse> preguntas
) {}