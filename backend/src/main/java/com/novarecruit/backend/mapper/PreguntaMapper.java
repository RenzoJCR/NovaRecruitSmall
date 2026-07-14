package com.novarecruit.backend.mapper;

import com.novarecruit.backend.dto.PreguntaDTO;
import com.novarecruit.backend.dto.PreguntaPostulanteResponse;
import com.novarecruit.backend.entity.Pregunta;

public class PreguntaMapper {

    private PreguntaMapper() {
    }

    /*
     * Conversión administrativa.
     * Incluye la respuesta correcta.
     */
    public static PreguntaDTO toDTO(Pregunta pregunta) {
        if (pregunta == null) {
            return null;
        }

        return new PreguntaDTO(
                pregunta.getId(),
                pregunta.getTipoPregunta(),
                pregunta.getEnunciado(),
                pregunta.getOpcionA(),
                pregunta.getOpcionB(),
                pregunta.getOpcionC(),
                pregunta.getOpcionD(),
                pregunta.getRespuestaCorrecta()
        );
    }

    /*
     * Conversión para el postulante.
     * No incluye la respuesta correcta.
     */
    public static PreguntaPostulanteResponse toPostulanteResponse(
            Pregunta pregunta) {

        if (pregunta == null) {
            return null;
        }

        return new PreguntaPostulanteResponse(
                pregunta.getId(),
                pregunta.getTipoPregunta(),
                pregunta.getEnunciado(),
                pregunta.getOpcionA(),
                pregunta.getOpcionB(),
                pregunta.getOpcionC(),
                pregunta.getOpcionD()
        );
    }

    /*
     * Convierte la pregunta recibida del administrador
     * en una entidad que se guardará en MySQL.
     */
    public static Pregunta toEntity(PreguntaDTO dto) {
        if (dto == null) {
            return null;
        }

        Pregunta pregunta = new Pregunta();

        pregunta.setTipoPregunta(dto.tipoPregunta());
        pregunta.setEnunciado(dto.enunciado());
        pregunta.setOpcionA(dto.opcionA());
        pregunta.setOpcionB(dto.opcionB());
        pregunta.setOpcionC(dto.opcionC());
        pregunta.setOpcionD(dto.opcionD());
        pregunta.setRespuestaCorrecta(dto.respuestaCorrecta());

        return pregunta;
    }
}