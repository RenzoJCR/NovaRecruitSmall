package com.novarecruit.backend.repository;

import com.novarecruit.backend.entity.Evaluacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface EvaluacionRepository extends JpaRepository<Evaluacion, Long> {
    
    // Recupera el examen técnico asociado de forma única a una vacante específica
    Optional<Evaluacion> findByVacanteId(Long vacanteId);
}