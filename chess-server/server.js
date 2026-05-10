
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { Chess } = require('chess.js');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

let waitingPlayer = null;

const games = new Map(); 
const privateRooms = new Map();

const broadcastServerStats = () => {
  io.emit('server_stats', {
    users: io.engine.clientsCount, 
    rooms: games.size              
  });
};

io.on('connection', (socket) => {
  console.log(`🟢 Player connection:${socket.id}`);

  broadcastServerStats();

  socket.on('find_match', () => {
    if (waitingPlayer && waitingPlayer.id !== socket.id) {
      const roomId = `room_${Date.now()}`;
      socket.join(roomId);
      waitingPlayer.join(roomId);

      const isPlayerOneWhite = Math.random() > 0.5;
      const player1Color = isPlayerOneWhite ? 'b' : 'w';
      const player2Color = isPlayerOneWhite ? 'w' : 'b';
      
      games.set(roomId, {
        game: new Chess(),
        players: {
          [socket.id]: player1Color,
          [waitingPlayer.id]: player2Color
        },
        timers: { w: 600, b: 600 }, 
        lastMoveTimestamp: Date.now()
      });

      socket.emit('match_found', { roomId, color: player1Color });
      waitingPlayer.emit('match_found', { roomId, color: player2Color });
      broadcastServerStats();
      
      console.log(` Room ${roomId} game started!`);
      waitingPlayer = null;
    } else {
      waitingPlayer = socket;
    }
  });

  socket.on('create_private_room', () => {

    for (const [code, hostSocket] of privateRooms.entries()) {
      if (hostSocket.id === socket.id) {
        privateRooms.delete(code);
      }
    }

    const roomCode = Math.random().toString(36).substring(2, 7).toUpperCase();
    privateRooms.set(roomCode, socket);
    

    socket.emit('private_room_created', roomCode);
    console.log(`Player ${socket.id} created a private room: ${roomCode}`);
  });


  socket.on('join_private_room', (code) => {
    const roomCode = code.toUpperCase();
    const hostSocket = privateRooms.get(roomCode);

    if (!hostSocket) {
      socket.emit('private_error', 'room_not_found'); 
      return;
    }
    if (hostSocket.id === socket.id) {
      socket.emit('private_error', 'cannot_join_self'); 
      return;
    }

    privateRooms.delete(roomCode);


    const roomId = `private_${roomCode}_${Date.now()}`;
    socket.join(roomId);
    hostSocket.join(roomId);
    

    const hostIsWhite = Math.random() > 0.5;
    const hostColor = hostIsWhite ? 'w' : 'b';
    const guestColor = hostIsWhite ? 'b' : 'w';

    games.set(roomId, {
      game: new Chess(),
      players: {
        [hostSocket.id]: hostColor,
        [socket.id]: guestColor
      },
      timers: { w: 600, b: 600 }, 
      lastMoveTimestamp: Date.now()
    });
    
    hostSocket.emit('match_found', { roomId, color: hostColor });
    socket.emit('match_found', { roomId, color: guestColor });
    broadcastServerStats();
    console.log(`🎉 Private room ${roomId} game started!`);
  });


  socket.on('cancel_private_room', (code) => {
    if (code) privateRooms.delete(code.toUpperCase());
  });


  socket.on('make_move', ({ roomId, move }) => {
    const room = games.get(roomId);
    if (!room) return;

    const { game, players, timers } = room;
    const playerColor = players[socket.id]; 


    const now = Date.now();
    const elapsed = Math.floor((now - room.lastMoveTimestamp) / 1000);
    timers[playerColor] -= elapsed; 
    room.lastMoveTimestamp = now;   

    if (timers[playerColor] <= 0) {
      timers[playerColor] = 0;
      io.to(roomId).emit('game_over', { 
        winner: playerColor === 'w' ? 'black' : 'white', 
        reason: 'Loss due to timeout' 
      });
      games.delete(roomId);
      broadcastServerStats();
      return;
    }

    try {
      const result = game.move(move);
      if (result) {
        io.to(roomId).emit('move_made', { 
          move: move, 
          fen: game.fen(),
          isGameOver: game.isGameOver(),
          turn: game.turn(),
          timers: timers 
        });

        if (game.isGameOver()) {
          games.delete(roomId);
          broadcastServerStats();
          console.log(`Room ${roomId} game ended normally, memory released.`);
        }
      }
    } catch (e) {
      socket.emit('sync_board', game.fen());
    }
  });

  socket.on('surrender', (roomId) => {
    socket.to(roomId).emit('opponent_surrendered');
    games.delete(roomId);
    broadcastServerStats();
  });

  socket.on('cancel_match', () => {
    if (waitingPlayer && waitingPlayer.id === socket.id) {
      console.log(`Player ${socket.id} cancelled the match`);
      waitingPlayer = null; 
    }
  });

  socket.on('disconnect', () => {
    console.log(`🔴 Player disconnected: ${socket.id}`);
    if (waitingPlayer && waitingPlayer.id === socket.id) {
      waitingPlayer = null; 
    }
    
    for (const [code, hostSocket] of privateRooms.entries()) {
      if (hostSocket.id === socket.id) {
        privateRooms.delete(code);
      }
    }

    for (const [roomId, room] of games.entries()) {
      if (room.players[socket.id]) {
        games.delete(roomId);
        socket.to(roomId).emit('opponent_surrendered');
        console.log(`Player ${socket.id} disconnected, memory for room ${roomId} released.`);
      }
    }

    broadcastServerStats();
  });
  });


const PORT = 3009; 
server.listen(PORT, () => {
  console.log(`Backend server is running, port:${PORT}`);
});