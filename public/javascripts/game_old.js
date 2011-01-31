$(function(){
  
  var logger = {
    log: function(foo) {
      if ((typeof console !== 'undefined') && console.log) console.log(foo);
    }
  };
  
  if (typeof Object.create !== 'function') { 
    Object.create = function (o) {
      var F = function () {}; 
      F.prototype = o; 
      f = new F();
      return f;
    };
  } 
  
  if (typeof Object.createAndExtend !== 'function') {
    Object.createAndExtend = function (o, extension) {
      var f = Object.create(o);
      if (typeof extension === 'object') {
        var key;
        for(key in extension) {
          f[key] = extension[key];
        }
      }
      return f;
    };
  }
  
  var gameObject = {
    listeners: [],
    x: 0,
    y: 0,
    animCount: 0,
    currentGfxClass: "",
    subtype: 0,
    init: function(x,y) {
      this.x = x;
      this.y = y;
      return this;
    },
    props: function(type) {
      this.subtype = type;
      return this;
    },
    gfxClass: function() {
      return "";
    },
    selector: function() {
      return "#tile-" + this.x + "-" + this.y;
    },
    tileDiv: function() {
      this.currentGfxClass = this.gfxClass();
      var div = "<div id='tile-" + this.x + "-" + this.y + "' class='tile x-" + this.x + " y-" + this.y + " " + this.gfxClass() + "'></div>";
      return div;
    },
    updateGfx: function() {
      var newGfxClass = this.gfxClass();
      $(this.selector()).removeClass(this.currentGfxClass).addClass(newGfxClass);
      this.currentGfxClass = newGfxClass;
    },
    gameTick: function() {
      // nothing ever happens
    },
    click: function(mouseKey) {
      // nothing ever happens
    },
    last: {}
  };
  
  // Directions
  //
  // ABCDE
  // 9   F
  // 8   0
  // 7   1
  // 65432
  
  
  var newDirectionMirror = function(old) {
    var nu = old;
    nu = ((16-this.subtype) - (old));
    if (nu < 0) nu += 16;
    if (nu >= 16) nu = (nu % 16);
    
    // console.log("x: " + this.x + "y: " + this.y + "old: " + old + "nu: " + nu + "subtype: " + this.subtype);
    
    return nu;
    
  };
  
  var newDirectionWall = function(old) {
    var straight = Math.round(old / 4);
    var diff = old - straight;
    var nu = ((old + 8) % 16) + diff;
    if (nu < 0) nu += 16;
    nu = nu % 16;
    return nu;
  };
  
  var gameObjectTypes = {
    mirror: { 
      gfxClass: function() { return "gfx-" + this.subtype + "-0"; },
      click: function(button) {
        if(button === 3) {
          this.subtype = (this.subtype + 1) % 16;
          this.updateGfx();
        }
        if(button === 1) {
          this.subtype = (this.subtype - 1);
          if (this.subtype < 0) this.subtype = 15;
          this.updateGfx();
        }
      },
      listeners: ['click'],
      newDirection: newDirectionMirror
    },
    grid_wood: { gfxClass: function() { return "gfx-" + (this.subtype + 8) + "-2"; } },
    grid_steel: { gfxClass: function() { return "gfx-" + this.subtype + "-2"; } },
    wall_wood: {
      gfxClass: function() { return "gfx-" + this.subtype + "-13"; } 
    },
    wall_steel: {
      gfxClass: function() { return "gfx-" + this.subtype + "-12"; } ,
      newDirection: newDirectionWall
    },
    empty: { },
    cell: {
      gfxClass: function() { return "gfx-2-8"; }
    },
    mine: {
      gfxClass: function() { return "gfx-3-8"; }
    },
    refractor: {
      gfxClass: function() { return "gfx-1-8"; },
      
      newDirection: function(direction) {
        var outMiddle = (Math.round(direction / 4) * 4) % 16;
        return(outMiddle + (Math.round(6 * Math.random()) - 3 ));
        
      }
    },
    lazer: {
      gfxClass: function() {return "gfx-" + this.subtype + "-9";}
    },
    detector: {
      gfxClass: function() {return "gfx-" + (this.subtype + 4) + "-9";}
    },
    fiberoptics: {
      gfxClass: function() {return "gfx-0-10";}
    },
    mirror_auto: {
      listeners: ['animation', 'click'],
      gfxClass: function() {return "gfx-" + this.subtype + "-0";},
      gameTick: function() {
        this.animCount++;
        if (this.animCount % 3 == 0) {
          this.subtype -= 1;
          if (this.subtype < 0) this.subtype += 16;
          this.updateGfx();
        }
      },
      newDirection: newDirectionMirror
    },
    grid_wood_auto: {
      listeners: ['animation'],
      gfxClass: function() { return "gfx-" + (this.subtype + 8) + "-2"; },
      gameTick: function() {
        this.animCount++;
        if (this.animCount % 2 == 0) {
          this.subtype -= 1;
          if (this.subtype < 0) this.subtype += 8;
          this.updateGfx();      
        }
      }
    },
    grid_steel_auto: {
      listeners: ['animation'],
      gfxClass: function() { return "gfx-" + this.subtype + "-2"; },
      gameTick: function() {
        this.animCount++;
        if (this.animCount % 2 == 0) {
          this.subtype -= 1;
          if (this.subtype < 0) this.subtype += 8;
          this.updateGfx();      
        }
      }
    },
    unknown: {}
  };
  
  var gameState = {};
  
  var tileForEvent = function(e) {
    var offset = $('#playfield').offset();
    return [Math.floor((e.pageX - offset.left) / 32), Math.floor((e.pageY - offset.top) / 32)];
  };
  
  var canvas = $('canvas#canvas').get(0).getContext('2d');
  canvas.strokeStyle = "#ffff00";
  canvas.lineWidth = 3;
  canvas.lineJoin = 'bevel';
  canvas.shadowColor = "rgba(0,0,0,0.5)";
  canvas.shadowBlur = 2;
  canvas.shadowOffsetX = 3;
  canvas.shadowOffsetY = 3;

  var gameObjects = [];
  var gameArray = [];
  var gameListeners = {click: [], animation: []};
  var lazer = null;
  var detector = null;
  
  var objectForCoordinate = function(x,y) {
    slotX = Math.floor(x / 32);
    slotY = Math.floor(y / 32);
    if (typeof gameArray[slotY] === 'object' && typeof gameArray[slotY][slotX] !== 'undefined') {
      return gameArray[slotY][slotX];
    } else {
      return undefined;
    }
  };

  var DIRECTIONS = [
    [1,0],[2,1],[1,1],[1,2],
    [0,1],[-1,2],[-1,1],[-2,1],
    [-1,0],[-2,-1],[-1,-1],[-1,-2],
    [0,-1],[1,-2],[1,-1],[2,-1]
  ];

  
  var lazersDo = function() {
    canvas.clearRect(0,0,512, 384);
    canvas.beginPath();
    
    var direction = lazer.subtype * 4;
    var startX = lazer.x * 32 + 16;
    var startY = lazer.y * 32 + 16;
    canvas.moveTo(startX, startY);
    var nextX = startX;
    var nextY = startY;
    var nextObj;
    var keepOn = true;
    var safety = 0;
    var currentObject = objectForCoordinate(nextX, nextY);

    while(keepOn && safety < 100) { // safety is a loop guard to keep the browser from jamming.
      safety++;
      nextX += (DIRECTIONS[direction][0]*32);
      nextY += (DIRECTIONS[direction][1]*32);
      nextObj = objectForCoordinate(nextX, nextY);
      if (nextObj !== currentObject) {
        
        if ((typeof nextObj === 'undefined') || (nextObj === null)) {
          keepOn = false;
        } else {
          if (nextObj.kind === 'mirror' || nextObj.kind === 'mirror_auto' || nextObj.kind === 'refractor') {
            if ((nextX % 32) === 16 && (nextY % 32) === 16) {
              direction = nextObj.newDirection(direction);
              currentObject = nextObj;
            }
            
          } else if (nextObj.kind === 'wall_wood') {
            //nextX = resetToBoundary(direction, nextX, 0);
            //nextY = resetToBoundary(direction, nextY, 1);
            keepOn = false;
          } else if (nextObj.kind === 'grid_wood' || nextObj.kind === 'grid_wood_auto') {
            var clear = 8-nextObj.subtype;
            if (direction !== clear && (direction + 8) % 16 !== clear) {
              keepOn = false;
              // nextX = resetToBoundary(direction, nextX, 0);
              // nextY = resetToBoundary(direction, nextY, 1);
            }
          } else if (nextObj.kind === 'wall_steel') {
            nextX = resetToBoundary(direction, nextX, 0);
            nextY = resetToBoundary(direction, nextY, 1);
            direction = nextObj.newDirection(direction);
            currentObject = nextObj;
            //keepOn = false;
          } else if (nextObj.kind === 'lazer') {
            keepOn = false;
          } else {
            currentObject = nextObj;
          }
        }
        canvas.lineTo(nextX,nextY);
        
      }
    }
    canvas.stroke();
  };
  
  var resetToBoundary = function(direction, nxt, which) {
    if (Math.abs(DIRECTIONS[direction][0]) === 2 || Math.abs(DIRECTIONS[direction][1]) === 2) {
      return nxt - ((DIRECTIONS[direction][which] / 2) * 16);
    } else {
      return nxt - ((DIRECTIONS[direction][which]) * 16);
    }
  };

  var initGame = function(data) {
    logger.log("loaded data. initializing screen");
    var elements = "";
    
    for(var y=0;y<data.field.length;y++) {
      gameArray[y] = [];
      for(var x=0; x<data.field[y].length; x++) {
        var go = null;
        var field = data.field[y][x];
        if (field) {
          if (gameObjectTypes[field[0]]) {
            go = Object.createAndExtend(gameObject, gameObjectTypes[field[0]]).init(x,y).props(field[1]);
            go.kind = field[0];
          } else {
            go = Object.create(gameObject).init(x,y).props(field[1]);
            go.kind = "unknown";
          }
        }
        
        if (go) {
          $.each(go.listeners, function() {
            if(typeof gameListeners[this] !== 'object') gameListeners[this] = [];
            gameListeners[this].push(go);
          });
          elements += go.tileDiv();
          gameObjects.push(go);
          gameArray[y].push(go);
        } 
        
      }
      
    }
    lazer = $.grep(gameObjects, function(e,i) { return e.kind === 'lazer'; })[0];
    
    
    
    
    //logger.log(gameListeners);
    $('#playfield').append(elements);
    $('#canvas').mousedown(function(e) {
      e.preventDefault();
      e.stopImmediatePropagation();
      var offset = $('#playfield').offset();
      gameState.click = [tileForEvent(e), e.which];
      return false;
    }).mouseup(function(e) {
      e.preventDefault();
      e.stopImmediatePropagation();
      var tile = tileForEvent(e);
      if (typeof gameState.click !== 'undefined' && gameState.click && gameState.click[0][0] === tile[0] && gameState.click[0][1] === tile[1] && gameState.click[1] === e.which) {
        jQuery.grep(gameObjects, function(element, index) {return element.x === gameState.click[0][0] && element.y === gameState.click[0][1];})[0].click(e.which);
      }
      gameState.click = null;
      return false;
    }).bind("contextmenu", function(e) {
      e.preventDefault();
    }).bind("mousemove", function(e) {
      var offset = $("#playfield").offset();
      var obj = objectForCoordinate(e.pageX - offset.left, e.pageY - offset.top);
      if (typeof obj !== 'undefined')
        $('#debug').html("kind: " + obj.kind + " subtype: " + obj.subtype);
    });
    
    window.setInterval(function() {
      $.each(gameListeners.animation, function() {
        this.gameTick();
      });
      lazersDo();
    }, 60);
  };
  var data = {
    field: [
      [['mirror', 4],['empty', 0], ['lazer', 2], ['empty', 0]],
      [['mirror', 12],['empty', 0], ['empty', 0], ['wall_wood', 15]],
      [['empty', 0],['empty', 0], ['empty', 0], ['wall_wood', 14]]
    ],
    last: {}
  };
  initGame(data);
  // var data = $.getJSON('/level/Classic_Games/classic_deflektor/001.json', initGame);
  
});