"use client";

import { io, type Socket } from "socket.io-client";

/**
 * Single shared Socket.IO connection to the connector backend
 * (connector/server.py). The connector enables `cors_allowed_origins="*"`, so
 * the browser connects directly here (the HTTP API goes through /api/* to avoid
 * CORS). Reused across the dashboard (live `alarm` push) and chat (`chat`).
 */

const CONNECTOR_URL =
  process.env.NEXT_PUBLIC_CONNECTOR_URL ?? "http://127.0.0.1:8000";

export interface ChatMessage {
  user: string; // "caretaker" | "ai" | "server" | ...
  text: string;
}

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(CONNECTOR_URL, {
      transports: ["websocket", "polling"],
      autoConnect: true,
    });
  }
  return socket;
}
