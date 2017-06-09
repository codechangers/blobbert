var playerId = 0;
var eating = true;
var playerPosition;

var myGameArea = {
  canvas : document.createElement("canvas"),
  start : function() {
    this.canvas.width = 5000;
    this.canvas.height = 5000;
    this.canvas.id = "game";
    this.context = this.canvas.getContext("2d");
    document.body.append(this.canvas);
    this.frameNo = 0;
    this.interval = setInterval(updateGameArea, 30);
    game = new component(canvasWidth, canvasHeight, 'grey', 0, 0, 'square');
    game.update();
    document.getElementById("startingPage").style.display = "none";
  },
  clear : function() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
};
function updateCamera(data) {
  for (var i = 0; i < allPlayers.length; i++) {
    allPlayers[i].newState(data[i][3], data[i][3], 'blobbert.png', data[i][0], data[i][1]);
    if (data[i][2] == playerId) {
      myGameArea.context.setTransform(1,0,0,1,0,0);
      myGameArea.clear();
      myGameArea.frameNo += 1;
      myGameArea.context.translate(-data[i][0] * zoomedIn + window.innerWidth/2, -data[i][1] * zoomedIn + window.innerHeight/2);
      game.update();
  }
 }
}
function connectToBoard(data) {
        var connectionId = data[0];
        var board = data[1];
        var foodBoard = data[2];

        if (playerId === 0) {
          playerId = connectionId;
          for (var i = 0; i < board.length; i++) {
            var newPlayerInfo = board[i];
            var newPlayerLeft = newPlayerInfo[0];
            var newPlayerTop = newPlayerInfo[1];
            var newPlayerId = newPlayerInfo[2];
            var newPlayerWidth = newPlayerInfo[3];
            var newPlayerName = newPlayerInfo[6];

            if (newPlayerId == playerId) {
              playerPosition = allPlayers.length;
              alive = true;
              characterLeft = newPlayerLeft;
              characterTop = newPlayerTop;
            }
            allPlayers.push(new component(newPlayerWidth, newPlayerWidth, characterImg, newPlayerLeft, newPlayerTop, newPlayerId, newPlayerName));
            allPlayers[allPlayers.length - 1].update();
          }
          for (var j = 0; j < foodBoard.length; j++) {
            var newFoodInfo = foodBoard[j];
            var newFoodLeft = newFoodInfo[0];
            var newFoodTop = newFoodInfo[1];
            allFood.push(new component(foodSize, foodSize, 'blue', newFoodLeft, newFoodTop));
          }
        } else {
          allPlayers.push(new component(normalPlayerWidth, normalPlayerWidth, characterImg, board[board.length - 1][0], board[board.length - 1][1], connectionId, board[board.length - 1][6]));
          allPlayers[allPlayers.length - 1].update();
        }
}

function checkCollision() {
  if (characterLeft + playerWidth > canvasWidth) {
    characterLeft = canvasWidth - playerWidth;
  }
  if (characterLeft - playerWidth < 0) {
    characterLeft = 0 + playerWidth;
  }
  if (characterTop + playerWidth > canvasHeight) {
    characterTop = canvasHeight - playerWidth;
  }
  if (characterTop - playerWidth < 0) {
    characterTop = 0 + playerWidth;
  }
  foods = [];
  for (var i = 0; i < allFood.length; i++) {
    if (allFood[i].crashWith(allPlayers[playerPosition]) != -1) {
      foods.push(i);
    }
  }
  if (foods.length > 0 && eating) {
    eating = false;
    socket.emit('eatFood', [playerWidth, foods]);
  }
  for (var j = 0; j < allPlayers.length; j++) {
    thisPlayer = allPlayers[playerPosition];
    otherPlayer = allPlayers[j];
    if (j != playerPosition) {
      if (thisPlayer.crashWith(otherPlayer) != -1 && thisPlayer.width * 0.8 > otherPlayer.width) {
        playerWidth += otherPlayer.width * (otherPlayer.width / thisPlayer.width);
        zoomedIn /= 1.005 + (0.005 * (otherPlayer.width * (otherPlayer.width / thisPlayer.width) - 1));
        console.log(zoomedIn);
        allPlayers.splice(j, 1);
        socket.emit('playerDied', [j, playerPosition]);
      }
    }
  }
}

function component(width, height, color, x, y, type, name) {
  this.type = type;
  this.width = width;
  this.height = height;
  this.speedX = 0;
  this.speedY = 0;
  this.x = x;
  this.y = y;
  this.color = color;
  this.name = name;
  if (typeof this.type == "number") {
    this.img = document.getElementById("character");
  }
  this.update = function() {
    if (this.type != "square") {
      ctx = myGameArea.context;
      if (typeof this.type == "number") {
        ctx.beginPath();
        ctx.drawImage(this.img, this.x * zoomedIn - this.width * zoomedIn, this.y * zoomedIn - this.width * zoomedIn, this.width*2*zoomedIn, this.height*2*zoomedIn);
        ctx.font = this.width + "px Arial";
        ctx.fillStyle = 'white';
        ctx.textAlign="center";
        ctx.fillText(this.name, this.x * zoomedIn, (this.y * zoomedIn + (this.width/4)/2));
      } else {
        ctx.beginPath();
        ctx.arc(this.x * zoomedIn,this.y * zoomedIn,this.width * zoomedIn, 0, 2*Math.PI);
        ctx.fillStyle = this.color;
        ctx.fill();
      }
    } else {
      ctx = myGameArea.context;
      ctx.beginPath();
      ctx.rect(this.x, this.y, this.width * zoomedIn, this.height * zoomedIn);
      ctx.fillStyle = this.color;
      ctx.fill();
    }
  };
  this.newState = function(width, height, color, x, y) {
    this.width = width;
    this.height = height;
    this.color = color;
    this.x = x;
    this.y = y;
  };
  this.crashWith = function(otherobj) {
    var r1 = this.width/2;
    var r2 = otherobj.width;
    var x1 = this.x;
    var y1 = this.y;
    var x2 = otherobj.x;
    var y2 = otherobj.y;
    if (Math.pow(x1-x2, 2) + Math.pow(y1-y2, 2) < Math.pow(r1+r2, 2)) {
      return true;
    } else {
      return -1;
    }
  };
}
