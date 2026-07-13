package com.novarecruit.backend.mapper;

import com.novarecruit.backend.dto.AreaResponse;
import com.novarecruit.backend.entity.Area;

public class AreaMapper {

    public static AreaResponse toResponse(Area area) {
        if (area == null) return null;

        return new AreaResponse(
            area.getId(),
            area.getNombre(),
            area.getDescripcion()
        );
    }
}