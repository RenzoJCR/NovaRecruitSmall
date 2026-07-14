package com.novarecruit.backend.config;

import com.novarecruit.backend.entity.Usuario;
import com.novarecruit.backend.repository.UsuarioRepository;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
public class JwtFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtFilter.class);

    private final JwtUtil jwtUtil;
    private final UsuarioRepository usuarioRepository;

    public JwtFilter(JwtUtil jwtUtil, UsuarioRepository usuarioRepository) {
        this.jwtUtil = jwtUtil;
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String authorizationHeader = request.getHeader("Authorization");

        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String jwt = authorizationHeader.substring(7).trim();

        try {
            String correo = jwtUtil.extraerCorreo(jwt);

            if (SecurityContextHolder.getContext().getAuthentication() == null) {
                Usuario usuario = usuarioRepository.findByCorreo(correo)
                        .orElseThrow(() -> new JwtException("El usuario del token ya no existe"));

                if (!usuario.isActivo()) {
                    throw new JwtException("El usuario se encuentra inactivo");
                }

                String rolToken = jwtUtil.extraerRol(jwt);
                Long userIdToken = jwtUtil.extraerUserId(jwt);

                boolean datosCoinciden = usuario.getRol().equals(rolToken)
                        && usuario.getId().equals(userIdToken);

                if (datosCoinciden && jwtUtil.esTokenValido(jwt, usuario.getCorreo())) {
                    var autoridad = new SimpleGrantedAuthority("ROLE_" + usuario.getRol());
                    var autenticacion = new UsernamePasswordAuthenticationToken(
                            usuario.getCorreo(),
                            null,
                            Collections.singletonList(autoridad));

                    autenticacion.setDetails(
                            new WebAuthenticationDetailsSource().buildDetails(request));

                    SecurityContextHolder.getContext().setAuthentication(autenticacion);
                    log.debug("[JWT] Petición autenticada: correo={}, rol={}, ruta={}",
                            usuario.getCorreo(), usuario.getRol(), request.getRequestURI());
                }
            }
        } catch (JwtException | IllegalArgumentException ex) {
            SecurityContextHolder.clearContext();
            log.warn("[JWT] Token rechazado en {}: {}", request.getRequestURI(), ex.getMessage());
        }

        filterChain.doFilter(request, response);
    }
}
