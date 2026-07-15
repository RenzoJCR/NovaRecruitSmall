package com.novarecruit.backend.service;

import com.novarecruit.backend.dto.AreaRequest;
import com.novarecruit.backend.dto.AreaResponse;
import com.novarecruit.backend.entity.Area;
import com.novarecruit.backend.mapper.AreaMapper;
import com.novarecruit.backend.repository.AreaRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class AreaService {

    private final AreaRepository areaRepository;

    public AreaService(
            AreaRepository areaRepository
    ) {
        this.areaRepository = areaRepository;
    }

    @Transactional
    public AreaResponse crearArea(
            AreaRequest request,
            String operador
    ) {
        validarRequest(request);

        String nombre =
                request.nombre().trim();

        String descripcion =
                normalizarDescripcion(
                        request.descripcion()
                );

        if (
                areaRepository
                        .existsByNombreIgnoreCase(
                                nombre
                        )
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Ya existe un área tecnológica con ese nombre."
            );
        }

        Area area = new Area();
        area.setNombre(nombre);
        area.setDescripcion(descripcion);
        area.setActivo(true);
        area.setCreadoPor(operador);

        return AreaMapper.toResponse(
                areaRepository.save(area)
        );
    }

    @Transactional
    public AreaResponse actualizarArea(
            Long areaId,
            AreaRequest request
    ) {
        validarRequest(request);

        Area area =
                buscarArea(areaId);

        String nombre =
                request.nombre().trim();

        String descripcion =
                normalizarDescripcion(
                        request.descripcion()
                );

        boolean nombreRepetido =
                areaRepository
                        .existsByNombreIgnoreCaseAndIdNot(
                                nombre,
                                areaId
                        );

        if (nombreRepetido) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Ya existe otra área tecnológica con ese nombre."
            );
        }

        area.setNombre(nombre);
        area.setDescripcion(descripcion);

        return AreaMapper.toResponse(
                areaRepository.save(area)
        );
    }

    /*
     * Activa o desactiva un área.
     *
     * No elimina el registro y tampoco modifica
     * las vacantes que ya la utilizan.
     */
    @Transactional
    public AreaResponse cambiarEstado(
            Long areaId,
            boolean activo
    ) {
        Area area =
                buscarArea(areaId);

        area.setActivo(activo);

        return AreaMapper.toResponse(
                areaRepository.save(area)
        );
    }

    /*
     * Administración:
     * muestra activas e inactivas.
     */
    @Transactional(readOnly = true)
    public List<AreaResponse> listarTodas() {
        return areaRepository
                .findAllByOrderByNombreAsc()
                .stream()
                .map(AreaMapper::toResponse)
                .toList();
    }

    /*
     * Formularios de creación o edición de vacantes:
     * solo devuelve áreas disponibles.
     */
    @Transactional(readOnly = true)
    public List<AreaResponse> listarActivas() {
        return areaRepository
                .findByActivoTrueOrderByNombreAsc()
                .stream()
                .map(AreaMapper::toResponse)
                .toList();
    }

    private Area buscarArea(
            Long areaId
    ) {
        return areaRepository
                .findById(areaId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "El área tecnológica no existe."
                        )
                );
    }

    private void validarRequest(
            AreaRequest request
    ) {
        if (
                request == null ||
                        request.nombre() == null ||
                        request.nombre()
                                .trim()
                                .isEmpty()
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El nombre del área es obligatorio."
            );
        }

        String nombre =
                request.nombre().trim();

        if (
                nombre.length() < 3 ||
                        nombre.length() > 100
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El nombre debe tener entre 3 y 100 caracteres."
            );
        }

        if (
                !nombre.matches(
                        "^[\\p{L}0-9\\s&+./-]+$"
                )
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El nombre contiene caracteres no permitidos."
            );
        }

        if (
                !nombre.matches(
                        ".*\\p{L}.*"
                )
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El nombre debe contener letras."
            );
        }

        String descripcion =
                normalizarDescripcion(
                        request.descripcion()
                );

        if (descripcion != null) {
            if (
                    descripcion.length() < 10 ||
                            descripcion.length() > 255
            ) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "La descripción debe tener entre 10 y 255 caracteres."
                );
            }

            if (
                    !descripcion.matches(
                            "^[\\p{L}0-9\\s,.;:()&+./-]+$"
                    )
            ) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "La descripción contiene caracteres no permitidos."
                );
            }

            if (
                    !descripcion.matches(
                            ".*\\p{L}.*"
                    )
            ) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "La descripción debe contener texto válido."
                );
            }
        }
    }

    private String normalizarDescripcion(
            String descripcion
    ) {
        if (descripcion == null) {
            return null;
        }

        String descripcionLimpia =
                descripcion.trim();

        return descripcionLimpia.isEmpty()
                ? null
                : descripcionLimpia;
    }
}