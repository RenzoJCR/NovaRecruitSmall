package com.novarecruit.backend.entity;

import java.time.LocalDateTime;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Table(name = "usuarios")
@Data
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nombres", nullable = false, length = 100)
    private String nombres;

    @Column(name = "apellidos", nullable = false, length = 100)
    private String apellidos;

    @Column(name = "correo", nullable = false, unique = true, length = 120)
    private String correo;

    @Column(name = "password", nullable = false, length = 255)
    private String password;

    @Column(name = "rol", nullable = false, length = 50)
    private String rol; // 'ADMINISTRADOR' o 'POSTULANTE'

    @Column(name = "cv_url", length = 255)
    private String cvUrl; // Atributo opcional (exclusivo del postulante)

    @Column(name = "creado_por", nullable = false)
    private String creadoPor;

    @Column(name = "fecha_creacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    // Si es Administrador: mapea las vacantes que ha publicado
    @OneToMany(mappedBy = "administrador")
    private List<Vacante> vacantesAdministradas;

    // Si es Postulante: mapea el historial de sus postulaciones enviadas
    @OneToMany(mappedBy = "usuario", cascade = CascadeType.ALL)
    private List<Postulacion> postulaciones;

    @Column(name = "activo", nullable = false)
    private boolean activo = true; // Por defecto, el usuario está activo

    @PrePersist
    protected void onCreate() {
        this.fechaCreacion = LocalDateTime.now();
    }
}