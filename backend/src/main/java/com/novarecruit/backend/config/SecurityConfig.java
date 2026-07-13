package com.novarecruit.backend.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
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

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtFilter jwtFilter;

    public SecurityConfig(JwtFilter jwtFilter) {
        this.jwtFilter = jwtFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable()) // Deshabilitamos CSRF porque usamos JWT (Stateless)
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Endpoints públicos (Cualquiera puede entrar aquí sin token)
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/actuator/**").permitAll() // Monitoreo
                .requestMatchers("/ws/**").permitAll() // Handshake SockJS/STOMP
                
                // Restricciones de negocio basadas en 2 roles únicos
                .requestMatchers("/api/areas/**").hasRole("ADMINISTRADOR")
                .requestMatchers(HttpMethod.GET, "/api/evaluaciones/vacante/**").hasAnyRole("ADMINISTRADOR", "POSTULANTE")
                .requestMatchers("/api/evaluaciones/**").hasRole("ADMINISTRADOR")
                .requestMatchers("/api/usuarios/**").hasRole("ADMINISTRADOR")
                .requestMatchers("/api/areas/**").hasRole("ADMINISTRADOR")
                
                // Las vacantes se pueden ver de forma pública, pero solo el Admin las puede crear
                .requestMatchers(HttpMethod.GET, "/api/vacantes/**").permitAll()
                .requestMatchers("/api/vacantes/**").hasRole("ADMINISTRADOR")
                
                // Cualquier otra transacción requiere estar autenticado
                .anyRequest().authenticated()
            )
            // Inyectamos nuestro filtro de JWT antes del filtro de autenticación por defecto
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // Gestion de origenes cruzados (CORS) para permitir que React consuma nuestro backend
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // Autorizamos explícitamente al puerto local de React
        configuration.setAllowedOrigins(List.of("http://localhost:5173", "http://127.0.0.1:5173"));
        
        // Habilitamos los verbos estándar HTTP que consumirá el cliente de Axios
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        
        // Permitimos las cabeceras comunes y la de Authorization para que pase el JWT
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "Cache-Control"));
        
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration); // Aplica la regla a todas las URLs del backend
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        // Algoritmo Hash altamente seguro exigido en la industria
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }
}