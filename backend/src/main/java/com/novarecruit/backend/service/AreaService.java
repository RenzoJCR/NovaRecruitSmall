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

    /*
     * Crea una nueva área tecnológica.
     */
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
        area.setCreadoPor(operador);

        Area guardada =
                areaRepository.save(area);

        return AreaMapper.toResponse(
                guardada
        );
    }

    /*
     * Actualiza únicamente los datos editables:
     * - nombre
     * - descripción
     *
     * No modifica:
     * - creadoPor
     * - fechaCreacion
     * - vacantes asociadas
     */
    @Transactional
    public AreaResponse actualizarArea(
            Long areaId,
            AreaRequest request
    ) {
        validarRequest(request);

        Area area = areaRepository
                .findById(areaId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "El área tecnológica no existe."
                        )
                );

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

        Area actualizada =
                areaRepository.save(area);

        return AreaMapper.toResponse(
                actualizada
        );
    }

    /*
     * Lista todas las áreas registradas.
     */
    @Transactional(readOnly = true)
    public List<AreaResponse> listarTodas() {
        return areaRepository
                .findAll()
                .stream()
                .map(AreaMapper::toResponse)
                .toList();
    }

    /*
     * Validación del backend.
     *
     * Aunque React ya valida, el backend también
     * debe protegerse frente a llamadas directas.
     */
    private void validarRequest(
            AreaRequest request
    ) {
        if (
                request == null ||
                        request.nombre() == null ||
                        request.nombre().trim().isEmpty()
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