package com.novarecruit.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PostulacionResponse(
        Long id,
        Long usuarioId,
        String usuarioNombre,
        String usuarioCorreo,
        Long vacanteId,
        String vacanteTitulo,
        String vacanteDescripcion,
        String vacanteAreaNombre,
        String vacanteModalidad,
        BigDecimal vacanteSalario,
        Long vacanteEvaluacionId,
        String estado,
        LocalDateTime fechaPostulacion,
        LocalDateTime fechaEvaluacion,
        Integer puntajeTecnico,
        String respuestasPostulante
) {}