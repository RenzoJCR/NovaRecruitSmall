package com.novarecruit.backend.dto;

import java.util.List;

public record EvaluacionResponse(
    Long id, 
    Long vacanteId, 
    String titulo, 
    String descripcion,
    List<PreguntaDTO> preguntas
) {}