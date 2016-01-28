var app = require('express')();
var express = require('express');
var server = require('http').Server(app);
var io = require('socket.io')(server);
var scorched = require('./scripts/scorched_core.js')();

scorched.createLand();
server.listen(3000);


var TANK_UPDATE_INTERVAL_MS = 500;
scorched.update = {};
scorched.update.angles = {};
scorched.update.bullets = {};

app.use("/css", express.static(__dirname + "/css"));
app.use("/scripts", express.static(__dirname + "/scripts"));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

var tankUpdateInterval = setInterval( function() {
  if (io.engine.clientsCount > 0 && (scorched.update.angles || scorched.update.bullets)){
    console.log({
      angles : scorched.update.angles,
      bullets : scorched.update.bullets
    });
    io.emit('sessionUpdate', {
      angles : scorched.update.angles,
      bullets : scorched.update.bullets
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
    var bulletData = scorched.prepareBullet(data);

    if (!scorched.update.bullets)
      scorched.update.bullets = {};

    scorched.update.bullets[data.id] = bulletData;
  });

  socket.on('disconnect', function() {
    var t = scorched.getSession().tanks[socket.id];
    scorched.removeTank(socket.id);

    socket.broadcast.emit('removeTank', {
      id: socket.id,
      tank: t
    });
  });

  socket.on('ping', function() {
    socket.emit('pong');
  });
});

