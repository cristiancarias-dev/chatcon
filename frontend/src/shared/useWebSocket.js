import { useEffect, useRef, useCallback } from "react";

export function useWebSocket(conversationId, { onMessage, onStatusUpdate } = {}) {
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);
  const subscribedRef = useRef(false);
  const conversationIdRef = useRef(conversationId);

  conversationIdRef.current = conversationId;

  const connect = useCallback(() => {
    const token = localStorage.getItem("token");
    if (!token || !conversationIdRef.current) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const url = `${protocol}//${host}/api/ws?token=${token}`;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ action: "subscribe", conversation_id: conversationIdRef.current }));
      subscribedRef.current = true;
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "new_message" && data.message && onMessage) {
          onMessage(data.message);
        } else if (data.type === "status_update" && onStatusUpdate) {
          onStatusUpdate(data.message_id, {
            whatsapp_status: data.whatsapp_status,
            whatsapp_error_code: data.whatsapp_error_code,
            whatsapp_error_message: data.whatsapp_error_message,
          });
        }
      } catch {}
    };

    ws.onclose = () => {
      subscribedRef.current = false;
      reconnectTimer.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [onMessage, onStatusUpdate]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);
}
