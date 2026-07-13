package com.novarecruit.backend.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.novarecruit.backend.config.JwtUtil;
import com.novarecruit.backend.dto.AuthResponse;
import com.novarecruit.backend.dto.RegistroRequest;
import com.novarecruit.backend.entity.Usuario;
import com.novarecruit.backend.repository.UsuarioRepository;

@Service
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    // Inyección de dependencias por constructor (Alineado a las buenas prácticas de Spring)
    public AuthService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    @Transactional
    public AuthResponse registrarPostulante(RegistroRequest request) {
        if (usuarioRepository.existsByCorreo(request.correo())) {
            throw new RuntimeException("El correo electrónico ya se encuentra registrado");
        }

        Usuario usuario = new Usuario();
        usuario.setNombres(request.nombres());
        usuario.setApellidos(request.apellidos());
        usuario.setCorreo(request.correo());
        
        // 1. Transformamos la clave en un Hash irreversible con BCrypt
        usuario.setPassword(passwordEncoder.encode(request.password())); 
        usuario.setRol("POSTULANTE");
        usuario.setCreadoPor("AUTOREGISTRO");

        Usuario guardado = usuarioRepository.save(usuario);
        
        // 2. Generamos un JWT que empaqueta su correo y su rol
        String token = jwtUtil.generarToken(guardado.getCorreo(), guardado.getRol());
        
        return new AuthResponse(
            token, 
            guardado.getId(), 
            guardado.getNombres(),
            guardado.getApellidos(), 
            guardado.getCorreo(), 
            guardado.getRol()
        );
    }

    @Transactional(readOnly = true)
    public AuthResponse login(String correo, String password) {
        Usuario usuario = usuarioRepository.findByCorreo(correo)
                .orElseThrow(() -> new RuntimeException("Credenciales incorrectas"));

        // 3. Comparamos el texto plano con el Hash de MySQL
        if (!passwordEncoder.matches(password, usuario.getPassword())) {
            throw new RuntimeException("Credenciales incorrectas");
        }
        if (!usuario.isActivo()) {
            throw new RuntimeException("Usuario inactivo. Contacte al administrador.");
        }

        // 4. El usuario es válido, le entregamos su token
        String token = jwtUtil.generarToken(usuario.getCorreo(), usuario.getRol());

        return new AuthResponse(
            token, 
            usuario.getId(), 
            usuario.getNombres(),
            usuario.getApellidos(), 
            usuario.getCorreo(), 
            usuario.getRol()
        );
    }
}