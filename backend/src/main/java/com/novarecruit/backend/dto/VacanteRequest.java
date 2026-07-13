package com.novarecruit.backend.dto;

import java.math.BigDecimal;

public record VacanteRequest(
    Long areaId, 
    String titulo, 
    String descripcion, 
    String modalidad, 
    BigDecimal salario
) {}