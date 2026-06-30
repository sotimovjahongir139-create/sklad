const { Server } = require('socket.io');
const { verifyAccess } = require('./jwt');
const logger = require('../utils/logger');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('No token'));
    try {
      socket.user = verifyAccess(token);
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`WS connected: ${socket.user.id}`);
    socket.join(`user:${socket.user.id}`);
    socket.join(`role:${socket.user.role}`);

    socket.on('disconnect', () => {
      logger.info(`WS disconnected: ${socket.user.id}`);
    });
  });

  return io;
};

const getIo = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

const emitToUser = (userId, event, data) => getIo().to(`user:${userId}`).emit(event, data);
const emitToRole = (role, event, data) => getIo().to(`role:${role}`).emit(event, data);
const emitToAll = (event, data) => getIo().emit(event, data);

module.exports = { initSocket, getIo, emitToUser, emitToRole, emitToAll };
