package com.novarecruit.backend.service;

import com.novarecruit.backend.dto.EvaluacionPostulanteResponse;
import com.novarecruit.backend.dto.EvaluacionResponse;
import com.novarecruit.backend.dto.PreguntaDTO;
import com.novarecruit.backend.entity.Evaluacion;
import com.novarecruit.backend.entity.Postulacion;
import com.novarecruit.backend.entity.Pregunta;
import com.novarecruit.backend.entity.Vacante;
import com.novarecruit.backend.mapper.EvaluacionMapper;
import com.novarecruit.backend.repository.EvaluacionRepository;
import com.novarecruit.backend.repository.PostulacionRepository;
import com.novarecruit.backend.repository.RespuestaPostulanteRepository;
import com.novarecruit.backend.repository.VacanteRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;

@Service
public class EvaluacionService {

    private static final Logger log =
            LoggerFactory.getLogger(
                    EvaluacionService.class
            );

    private final EvaluacionRepository evaluacionRepository;
    private final VacanteRepository vacanteRepository;
    private final PostulacionRepository postulacionRepository;
    private final RespuestaPostulanteRepository
            respuestaPostulanteRepository;

    public EvaluacionService(
            EvaluacionRepository evaluacionRepository,
            VacanteRepository vacanteRepository,
            PostulacionRepository postulacionRepository,
            RespuestaPostulanteRepository
                    respuestaPostulanteRepository
    ) {
        this.evaluacionRepository =
                evaluacionRepository;

        this.vacanteRepository =
                vacanteRepository;

        this.postulacionRepository =
                postulacionRepository;

        this.respuestaPostulanteRepository =
                respuestaPostulanteRepository;
    }

    @Transactional(readOnly = true)
    public List<EvaluacionResponse>
    listarEvaluaciones() {

        return evaluacionRepository
                .findAll()
                .stream()
                .map(EvaluacionMapper::toResponse)
                .toList();
    }

    /*
     * Entrega el examen completo al administrador,
     * incluyendo las claves correctas.
     */
    @Transactional(readOnly = true)
    public EvaluacionResponse
    listarPorVacanteAdmin(
            Long vacanteId
    ) {
        Evaluacion evaluacion =
                buscarPorVacante(
                        vacanteId
                );

        log.info(
                "[EVALUACION] Entregando examen administrativo. "
                        + "vacanteId={}, evaluacionId={}",
                vacanteId,
                evaluacion.getId()
        );

        return EvaluacionMapper.toResponse(
                evaluacion
        );
    }

    /*
     * Indica si el examen todavía puede editarse.
     *
     * Una sola respuesta registrada es suficiente
     * para bloquear completamente la evaluación.
     */
    @Transactional(readOnly = true)
    public boolean puedeEditarEvaluacion(
            Long evaluacionId
    ) {
        Evaluacion evaluacion =
                buscarPorId(
                        evaluacionId
                );

        boolean tieneRespuestas =
                respuestaPostulanteRepository
                        .existsByPregunta_Evaluacion_Id(
                                evaluacion.getId()
                        );

        return !tieneRespuestas;
    }

    /*
     * Entrega el examen seguro al postulante,
     * sin respuestas correctas.
     */
    @Transactional(readOnly = true)
    public EvaluacionPostulanteResponse
    listarPorVacantePostulante(
            Long vacanteId,
            String correoPostulante
    ) {
        Postulacion postulacion =
                postulacionRepository
                        .findByUsuario_CorreoAndVacante_Id(
                                correoPostulante,
                                vacanteId
                        )
                        .orElseThrow(() -> {
                            log.warn(
                                    "[SEGURIDAD] Acceso a examen "
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

        Evaluacion evaluacion =
                postulacion
                        .getVacante()
                        .getEvaluacion();

        if (evaluacion == null) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Esta vacante no cuenta con una evaluación configurada"
            );
        }

        int cantidadPreguntas =
                evaluacion.getPreguntas() == null
                        ? 0
                        : evaluacion
                        .getPreguntas()
                        .size();

        log.info(
                "[EVALUACION] Entregando examen seguro. "
                        + "correo={}, postulacionId={}, "
                        + "vacanteId={}, evaluacionId={}, preguntas={}",
                correoPostulante,
                postulacion.getId(),
                vacanteId,
                evaluacion.getId(),
                cantidadPreguntas
        );

        return EvaluacionMapper
                .toPostulanteResponse(
                        evaluacion
                );
    }

    /*
     * Crea una evaluación nueva.
     */
    @Transactional
    public EvaluacionResponse crearEvaluacion(
            String titulo,
            String descripcion,
            Long vacanteId,
            List<PreguntaDTO> preguntasDTO,
            String operador
    ) {
        validarEvaluacion(
                titulo,
                vacanteId,
                preguntasDTO
        );

        Vacante vacante =
                vacanteRepository
                        .findById(vacanteId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Vacante asociada no encontrada"
                                )
                        );

        if (
                evaluacionRepository
                        .findByVacanteId(vacanteId)
                        .isPresent()
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "La vacante ya cuenta con una evaluación configurada."
            );
        }

        Evaluacion evaluacion =
                new Evaluacion();

        evaluacion.setVacante(vacante);

        evaluacion.setTitulo(
                titulo.trim()
        );

        evaluacion.setDescripcion(
                normalizarTextoOpcional(
                        descripcion
                )
        );

        evaluacion.setCreadoPor(
                operador
        );

        List<Pregunta> preguntas =
                construirPreguntas(
                        preguntasDTO,
                        evaluacion
                );

        evaluacion.setPreguntas(
                preguntas
        );

        /*
         * Conserva sincronizada la relación
         * bidireccional en memoria.
         */
        vacante.setEvaluacion(
                evaluacion
        );

        Evaluacion guardada =
                evaluacionRepository.save(
                        evaluacion
                );

        log.info(
                "[DB] Evaluación creada. "
                        + "evaluacionId={}, vacanteId={}, "
                        + "preguntas={}, operador={}",
                guardada.getId(),
                vacanteId,
                preguntas.size(),
                operador
        );

        return EvaluacionMapper.toResponse(
                guardada
        );
    }

    /*
     * Actualiza título, descripción y preguntas.
     *
     * Solo puede ejecutarse cuando ninguna pregunta
     * de la evaluación tiene respuestas.
     */
    @Transactional
    public EvaluacionResponse actualizarEvaluacion(
            Long evaluacionId,
            String titulo,
            String descripcion,
            Long vacanteId,
            List<PreguntaDTO> preguntasDTO,
            String operador
    ) {
        validarEvaluacion(
                titulo,
                vacanteId,
                preguntasDTO
        );

        Evaluacion evaluacion =
                buscarPorId(
                        evaluacionId
                );

        boolean tieneRespuestas =
                respuestaPostulanteRepository
                        .existsByPregunta_Evaluacion_Id(
                                evaluacionId
                        );

        if (tieneRespuestas) {
            log.warn(
                    "[EVALUACION] Edición bloqueada porque "
                            + "el examen ya fue respondido. "
                            + "evaluacionId={}, operador={}",
                    evaluacionId,
                    operador
            );

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Esta evaluación ya fue respondida y no puede modificarse."
            );
        }

        /*
         * Una evaluación no puede trasladarse
         * hacia otra vacante.
         */
        if (
                !evaluacion
                        .getVacante()
                        .getId()
                        .equals(vacanteId)
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La evaluación no pertenece a la vacante indicada."
            );
        }

        evaluacion.setTitulo(
                titulo.trim()
        );

        evaluacion.setDescripcion(
                normalizarTextoOpcional(
                        descripcion
                )
        );

        /*
         * Se conserva la misma colección administrada
         * por Hibernate para que orphanRemoval elimine
         * correctamente las preguntas anteriores.
         */
        List<Pregunta> preguntasActuales =
                evaluacion.getPreguntas();

        if (preguntasActuales == null) {
            preguntasActuales =
                    new ArrayList<>();

            evaluacion.setPreguntas(
                    preguntasActuales
            );
        }

        preguntasActuales.clear();

        List<Pregunta> preguntasNuevas =
                construirPreguntas(
                        preguntasDTO,
                        evaluacion
                );

        preguntasActuales.addAll(
                preguntasNuevas
        );

        Evaluacion actualizada =
                evaluacionRepository.save(
                        evaluacion
                );

        log.info(
                "[DB] Evaluación actualizada. "
                        + "evaluacionId={}, vacanteId={}, "
                        + "preguntas={}, operador={}",
                actualizada.getId(),
                vacanteId,
                preguntasNuevas.size(),
                operador
        );

        return EvaluacionMapper.toResponse(
                actualizada
        );
    }

    /*
     * Construye preguntas nuevas.
     *
     * Al editar no reutilizamos los ID antiguos:
     * se eliminan las preguntas previas y se insertan
     * nuevamente, únicamente cuando no hay respuestas.
     */
    private List<Pregunta> construirPreguntas(
            List<PreguntaDTO> preguntasDTO,
            Evaluacion evaluacion
    ) {
        List<Pregunta> preguntas =
                new ArrayList<>();

        for (
                int indice = 0;
                indice < preguntasDTO.size();
                indice++
        ) {
            PreguntaDTO dto =
                    preguntasDTO.get(indice);

            int numeroPregunta =
                    indice + 1;

            if (dto == null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "La pregunta "
                                + numeroPregunta
                                + " no contiene información."
                );
            }

            String tipo =
                    normalizarTextoObligatorio(
                            dto.tipoPregunta(),
                            "El tipo de la pregunta "
                                    + numeroPregunta
                                    + " es obligatorio."
                    )
                            .toUpperCase();

            if (
                    !"MULTIPLE".equals(tipo) &&
                            !"VERDADERO_FALSO".equals(tipo)
            ) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "El tipo de la pregunta "
                                + numeroPregunta
                                + " no es válido."
                );
            }

            String enunciado =
                    normalizarTextoObligatorio(
                            dto.enunciado(),
                            "El enunciado de la pregunta "
                                    + numeroPregunta
                                    + " es obligatorio."
                    );

            String respuestaCorrecta =
                    normalizarTextoObligatorio(
                            dto.respuestaCorrecta(),
                            "La respuesta correcta de la pregunta "
                                    + numeroPregunta
                                    + " es obligatoria."
                    )
                            .toUpperCase();

            Pregunta pregunta =
                    new Pregunta();

            pregunta.setEvaluacion(
                    evaluacion
            );

            pregunta.setTipoPregunta(
                    tipo
            );

            pregunta.setEnunciado(
                    enunciado
            );

            if (
                    "VERDADERO_FALSO".equals(
                            tipo
                    )
            ) {
                if (
                        !"A".equals(
                                respuestaCorrecta
                        ) &&
                                !"B".equals(
                                        respuestaCorrecta
                                )
                ) {
                    throw new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "La pregunta "
                                    + numeroPregunta
                                    + " de verdadero o falso "
                                    + "solo puede tener como clave A o B."
                    );
                }

                pregunta.setOpcionA(
                        "VERDADERO"
                );

                pregunta.setOpcionB(
                        "FALSO"
                );

                pregunta.setOpcionC(
                        "N/A"
                );

                pregunta.setOpcionD(
                        "N/A"
                );
            } else {
                String opcionA =
                        normalizarTextoObligatorio(
                                dto.opcionA(),
                                "La alternativa A de la pregunta "
                                        + numeroPregunta
                                        + " es obligatoria."
                        );

                String opcionB =
                        normalizarTextoObligatorio(
                                dto.opcionB(),
                                "La alternativa B de la pregunta "
                                        + numeroPregunta
                                        + " es obligatoria."
                        );

                String opcionC =
                        normalizarTextoOpcional(
                                dto.opcionC()
                        );

                String opcionD =
                        normalizarTextoOpcional(
                                dto.opcionD()
                        );

                if (
                        !"A".equals(
                                respuestaCorrecta
                        ) &&
                                !"B".equals(
                                        respuestaCorrecta
                                ) &&
                                !"C".equals(
                                        respuestaCorrecta
                                ) &&
                                !"D".equals(
                                        respuestaCorrecta
                                )
                ) {
                    throw new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "La clave de la pregunta "
                                    + numeroPregunta
                                    + " debe ser A, B, C o D."
                    );
                }

                if (
                        "C".equals(
                                respuestaCorrecta
                        ) &&
                                opcionC == null
                ) {
                    throw new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "La pregunta "
                                    + numeroPregunta
                                    + " usa la clave C, pero "
                                    + "la alternativa C está vacía."
                    );
                }

                if (
                        "D".equals(
                                respuestaCorrecta
                        ) &&
                                opcionD == null
                ) {
                    throw new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "La pregunta "
                                    + numeroPregunta
                                    + " usa la clave D, pero "
                                    + "la alternativa D está vacía."
                    );
                }

                pregunta.setOpcionA(
                        opcionA
                );

                pregunta.setOpcionB(
                        opcionB
                );

                pregunta.setOpcionC(
                        opcionC == null
                                ? "N/A"
                                : opcionC
                );

                pregunta.setOpcionD(
                        opcionD == null
                                ? "N/A"
                                : opcionD
                );
            }

            pregunta.setRespuestaCorrecta(
                    respuestaCorrecta
            );

            preguntas.add(
                    pregunta
            );
        }

        return preguntas;
    }

    private void validarEvaluacion(
            String titulo,
            Long vacanteId,
            List<PreguntaDTO> preguntasDTO
    ) {
        if (
                vacanteId == null
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Debe indicar la vacante de la evaluación."
            );
        }

        if (
                titulo == null ||
                        titulo.trim().isEmpty()
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El título de la evaluación es obligatorio."
            );
        }

        if (
                titulo.trim().length() > 150
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El título de la evaluación no puede superar los 150 caracteres."
            );
        }

        if (
                preguntasDTO == null ||
                        preguntasDTO.isEmpty()
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La evaluación debe contener al menos una pregunta."
            );
        }
    }

    private String normalizarTextoObligatorio(
            String valor,
            String mensaje
    ) {
        if (
                valor == null ||
                        valor.trim().isEmpty()
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    mensaje
            );
        }

        return valor.trim();
    }

    private String normalizarTextoOpcional(
            String valor
    ) {
        if (valor == null) {
            return null;
        }

        String texto =
                valor.trim();

        return texto.isEmpty()
                ? null
                : texto;
    }

    private Evaluacion buscarPorId(
            Long evaluacionId
    ) {
        return evaluacionRepository
                .findById(evaluacionId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Evaluación no encontrada"
                        )
                );
    }

    private Evaluacion buscarPorVacante(
            Long vacanteId
    ) {
        return evaluacionRepository
                .findByVacanteId(vacanteId)
                .orElseThrow(() -> {
                    log.info(
                            "[EVALUACION] Vacante sin examen. "
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