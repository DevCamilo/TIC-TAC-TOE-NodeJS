var socket = io();
var symbol;
var room;
var user;
socket.on("ready", function (data) {
  $("#IdRoom").text(data.idRoom);
  room = data.idRoom;
  user = data;
  $("#name").val(data.name)
});
$(function () {
  $(".board button").attr("disabled", true);
  $(".board> button").on("click", makeMove);
  $("#sendName").on("click", () => {
    socket.emit('change.name', $("#name").val());

  });
  socket.on('change.name', (user) => {
    $("#oponent").text(user);
  });
  //Movimientos del juego
  socket.on("move.made", function (data) {
    $("#" + data.position).text(data.symbol);

    myTurn = data.symbol !== symbol;

    // Valida estado del juego
    if (!isGameOver()) {
      if (gameTied()) {
        $("#messages").text("¡EMPATE!");
        $(".board button").attr("disabled", true);
      } else {
        renderTurnMessage();
      }
    } else {
      // Muestra Mensajes
      if (myTurn) {
        $("#messages").text("¡PERDISTE!");
      } else {
        $("#messages").text("¡GANASTE!");
      }
      $(".board button").attr("disabled", true);
    }
  });

  //Inicio del juegos
  socket.on("game.begin", function (data) {
    symbol = data.symbol;
    myTurn = symbol === "X";
    if (user.type == 1) {
      $("#oponent").text("Player2");
    } else {
      $("#oponent").text("Player1");
    }
    renderTurnMessage();
  });

  // Desabilita el tablero si el oponente abandonó
  socket.on("opponent.left", function () {
    $("#messages").text("Tu opoenente ha abandonado el juego.");
    $(".board button").attr("disabled", true);
  });
});

function getBoardState() {
  var obj = {};
  //Actualiza el esatdo del tablero
  $(".board button").each(function () {
    obj[$(this).attr("id")] = $(this).text() || "";
  });
  return obj;
}

function gameTied() {
  var state = getBoardState();

  if (
    state.a0 !== "" &&
    state.a1 !== "" &&
    state.a2 !== "" &&
    state.b0 !== "" &&
    state.b1 !== "" &&
    state.b2 !== "" &&
    state.b3 !== "" &&
    state.c0 !== "" &&
    state.c1 !== "" &&
    state.c2 !== ""
  ) {
    return true;
  }
}

function isGameOver() {
  var state = getBoardState(),
    //Valida las convinaciones para el fin del juego
    matches = ["XXX", "OOO"],
    // Revisa todas las posibles convinaciones
    rows = [
      state.a0 + state.a1 + state.a2,
      state.b0 + state.b1 + state.b2,
      state.c0 + state.c1 + state.c2,
      state.a0 + state.b1 + state.c2,
      state.a2 + state.b1 + state.c0,
      state.a0 + state.b0 + state.c0,
      state.a1 + state.b1 + state.c1,
      state.a2 + state.b2 + state.c2,
    ];
  for (var i = 0; i < rows.length; i++) {
    if (rows[i] === matches[0] || rows[i] === matches[1]) {
      return true;
    }
  }
}

function renderTurnMessage() {
  // Desabilita el tablero cuando no es su turno
  if (!myTurn) {
    $("#messages").text("Turno del Oponente");
    $(".board button").attr("disabled", true);
    // Habilita el tablero cuando es tu turno
  } else {
    $("#messages").text("Tu turno.");
    $(".board button").removeAttr("disabled");
  }
}

function makeMove(e) {
  e.preventDefault();
  // Revisa si es su turno
  if (!myTurn) {
    return;
  }
  // Revisa si el espacio ya está maracdo
  if ($(this).text().length) {
    return;
  }

  // Emite el movimiento al servidor
  socket.emit("make.move", {
    symbol: symbol,
    position: $(this).attr("id"),
  });
}
