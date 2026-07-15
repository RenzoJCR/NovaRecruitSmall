package com.novarecruit.backend.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "areas")
@Data
public class Area {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "activo", nullable = false)
    private Boolean activo;

    @Column(name = "nombre", nullable = false, length = 100)
    private String nombre;

    @Column(name = "descripcion", columnDefinition = "TEXT")
    private String descripcion;

    @Column(
            name = "creado_por",
            nullable = false,
            updatable = false
    )
    private String creadoPor;

    @Column(
            name = "fecha_creacion",
            nullable = false,
            updatable = false
    )
    private LocalDateTime fechaCreacion;

    /*
     * Un área puede tener muchas vacantes.
     *
     * Desactivar un área no elimina ni modifica
     * las vacantes que ya están asociadas.
     */
    @OneToMany(mappedBy = "area")
    private List<Vacante> vacantes;

    @PrePersist
    protected void onCreate() {
        if (this.fechaCreacion == null) {
            this.fechaCreacion = LocalDateTime.now();
        }

        if (this.activo == null) {
            this.activo = true;
        }
    }
}