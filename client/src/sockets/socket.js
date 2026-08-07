import { io } from "socket.io-client";

// Same-origin by default (client is served by the same Express+Socket.IO
// server in production). Only set VITE_SOCKET_URL if running client/server
// on different hosts (e.g. separate local dev servers).
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || undefined;

let socket = null;

// Note: the access token also travels via the httpOnly cookie automatically
// (withCredentials), so no token needs to be read from JS here.
export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      withCredentials: true,
      autoConnect: false,
    });
  }
  return socket;
}

export function connectSocket() {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket() {
  if (socket?.connected) socket.disconnect();
}
