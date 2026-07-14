package com.novarecruit.backend.mapper;

import com.novarecruit.backend.dto.PostulacionResponse;
import com.novarecruit.backend.entity.Postulacion;

public class PostulacionMapper {

    private PostulacionMapper() {
    }

    public static PostulacionResponse toResponse(
            Postulacion postulacion) {

        if (postulacion == null) {
            return null;
        }

        String nombreCompleto =
                postulacion.getUsuario().getNombres()
                        + " "
                        + postulacion.getUsuario().getApellidos();

        Long evaluacionId =
                postulacion.getVacante().getEvaluacion() != null
                        ? postulacion
                        .getVacante()
                        .getEvaluacion()
                        .getId()
                        : null;

        return new PostulacionResponse(
                postulacion.getId(),
                postulacion.getUsuario().getId(),
                nombreCompleto,
                postulacion.getUsuario().getCorreo(),
                postulacion.getVacante().getId(),
                postulacion.getVacante().getTitulo(),
                postulacion.getVacante().getDescripcion(),
                postulacion.getVacante().getArea().getNombre(),
                postulacion.getVacante().getModalidad(),
                postulacion.getVacante().getSalario(),
                evaluacionId,
                postulacion.getEstado(),
                postulacion.getFechaPostulacion(),
                postulacion.getFechaEvaluacion(),
                postulacion.getPuntajeTecnico(),
                postulacion.getRespuestasPostulante()
        );
    }
}