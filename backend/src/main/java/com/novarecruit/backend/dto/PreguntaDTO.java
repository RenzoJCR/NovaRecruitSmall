package com.novarecruit.backend.dto;

public record PreguntaDTO(
    Long id,
    String tipoPregunta, 
    String enunciado, 
    String opcionA, 
    String opcionB, 
    String opcionC, 
    String opcionD, 
    String respuestaCorrecta
) {}