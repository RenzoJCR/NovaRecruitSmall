package com.novarecruit.backend.repository;

import com.novarecruit.backend.entity.Pregunta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PreguntaRepository extends JpaRepository<Pregunta, Long> {
    
    // Lista todas las preguntas asociadas a un examen estructurado
    List<Pregunta> findByEvaluacionId(Long evaluacionId);
}