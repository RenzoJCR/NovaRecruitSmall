package com.novarecruit.backend.config;

import com.novarecruit.backend.entity.Usuario;
import com.novarecruit.backend.repository.UsuarioRepository;
import io.jsonwebtoken.JwtException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.Collections;

@Component
public class WebSocketAuthChannelInterceptor implements ChannelInterceptor {

    private static final Logger log = LoggerFactory.getLogger(WebSocketAuthChannelInterceptor.class);

    private static final String CANAL_ADMIN = "/topic/admin/notificaciones";
    private static final String PREFIJO_CANAL_POSTULANTE = "/topic/user/notificaciones/";

    private final JwtUtil jwtUtil;
    private final UsuarioRepository usuarioRepository;

    public WebSocketAuthChannelInterceptor(JwtUtil jwtUtil, UsuarioRepository usuarioRepository) {
        this.jwtUtil = jwtUtil;
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) {
            return message;
        }

        StompCommand command = accessor.getCommand();
        if (command == null) {
            return message;
        }

        if (StompCommand.CONNECT.equals(command)) {
            autenticarConexion(accessor);
        } else if (StompCommand.SUBSCRIBE.equals(command)) {
            autorizarSuscripcion(accessor);
        } else if (StompCommand.SEND.equals(command)) {
            throw new AccessDeniedException(
                    "El cliente no tiene permitido publicar mensajes directamente en el broker");
        } else if (StompCommand.DISCONNECT.equals(command)) {
            String usuario = accessor.getUser() == null ? "desconocido" : accessor.getUser().getName();
            log.info("[WS-AUTH] Cliente desconectado: {}", usuario);
        }

        return message;
    }

    private void autenticarConexion(StompHeaderAccessor accessor) {
        String authorizationHeader = accessor.getFirstNativeHeader("Authorization");
        String token = extraerBearerToken(authorizationHeader);

        try {
            String correo = jwtUtil.extraerCorreo(token);
            Usuario usuario = usuarioRepository.findByCorreo(correo)
                    .orElseThrow(() -> new JwtException("El usuario del token no existe"));

            if (!usuario.isActivo()) {
                throw new JwtException("El usuario está inactivo");
            }

            String rolToken = jwtUtil.extraerRol(token);
            Long userIdToken = jwtUtil.extraerUserId(token);

            boolean datosCoinciden = usuario.getRol().equals(rolToken)
                    && usuario.getId().equals(userIdToken);

            if (!datosCoinciden || !jwtUtil.esTokenValido(token, usuario.getCorreo())) {
                throw new JwtException("Los datos del token no coinciden con el usuario actual");
            }

            var autoridad = new SimpleGrantedAuthority("ROLE_" + usuario.getRol());
            var autenticacion = new UsernamePasswordAuthenticationToken(
                    usuario.getCorreo(),
                    null,
                    Collections.singletonList(autoridad));

            autenticacion.setDetails(usuario.getId());
            accessor.setUser(autenticacion);

            log.info("[WS-AUTH] Conexión STOMP autenticada: userId={}, correo={}, rol={}",
                    usuario.getId(), usuario.getCorreo(), usuario.getRol());

        } catch (JwtException | IllegalArgumentException ex) {
            log.warn("[WS-AUTH] Conexión STOMP rechazada: {}", ex.getMessage());
            throw new AccessDeniedException("Token WebSocket inválido o expirado", ex);
        }
    }

    private void autorizarSuscripcion(StompHeaderAccessor accessor) {
        if (!(accessor.getUser() instanceof Authentication authentication)
                || !authentication.isAuthenticated()) {
            throw new AccessDeniedException("La conexión STOMP no está autenticada");
        }

        String destino = accessor.getDestination();
        if (destino == null) {
            throw new AccessDeniedException("La suscripción no contiene un destino válido");
        }

        boolean esAdministrador = tieneRol(authentication, "ROLE_ADMINISTRADOR");
        boolean esPostulante = tieneRol(authentication, "ROLE_POSTULANTE");

        if (CANAL_ADMIN.equals(destino)) {
            if (!esAdministrador) {
                throw new AccessDeniedException("Solo los administradores pueden escuchar este canal");
            }
        } else if (destino.startsWith(PREFIJO_CANAL_POSTULANTE)) {
            if (!esPostulante) {
                throw new AccessDeniedException("Solo los postulantes pueden escuchar este canal");
            }

            Long usuarioId = obtenerUsuarioId(authentication);
            String canalPermitido = PREFIJO_CANAL_POSTULANTE + usuarioId;

            if (!canalPermitido.equals(destino)) {
                throw new AccessDeniedException(
                        "Un postulante no puede suscribirse a notificaciones de otro usuario");
            }
        } else {
            throw new AccessDeniedException("El destino solicitado no está permitido");
        }

        log.info("[WS-AUTH] Suscripción autorizada: correo={}, destino={}",
                authentication.getName(), destino);
    }

    private String extraerBearerToken(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            throw new AccessDeniedException("Falta la cabecera Authorization en CONNECT");
        }

        String token = authorizationHeader.substring(7).trim();
        if (token.isBlank()) {
            throw new AccessDeniedException("El token WebSocket está vacío");
        }
        return token;
    }

    private boolean tieneRol(Authentication authentication, String rol) {
        return authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals(rol));
    }

    private Long obtenerUsuarioId(Authentication authentication) {
        Object details = authentication.getDetails();
        if (details instanceof Long usuarioId) {
            return usuarioId;
        }
        if (details instanceof Number numero) {
            return numero.longValue();
        }
        throw new AccessDeniedException("No se pudo identificar al usuario de la conexión");
    }
}
