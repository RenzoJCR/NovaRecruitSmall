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

import com.novarecruit.backend.entity.Postulacion;
import com.novarecruit.backend.repository.PostulacionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.server.ResponseStatusException;

@Service
public class EvaluacionService {

    private static final Logger log =
            LoggerFactory.getLogger(EvaluacionService.class);

    private final EvaluacionRepository evaluacionRepository;
    private final VacanteRepository vacanteRepository;
    private final PostulacionRepository postulacionRepository;

    public EvaluacionService(
            EvaluacionRepository evaluacionRepository,
            VacanteRepository vacanteRepository,
            PostulacionRepository postulacionRepository) {

        this.evaluacionRepository = evaluacionRepository;
        this.vacanteRepository = vacanteRepository;
        this.postulacionRepository = postulacionRepository;
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
    public EvaluacionPostulanteResponse
    listarPorVacantePostulante(
            Long vacanteId,
            String correoPostulante) {

        /*
         * La consulta comprueba que existe una postulación
         * que relaciona al correo autenticado con la vacante.
         */
        Postulacion postulacion =
                postulacionRepository
                        .findByUsuario_CorreoAndVacante_Id(
                                correoPostulante,
                                vacanteId
                        )
                        .orElseThrow(() -> {

                            log.warn(
                                    "[SEGURIDAD] Intento de acceder a examen "
                                            + "sin postulación propia. "
                                            + "correo={}, vacanteId={}",
                                    correoPostulante,
                                    vacanteId
                            );

                            return new AccessDeniedException(
                                    "No puedes acceder al examen "
                                            + "de esta vacante"
                            );
                        });

        /*
         * El examen se obtiene desde la vacante
         * vinculada a la postulación validada.
         */
        Evaluacion evaluacion =
                postulacion.getVacante().getEvaluacion();

        if (evaluacion == null) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Esta vacante no cuenta con una evaluación configurada"
            );
        }

        int cantidadPreguntas =
                evaluacion.getPreguntas() == null
                        ? 0
                        : evaluacion.getPreguntas().size();

        log.info(
                "[EVALUACION] Entregando examen seguro. "
                        + "correo={}, postulacionId={}, vacanteId={}, "
                        + "evaluacionId={}, preguntas={}",
                correoPostulante,
                postulacion.getId(),
                vacanteId,
                evaluacion.getId(),
                cantidadPreguntas
        );

        return EvaluacionMapper.toPostulanteResponse(
                evaluacion
        );
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

        return evaluacionRepository
                .findByVacanteId(vacanteId)
                .orElseThrow(() -> {

                    log.info(
                            "[EVALUACION] Vacante sin examen configurado. "
                                    + "vacanteId={}",
                            vacanteId
                    );

                    return new ResponseStatusException(
                            HttpStatus.NOT_FOUND,
                            "Esta vacante aún no cuenta "
                                    + "con una evaluación configurada"
                    );
                });
    }
}