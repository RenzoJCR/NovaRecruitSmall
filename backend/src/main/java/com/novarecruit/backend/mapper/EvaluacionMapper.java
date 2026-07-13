package com.novarecruit.backend.mapper;

import com.novarecruit.backend.dto.EvaluacionResponse;
import com.novarecruit.backend.entity.Evaluacion;

import java.util.Collections;

public class EvaluacionMapper {

    public static EvaluacionResponse toResponse(Evaluacion evaluacion) {
        if (evaluacion == null) return null;

        // Si la evaluación no tiene preguntas aún, inicializamos una lista vacía segura
        var preguntasDTO = (evaluacion.getPreguntas() != null) 
            ? evaluacion.getPreguntas().stream().map(PreguntaMapper::toDTO).toList() 
            : Collections.<com.novarecruit.backend.dto.PreguntaDTO>emptyList();

        return new EvaluacionResponse(
            evaluacion.getId(),
            evaluacion.getVacante().getId(),
            evaluacion.getTitulo(),
            evaluacion.getDescripcion(),
            preguntasDTO
        );
    }
}