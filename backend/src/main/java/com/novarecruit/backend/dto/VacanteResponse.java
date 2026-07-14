package com.novarecruit.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record VacanteResponse(
        Long id,
        Long areaId,
        String areaNombre,
        String titulo,
        String descripcion,
        String modalidad,
        BigDecimal salario,
        String estado,
        Long evaluacionId,
        LocalDateTime fechaCreacion
) {}