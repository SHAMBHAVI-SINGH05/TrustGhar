const { Server } = require('socket.io');

let io = null;

function init(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: '*' },
  });
  return io;
}

function getIO() {
  if (!io) throw new Error('Socket.io not initialized yet');
  return io;
}

module.exports = { init, getIO };
