const express = require('express');
var app = express();
var path = require('path');
var http = require('http').createServer(app);
var uuid = require('uuid');
var io = require('socket.io')(http);
const bodyParser = require('body-parser');

let idGamesArrays = [];
var players = [],
  unmatched;
var room;
var user;
// Public
app.use(express.static(path.join(__dirname, 'public'))); // Adigna al directorio principal la carpeta public
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

app.get('/newGame', function (req, res) {
  if (req.query.room) {
    room = req.query.room;
    user = {
      name: "Player 2",
      type: 2,
      idRoom: room
    }
  } else {
    room = uuid.v4();
    user = {
      name: "Player 1",
      type: 1,
      idRoom: room
    }
  }

  res.redirect('/game.html');
});



http.listen('3000', function () {
  console.log(`listening on http://localhost:3000`);
});

// Web Socket 
io.on('connection', (socket) => {
  // Evento para detectar cuando se concentran un nuevo usuario
  console.log('Nueva conexión');
  socket.join(room);
  joinGame(socket);
  console.log(socket.id);
  io.to(socket.id).emit("ready", user);
  if (idGamesArrays.includes(room)) {
    if (getOpponent(socket)) {
      io.to(room).emit("game.begin", {
        symbol: players[socket.id].symbol
      });
      getOpponent(socket).to(room).emit("game.begin", {
        symbol: players[getOpponent(socket).id].symbol,
      });
    }
  }

  socket.on("make.move", function (data) {
    if (!getOpponent(socket)) {
      return;
    }
    io.to(room).emit("move.made", data);
    getOpponent(socket).to(room).emit("move.made", data);
  });

  socket.on("disconnect", function () {
    if (getOpponent(socket)) {
      getOpponent(socket).to(room).emit("opponent.left");
    }
  });
  socket.on('change.name', (user) => {
    socket.broadcast.emit('change.name', user)
  });
  idGamesArrays.push(room);
});

function joinGame(socket) {
  players[socket.id] = {
    opponent: unmatched,
    symbol: "X",
    socket: socket,
  };
  if (unmatched) {
    players[socket.id].symbol = "O";
    players[unmatched].opponent = socket.id;
    unmatched = null;
  } else {
    unmatched = socket.id;
  }
}

function getOpponent(socket) {
  if (!players[socket.id].opponent) {
    return;
  }
  return players[players[socket.id].opponent].socket;
}