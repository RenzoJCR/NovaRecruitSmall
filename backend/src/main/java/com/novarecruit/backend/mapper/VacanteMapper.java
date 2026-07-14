package com.novarecruit.backend.mapper;

import com.novarecruit.backend.dto.VacanteResponse;
import com.novarecruit.backend.entity.Vacante;

public class VacanteMapper {

    private VacanteMapper() {
    }

    public static VacanteResponse toResponse(
            Vacante vacante) {

        if (vacante == null) {
            return null;
        }

        Long evaluacionId =
                vacante.getEvaluacion() != null
                        ? vacante.getEvaluacion().getId()
                        : null;

        return new VacanteResponse(
                vacante.getId(),
                vacante.getArea().getId(),
                vacante.getArea().getNombre(),
                vacante.getTitulo(),
                vacante.getDescripcion(),
                vacante.getModalidad(),
                vacante.getSalario(),
                vacante.getEstado(),
                evaluacionId,
                vacante.getFechaCreacion()
        );
    }
}