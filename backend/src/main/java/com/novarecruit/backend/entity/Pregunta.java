package com.novarecruit.backend.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "preguntas")
@Data
public class Pregunta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evaluacion_id", nullable = false)
    private Evaluacion evaluacion;

    @Column(name = "tipo_pregunta", nullable = false, length = 50)
    private String tipoPregunta; // 'MULTIPLE' o 'VERDADERO_FALSO'

    @Column(name = "enunciado", nullable = false, columnDefinition = "TEXT")
    private String enunciado;

    @Column(name = "opcion_a")
    private String opcionA;

    @Column(name = "opcion_b")
    private String opcionB;

    @Column(name = "opcion_c")
    private String opcionC;

    @Column(name = "opcion_d")
    private String opcionD;

    @Column(name = "respuesta_correcta", nullable = false, length = 10)
    private String respuestaCorrecta; // 'A', 'B', 'C' o 'D'
}