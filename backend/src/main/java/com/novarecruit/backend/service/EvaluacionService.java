package com.novarecruit.backend.service;

import com.novarecruit.backend.dto.EvaluacionPostulanteResponse;
import com.novarecruit.backend.dto.EvaluacionResponse;
import com.novarecruit.backend.dto.PreguntaDTO;
import com.novarecruit.backend.entity.Evaluacion;
import com.novarecruit.backend.entity.Pregunta;
import com.novarecruit.backend.entity.Vacante;
import com.novarecruit.backend.mapper.EvaluacionMapper;
import com.novarecruit.backend.mapper.PreguntaMapper;
import com.novarecruit.backend.repository.EvaluacionRepository;
import com.novarecruit.backend.repository.VacanteRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class EvaluacionService {

    private static final Logger log =
            LoggerFactory.getLogger(EvaluacionService.class);

    private final EvaluacionRepository evaluacionRepository;
    private final VacanteRepository vacanteRepository;

    public EvaluacionService(
            EvaluacionRepository evaluacionRepository,
            VacanteRepository vacanteRepository) {

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

    /*
     * Devuelve el examen completo al administrador.
     */
    @Transactional(readOnly = true)
    public EvaluacionResponse listarPorVacanteAdmin(Long vacanteId) {

        Evaluacion evaluacion = buscarPorVacante(vacanteId);

        log.info(
                "[EVALUACION] Entregando examen administrativo con claves. "
                        + "vacanteId={}, evaluacionId={}",
                vacanteId,
                evaluacion.getId()
        );

        return EvaluacionMapper.toResponse(evaluacion);
    }

    /*
     * Devuelve el examen sin respuestas correctas al postulante.
     */
    @Transactional(readOnly = true)
    public EvaluacionPostulanteResponse listarPorVacantePostulante(
            Long vacanteId) {

        Evaluacion evaluacion = buscarPorVacante(vacanteId);

        int cantidadPreguntas =
                evaluacion.getPreguntas() == null
                        ? 0
                        : evaluacion.getPreguntas().size();

        log.info(
                "[EVALUACION] Entregando examen seguro al postulante "
                        + "sin respuestas correctas. "
                        + "vacanteId={}, evaluacionId={}, preguntas={}",
                vacanteId,
                evaluacion.getId(),
                cantidadPreguntas
        );

        return EvaluacionMapper.toPostulanteResponse(evaluacion);
    }

    @Transactional
    public EvaluacionResponse crearEvaluacion(
            String titulo,
            String descripcion,
            Long vacanteId,
            List<PreguntaDTO> preguntasDTO,
            String operador) {

        Vacante vacante = vacanteRepository.findById(vacanteId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Vacante asociada no encontrada"
                        )
                );

        Evaluacion evaluacion = new Evaluacion();

        evaluacion.setVacante(vacante);
        vacante.setEvaluacion(evaluacion);
        evaluacion.setTitulo(titulo);
        evaluacion.setDescripcion(descripcion);
        evaluacion.setCreadoPor(operador);

        List<Pregunta> preguntas = preguntasDTO.stream()
                .map(dto -> {
                    Pregunta pregunta = PreguntaMapper.toEntity(dto);
                    pregunta.setEvaluacion(evaluacion);
                    return pregunta;
                })
                .toList();

        evaluacion.setPreguntas(preguntas);

        Evaluacion evaluacionGuardada =
                evaluacionRepository.save(evaluacion);

        return EvaluacionMapper.toResponse(evaluacionGuardada);
    }

    private Evaluacion buscarPorVacante(Long vacanteId) {
        return evaluacionRepository.findByVacanteId(vacanteId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Esta vacante no cuenta con una "
                                        + "evaluación configurada"
                        )
                );
    }
}