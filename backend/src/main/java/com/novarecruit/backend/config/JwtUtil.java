package com.novarecruit.backend.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Component
public class JwtUtil {

    // Llave secreta segura de 256 bits para firmar los tokens criptográficamente
    private final Key SECRET_KEY = Keys.secretKeyFor(SignatureAlgorithm.HS256);
    
    // El token expirará en 24 horas
    private final long EXPIRATION_TIME = 86400000; 

    // Genera el pasaporte digital con el correo y el rol del usuario
    public String generarToken(String correo, String rol) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("rol", rol); // Guardamos el rol dentro del Payload del token

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(correo)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(SECRET_KEY)
                .compact();
    }

    // Abre el token y extrae el correo electrónico (Subject)
    public String extraerCorreo(String token) {
        return extraerTodosLosClaims(token).getSubject();
    }

    // Extrae el rol guardado en el token
    public String extraerRol(String token) {
        return extraerTodosLosClaims(token).get("rol", String.class);
    }

    // Valida si el token ha expirado
    public boolean esTokenValido(String token, String correoUsuario) {
        String correoToken = extraerCorreo(token);
        return (correoToken.equals(correoUsuario) && !estaExpirado(token));
    }

    private boolean estaExpirado(String token) {
        return extraerTodosLosClaims(token).getExpiration().before(new Date());
    }

    private Claims extraerTodosLosClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(SECRET_KEY)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}