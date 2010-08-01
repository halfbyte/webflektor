$(function(){
  
  
  
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
    last: {}
  };
  
  
  
  var gameObjectTypes = {
    mirror: { gfxClass: function() { return "gfx-" + this.subtype + "-0"; } },
    grid_wood: { gfxClass: function() { return "gfx-" + (this.subtype + 8) + "-2"; } },
    grid_steel: { gfxClass: function() { return "gfx-" + this.subtype + "-2"; } },
    wall_wood: {
      gfxClass: function() { return "gfx-" + this.subtype + "-13"; } 
    },
    wall_steel: {
      gfxClass: function() { return "gfx-" + this.subtype + "-13"; } 
    },
    empty: { },
    cell: {
      gfxClass: function() { return "gfx-2-8"; }
    },
    cell: {
      gfxClass: function() { return "gfx-3-8"; }
    },
    refractor: {
      gfxClass: function() { return "gfx-1-8"; }
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
      gfxClass: function() {return "gfx-" + this.subtype + "-0";},
      gameTick: function() {
        this.subtype = (this.subtype + 1) % 16;
        this.updateGfx();
      }
    },
    grid_wood_auto: {
      gfxClass: function() { return "gfx-" + (this.subtype + 8) + "-2"; },
      gameTick: function() {
        this.animCount++;
        if (this.animCount % 2 == 0) {
          this.subtype = (this.subtype + 1) % 8;
          this.updateGfx();      
        }
      }
    },
    grid_steel_auto: {
      gfxClass: function() { return "gfx-" + this.subtype + "-2"; },
      gameTick: function() {
        this.animCount++;
        if (this.animCount % 2 == 0) {
          this.subtype = (this.subtype + 1) % 8;
          this.updateGfx();      
        }
      }
    },
    unknown: {}
  };
  
  var data = $.getJSON('/level/Classic_Games/classic_deflektor/001.json', function(data) {
    console.log("loaded data. initializing screen");
    var elements = "";
    var gameObjects = [];
    for(var y=0;y<data.field.length;y++) {
      for(var x=0; x<data.field[y].length; x++) {
        var go = null;
        var field = data.field[y][x];
        if (field) {
          if (gameObjectTypes[field[0]]) {
            go = Object.createAndExtend(gameObject, gameObjectTypes[field[0]]).init(x,y).props(field[1]);  
          } else {
            go = Object.create(gameObject).init(x,y).props(field[1]);
          }
        }
        
        if (go) {
          elements += go.tileDiv();
          gameObjects.push(go);
        } 
        
      }
    }
    $('#playfield').append(elements).bind('mousedown', function(e) {
      console.log(e.which);
    });
    
    window.setInterval(function() {$.each(gameObjects, function() {
      this.gameTick();
    });}, 60);
  });
  
});