const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(path.join(__dirname, '../client')));

const usersInRoom = {};
const roomMessages = {};
const usedRoomCodes = new Set();

io.on('connection', (socket) => {
  let currentRoom = null;
  let currentUser = null;

  socket.on('joinRoom', ({ room, username }) => {
    if (usersInRoom[room] && usersInRoom[room].length === 0) {
  delete usersInRoom[room];
  delete roomMessages[room]; // <- clears chat history
}

    usedRoomCodes.add(room);

    currentRoom = room;
    currentUser = username;

    socket.join(room);
    if (!usersInRoom[room]) usersInRoom[room] = [];
    if (!roomMessages[room]) roomMessages[room] = [];

    usersInRoom[room].push({ id: socket.id, username });

    roomMessages[room].forEach(msg => {
      socket.emit('receiveMessage', msg);
    });

    io.to(room).emit('userJoined', {
      username,
      count: usersInRoom[room].length
    });
  });

  socket.on('sendMessage', ({ room, message, username }) => {
    const msg = { username, message };
    if (!roomMessages[room]) roomMessages[room] = [];
    roomMessages[room].push(msg);
    socket.to(room).emit('receiveMessage', msg);
  });

  socket.on('leaveRoom', ({ room, username }) => {
    socket.leave(room);
    if (usersInRoom[room]) {
      usersInRoom[room] = usersInRoom[room].filter(u => u.id !== socket.id);
      io.to(room).emit('userLeft', { username, count: usersInRoom[room].length });
    }
    if (usersInRoom[room] && usersInRoom[room].length === 0) {
      delete usersInRoom[room];
      delete roomMessages[room];
    }
  });

  socket.on('disconnect', () => {
    if (currentRoom && currentUser) {
      socket.leave(currentRoom);
      if (usersInRoom[currentRoom]) {
        usersInRoom[currentRoom] = usersInRoom[currentRoom].filter(u => u.id !== socket.id);
        io.to(currentRoom).emit('userLeft', { username: currentUser, count: usersInRoom[currentRoom].length });
      }
      if (usersInRoom[currentRoom] && usersInRoom[currentRoom].length === 0) {
        delete usersInRoom[currentRoom];
        delete roomMessages[currentRoom];
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
