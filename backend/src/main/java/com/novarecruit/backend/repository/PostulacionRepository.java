package com.novarecruit.backend.repository;

import com.novarecruit.backend.entity.Postulacion;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public interface PostulacionRepository
        extends JpaRepository<Postulacion, Long> {

    // Historial del postulante.
    List<Postulacion> findByUsuarioId(Long usuarioId);

    // Postulantes asociados a una vacante.
    List<Postulacion> findByVacanteId(Long vacanteId);

    // Evita que un usuario postule dos veces a la misma vacante.
    boolean existsByUsuarioIdAndVacanteId(
            Long usuarioId,
            Long vacanteId
    );

    /*
     * Bloqueo pesimista:
     * mientras una solicitud está calificando esta postulación,
     * una segunda solicitud debe esperar.
     *
     * Al continuar, la segunda solicitud encontrará que el examen
     * ya fue evaluado y será rechazada.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Postulacion> findByIdAndUsuario_Correo(
            Long postulacionId,
            String correo
    );

    // Comprueba que el postulante esté asociado a la vacante.
    Optional<Postulacion> findByUsuario_CorreoAndVacante_Id(
            String correo,
            Long vacanteId
    );

    // MÉTRICA 1: Volumen de Atracción (Conteo de postulaciones agrupadas por día/fecha)
    @Query(value = """
            SELECT DATE(fecha_postulacion) AS fecha,
                   COUNT(*) AS cantidad
            FROM postulaciones
            GROUP BY DATE(fecha_postulacion)
            ORDER BY fecha ASC
            """, nativeQuery = true)
    List<Map<String, Object>> obtenerMetricaAtraccionTiempo();

    // MÉTRICA 2: Índice de Rendimiento (Promedio de notas de exámenes agrupado por fecha de evaluación)
    @Query(value = """
            SELECT DATE(fecha_evaluacion) AS fecha,
                   ROUND(AVG(puntaje_tecnico), 2) AS promedio
            FROM postulaciones
            WHERE puntaje_tecnico IS NOT NULL
            GROUP BY DATE(fecha_evaluacion)
            ORDER BY fecha ASC
            """, nativeQuery = true)
    List<Map<String, Object>> obtenerMetricaRendimientoTiempo();
}