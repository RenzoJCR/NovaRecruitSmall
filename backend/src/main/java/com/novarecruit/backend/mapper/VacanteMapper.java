package com.novarecruit.backend.mapper;

import com.novarecruit.backend.dto.VacanteResponse;
import com.novarecruit.backend.entity.Vacante;

public class VacanteMapper {

    public static VacanteResponse toResponse(Vacante vacante) {
        if (vacante == null) return null;

        return new VacanteResponse(
            vacante.getId(),
            vacante.getArea().getId(),       // Extraemos solo el ID relacional
            vacante.getArea().getNombre(),   // Extraemos el nombre de la categoría
            vacante.getTitulo(),
            vacante.getDescripcion(),
            vacante.getModalidad(),
            vacante.getSalario(),
            vacante.getEstado(),
            vacante.getFechaCreacion()
        );
    }
}