package com.novarecruit.backend.service;

import com.novarecruit.backend.config.JwtUtil;
import com.novarecruit.backend.dto.AuthResponse;
import com.novarecruit.backend.dto.RegistroRequest;
import com.novarecruit.backend.entity.Usuario;
import com.novarecruit.backend.repository.UsuarioRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(
            UsuarioRepository usuarioRepository,
            PasswordEncoder passwordEncoder,
            JwtUtil jwtUtil) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    @Transactional
    public AuthResponse registrarPostulante(RegistroRequest request) {
        String correoNormalizado = normalizarCorreo(request.correo());

        if (usuarioRepository.existsByCorreo(correoNormalizado)) {
            log.warn("[AUTH] Registro rechazado: correo duplicado={}", correoNormalizado);
            throw new RuntimeException("El correo electrónico ya se encuentra registrado");
        }

        Usuario usuario = new Usuario();
        usuario.setNombres(request.nombres().trim());
        usuario.setApellidos(request.apellidos().trim());
        usuario.setCorreo(correoNormalizado);
        usuario.setPassword(passwordEncoder.encode(request.password()));
        usuario.setRol("POSTULANTE");
        usuario.setCreadoPor("AUTOREGISTRO");

        Usuario guardado = usuarioRepository.save(usuario);
        String token = jwtUtil.generarToken(
                guardado.getId(), guardado.getCorreo(), guardado.getRol());

        log.info("[AUTH] Postulante registrado: userId={}, correo={}, rol={}",
                guardado.getId(), guardado.getCorreo(), guardado.getRol());

        return crearRespuesta(guardado, token);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(String correo, String password) {
        String correoNormalizado = normalizarCorreo(correo);

        Usuario usuario = usuarioRepository.findByCorreo(correoNormalizado)
                .orElseThrow(() -> {
                    log.warn("[AUTH] Inicio de sesión fallido: correo no registrado={}",
                            correoNormalizado);
                    return new RuntimeException("Credenciales incorrectas");
                });

        if (!passwordEncoder.matches(password, usuario.getPassword())) {
            log.warn("[AUTH] Inicio de sesión fallido: contraseña incorrecta para {}",
                    correoNormalizado);
            throw new RuntimeException("Credenciales incorrectas");
        }

        if (!usuario.isActivo()) {
            log.warn("[AUTH] Inicio de sesión rechazado: usuario inactivo={}",
                    correoNormalizado);
            throw new RuntimeException("Usuario inactivo. Contacte al administrador.");
        }

        String token = jwtUtil.generarToken(
                usuario.getId(), usuario.getCorreo(), usuario.getRol());

        log.info("[AUTH] Inicio de sesión exitoso: userId={}, correo={}, rol={}",
                usuario.getId(), usuario.getCorreo(), usuario.getRol());

        return crearRespuesta(usuario, token);
    }

    private AuthResponse crearRespuesta(Usuario usuario, String token) {
        return new AuthResponse(
                token,
                usuario.getId(),
                usuario.getNombres(),
                usuario.getApellidos(),
                usuario.getCorreo(),
                usuario.getRol());
    }

    private String normalizarCorreo(String correo) {
        if (correo == null || correo.isBlank()) {
            throw new RuntimeException("El correo electrónico es obligatorio");
        }
        return correo.trim().toLowerCase();
    }
}
