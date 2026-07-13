package com.novarecruit.backend.mapper;

import com.novarecruit.backend.dto.PreguntaDTO;
import com.novarecruit.backend.entity.Pregunta;

public class PreguntaMapper {

    public static PreguntaDTO toDTO(Pregunta pregunta) {
        if (pregunta == null) return null;

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

    public static Pregunta toEntity(PreguntaDTO dto) {
        if (dto == null) return null;

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