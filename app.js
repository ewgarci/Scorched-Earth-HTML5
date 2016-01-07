var app = require('express')();
var express = require('express');
var server = require('http').Server(app);
var io = require('socket.io')(server);
var scorched = require('./scripts/scorched_common.js')();

scorched.createLand();
server.listen(80);

var TANK_UPDATE_INTERVAL_MS = 500;
scorched.update = {};
scorched.update.angles = {};
scorched.update.firedShots = {};

app.use("/css", express.static(__dirname + "/css"));
app.use("/scripts", express.static(__dirname + "/scripts"));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

var tankUpdateInterval = setInterval( function() {
  if (io.engine.clientsCount > 0 && (scorched.update.angles || scorched.update.firedShots)){
    console.log({
      angles : scorched.update.angles,
      firedShots : scorched.update.firedShots
    });
    io.emit('sessionUpdate', {
      angles : scorched.update.angles,
      firedShots : scorched.update.firedShots
    });

    scorched.update = {};
  }
}, TANK_UPDATE_INTERVAL_MS);

io.on('connection', function (socket) {
  var socketId = socket.id;
  var clientIp = socket.request.connection.remoteAddress;
//  console.log(clientIp);

  scorched.addTank(socket.id);
  socket.emit('session', {
    session: scorched.getSession(),
    id: socket.id
  });

  socket.broadcast.emit('addTank', {
    id: socket.id,
    tank: scorched.getSession().tanks[socket.id]
  });

  socket.on('angleUpdate', function (data) {
    console.log(data);
    if (!scorched.update.angles)
      scorched.update.angles = {};

    scorched.update.angles[data.id] = data.angle;
  });

  socket.on('fireUpdate', function (data) {
    console.log(data);
    if (!scorched.update.firedShots)
      scorched.update.firedShots = {};

    scorched.update.firedShots[data.id] = data;
  });

  socket.on('disconnect', function() {
    var t = scorched.getSession().tanks[socket.id];
    scorched.removeTank(socket.id);

    socket.broadcast.emit('removeTank', {
      id: socket.id,
      tank: t
    });
  });
});

