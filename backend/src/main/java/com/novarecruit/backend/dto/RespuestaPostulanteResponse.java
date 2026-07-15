package com.novarecruit.backend.dto;

import java.time.LocalDateTime;

public record RespuestaPostulanteResponse(
        Long id,
        Long preguntaId,
        Integer numeroPregunta,
        String enunciado,
        String tipoPregunta,
        String respuestaSeleccionada,
        String respuestaSeleccionadaTexto,
        String respuestaCorrecta,
        String respuestaCorrectaTexto,
        boolean correcta,
        Integer puntajeAsignado,
        Integer puntajeObtenido,
        LocalDateTime fechaRespuesta
) {
}