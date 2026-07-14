package com.novarecruit.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.novarecruit.backend.entity.Postulacion;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public interface PostulacionRepository extends JpaRepository<Postulacion, Long> {
    // Historial: Permite a un Postulante ver todas sus aplicaciones
    List<Postulacion> findByUsuarioId(Long usuarioId);

    // Seguimiento: Permite al Administrador ver quiénes han aplicado a una Vacante específica
    List<Postulacion> findByVacanteId(Long vacanteId);

    // Seguridad: Valida si un usuario ya postuló a esa vacante concreta (Evita doble postulación)
    boolean existsByUsuarioIdAndVacanteId(Long usuarioId, Long vacanteId);

    // Seguridad: busca una postulación únicamente si pertenece al correo autenticado.
    Optional<Postulacion> findByIdAndUsuario_Correo(
            Long postulacionId,
            String correo
    );

    // Seguridad: verifica que el usuario autenticado haya postulado a la vacante.
    Optional<Postulacion> findByUsuario_CorreoAndVacante_Id(
            String correo,
            Long vacanteId
    );

    // MÉTRICA 1: Volumen de Atracción (Conteo de postulaciones agrupadas por día/fecha)
    @Query(value = "SELECT DATE(fecha_postulacion) as fecha, COUNT(*) as cantidad " +
                   "FROM postulaciones " +
                   "GROUP BY DATE(fecha_postulacion) " +
                   "ORDER BY fecha ASC", nativeQuery = true)
    List<Map<String, Object>> obtenerMetricaAtraccionTiempo();

    // MÉTRICA 2: Índice de Rendimiento (Promedio de notas de exámenes agrupado por fecha de evaluación)
    @Query(value = "SELECT DATE(fecha_evaluacion) as fecha, ROUND(AVG(puntaje_tecnico), 2) as promedio " +
                   "FROM postulaciones " +
                   "WHERE puntaje_tecnico IS NOT NULL " +
                   "GROUP BY DATE(fecha_evaluacion) " +
                   "ORDER BY fecha ASC", nativeQuery = true)
    List<Map<String, Object>> obtenerMetricaRendimientoTiempo();
}
