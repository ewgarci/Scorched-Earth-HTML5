module.exports = function () {
  var width = 640;
  var height = 480;
  var session = {
    tanks: {},
    land: []
  };
  var gravity = 1;
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
            var yPos = Math.floor((frequency * amplitude) + shift);

            // Add land slice to array
            session.land.push({xPos: i, yPos: yPos});
        }
    },

    addTank: function(id) {
        // Generate random X position
        var xPos = Math.round(Math.random() * width);

        var newTank = {
          id: id,
          xPos: xPos,
          yPos: session.land[xPos].yPos,
          power: tankDefaults.power,
          angle: tankDefaults.angle,
        };

        session.tanks[newTank.id] = newTank;

        return newTank;
    },

    prepareBullet: function(bulletData) {
        var tank = session.tanks[bulletData.id];
        var velocity = bulletData.power;
        var angleRadians = bulletData.angle * (Math.PI / 180);

        var bullet = {};
        bulletData.xPosArr = [];
        bulletData.yPosArr = [];

        // Set initial start position for the bullet away from turrent
        bullet.xPos = tank.xPos + (Math.cos(angleRadians) * 1.3 * tankDefaults.turretLength);
        bullet.yPos = tank.yPos - (Math.sin(angleRadians) * 1.3 * tankDefaults.turretLength);


        bullet.xSpeed = (Math.cos(angleRadians) * velocity);
        bullet.ySpeed = (Math.sin(angleRadians) * velocity);

        while (true) {
          bulletData.xPosArr.push(Math.round(bullet.xPos));
          bulletData.yPosArr.push(Math.round(bullet.yPos));

          if (bullet.xPos >= width || bullet.xPos <= 0 ) {
              break;
          } else if (bullet.yPos > session.land[Math.floor(bullet.xPos)].yPos) {

              var tankDestroyed = this.didBulletHitTank(bullet.xPos, bullet.yPos);

              console.log('tankDestroyed');
              console.log(tankDestroyed);

              if ( tankDestroyed ) {
                bulletData.tankDestroyed = tankDestroyed;
                bulletData.tankAdded =  this.addTank(tankDestroyed.id);
              }


              break;
          }

          // Set the new coordinates
          bullet.xPos += bullet.xSpeed / 10;
          bullet.yPos -= bullet.ySpeed / 10;

          bullet.ySpeed -= gravity;
        }

        return bulletData;
    },

    didBulletHitTank: function(xPos, yPos) {
      for (var t in session.tanks) {
        if (this.isTankHit(session.tanks[t], xPos, yPos)) {
          return session.tanks[t];
        }
      }

      return null;
    },

    isTankHit: function(tank, xPos, yPos) {
      if ((xPos - tank.xPos)*(xPos - tank.xPos) + (yPos - tank.yPos)*(yPos - tank.yPos) <= tankDefaults.killRadius * tankDefaults.killRadius)
        return true;
      else
        return false;
    },

    removeTank: function(id) {
        delete session.tanks[id];
    },

    getSession: function() {
      return session;
    }

  }
}

