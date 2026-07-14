package com.novarecruit.backend.mapper;

import com.novarecruit.backend.dto.EvaluacionPostulanteResponse;
import com.novarecruit.backend.dto.EvaluacionResponse;
import com.novarecruit.backend.dto.PreguntaDTO;
import com.novarecruit.backend.dto.PreguntaPostulanteResponse;
import com.novarecruit.backend.entity.Evaluacion;

import java.util.Collections;
import java.util.List;

public class EvaluacionMapper {

    private EvaluacionMapper() {
    }

    /*
     * Respuesta completa para el administrador.
     * Las preguntas incluyen respuestaCorrecta.
     */
    public static EvaluacionResponse toResponse(Evaluacion evaluacion) {
        if (evaluacion == null) {
            return null;
        }

        List<PreguntaDTO> preguntas =
                evaluacion.getPreguntas() != null
                        ? evaluacion.getPreguntas()
                        .stream()
                        .map(PreguntaMapper::toDTO)
                        .toList()
                        : Collections.emptyList();

        return new EvaluacionResponse(
                evaluacion.getId(),
                evaluacion.getVacante().getId(),
                evaluacion.getTitulo(),
                evaluacion.getDescripcion(),
                preguntas
        );
    }

    /*
     * Respuesta segura para el postulante.
     * Las preguntas no incluyen respuestaCorrecta.
     */
    public static EvaluacionPostulanteResponse toPostulanteResponse(
            Evaluacion evaluacion) {

        if (evaluacion == null) {
            return null;
        }

        List<PreguntaPostulanteResponse> preguntas =
                evaluacion.getPreguntas() != null
                        ? evaluacion.getPreguntas()
                        .stream()
                        .map(PreguntaMapper::toPostulanteResponse)
                        .toList()
                        : Collections.emptyList();

        return new EvaluacionPostulanteResponse(
                evaluacion.getId(),
                evaluacion.getVacante().getId(),
                evaluacion.getTitulo(),
                evaluacion.getDescripcion(),
                preguntas
        );
    }
}