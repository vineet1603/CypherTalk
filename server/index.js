const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(express.static(path.join(__dirname, '../client')));

io.on('connection', (socket) => {
  socket.on('joinRoom', (room) => socket.join(room));
  socket.on('sendMessage', ({ room, message }) => {
    socket.to(room).emit('receiveMessage', message);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
