import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

export const crearConexionWebSocket = (
  onMessageReceived,
  canal,
  token,
  onStatusChange,
) => {
  const wsUrl = import.meta.env.VITE_WS_URL || "http://localhost:8080/ws";

  if (!token) {
    throw new Error("No se puede conectar al WebSocket sin un token JWT");
  }

  const client = new Client({
    webSocketFactory: () => new SockJS(wsUrl),
    connectHeaders: {
      Authorization: `Bearer ${token}`,
    },
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
  });

  console.debug("[WebSocket] Inicializando cliente", { canal, wsUrl });
  onStatusChange?.("conectando");

  let timeoutConexion = window.setTimeout(() => {
    onStatusChange?.("error");
    console.error(
      "[WebSocket] El broker no respondió dentro del tiempo esperado.",
    );
    client.deactivate();
  }, 12000);

  client.onWebSocketOpen = () => {
    console.debug(
      "[WebSocket] Socket físico abierto; iniciando autenticación STOMP.",
    );
  };

  client.onConnect = () => {
    if (timeoutConexion) {
      window.clearTimeout(timeoutConexion);
      timeoutConexion = null;
    }

    console.log("[WebSocket] STOMP conectado y autenticado correctamente.");
    onStatusChange?.("conectado");

    client.subscribe(canal, (message) => {
      if (!message.body) {
        return;
      }

      try {
        const payload = JSON.parse(message.body);
        console.debug("[WebSocket] Mensaje recibido", payload);
        onMessageReceived(payload);
      } catch (error) {
        console.error("[WebSocket] Mensaje inválido recibido", error);
      }
    });
  };

  client.onStompError = (frame) => {
    if (timeoutConexion) {
      window.clearTimeout(timeoutConexion);
      timeoutConexion = null;
    }

    console.error(
      "[WebSocket] Error STOMP:",
      frame.headers.message,
      frame.body,
    );
    onStatusChange?.("error");
  };

  client.onWebSocketClose = () => {
    if (timeoutConexion) {
      window.clearTimeout(timeoutConexion);
      timeoutConexion = null;
    }

    if (client.active) {
      console.warn("[WebSocket] Conexión perdida; se intentará reconectar.");
      onStatusChange?.("reconectando");
    } else {
      console.log("[WebSocket] Conexión cerrada correctamente.");
      onStatusChange?.("desconectado");
    }
  };

  client.onWebSocketError = (event) => {
    console.error("[WebSocket] Error físico del socket", event);
    onStatusChange?.("reconectando");
  };

  client.activate();

  return () => {
    if (timeoutConexion) {
      window.clearTimeout(timeoutConexion);
      timeoutConexion = null;
    }

    client.deactivate();
  };
};
