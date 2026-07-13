import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

export const crearConexionWebSocket = (
  onMessageReceived,
  canal = "/topic/admin/notificaciones",
  onStatusChange
) => {
  const wsUrl = import.meta.env.VITE_WS_URL || "http://localhost:8080/ws";

  // Configuración del cliente STOMP sobre el endpoint SockJS de Spring Boot
  const client = new Client({
    webSocketFactory: () => new SockJS(wsUrl),
    reconnectDelay: 5000, // Intento automático de reconexión si se cae Azure cada 5 seg
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
  });

  console.debug("[WebSocket] inicializando cliente", { canal, wsUrl });

  if (onStatusChange) {
    onStatusChange("conectando");
  }

  let timeoutConexion = null;

  timeoutConexion = window.setTimeout(() => {
    onStatusChange?.("error");
    console.error("Timeout de conexión WebSocket: el broker no respondió dentro del tiempo esperado.");
    client.deactivate();
  }, 12000);

  client.onWebSocketOpen = () => {
    console.debug("[WebSocket] socket físico abierto, esperando handshake STOMP...");
  };

  client.onConnect = () => {
    if (timeoutConexion) {
      window.clearTimeout(timeoutConexion);
      timeoutConexion = null;
    }

    console.log("[WebSocket] STOMP conectado exitosamente a Spring Boot.");
    onStatusChange?.("conectado");
    
    // Nos suscribimos al canal dinámico configurado en tu PostulacionService
    console.debug("[WebSocket] suscribiendo al canal", canal);
    client.subscribe(canal, (message) => {
      if (message.body) {
        const payload = JSON.parse(message.body);
        console.debug("[WebSocket] mensaje recibido", payload);
        onMessageReceived(payload); // Enviamos el JSON limpio a la pantalla de React
      }
    });
  };

  client.onStompError = (frame) => {
    if (timeoutConexion) {
      window.clearTimeout(timeoutConexion);
      timeoutConexion = null;
    }

    console.error("[WebSocket] Error STOMP:", frame.headers["message"], frame.body);
    onStatusChange?.("error");
  };

  client.onWebSocketClose = () => {
    if (timeoutConexion) {
      window.clearTimeout(timeoutConexion);
      timeoutConexion = null;
    }

    console.warn("[WebSocket] socket cerrado");
    onStatusChange?.("desconectado");
  };

  client.onWebSocketError = (event) => {
    console.error("[WebSocket] error físico del socket", event);
    onStatusChange?.("reconectando");
  };

  client.onDisconnect = () => {
    console.warn("[WebSocket] desconectado por STOMP");
    onStatusChange?.("desconectado");
  };

  client.activate(); // Encendemos la escucha real de red

  // Retornamos una función de apagado para limpiar la memoria cuando el usuario cierre la pestaña
  return () => {
    if (timeoutConexion) {
      window.clearTimeout(timeoutConexion);
      timeoutConexion = null;
    }

    client.deactivate();
    console.log("[WebSocket] antena desconectada de forma segura.");
  };
};