package com.novarecruit.backend.service;

import com.novarecruit.backend.dto.VacanteRequest;
import com.novarecruit.backend.dto.VacanteResponse;
import com.novarecruit.backend.entity.Area;
import com.novarecruit.backend.entity.Vacante;
import com.novarecruit.backend.entity.Usuario;
import com.novarecruit.backend.mapper.VacanteMapper;
import com.novarecruit.backend.repository.AreaRepository;
import com.novarecruit.backend.repository.VacanteRepository;
import com.novarecruit.backend.repository.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class VacanteService {

    private final VacanteRepository vacanteRepository;
    private final AreaRepository areaRepository;
    private final UsuarioRepository usuarioRepository;

    public VacanteService(VacanteRepository vacanteRepository, AreaRepository areaRepository, UsuarioRepository usuarioRepository) {
        this.vacanteRepository = vacanteRepository;
        this.areaRepository = areaRepository;
        this.usuarioRepository = usuarioRepository;
    }

    @Transactional
    public VacanteResponse crearVacante(VacanteRequest request, String operador) {
        Area area = areaRepository.findById(request.areaId())
                .orElseThrow(() -> new RuntimeException("Área tecnológica no encontrada"));
        
        Usuario admin = usuarioRepository.findByCorreo(operador)
                .orElseThrow(() -> new RuntimeException("Administrador no encontrado"));

        Vacante vacante = new Vacante();
        vacante.setArea(area);
        vacante.setAdministrador(admin);
        vacante.setTitulo(request.titulo());
        vacante.setDescripcion(request.descripcion());
        vacante.setModalidad(request.modalidad());
        vacante.setSalario(request.salario());
        vacante.setCreadoPor(operador);

        return VacanteMapper.toResponse(vacanteRepository.save(vacante));
    }

    @Transactional(readOnly = true)
    public List<VacanteResponse> listarActivas() {
        return vacanteRepository.findByEstado("ACTIVA").stream()
                .map(VacanteMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public VacanteResponse obtenerPorId(Long id) {
        Vacante vacante = vacanteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vacante no encontrada"));
        return VacanteMapper.toResponse(vacante);
    }

    @Transactional
    public VacanteResponse cambiarEstado(Long id, String nuevoEstado, String operador) {
        Vacante vacante = vacanteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vacante no encontrada"));
        
        vacante.setEstado(nuevoEstado);
        vacante.setModificadoPor(operador); // Registro de auditoría

        return VacanteMapper.toResponse(vacanteRepository.save(vacante));
    }
}