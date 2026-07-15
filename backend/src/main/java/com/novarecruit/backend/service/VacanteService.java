package com.novarecruit.backend.service;

import com.novarecruit.backend.dto.VacanteRequest;
import com.novarecruit.backend.dto.VacanteResponse;
import com.novarecruit.backend.entity.Area;
import com.novarecruit.backend.entity.Usuario;
import com.novarecruit.backend.entity.Vacante;
import com.novarecruit.backend.mapper.VacanteMapper;
import com.novarecruit.backend.repository.AreaRepository;
import com.novarecruit.backend.repository.UsuarioRepository;
import com.novarecruit.backend.repository.VacanteRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class VacanteService {

    private static final Logger log =
            LoggerFactory.getLogger(
                    VacanteService.class
            );

    private final VacanteRepository vacanteRepository;
    private final AreaRepository areaRepository;
    private final UsuarioRepository usuarioRepository;

    public VacanteService(
            VacanteRepository vacanteRepository,
            AreaRepository areaRepository,
            UsuarioRepository usuarioRepository
    ) {
        this.vacanteRepository =
                vacanteRepository;

        this.areaRepository =
                areaRepository;

        this.usuarioRepository =
                usuarioRepository;
    }

    /*
     * Crear vacante.
     *
     * Solo permite utilizar áreas activas.
     */
    @Transactional
    public VacanteResponse crearVacante(
            VacanteRequest request,
            String operador
    ) {
        Area area = areaRepository
                .findById(request.areaId())
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "El área tecnológica no fue encontrada"
                        )
                );

        if (!Boolean.TRUE.equals(
                area.getActivo()
        )) {
            log.warn(
                    "[VACANTE] Intento de crear una vacante "
                            + "con un área inactiva. "
                            + "areaId={}, areaNombre='{}', operador={}",
                    area.getId(),
                    area.getNombre(),
                    operador
            );

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "No se puede crear una vacante con un área inactiva."
            );
        }

        Usuario administrador =
                usuarioRepository
                        .findByCorreo(operador)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "El administrador autenticado no fue encontrado"
                                )
                        );

        Vacante vacante = new Vacante();

        vacante.setArea(area);
        vacante.setAdministrador(
                administrador
        );

        vacante.setTitulo(
                request.titulo().trim()
        );

        vacante.setDescripcion(
                request.descripcion().trim()
        );

        vacante.setModalidad(
                request.modalidad()
                        .toUpperCase()
                        .trim()
        );

        vacante.setSalario(
                request.salario()
        );

        vacante.setCreadoPor(
                operador
        );

        Vacante guardada =
                vacanteRepository.save(
                        vacante
                );

        log.info(
                "[DB] Vacante guardada en MySQL. "
                        + "vacanteId={}, titulo='{}', "
                        + "estado={}, administrador={}",
                guardada.getId(),
                guardada.getTitulo(),
                guardada.getEstado(),
                operador
        );

        return VacanteMapper.toResponse(
                guardada
        );
    }

    /*
     * Editar vacante.
     *
     * Campos permitidos:
     * - área
     * - título
     * - descripción
     * - modalidad
     * - salario
     *
     * No modifica:
     * - administrador
     * - creadoPor
     * - fechaCreacion
     * - estado
     * - evaluación
     * - postulaciones
     */
    @Transactional
    public VacanteResponse actualizarVacante(
            Long vacanteId,
            VacanteRequest request,
            String operador
    ) {
        Vacante vacante =
                vacanteRepository
                        .findById(vacanteId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Vacante no encontrada"
                                )
                        );

        Area areaSolicitada =
                areaRepository
                        .findById(request.areaId())
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "El área tecnológica no fue encontrada"
                                )
                        );

        /*
         * Se permite conservar el área actual aunque
         * posteriormente haya sido desactivada.
         *
         * Sin embargo, para cambiar hacia otra área,
         * esa nueva área obligatoriamente debe estar activa.
         */
        boolean conservaMismaArea =
                vacante.getArea()
                        .getId()
                        .equals(
                                areaSolicitada.getId()
                        );

        if (
                !conservaMismaArea &&
                        !Boolean.TRUE.equals(
                                areaSolicitada.getActivo()
                        )
        ) {
            log.warn(
                    "[VACANTE] Intento de cambiar una vacante "
                            + "hacia un área inactiva. "
                            + "vacanteId={}, areaId={}, operador={}",
                    vacanteId,
                    areaSolicitada.getId(),
                    operador
            );

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "No se puede trasladar la vacante hacia un área inactiva."
            );
        }

        vacante.setArea(
                areaSolicitada
        );

        vacante.setTitulo(
                request.titulo().trim()
        );

        vacante.setDescripcion(
                request.descripcion().trim()
        );

        vacante.setModalidad(
                request.modalidad()
                        .toUpperCase()
                        .trim()
        );

        vacante.setSalario(
                request.salario()
        );

        vacante.setModificadoPor(
                operador
        );

        Vacante actualizada =
                vacanteRepository.save(
                        vacante
                );

        log.info(
                "[DB] Vacante actualizada en MySQL. "
                        + "vacanteId={}, titulo='{}', "
                        + "areaId={}, operador={}",
                actualizada.getId(),
                actualizada.getTitulo(),
                actualizada.getArea().getId(),
                operador
        );

        return VacanteMapper.toResponse(
                actualizada
        );
    }

    /*
     * Portal público y postulante:
     * solamente muestra vacantes activas.
     */
    @Transactional(readOnly = true)
    public List<VacanteResponse>
    listarActivas() {

        List<VacanteResponse> vacantes =
                vacanteRepository
                        .findByEstadoOrderByFechaCreacionDesc(
                                "ACTIVA"
                        )
                        .stream()
                        .map(
                                VacanteMapper::toResponse
                        )
                        .toList();

        log.info(
                "[VACANTE] Consulta pública completada. "
                        + "vacantesActivas={}",
                vacantes.size()
        );

        return vacantes;
    }

    /*
     * Panel administrativo:
     * muestra vacantes activas y cerradas.
     */
    @Transactional(readOnly = true)
    public List<VacanteResponse>
    listarTodasAdmin() {

        List<VacanteResponse> vacantes =
                vacanteRepository
                        .findAllByOrderByFechaCreacionDesc()
                        .stream()
                        .map(
                                VacanteMapper::toResponse
                        )
                        .toList();

        log.info(
                "[VACANTE] Consulta administrativa completada. "
                        + "vacantesTotales={}",
                vacantes.size()
        );

        return vacantes;
    }

    /*
     * El detalle público solo puede mostrar
     * una vacante activa.
     */
    @Transactional(readOnly = true)
    public VacanteResponse obtenerActivaPorId(
            Long id
    ) {
        Vacante vacante =
                vacanteRepository
                        .findById(id)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Vacante no encontrada"
                                )
                        );

        if (
                !"ACTIVA".equalsIgnoreCase(
                        vacante.getEstado()
                )
        ) {
            log.warn(
                    "[VACANTE] Intento de consultar públicamente "
                            + "una vacante no activa. "
                            + "vacanteId={}, estado={}",
                    id,
                    vacante.getEstado()
            );

            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "La vacante no se encuentra disponible"
            );
        }

        return VacanteMapper.toResponse(
                vacante
        );
    }

    @Transactional
    public VacanteResponse cambiarEstado(
            Long id,
            String nuevoEstado,
            String operador
    ) {
        Vacante vacante =
                vacanteRepository
                        .findById(id)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Vacante no encontrada"
                                )
                        );

        if (
                nuevoEstado == null ||
                        nuevoEstado.isBlank()
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Debe indicar el nuevo estado de la vacante"
            );
        }

        String estadoNormalizado =
                nuevoEstado
                        .toUpperCase()
                        .trim();

        if (
                !"ACTIVA".equals(
                        estadoNormalizado
                ) &&
                        !"CERRADA".equals(
                                estadoNormalizado
                        )
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El estado de la vacante debe ser ACTIVA o CERRADA"
            );
        }

        String estadoAnterior =
                vacante.getEstado();

        vacante.setEstado(
                estadoNormalizado
        );

        vacante.setModificadoPor(
                operador
        );

        Vacante guardada =
                vacanteRepository.save(
                        vacante
                );

        log.info(
                "[DB] Estado de vacante actualizado en MySQL. "
                        + "vacanteId={}, estadoAnterior={}, "
                        + "estadoNuevo={}, operador={}",
                guardada.getId(),
                estadoAnterior,
                guardada.getEstado(),
                operador
        );

        return VacanteMapper.toResponse(
                guardada
        );
    }
}