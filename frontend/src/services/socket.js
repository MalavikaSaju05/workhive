import { io } from 'socket.io-client';

/**
 * Socket.IO client (Phase 12).
 *
 * A single shared socket instance for the whole app, created lazily and
 * authenticated with the same JWT used for REST requests. The socket is
 * connected once the user logs in (see AuthContext) and disconnected on
 * logout.
 */

let socket = null;

/**
 * Creates (or returns the existing) authenticated socket connection.
 * @param {string} token - JWT used for REST API requests
 * @returns {import('socket.io-client').Socket}
 */
export const connectSocket = (token) => {
  if (socket && socket.connected) return socket;

  socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
    auth: { token },
    autoConnect: true,
    transports: ['websocket', 'polling'],
  });

  return socket;
};

/**
 * Returns the current socket instance, or null if not yet connected.
 */
export const getSocket = () => socket;

/**
 * Disconnects and clears the shared socket instance (called on logout).
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
