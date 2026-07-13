package com.novarecruit.backend.service;

import com.novarecruit.backend.dto.EvaluacionResponse;
import com.novarecruit.backend.dto.PreguntaDTO;
import com.novarecruit.backend.entity.Evaluacion;
import com.novarecruit.backend.entity.Pregunta;
import com.novarecruit.backend.entity.Vacante;
import com.novarecruit.backend.mapper.EvaluacionMapper;
import com.novarecruit.backend.mapper.PreguntaMapper;
import com.novarecruit.backend.repository.EvaluacionRepository;
import com.novarecruit.backend.repository.VacanteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class EvaluacionService {

    private final EvaluacionRepository evaluacionRepository;
    private final VacanteRepository vacanteRepository;

    public EvaluacionService(EvaluacionRepository evaluacionRepository, VacanteRepository vacanteRepository) {
        this.evaluacionRepository = evaluacionRepository;
        this.vacanteRepository = vacanteRepository;
    }

    @Transactional(readOnly = true)
    public List<EvaluacionResponse> listarEvaluaciones() {
        return evaluacionRepository.findAll()
                .stream()
                .map(EvaluacionMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public EvaluacionResponse listarPorVacante(Long vacanteId) {
        Evaluacion evaluacion = evaluacionRepository.findByVacanteId(vacanteId)
                .orElseThrow(() -> new RuntimeException("Esta vacante no cuenta con una evaluación configurada"));
        return EvaluacionMapper.toResponse(evaluacion);
    }

    @Transactional
    public EvaluacionResponse crearEvaluacion(String titulo, String descripcion, Long vacanteId, List<PreguntaDTO> preguntasDTO, String operador) {
        Vacante vacante = vacanteRepository.findById(vacanteId)
                .orElseThrow(() -> new RuntimeException("Vacante asociada no encontrada"));

        Evaluacion evaluacion = new Evaluacion();
        evaluacion.setVacante(vacante);
        vacante.setEvaluacion(evaluacion);
        evaluacion.setTitulo(titulo);
        evaluacion.setDescripcion(descripcion);
        evaluacion.setCreadoPor(operador);

        // Convertimos las preguntas DTO a Entidades y las enlazamos bidireccionalmente
        List<Pregunta> preguntas = preguntasDTO.stream().map(dto -> {
            Pregunta p = PreguntaMapper.toEntity(dto);
            p.setEvaluacion(evaluacion);
            return p;
        }).toList();
        
        evaluacion.setPreguntas(preguntas);

        return EvaluacionMapper.toResponse(evaluacionRepository.save(evaluacion));
    }

    @Transactional(readOnly = true)
    public EvaluacionResponse obtenerPorVacante(Long vacanteId) {
        Evaluacion evaluacion = evaluacionRepository.findByVacanteId(vacanteId)
                .orElseThrow(() -> new RuntimeException("Esta vacante no cuenta con una evaluación configurada"));
        return EvaluacionMapper.toResponse(evaluacion);
    }
}