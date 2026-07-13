package com.novarecruit.backend.repository;

import com.novarecruit.backend.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    
    // Busca al usuario por su correo electrónico (Clave para validar el Login con JWT)
    Optional<Usuario> findByCorreo(String correo);

    // Devuelve verdadero o falso si el correo ya existe (Evita duplicados al crear usuarios)
    boolean existsByCorreo(String correo);
}