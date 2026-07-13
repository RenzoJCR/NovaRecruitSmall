package com.novarecruit.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "postulaciones", uniqueConstraints = {
    @UniqueConstraint(name = "uk_usuario_vacante", columnNames = {"usuario_id", "vacante_id"})
})
@Data
public class Postulacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vacante_id", nullable = false)
    private Vacante vacante;

    @Column(name = "estado", nullable = false, length = 50)
    private String estado; // POSTULADO, EVALUADO, CONTRATADO, RECHAZADO

    @Column(name = "fecha_postulacion", nullable = false)
    private LocalDateTime fechaPostulacion; // Base para Métrica de Tiempo 1

    @Column(name = "fecha_evaluacion")
    private LocalDateTime fechaEvaluacion;   // Base para Métrica de Tiempo 2

    @Column(name = "puntaje_tecnico")
    private Integer puntajeTecnico; // Sumatoria final calculada en el backend

    @Column(name = "respuestas_postulante", columnDefinition = "TEXT")
    private String respuestasPostulante; // Objeto JSON serializado como texto plano

    @Column(name = "comentarios_internos", columnDefinition = "TEXT")
    private String comentariosInternos;

    @PrePersist
    protected void onCreate() {
        if (this.fechaPostulacion == null) {
            this.fechaPostulacion = LocalDateTime.now();
        }
        if (this.estado == null) {
            this.estado = "POSTULADO";
        }
    }
}