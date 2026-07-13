package com.novarecruit.backend.dto;

import java.util.List;

// Este es el modelo de datos que el front-end enviará al back-end para crear una nueva evaluación asociada a una vacante específica.
// Contiene el título, la descripción, el ID de la vacante y una lista de preguntas (PreguntasDTO) que conforman la evaluación.
public record EvaluacionRequest(
    String titulo,
    String descripcion,
    Long vacanteId,
    List<PreguntaDTO> preguntas
) {}