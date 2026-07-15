package com.novarecruit.backend.repository;

import com.novarecruit.backend.entity.Area;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AreaRepository extends JpaRepository<Area, Long> {

    // Evita registrar dos áreas con el mismo nombre.
    boolean existsByNombreIgnoreCase(String nombre);

    // Permite validar nombres repetidos al editar,
    // ignorando el área que se está modificando.
    boolean existsByNombreIgnoreCaseAndIdNot(
            String nombre,
            Long id
    );
}