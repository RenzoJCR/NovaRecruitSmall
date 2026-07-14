package com.novarecruit.backend.repository;

import com.novarecruit.backend.entity.Vacante;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VacanteRepository
        extends JpaRepository<Vacante, Long> {

    // Vacantes pertenecientes a un área.
    List<Vacante> findByAreaId(Long areaId);

    // Portal público: solamente activas, ordenadas de la más reciente.
    List<Vacante> findByEstadoOrderByFechaCreacionDesc(
            String estado
    );

    // Panel administrativo: activas y cerradas.
    List<Vacante> findAllByOrderByFechaCreacionDesc();
}