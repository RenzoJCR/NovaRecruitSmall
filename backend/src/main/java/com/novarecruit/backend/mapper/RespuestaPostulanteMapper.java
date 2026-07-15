package com.novarecruit.backend.mapper;

import com.novarecruit.backend.dto.RespuestaPostulanteResponse;
import com.novarecruit.backend.entity.Pregunta;
import com.novarecruit.backend.entity.RespuestaPostulante;

public final class RespuestaPostulanteMapper {

    private RespuestaPostulanteMapper() {
    }

    public static RespuestaPostulanteResponse toResponse(
            RespuestaPostulante respuesta,
            int numeroPregunta) {

        Pregunta pregunta = respuesta.getPregunta();

        return new RespuestaPostulanteResponse(
                respuesta.getId(),
                pregunta.getId(),
                numeroPregunta,
                pregunta.getEnunciado(),
                pregunta.getTipoPregunta(),
                respuesta.getRespuestaSeleccionada(),
                resolverTexto(
                        pregunta,
                        respuesta.getRespuestaSeleccionada()
                ),
                pregunta.getRespuestaCorrecta(),
                resolverTexto(
                        pregunta,
                        pregunta.getRespuestaCorrecta()
                ),
                respuesta.isCorrecta(),
                respuesta.getPuntajeAsignado(),
                respuesta.getPuntajeObtenido(),
                respuesta.getFechaRespuesta()
        );
    }

    private static String resolverTexto(
            Pregunta pregunta,
            String alternativa) {

        if (alternativa == null) {
            return "";
        }

        return switch (
                alternativa.trim().toUpperCase()
                ) {
            case "A" -> pregunta.getOpcionA();
            case "B" -> pregunta.getOpcionB();
            case "C" -> pregunta.getOpcionC();
            case "D" -> pregunta.getOpcionD();
            default -> alternativa;
        };
    }
}