# A simple logger implementation...
Logger =
  log: (message) ->
    console.log(message) if console?

wrap = (val, max) ->
  val += max if (val < 0)
  val = val % max

wrap16 = (val) ->
  wrap(val, 16)

wrap8 = (val) ->
  wrap(val, 8)

newDirectionMirror = (old) ->
  nu = (16-@subtype) - old
  wrap16 nu

#  3
# 2 0
#  1

newDirectionWall = (old, enteredAtSide) ->
  #Logger.log("old: " + old)
  # got it all wrong, quickfix
  old = wrap16(old + 8)
  direction = switch enteredAtSide
    when 0
      16 - (0 - old)
    when 2,4,6
      ((enteredAtSide * 2) + ((enteredAtSide * 2) - old))
    when 1,3,5,7
      old
  wrap16 direction

class GameObject

  listeners: []
  x: 0
  y: 0
  animCount: 0
  CurrentGfxClass: ""
  subtype: 0

  newByFieldData: (x, y, field) ->
    if GameObject::TYPES[field[0]]?
      new GameObject::TYPES[field[0]](x,y,field[0],field[1])
    else
      new GameObject(x,y,"unknown", field[1])

  constructor: (x,y, type, subtype) ->
    @x = x
    @y = y
    @kind = type
    @subtype = subtype if subtype?

  gfxClass: -> ""
  selector: -> "\#tile-#{this.x}-#{this.y}"
  tileDiv: ->
    @currentGfxClass = @gfxClass()
    "<div id='tile-#{@x}-#{@y}' class='tile x-#{@x} y-#{@y} #{@gfxClass()}'></div>"
  updateGfx: ->
    newGfxClass = @gfxClass()
    $(@selector()).removeClass(@currentGfxClass).addClass(newGfxClass)
    @currentGfxClass = newGfxClass
  animation: ->
  click: ->
  enterBeam: (nextX, nextY, direction) ->
    [nextX, nextY, direction, true, true]

  pixelIsSolid: (x,y) ->
    bit = Math.floor(x % 32 / 16) + (Math.floor(y % 32 / 16) * 2)
    @subtype & (1 << bit)

  enteredFrom: (gx,gy, size) ->
    x = gx % size
    y = gy % size
    Logger.log("x: " + x)
    Logger.log("y: " + y)
    max = size - 1
    side = 0

    if x is (max) and y > 0
      side = 0
    else if x is (max) and y is max
      side = 1
    else if 0 < x < (max) and y is max
      side = 2
    else if x is 0 and y is max
      side = 3
    else if x is 0 and 0 < y < max
      side = 4
    else if x is y and x is 0
      side = 5
    else if x > y and y <= 0 and x < max
      side = 6
    else if x is max and y = 0
      side = 7
    else 0
    Logger.log("side: " + side)
    side

class Mirror extends GameObject
  gfxClass: -> "gfx-#{@subtype}-0"
  click: (button) ->
    Logger.log(button)
    switch button
      when 3
        @subtype = (@subtype + 1) % 16
        @updateGfx()
      when 1
        @subtype = (@subtype - 1)
        if @subtype < 0 then @subtype = 15
        @updateGfx()
  listeners: ['click']
  newDirection: newDirectionMirror
  enterBeam: (nextX, nextY, direction) ->
    if 15 <= (nextX % 32) <= 16 && 15 <= (nextY % 32) <= 16
      direction = @newDirection(direction)
      [nextX, nextY, direction, true, true]
    else
      [nextX, nextY, direction, false, true]

class GridWood extends GameObject
  gfxClass: -> "gfx-#{@subtype}-2"
  enterBeam: (nextX, nextY, direction) ->
    clear = 8-@subtype
    keepOn = ((direction is clear) or ((direction + 8) % 16 is clear))
    [nextX, nextY, direction, true, keepOn]


class GridSteel extends GameObject
  gfxClass: -> "gfx-#{@subtype}-2"
  enterBeam: (x,y,direction) ->
    Logger.log("eb d: " + direction)
    clear = 8-@subtype
    unless keepOn = ((direction is clear) or ((direction + 8) % 16 is clear))
      direction = @newDirection(direction, @enteredFrom(x,y, 32))
      Logger.log(direction)
    [x, y, direction, true, true]

  newDirection: newDirectionWall


class WallWood extends GameObject
  gfxClass: -> return "gfx-#{@subtype}-13"
  enterBeam: (nextX, nextY, direction) ->
    if @pixelIsSolid(nextX, nextY)
      [nextX, nextY, direction, true, false]
    else
      [nextX, nextY, direction, false, true]

class WallSteel extends GameObject
  gfxClass: -> "gfx-#{@subtype}-12"
  enterBeam: (x,y,direction) ->
    Logger.log(@enteredFrom(x,y, 8))
    direction = @newDirection(direction, @enteredFrom(x,y, 8))
    [x, y, direction, false, true]

  newDirection: newDirectionWall

class Cell extends GameObject
  gfxClass: -> "gfx-2-8"

class Mine extends GameObject
  gfxClass: -> "gfx-3-8"

class Refractor extends GameObject
  gfxClass: -> "gfx-1-8"
  newDirection: (old) ->
    outMiddle = (Math.round(direction / 4) * 4) % 16
    wrap16(outMiddle + (Math.round(6 * Math.random()) - 3 ))

class Lazer extends GameObject
  gfxClass: -> "gfx-#{@subtype}-9"
  enterBeam: (nextX, nextY, direction) ->
    [nextX, nextY, direction, true, false]

class Detector extends GameObject
  gfxClass: -> "gfx-#{@subtype + 4}-9"

class FiberOptics extends GameObject
  gfxClass: -> "gfx-0-10"

class MirrorAuto extends Mirror
  listeners: ['animation', 'click']
  animation: ->
    @subtype -= 1
    @subtype = wrap16 @subtype
    @updateGfx()
  newDirection: newDirectionMirror

class GridWoodAuto extends GridWood
  listeners: ['animation']
  animation: ->
    @subtype -= 1
    @subtype = wrap8 @subtype
    @updateGfx()

class GridSteelAuto extends GridSteel
  listeners: ['animation']
  animation: ->
    this.animCount++
    if (this.animCount % 2) is 0
      this.subtype -= 1
      @subtype = wrap8 @subtype
      this.updateGfx()

# assignment needs to be deferred because otherwise the classes would not be defined.
GameObject::TYPES =
  mirror: Mirror, mirror_auto: MirrorAuto
  grid_wood: GridWood, grid_wood_auto: GridWoodAuto
  grid_steel: GridSteel, grid_steel_auto: GridSteelAuto
  lazer: Lazer
  detector: Detector
  cell: Cell
  mine: Mine
  fiberoptics: FiberOptics
  wall_wood: WallWood, wall_steel: WallSteel

class PlayField
  addListeners: (go) ->
    for listener in go.listeners
      @listeners[listener] ?= []
      @listeners[listener].push(go)

  createGameField: (data) ->
    elements = ""
    for y in [0...data.field.length]
      @objects[y] = []
      for x in [0...data.field[y].length]
        go = null
        field = data.field[y][x]
        if field? and (go = GameObject::newByFieldData(x, y, field))?
          @addListeners(go)
          if go.kind is 'lazer'
            @lazer = go
          elements += go.tileDiv()
          @objects[y].push(go)
    $('#playfield').append(elements)

  addEventListeners: ->
    $('#canvas').mousedown((e) =>
      tile = @tileForEvent(e)
      offset = $('#playfield').offset()
      @gameState.click = [tile, e.which];
      false
    ).mouseup((e) =>
      tile = @tileForEvent(e);
      if @gameState.click? and
        @gameState.click[0][0] is tile[0] and
        @gameState.click[0][1] is tile[1] and
        @gameState.click[1] is e.which

        @objects[tile[1]][tile[0]].click(e.which)
        @gameState.click = null;
      false
    ).bind("contextmenu", (e) =>
      e.preventDefault()
    ).bind("mousemove", (e) =>
      [x,y] = @tileForEvent(e)
      if (obj = @objectAtCoordinate(x*32,y*32))?
        $('#debug').html("kind: " + obj.kind + " subtype: " + obj.subtype)
    )


  initCanvas: ->
    @canvas = $('canvas#canvas').get(0).getContext('2d')
    @canvas.strokeStyle = '#ffff00'
    @canvas.lineWidth = 3
    @canvas.lineJoin = 'bevel'
    @canvas.shadowColor = "rgba(0,0,0,0.5)"
    @canvas.shadowBlur = 2
    @canvas.shadowOffsetX = 3
    @canvas.shadowOffsetY = 3

  gameLoop: ->
    if @listeners.animation?
      for obj in @listeners.animation
        obj.animation()
    @lazersDo()


  initGameLoop: ->
    window.setInterval(=>
      @gameLoop()
    100)


  constructor: (data) ->
    startTime = new Date().getTime();
    Logger.log("loaded data. initializing screen");
    @createGameField(data)
    @addEventListeners()
    @initCanvas()
    @initGameLoop()
    Logger.log("Setup Time: #{new Date().getTime() - startTime} ms")

  DIRECTIONS:
    [
      [1,0],[2,1],[1,1],[1,2]
      [0,1],[-1,2],[-1,1],[-2,1]
      [-1,0],[-2,-1],[-1,-1],[-1,-2]
      [0,-1],[1,-2],[1,-1],[2,-1]
    ]

  gameState: {}
  objects: []
  listeners: {}
  canvas: null

  objectAtCoordinate: (x,y) ->
    [slotX, slotY] = @tileAtCoordinate(x,y)
    if @objects[slotY]? and @objects[slotY][slotX]?
      @objects[slotY][slotX]
    else
      undefined

  tileAtCoordinate: (x,y) ->
    [Math.floor(x / 32), Math.floor(y / 32)]

  tileForEvent: (e) ->
    offset = $('#playfield').offset()
    @tileAtCoordinate(e.pageX - offset.left, e.pageY - offset.top)

  startLazers: ->
    startTime = new Date().getTime()
    @canvas.clearRect(0,0,512, 384)
    @canvas.beginPath()
    @direction = @lazer.subtype * 4
    startX = @lazer.x * 32 + 16
    startY = @lazer.y * 32 + 16
    @canvas.moveTo(startX, startY)
    [startX, startY]

  advance: (x,y) ->
    [x + @DIRECTIONS[@direction][0]*8, y + @DIRECTIONS[@direction][1]*8]

  lazersDo: ->
    [nextX, nextY] = @startLazers()
    nextObj = null
    keepOn = true
    safety = 0
    currentObject = @objectAtCoordinate(nextX, nextY)

    while keepOn and safety < 10000
      safety++
      [nextX, nextY] = @advance(nextX, nextY)
      [testX, testY] = [nextX, nextY]
      if (3 < @direction < 13)
        testX = nextX - 1
      if (8 < @direction <= 15)
        testY = nextY - 1

      nextObj = @objectAtCoordinate(testX, testY)
      if nextObj isnt currentObject
        unless nextObj?
          keepOn = false
        else
          [testX, testY, @direction, checked, cont] = nextObj.enterBeam(testX, testY, @direction)
          currentObject = nextObj if checked
          keepOn = cont
      @canvas.lineTo(nextX,nextY)

    @canvas.stroke()

  # resetToBoundary: (direction, nxt, which) ->
  #   if Math.abs(DIRECTIONS[direction][0]) is 2 or Math.abs(DIRECTIONS[direction][1]) is 2
  #     nxt - ((DIRECTIONS[direction][which] / 2) * 16)
  #   else
  #     nxt - ((DIRECTIONS[direction][which]) * 16)

data =
  field: [
    [['mirror', 4],['empty', 0], ['lazer', 2], ['mirror_auto', 0]],
    [['mirror', 10],['empty', 0], ['empty', 0], ['mirror', 12]],
    [['empty', 0],['wall_steel', 10], ['grid_steel', 1], ['wall_wood', 14]]
    [['wall_steel', 13],['empty', 0], ['grid_steel', 1], ['wall_wood', 14]]
  ]
$(->
  playfield = new PlayField(data)
)
