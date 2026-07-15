package com.novarecruit.backend.repository;

import com.novarecruit.backend.entity.RespuestaPostulante;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RespuestaPostulanteRepository
        extends JpaRepository<RespuestaPostulante, Long> {

    boolean existsByPostulacion_Id(
            Long postulacionId
    );

    List<RespuestaPostulante>
    findByPostulacion_IdOrderByPregunta_IdAsc(
            Long postulacionId
    );

    /*
     * Lo utilizaremos después para impedir editar
     * un examen que ya tenga respuestas.
     */
    boolean existsByPregunta_Evaluacion_Id(
            Long evaluacionId
    );
}