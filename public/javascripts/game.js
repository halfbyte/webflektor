$(function(){
  var data = $.getJSON('/level/Classic_Games/classic_deflektor/001.json', function(data) {
    console.log("loaded data. initializing screen");
    console.log(data.field);
    var elements = "";
    for(var y=0;y<data.field.length;y++) {
      for(var x=0; x<data.field[y].length; x++) {
        
        var field = data.field[y][x];
        var gfxClass = "gfx-";
        if (field >= 240 && field < 256) {
          gfxClass += "" + (field - 240) + "-0";
        } else if (field >= 256 && field < 264) {
          gfxClass += "" + (field - 256) + "-2";
        } else if (field >= 324 && field < 340) {
          gfxClass += "" + (field - 324) + "-1";
        } else if (field >= 340 && field < 356) {
          gfxClass += "" + (field - 340) + "-3";
        } else if (field >= 272 && field < 304) {
          gfxClass += "0-8";
        } else if (field >= 308 && field < 316) {
          gfxClass += "" + (field - 308) + "-9";
        } else {
          continue;
        }
        
        elements += "<div id='tile-" + x + "-" + y + "' class='tile x-" + x + " y-" + y + " " + gfxClass + "'></div>";
      }
    }
    $('#playfield').append(elements);
  });
  
});