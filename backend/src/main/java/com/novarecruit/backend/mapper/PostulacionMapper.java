package com.novarecruit.backend.mapper;

import com.novarecruit.backend.dto.PostulacionResponse;
import com.novarecruit.backend.entity.Postulacion;

public class PostulacionMapper {

    public static PostulacionResponse toResponse(Postulacion postulacion) {
        if (postulacion == null) return null;

        String nombreCompleto = postulacion.getUsuario().getNombres() + " " + postulacion.getUsuario().getApellidos();

        return new PostulacionResponse(
            postulacion.getId(),
            postulacion.getUsuario().getId(),
            nombreCompleto,                     // Nombre unificado legible para el front
            postulacion.getVacante().getId(),
            postulacion.getVacante().getTitulo(),
            postulacion.getVacante().getDescripcion(),
            postulacion.getVacante().getArea().getNombre(),
            postulacion.getVacante().getModalidad(),
            postulacion.getVacante().getSalario(),
            postulacion.getVacante().getEvaluacion() != null ? postulacion.getVacante().getEvaluacion().getId() : null,
            postulacion.getEstado(),
            postulacion.getFechaPostulacion(),
            postulacion.getFechaEvaluacion(),
            postulacion.getPuntajeTecnico(),
            postulacion.getRespuestasPostulante() != null ? postulacion.getRespuestasPostulante() : null, // Mantiene el JSON String plano
            postulacion.getComentariosInternos()
        );
    }
}