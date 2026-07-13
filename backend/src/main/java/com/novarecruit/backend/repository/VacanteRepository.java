package com.novarecruit.backend.repository;

import com.novarecruit.backend.entity.Vacante;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface VacanteRepository extends JpaRepository<Vacante, Long> {
    
    // Filtra las vacantes según el Área (Categoría/Agrupación) seleccionada
    List<Vacante> findByAreaId(Long areaId);

    // Permite listar únicamente las vacantes que están 'ACTIVAS' para los postulantes
    List<Vacante> findByEstado(String estado);
}