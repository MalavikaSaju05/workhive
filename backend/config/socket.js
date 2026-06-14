const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

let io = null;

// Tracks which users are currently present in each board room:
// { [boardId]: Map<userId, { _id, name, avatar, socketCount }> }
const boardPresence = new Map();

/**
 * Returns the room name used for a given board.
 */
const boardRoom = (boardId) => `board:${boardId}`;

/**
 * Broadcasts the current list of online users for a board to everyone
 * in that board's room.
 */
const emitPresence = (boardId) => {
  const presence = boardPresence.get(boardId);
  const users = presence ? [...presence.values()].map(({ socketCount, ...u }) => u) : [];
  io.to(boardRoom(boardId)).emit('presence:update', { boardId, users });
};

/**
 * Initializes Socket.IO on top of the given HTTP server.
 *
 * Auth: clients connect with `{ auth: { token: '<JWT>' } }`. The token is
 * verified the same way as the REST API's `protect` middleware, and the
 * authenticated user is attached to `socket.user`.
 *
 * Events handled:
 *  - "board:join"  { boardId }  — join a board's room, join presence list
 *  - "board:leave" { boardId }  — leave a board's room, leave presence list
 *  - "disconnect"               — clean up presence for all joined boards
 *
 * Server -> client events emitted elsewhere (via the helpers below):
 *  - "task:created" | "task:updated" | "task:deleted" | "task:moved"
 *  - "comment:added" | "comment:updated" | "comment:deleted"
 *  - "column:created" | "column:updated" | "column:deleted" | "columns:reordered"
 *  - "presence:update" { boardId, users }
 *
 * @param {import('http').Server} httpServer
 */
const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  // Authenticate every socket connection using the same JWT used by the REST API
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication token missing'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return next(new Error('User not found'));

      socket.user = { _id: user._id.toString(), name: user.name, avatar: user.avatar };
      next();
    } catch (err) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    // Track which boards this socket has joined, for cleanup on disconnect
    const joinedBoards = new Set();

    socket.on('board:join', ({ boardId }) => {
      if (!boardId) return;
      socket.join(boardRoom(boardId));
      joinedBoards.add(boardId);

      if (!boardPresence.has(boardId)) boardPresence.set(boardId, new Map());
      const presence = boardPresence.get(boardId);
      const existing = presence.get(socket.user._id);
      presence.set(socket.user._id, {
        ...socket.user,
        socketCount: (existing?.socketCount || 0) + 1,
      });

      emitPresence(boardId);
    });

    socket.on('board:leave', ({ boardId }) => {
      if (!boardId) return;
      socket.leave(boardRoom(boardId));
      joinedBoards.delete(boardId);
      removeFromPresence(boardId, socket.user._id);
      emitPresence(boardId);
    });

    socket.on('disconnect', () => {
      joinedBoards.forEach((boardId) => {
        removeFromPresence(boardId, socket.user._id);
        emitPresence(boardId);
      });
    });
  });

  return io;
};

/**
 * Decrements a user's socket count for a board's presence list, removing
 * them entirely once their last socket disconnects/leaves.
 */
const removeFromPresence = (boardId, userId) => {
  const presence = boardPresence.get(boardId);
  if (!presence) return;

  const existing = presence.get(userId);
  if (!existing) return;

  if (existing.socketCount <= 1) {
    presence.delete(userId);
  } else {
    presence.set(userId, { ...existing, socketCount: existing.socketCount - 1 });
  }
};

/**
 * Returns the initialized Socket.IO server instance.
 * @throws if called before initSocket()
 */
const getIO = () => {
  if (!io) throw new Error('Socket.IO has not been initialized');
  return io;
};

/**
 * Emits an event to everyone in a board's room.
 * Used by controllers after mutating tasks/columns/comments so all
 * connected clients on that board update in real time.
 *
 * @param {string} boardId
 * @param {string} event
 * @param {object} payload
 */
const emitToBoard = (boardId, event, payload) => {
  if (!io) return; // Socket.IO not initialized (e.g. during tests)
  io.to(boardRoom(boardId)).emit(event, payload);
};

module.exports = { initSocket, getIO, emitToBoard };
