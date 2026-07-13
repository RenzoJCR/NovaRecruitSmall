package com.novarecruit.backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker // Activa el manejo de mensajes en tiempo real estructurado
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private static final Logger log = LoggerFactory.getLogger(WebSocketConfig.class);

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        log.info("Configurando broker STOMP con prefijo /topic y destino de aplicación /app");
        // Destino donde el Frontend se va a suscribir para escuchar alertas (ej: /topic/notificaciones)
        registry.enableSimpleBroker("/topic");
        
        // Prefijo para los mensajes que viajen del Frontend hacia el Backend (si fueran necesarios)
        registry.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        log.info("Registrando endpoint SockJS/STOMP en /ws con orígenes locales permitidos");
        // URL del punto de conexión física del WebSocket al que React se conectará inicialmente
        registry.addEndpoint("/ws")
            .setAllowedOriginPatterns("http://localhost:5173", "http://127.0.0.1:5173") // Desarrollo local común
                .withSockJS(); // Soporte de caída por si el navegador del cliente es antiguo
    }
}