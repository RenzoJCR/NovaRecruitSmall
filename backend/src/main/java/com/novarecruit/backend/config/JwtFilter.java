package com.novarecruit.backend.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
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

    private final JwtUtil jwtUtil;

    public JwtFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        // 1. Extraemos la cabecera HTTP llamada 'Authorization'
        String authorizationHeader = request.getHeader("Authorization");

        String correo = null;
        String jwt = null;

        // 2. El estándar dicta que el token debe empezar con la palabra "Bearer "
        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            jwt = authorizationHeader.substring(7);
            try {
                correo = jwtUtil.extraerCorreo(jwt);
            } catch (Exception e) {
                // Si el token es inválido o fue manipulado, no hacemos nada y la petición será rebotada
            }
        }

        // 3. Si el token tiene un correo válido y el usuario no está ya autenticado en el hilo actual
        if (correo != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            String rol = jwtUtil.extraerRol(jwt);

            if (jwtUtil.esTokenValido(jwt, correo)) {
                // Creamos la autoridad de Spring Security basada en el rol del JWT
                var autoridad = new SimpleGrantedAuthority("ROLE_" + rol);
                
                var authToken = new UsernamePasswordAuthenticationToken(
                        correo, null, Collections.singletonList(autoridad));
                
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                
                // Autenticamos al usuario en el sistema
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        // 4. Dejamos que la petición continúe su camino hacia el filtro siguiente o el controlador
        filterChain.doFilter(request, response);
    }
}