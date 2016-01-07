module.exports = function () {
  var width = 640;
  var height = 480;
  var session = {
    tanks: {},
    land: []
  };
  var tankDefaults = {
      power: 30,
      angle: 60,
      width: 15,
      height: 7,
      turretLength: 15,
      spriteSize: 40,
      killRadius: 8
  };

  return {
    guid: function() {
      function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
      }
      return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    },

    createLand: function() {
        // Clear land array
        session.land = [];

        // Random horizontal shift
        var hoz_shift = Math.round((Math.random() * width));

        // Loop through each pixel and draw the land
        for (var i=0; i < width; i += 1) {
            // Calculate Y position
            var shift = height/1.5;
            var amplitude = (height / 10);
            var frequency = Math.sin((i+hoz_shift)/100);
            var ypos = Math.floor((frequency * amplitude) + shift);

            // Add land slice to array
            session.land.push({xpos: i, ypos: ypos});
        }
    },

    addTank: function(id) {
        // Generate random X position
        var xpos = Math.round(Math.random() * width);

        var newTank = {
          id: id,
          xpos: xpos,
          ypos: session.land[xpos].ypos,
          power: tankDefaults.power,
          angle: tankDefaults.angle,
        };

        session.tanks[newTank.id] = newTank;
    },

    removeTank: function(id) {
        delete session.tanks[id];
    },

    getSession: function() {
      return session;
    }

  }
}

