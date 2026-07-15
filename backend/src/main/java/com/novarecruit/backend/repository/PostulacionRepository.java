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
    List<Postulacion> findByUsuarioId(
            Long usuarioId
    );

    // Postulantes asociados a una vacante.
    List<Postulacion> findByVacanteId(
            Long vacanteId
    );

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

    /*
     * MÉTRICA 1:
     * Volumen de Atracción TI.
     *
     * Cuenta las postulaciones por mes durante los
     * últimos seis meses, incluyendo el mes actual.
     */
    @Query(
            value = """
                    SELECT
                        YEAR(fecha_postulacion) AS anio,
                        MONTH(fecha_postulacion) AS mes,
                        COUNT(*) AS cantidad
                    FROM postulaciones
                    WHERE fecha_postulacion >= DATE_SUB(
                        DATE_FORMAT(CURDATE(), '%Y-%m-01'),
                        INTERVAL 5 MONTH
                    )
                    GROUP BY
                        YEAR(fecha_postulacion),
                        MONTH(fecha_postulacion)
                    ORDER BY
                        anio ASC,
                        mes ASC
                    """,
            nativeQuery = true
    )
    List<Map<String, Object>>
    obtenerMetricaAtraccionTiempo();

    /*
     * MÉTRICA 2:
     * Índice de Aptitud Técnica.
     *
     * Calcula el promedio mensual de las notas y
     * devuelve también cuántos exámenes fueron
     * procesados durante cada mes.
     */
    @Query(
            value = """
                    SELECT
                        YEAR(fecha_evaluacion) AS anio,
                        MONTH(fecha_evaluacion) AS mes,
                        COUNT(*) AS evaluaciones,
                        ROUND(
                            AVG(puntaje_tecnico),
                            2
                        ) AS promedio
                    FROM postulaciones
                    WHERE fecha_evaluacion IS NOT NULL
                      AND puntaje_tecnico IS NOT NULL
                      AND fecha_evaluacion >= DATE_SUB(
                          DATE_FORMAT(CURDATE(), '%Y-%m-01'),
                          INTERVAL 5 MONTH
                      )
                    GROUP BY
                        YEAR(fecha_evaluacion),
                        MONTH(fecha_evaluacion)
                    ORDER BY
                        anio ASC,
                        mes ASC
                    """,
            nativeQuery = true
    )
    List<Map<String, Object>>
    obtenerMetricaRendimientoTiempo();
}