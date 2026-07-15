package com.novarecruit.backend.entity;

import jakarta.persistence.*;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(
        name = "respuestas_postulantes",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_respuesta_postulacion_pregunta",
                        columnNames = {
                                "postulacion_id",
                                "pregunta_id"
                        }
                )
        },
        indexes = {
                @Index(
                        name = "idx_respuesta_postulacion",
                        columnList = "postulacion_id"
                ),
                @Index(
                        name = "idx_respuesta_pregunta",
                        columnList = "pregunta_id"
                )
        }
)
public class RespuestaPostulante {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(
            fetch = FetchType.LAZY,
            optional = false
    )
    @JoinColumn(
            name = "postulacion_id",
            nullable = false
    )
    private Postulacion postulacion;

    @ManyToOne(
            fetch = FetchType.LAZY,
            optional = false
    )
    @JoinColumn(
            name = "pregunta_id",
            nullable = false
    )
    private Pregunta pregunta;

    @Column(
            name = "respuesta_seleccionada",
            nullable = false,
            length = 10
    )
    private String respuestaSeleccionada;

    @Column(
            name = "es_correcta",
            nullable = false
    )
    private boolean correcta;

    /*
     * Valor máximo que tenía la pregunta al rendirse.
     * Permite conservar el cálculo histórico.
     */
    @Column(
            name = "puntaje_asignado",
            nullable = false
    )
    private Integer puntajeAsignado;

    @Column(
            name = "puntaje_obtenido",
            nullable = false
    )
    private Integer puntajeObtenido;

    @Column(
            name = "fecha_respuesta",
            nullable = false
    )
    private LocalDateTime fechaRespuesta;

    @PrePersist
    private void asignarFecha() {
        if (fechaRespuesta == null) {
            fechaRespuesta = LocalDateTime.now();
        }
    }
}