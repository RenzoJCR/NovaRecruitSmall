package com.novarecruit.backend.config;

import com.novarecruit.backend.entity.Area;
import com.novarecruit.backend.entity.Usuario;
import com.novarecruit.backend.repository.AreaRepository;
import com.novarecruit.backend.repository.UsuarioRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final AreaRepository areaRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UsuarioRepository usuarioRepository, AreaRepository areaRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.areaRepository = areaRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        // 1. SEMILLERO DE CATEGORÍAS (ÁREAS)
        if (areaRepository.count() == 0) {
            Area area1 = new Area();
            area1.setNombre("Desarrollo Backend");
            area1.setDescripcion("Puestos relacionados con Spring Boot, Node.js, bases de datos y arquitectura cloud.");
            area1.setCreadoPor("SISTEMA");
            areaRepository.save(area1);

            Area area2 = new Area();
            area2.setNombre("Desarrollo Frontend");
            area2.setDescripcion("Puestos enfocados en interfaces de usuario con React, Angular y diseño UX/UI.");
            area2.setCreadoPor("SISTEMA");
            areaRepository.save(area2);
        }

        // 2. SEMILLERO DE USUARIOS (ADMINISTRADOR CORE)
        if (usuarioRepository.count() == 0) {
            Usuario admin = new Usuario();
            admin.setNombres("Admin");
            admin.setApellidos("NovaRecruit");
            admin.setCorreo("admin@novarecruit.com");
            // Guardamos la contraseña encriptada de forma segura
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setRol("ADMINISTRADOR");
            admin.setCreadoPor("SISTEMA");
            admin.setActivo(true);
            
            usuarioRepository.save(admin);
        }
    }
}