package com.novarecruit.backend.service;

import com.novarecruit.backend.dto.AreaRequest;
import com.novarecruit.backend.dto.AreaResponse;
import com.novarecruit.backend.entity.Area;
import com.novarecruit.backend.mapper.AreaMapper;
import com.novarecruit.backend.repository.AreaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AreaService {

    private final AreaRepository areaRepository;

    public AreaService(AreaRepository areaRepository) {
        this.areaRepository = areaRepository;
    }

    @Transactional
    public AreaResponse crearArea(AreaRequest request, String operador) {
        Area area = new Area();
        area.setNombre(request.nombre());
        area.setDescripcion(request.descripcion());
        area.setCreadoPor(operador); // Captura quién audita la acción

        return AreaMapper.toResponse(areaRepository.save(area));
    }

    @Transactional(readOnly = true)
    public List<AreaResponse> listarTodas() {
        return areaRepository.findAll().stream()
                .map(AreaMapper::toResponse)
                .toList();
    }
}