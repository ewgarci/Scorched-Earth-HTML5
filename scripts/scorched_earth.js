/*
    Title:      Scorched Earth HTML5 Game JavaScript
    File:       scorched_earth.js
    Description:
        A clone of the classic DOS game Scorched Earth, remade
        using JavaScript and HTML 5 <canvas> element.
        This is a personal project designed to learn more about
        JavaScript and HTML5

    Author:     Andrew Mason (andrew at coderonfire dot com)
    URL:        http://coderonfire.com/
    Version:    0.1
    Created:    09/02/2010

    License:
    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.

*/

var SEarth = (function() {
    // Private Vars
    var ctx = document.getElementById('game_board').getContext('2d');
    var width = ctx.canvas.width;
    var height = ctx.canvas.height;
    var gravity = 1;
    var fps = 1000 / 30; // 30fps
    var land = [];
    var selectedTankIdx = 0;
    var selectedTankId = '';
    var numOfTanks = 2;
    var tanks = {};
    var tankDefaults = {
        power: 30,
        angle: 60,
        width: 15,
        height: 7,
        turretLength: 15
    };

    var count = 0;
    var colors = [
      'rgb(255, 255, 0)',
      'rgb(0, 255, 0)',
      'rgb(0, 0, 255)',
      'rgb(255, 0, 255)'
    ];

    function guid() {
      function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
      }
      return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    }

    return {
        drawSky: function() {
            var bands = 45;

            // Set black background
            ctx.fillStyle  = 'rgb(0, 0, 0)';
            ctx.fillRect(0, 0, width, height);

            // Vertical offset
            var v_offset = 50;

            var shade = Math.round(255 / bands);
            var band_height = Math.round((height - v_offset) / bands);
            var colour = 0;
            // Loop bands and adding them to the canvas
            for (var i=0; i<bands; i += 1) {
                ctx.fillStyle  = 'rgb(' + colour + ', 0, 0)';
                ctx.fillRect(0, v_offset + (band_height * i), width, band_height);
                colour += shade;
            }
        },

        drawLand: function() {
            // Clear land array
            land = [];

            // Bands count and colour shade
            var bands = 10;
            var shade = Math.round(150 / bands);

            // Random horizontal shift
            var hoz_shift = Math.round((Math.random() * width));

            // Loop through each pixel and draw the land
            for (var i=0; i < width; i += 1) {
                // Calculate Y position
                var shift = height/1.5;
                var amplitude = (height / 10);
                var frequency = Math.sin((i+hoz_shift)/100);
                var ypos = Math.floor((frequency * amplitude) + shift);

                // Calculate band height
                var block_height = height-ypos;
                var band_height = Math.floor((block_height / 3) / bands);

                // Set the colour of the ground
                ctx.fillStyle  = 'rgb(255, 255, 255)';

                var col = 255;
                var new_ypos = 0;

                // Draw bands on the block
                for (var n=0; n<bands; n += 1) {
                    ctx.fillStyle  = 'rgb(' + col + ',' + col + ',' + col +')';

                    new_ypos = ypos + (band_height * n);

                    // Draw the rectangle onto the canvas
                    ctx.fillRect(i, new_ypos, 1, band_height);

                    // Decrease colour by one shade
                    col -= shade;
                }

                // Fill in the remainder of the land
                ctx.fillStyle  = 'rgb(' + col + ',' + col + ',' + col +')';
                ctx.fillRect(i, new_ypos+band_height, 1, height-ypos);


                // Add land slice to array
                land.push({xpos: i, ypos: ypos});
            }
        },

        addTank: function() {
            // Generate random X position
            var xpos = Math.round(Math.random() * width);
            var colorIdx = Math.round(Math.random() * 4);

            var newTank = {
              id: guid(),
              xpos: xpos,
              ypos: land[xpos].ypos,
              power: tankDefaults.power,
              angle: tankDefaults.angle,
              color: colors[colorIdx]
            };

            newTank.topLeftXPos = newTank.xpos - tankDefaults.turretLength;
            newTank.topLeftYPos = newTank.ypos - tankDefaults.turretLength;
            newTank.origBg = ctx.getImageData(newTank.topLeftXPos, newTank.topLeftYPos, tankDefaults.turretLength*2, tankDefaults.turretLength*2);

            tanks[newTank.id] = newTank;
            this.drawTank(newTank);

            selectedTankId = newTank.id
        },

        drawTank: function(tank) {
            // Erase Tank
            ctx.putImageData(tank.origBg, tank.topLeftXPos, tank.topLeftYPos);

            // Draw the tank on the canvas
            ctx.fillStyle = tank.color;
            ctx.fillRect(tank.xpos - tankDefaults.width/2, tank.ypos - tankDefaults.height, tankDefaults.width, tankDefaults.height);

            // Start drawing the turret path
            ctx.strokeStyle = tank.color;
            ctx.beginPath();
            ctx.moveTo(tank.xpos, tank.ypos);

            // Set the new coordinates
            var angleRadians = tank.angle * (Math.PI / 180);
            var turretXEnd = tank.xpos + (Math.cos(angleRadians) * tankDefaults.turretLength);
            var turretYEnd = tank.ypos - (Math.sin(angleRadians) * tankDefaults.turretLength);
            // Draw line to the new coordinates
            ctx.lineTo(turretXEnd, turretYEnd);
            ctx.closePath();
            ctx.stroke();
        },

        fireBullet: function(id) {
            // Calculate the X and Y speeds
            var velocity = tanks[id].power;
            var angleRadians = tanks[id].angle * (Math.PI / 180);

            // Set initial start position for the bullet
            tanks[id].bulletXPos = tanks[id].xpos + (Math.cos(angleRadians) * 1.2 * tankDefaults.turretLength);
            tanks[id].bulletYPos = tanks[id].ypos - (Math.sin(angleRadians) * 1.2 * tankDefaults.turretLength);

            tanks[id].bulletXSpeed = (Math.cos(angleRadians) * velocity);
            tanks[id].bulletYSpeed = (Math.sin(angleRadians) * velocity);

            // Animate the bullet path
            var intervalBullet = setInterval( function() {
              SEarth.drawBullet(tanks[id], intervalBullet);
            }, 30);

        },

        drawBullet: function(tank, intervalBullet) {
            // Clear interval if bullet hits land or edge of canvas
            if (tank.bulletXPos >= width || tank.bulletXPos <= 0 ) {
                clearInterval(intervalBullet);
                return;
            } else if (tank.bulletYPos > land[Math.floor(tank.bulletXPos)].ypos) {
                // BOOM! The bullet hit the ground.
                clearInterval(intervalBullet);

                tankDestroyed = this.didBulletHitTank(tank.bulletXPos, tank.bulletYPos);

                if ( tankDestroyed ) {
                  this.destroyTank(tankDestroyed);
                }

                this.drawExplosion(tank.bulletXPos, tank.bulletYPos, tank.color);

                return;
            }

            // Start drawing the bullets path
            ctx.strokeStyle = tank.color;
            ctx.beginPath();

            // Move
            ctx.moveTo(tank.bulletXPos, tank.bulletYPos);

            // Set the new coordinates
            tank.bulletXPos += tank.bulletXSpeed / 10;
            tank.bulletYPos -= tank.bulletYSpeed / 10;

            // Draw line to the new coordinates
            ctx.lineTo(tank.bulletXPos, tank.bulletYPos);
            ctx.closePath();
            ctx.stroke();

            // Affect bullet with gravity
            tank.bulletYSpeed -= gravity;

            return;
        },

        didBulletHitTank: function(xPos, yPos) {
          for (var t in tanks) {
            if (this.isTankHit(tanks[t], xPos, yPos)) {
              return tanks[t];
            }
          }

          return null;
        },

        isTankHit: function(tank, xPos, yPos) {
          if ((xPos - tank.xpos)*(xPos - tank.xpos) + (yPos - tank.ypos)*(yPos - tank.ypos) <= tankDefaults.turretLength*tankDefaults.turretLength)
            return true;
          else
            return false;
        },

        destroyTank: function(tank) {
            this.drawExplosion(tank.xpos, tank.ypos, tank.color);

            // Erase Tank
            ctx.putImageData(tank.origBg, tank.topLeftXPos, tank.topLeftYPos);
            delete tanks[tank.id];
            this.addTank();
        },

        drawExplosion: function(xpos, ypos, color) {
            var topLeftXPos = xpos - tankDefaults.turretLength;
            var topLeftYPos = ypos - tankDefaults.turretLength;
            var origBg = ctx.getImageData(topLeftXPos, topLeftYPos, tankDefaults.turretLength*2, tankDefaults.turretLength*2);

            var explosionCount = 1;
            var explosionLength = 10;
            var explosionRadius = (tankDefaults.turretLength * .5) / explosionLength;

            // Animate the explosion getting larger
            var explosionInterval = setInterval( function() {

              if (explosionCount > explosionLength ) {
                  clearInterval(explosionInterval);
                  ctx.putImageData(origBg, topLeftXPos, topLeftYPos);
                  return;
              }

              ctx.beginPath();
              ctx.fillStyle = color;
              ctx.arc(xpos, ypos, explosionRadius*explosionCount, 0, 2*Math.PI, true);
              ctx.fill();

              explosionCount++;

            }, 30);

        },

        animate: function() {
            var d = new Date();
            var now = d.getTime();
            var end = now + fps;
            var count = 0;
            while (now < end) {
                count += 1;
                d = new Date();
                now = d.getTime();
            }

            setInterval(this.outputFPS, fps)
        },

        outputFPS: function() {
            ctx.fillStyle = 'rgb(255, 255, 255)';
            ctx.fillText('FPS: ' + count , count, count);
            count += 1;
        },

        addControls: function() {
            // Collect the DOM elements
            btnPowerDown = document.getElementById('power_down');
            btnPowerUp = document.getElementById('power_up');
            btnPowerNum = document.getElementById('power_number');
            btnAngleDown = document.getElementById('angle_down');
            btnAngleUp = document.getElementById('angle_up');
            btnAngleNum = document.getElementById('angle_number');
            btnFireNum = document.getElementById('fire_button');
            btnSwitch = document.getElementById('switch_button');

            btnPowerNum.innerHTML = tankDefaults.power;
            btnAngleNum.innerHTML = tankDefaults.angle;

            // Add Events
            this.addEvent(btnPowerDown, 'click', function() {SEarth.alterPower(-1)});
            this.addEvent(btnPowerUp, 'click', function() {SEarth.alterPower(+1)});
            this.addEvent(btnAngleDown, 'click', function() {SEarth.alterAngle(+1)});
            this.addEvent(btnAngleUp, 'click', function() {SEarth.alterAngle(-1)});
            this.addEvent(btnFireNum, 'click', function() {
              SEarth.fireBullet(selectedTankId);
            });

            this.addEvent(btnSwitch, 'click', function() {
              selectedTankIdx += 1;
              var tankArray = Object.keys(tanks);

              if (selectedTankIdx >= tankArray.length)
                selectedTankIdx = 0;

              selectedTankId = tankArray[selectedTankIdx];

              btnPowerNum.innerHTML = tanks[selectedTankId].power;
              btnAngleNum.innerHTML = tanks[selectedTankId].angle;
            });

            // Add keyboard listener.
            window.addEventListener('keydown', SEarth.handleKeyPress, true);
        },

        handleKeyPress: function(evt) {
            switch (evt.keyCode) {

              // Space Bar
              case 32:
                SEarth.fireBullet(selectedTankId);
                break;

              // Left arrow
              case 37:
                SEarth.alterAngle(+1);
                break;

              // Right arrow
              case 39:
                SEarth.alterAngle(-1);
                break;

              // Down arrow
              case 40:
                SEarth.alterPower(-1);
                break;

              // Up arrow
              case 38:
                SEarth.alterPower(+1);
                break;
            }
        },

        addEvent: function(elm, event, func) {
            elm.addEventListener(event, func, false);
        },

        alterPower: function(value) {
            var tank = tanks[selectedTankId];

            // Prevent power going below 0
            if ((tank.power + value < 0) || (tank.power + value >= 100)) {
                return;
            }


            // Increase power and update DOM
            tank.power += value;

            var btnPowerNum = document.getElementById('power_number');
            btnPowerNum.innerHTML = tank.power;
        },

        alterAngle: function(value) {
            var tank = tanks[selectedTankId];

            // Prevent angle going below 0
            if ((tank.angle + value < 0) || (tank.angle + value >= 180)) {
                return;
            }


            this.drawTank(tank);

            // Increase angle and update DOM
            tank.angle += value;

            var btnAngleNum = document.getElementById('angle_number');
            btnAngleNum.innerHTML = tank.angle;
        },

        init: function() {
            this.drawSky();
            this.drawLand();
            this.addTank();
            this.addTank();
            this.addControls();
            //this.outputFPS(23);
            //this.animate();

        }
    };
})();


// Render when the DOM is ready
window.onload = function() {
    SEarth.init();
}
