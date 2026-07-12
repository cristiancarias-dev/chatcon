import json
import logging
from typing import Any

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.auth import verify_token

log = logging.getLogger(__name__)
router = APIRouter()


class ConnectionManager:
    def __init__(self):
        self.active: dict[int, list[WebSocket]] = {}

    async def connect(self, ws: WebSocket, conversation_id: int):
        self.active.setdefault(conversation_id, []).append(ws)
        log.info("WS subscribed: conversation_id=%d", conversation_id)

    def disconnect(self, ws: WebSocket, conversation_id: int):
        conns = self.active.get(conversation_id, [])
        if ws in conns:
            conns.remove(ws)
        if not conns:
            self.active.pop(conversation_id, None)
        log.info("WS disconnected: conversation_id=%d", conversation_id)

    async def broadcast(self, conversation_id: int, message: dict[str, Any]):
        conns = self.active.get(conversation_id, [])
        log.info("Broadcasting to conversation_id=%d, %d connections", conversation_id, len(conns))
        dead = []
        for ws in conns:
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws, conversation_id)


manager = ConnectionManager()


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str | None = None):
    if not token:
        await websocket.close(code=4001, reason="Missing token")
        return

    token_data = verify_token(token)
    if not token_data or not token_data.email:
        await websocket.close(code=4001, reason="Invalid token")
        return

    await websocket.accept()

    conversation_ids: set[int] = set()

    try:
        while True:
            data = await websocket.receive_json()
            action = data.get("action")

            if action == "subscribe":
                conv_id = data.get("conversation_id")
                if conv_id:
                    conversation_ids.add(conv_id)
                    await manager.connect(websocket, conv_id)

            elif action == "unsubscribe":
                conv_id = data.get("conversation_id")
                if conv_id and conv_id in conversation_ids:
                    conversation_ids.discard(conv_id)
                    manager.disconnect(websocket, conv_id)

            elif action == "ping":
                await websocket.send_json({"action": "pong"})

    except WebSocketDisconnect:
        for conv_id in conversation_ids:
            manager.disconnect(websocket, conv_id)
    except Exception as e:
        log.error("WS error: %s", e)
        for conv_id in conversation_ids:
            manager.disconnect(websocket, conv_id)
