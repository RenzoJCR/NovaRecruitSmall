package com.novarecruit.backend.repository;

import com.novarecruit.backend.entity.Area;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AreaRepository
        extends JpaRepository<Area, Long> {

    boolean existsByNombreIgnoreCase(
            String nombre
    );

    boolean existsByNombreIgnoreCaseAndIdNot(
            String nombre,
            Long id
    );

    /*
     * Administración:
     * devuelve áreas activas e inactivas.
     */
    List<Area> findAllByOrderByNombreAsc();

    /*
     * Formularios de vacantes:
     * devuelve solamente áreas activas.
     */
    List<Area> findByActivoTrueOrderByNombreAsc();
}