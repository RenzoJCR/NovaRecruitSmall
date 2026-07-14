package com.novarecruit.backend.config;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtFilter jwtFilter;
    private final List<String> allowedOrigins;

    public SecurityConfig(
            JwtFilter jwtFilter,
            @Value("${app.cors.allowed-origins:http://localhost:5173,http://127.0.0.1:5173}")
            String allowedOrigins) {
        this.jwtFilter = jwtFilter;
        this.allowedOrigins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isBlank())
                .toList();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint((request, response, exception) -> {
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                            response.getWriter().write("{\"message\":\"Debe iniciar sesión para acceder a este recurso\"}");
                        })
                        .accessDeniedHandler((request, response, exception) -> {
                            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                            response.getWriter().write("{\"message\":\"No cuenta con permisos para realizar esta acción\"}");
                        }))
                        .authorizeHttpRequests(auth -> auth

                                // Autenticación pública.
                                .requestMatchers("/api/auth/**")
                                .permitAll()
                                
                                // Permite que Spring devuelva correctamente errores 400, 404, 409, etc.
                                // No representa un endpoint funcional del sistema.
                                .requestMatchers("/error")
                                .permitAll()


                                // Actuator temporalmente público.
                                .requestMatchers("/actuator/**")
                                .permitAll()

                                // Handshake SockJS.
                                .requestMatchers("/ws/**")
                                .permitAll()

                                // Áreas administrativas.
                                .requestMatchers("/api/areas/**")
                                .hasRole("ADMINISTRADOR")

                                // Examen completo para administrador.
                                .requestMatchers(
                                        HttpMethod.GET,
                                        "/api/evaluaciones/admin/vacante/**"
                                )
                                .hasRole("ADMINISTRADOR")

                                // Examen seguro para postulante.
                                .requestMatchers(
                                        HttpMethod.GET,
                                        "/api/evaluaciones/vacante/**"
                                )
                                .hasRole("POSTULANTE")

                                // Gestión administrativa de evaluaciones.
                                .requestMatchers(
                                        HttpMethod.GET,
                                        "/api/evaluaciones"
                                )
                                .hasRole("ADMINISTRADOR")

                                .requestMatchers(
                                        HttpMethod.POST,
                                        "/api/evaluaciones"
                                )
                                .hasRole("ADMINISTRADOR")

                                .requestMatchers("/api/evaluaciones/**")
                                .hasRole("ADMINISTRADOR")

                                // Usuarios.
                                .requestMatchers("/api/usuarios/**")
                                .hasRole("ADMINISTRADOR")

                                // Catálogo administrativo de vacantes.
                                .requestMatchers(
                                        HttpMethod.GET,
                                        "/api/vacantes/admin",
                                        "/api/vacantes/admin/**"
                                )
                                .hasRole("ADMINISTRADOR")

                                // Catálogo público de vacantes activas.
                                .requestMatchers(
                                        HttpMethod.GET,
                                        "/api/vacantes",
                                        "/api/vacantes/*"
                                )
                                .permitAll()

                                // Creación y modificación de vacantes.
                                .requestMatchers("/api/vacantes/**")
                                .hasRole("ADMINISTRADOR")

                                // El resto requiere autenticación.
                                .anyRequest()
                                .authenticated()
                        )
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(allowedOrigins);
        configuration.setAllowedMethods(
                List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(
                List.of("Authorization", "Content-Type", "Cache-Control"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

}
