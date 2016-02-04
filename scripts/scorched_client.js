/*
    Title:      Scorched Earth HTML5 Game JavaScript
    File:       scorched_earth.js
    Description:
        A clone of the classic DOS game Scorched Earth, remade
        using JavaScript and HTML 5 <canvas> element.
        This is a personal project designed to learn more about
        JavaScript and HTML5

    Authors:    Andrew Mason (andrew at coderonfire dot com)
                Eddy Garcia (ewgarci at gmail dot com)
    URL:        http://coderonfire.com/
    Version:    0.2
    Created:    09/02/2010
    Updated:    01/27/2016

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
    var localId = '';
    var gravity = 1;
    var landscape = [];
    var selectedTankIdx = 0;
    var selectedTankId = '';
    var tanks = {};
    var tankDefaults = {
        power: 30,
        angle: 60,
        width: 15,
        height: 7,
        turretLength: 15,
        spriteSize: 40,
        killRadius: 8
    };

    var angleChangeCb = function (){};
    var shotFiredCb = function (){};

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

        drawLand: function(land) {
            landscape = land;

            // Bands count and colour shade
            var bands = 10;
            var shade = Math.round(150 / bands);

            // Loop through each pixel and draw the land
            for (var i=0; i < land.length; i += 1) {
                var yPos = land[i].yPos;

                // Calculate band height
                var block_height = height-yPos;
                var band_height = Math.floor((block_height / 3) / bands);

                // Set the colour of the ground
                ctx.fillStyle  = 'rgb(255, 255, 255)';

                var col = 255;
                var new_yPos = 0;

                // Draw bands on the block
                for (var n=0; n<bands; n += 1) {
                    ctx.fillStyle  = 'rgb(' + col + ',' + col + ',' + col +')';

                    new_yPos = yPos + (band_height * n);

                    // Draw the rectangle onto the canvas
                    ctx.fillRect(i, new_yPos, 1, band_height);

                    // Decrease colour by one shade
                    col -= shade;
                }

                // Fill in the remainder of the land
                ctx.fillStyle  = 'rgb(' + col + ',' + col + ',' + col +')';
                ctx.fillRect(i, new_yPos+band_height, 1, height-yPos);
            }
        },

        addTank: function(tank) {
            if (tank.id == SEarth.localId){
              tank.color = 'rgb(0, 255, 0)';
            } else {
              tank.color = 'rgb(255, 0, 255)';
            }

            tanks[tank.id] = tank;
            SEarth.drawTank(tank);
        },

        drawTank: function(tank) {
            if (!tank.origBg) {
              tank.topLeftXPos = tank.xPos - tankDefaults.spriteSize/2;
              tank.topLeftYPos = tank.yPos - tankDefaults.spriteSize/2;
              tank.origBg = ctx.getImageData(tank.topLeftXPos, tank.topLeftYPos, tankDefaults.spriteSize, tankDefaults.spriteSize);
            }

            if (!tank.bulletCanvas) {
              var bulletCanvas = document.createElement('canvas');
              bulletCanvas.id     = tank.id + "-bl";
              bulletCanvas.width  = width;
              bulletCanvas.height = height;
              bulletCanvas.style.zIndex   = 5;
              document.getElementById('canvas-container').appendChild(bulletCanvas);
              tank.bulletCanvas = bulletCanvas;
            }

            // Erase Tank
            ctx.putImageData(tank.origBg, tank.topLeftXPos, tank.topLeftYPos);

            // Draw the tank on the canvas
            ctx.fillStyle = tank.color;
            ctx.fillRect(tank.xPos - tankDefaults.width/2, tank.yPos - tankDefaults.height, tankDefaults.width, tankDefaults.height);

            // Start drawing the turret path
            ctx.strokeStyle = tank.color;
            ctx.beginPath();
            ctx.moveTo(tank.xPos, tank.yPos);

            // Set the new coordinates
            var angleRadians = tank.angle * (Math.PI / 180);
            var turretXEnd = tank.xPos + (Math.cos(angleRadians) * tankDefaults.turretLength);
            var turretYEnd = tank.yPos - (Math.sin(angleRadians) * tankDefaults.turretLength);

            // Draw line to the new coordinates
            ctx.lineTo(turretXEnd, turretYEnd);
            ctx.closePath();
            ctx.stroke();
        },

        fireBullet: function(id, bullet) {
            var xArr = bullet.xPosArr;
            var yArr = bullet.yPosArr;
            var xPosExplosion = xArr[xArr.length - 1];
            var yPosExplosion = yArr[yArr.length - 1];
            var tankDestroyed = bullet.tankDestroyed;
            var tankAdded = bullet.tankAdded;
            var bulletCtx = tanks[id].bulletCanvas.getContext('2d');
            bulletCtx.clearRect(0, 0, width, height);

            // Animate the bullet path
            tanks[id].intervalBullet = setInterval( function() {
              if (xArr.length > 1) {
                SEarth.drawBullet(tanks[id], bulletCtx, xArr, yArr);
              } else {
                clearInterval(tanks[id].intervalBullet);

                if ( tankDestroyed && tankAdded ) {
                  SEarth.removeTank(tankDestroyed.id);
                  SEarth.addTank(tankAdded);
                }

                SEarth.drawExplosion(xPosExplosion, yPosExplosion, tanks[id].color);
              }

            }, 1000/30);

        },

        drawBullet: function(tank, bulletCtx, xArr, yArr) {
            var x1, x2, y1, y2;

            // Start drawing the bullets path
            bulletCtx.strokeStyle = tank.color;
            bulletCtx.beginPath();

            x1 = xArr.shift();
            y1 = yArr.shift();

            // Move
            bulletCtx.moveTo(x1, y1);

            //Dashed Line
            x2 = xArr.shift();
            y2 = yArr.shift();

            //Solid Lines
            //x2 = xArr[0];
            //y2 = yArr[0];

            // Draw line to the new coordinates
            bulletCtx.lineTo(x2, y2);
            bulletCtx.closePath();
            bulletCtx.stroke();

            return;
        },

        removeTank: function(id) {
            // Erase Tank
            var tank = tanks[id];
            ctx.putImageData(tank.origBg, tank.topLeftXPos, tank.topLeftYPos);

            var bulletCtx = tank.bulletCanvas.getContext('2d');
            bulletCtx.clearRect(0, 0, width, height);
            tank.bulletCanvas.remove();

            delete tanks[id];
        },

        destroyTank: function(tank) {

            // Erase Tank
            ctx.putImageData(tank.origBg, tank.topLeftXPos, tank.topLeftYPos);

            var bulletCtx = tank.bulletCanvas.getContext('2d');
            bulletCtx.clearRect(0, 0, width, height);
            tank.bulletCanvas.remove();

            delete tanks[tank.id];
        },

        drawExplosion: function(xPos, yPos, color) {
            var topLeftXPos = xPos - tankDefaults.spriteSize/2;
            var topLeftYPos = yPos - tankDefaults.spriteSize/2;
            var origBg = ctx.getImageData(topLeftXPos, topLeftYPos, tankDefaults.spriteSize, tankDefaults.spriteSize);

            var explosionCount = 1;
            var explosionLength = 10;
            var explosionRadius = (tankDefaults.turretLength * 0.5) / explosionLength;

            // Animate the explosion getting larger
            var explosionInterval = setInterval( function() {

              if (explosionCount > explosionLength ) {
                  clearInterval(explosionInterval);
                  ctx.putImageData(origBg, topLeftXPos, topLeftYPos);
                  return;
              }

              ctx.beginPath();
              ctx.fillStyle = color;
              ctx.arc(xPos, yPos, explosionRadius*explosionCount, 0, 2*Math.PI, true);
              ctx.fill();
              ctx.closePath();

              explosionCount++;

            }, 30);

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
            this.addEvent(btnPowerDown, 'click', function() { SEarth.alterPower(-1) });
            this.addEvent(btnPowerUp, 'click', function() { SEarth.alterPower(+1)} );
            this.addEvent(btnAngleDown, 'click', function() { SEarth.alterAngle(+1) });
            this.addEvent(btnAngleUp, 'click', function() { SEarth.alterAngle(-1) });
            this.addEvent(btnFireNum, 'click', function() {
              SEarth.localFireBullet(selectedTankId);
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
                SEarth.localFireBullet(selectedTankId);
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

        localFireBullet: function(id) {
            //this.fireBullet(id)
            shotFiredCb(id, tanks[id].angle, tanks[id].power);
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
            if ((tank.angle + value < 0) || (tank.angle + value > 180)) {
                return;
            }

            // Increase angle and update DOM
            tank.angle += value;

            this.drawTank(tank);

            var btnAngleNum = document.getElementById('angle_number');
            btnAngleNum.innerHTML = tank.angle;

            angleChangeCb(tank.angle);
        },

        updateTank: function(id, angle, power) {
            if (angle && angle >= 0 && angle <= 180) {
              tanks[id].angle = angle;
            }

            if (power && power > 0 && power <= 100) {
              tanks[id].power = power;
            }

            this.drawTank(tanks[id]);
        },

        selectTank: function(id) {
            selectedTankId = id;
        },

        updateFromSession: function(session) {
            SEarth.drawSky();
            SEarth.drawLand(session.land);
            for (var t in session.tanks) {
              console.log(session.tanks[t]);
              SEarth.addTank(session.tanks[t]);
            }
        },

        setAngleChangeCb: function(cb) {
            angleChangeCb = cb;
        },

        setShotFiredCb: function(cb) {
            shotFiredCb = cb;
        },

        initMultiplayer: function() {
            //TODO Change to match server ip
            var socket = io.connect('http://localhost:3000');

            var angleChangeCb = function(angle) {
              socket.emit('angleUpdate', {
                id: SEarth.localId,
                angle: angle
              });
            };

            var shotFiredCb = function(id, angle, power) {
              socket.emit('fireUpdate', {
                id: SEarth.localId,
                angle: angle,
                power: power
              });
            };

            socket.on('session', function (data) {
              console.log(data);
              SEarth.setAngleChangeCb(angleChangeCb);
              SEarth.setShotFiredCb(shotFiredCb);
              SEarth.localId = data.id;

              SEarth.selectTank(SEarth.localId);
              SEarth.updateFromSession(data.session);

              SEarth.addControls();
            });

            socket.on('misc', function (data) {
              console.log(data);
            });

            socket.on('sessionUpdate', function (data) {
              console.log(data);
              if (data.angles) {
                for (var id in data.angles) {
                  SEarth.updateTank(id, data.angles[id], null);
                }
              }

              if (data.bullets) {
                for (var id in data.bullets) {
                    SEarth.updateTank(id,
                      data.bullets[id].angle,
                      data.bullets[id].power);

                    SEarth.fireBullet(id, data.bullets[id]);
                }
              }

            });

            socket.on('addTank', function (data) {
              console.log('addTank ');
              console.log(data);
              SEarth.addTank(data.tank);
            });

            socket.on('removeTank', function (data) {
              console.log('removeTank ');
              console.log(data);
              SEarth.removeTank(data.id);
            });

        }
    };
})();


