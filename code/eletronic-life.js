var plan = ["############################",
            "#      #    #      o      ##",
            "#                          #",
            "# ~        #####           #",
            "##         #   #    ##     #",
            "###           ##     #     #",
            "#           ###      #     #",
            "#   ####                   #",
            "#   ##       o             #",
            "# o  #         o       ### #",
            "#    #                     #",
            "############################"];

// Objeto simples de Vetor
function Vector(x, y) {
    this.x = x;
    this.y = y;
}
Vector.prototype.plus = function(other) {
    return new Vector (this.x + other.x, this.y + other.y)
}
/* 
var grid = ["top left",    "top middle",    "top right",
            "bottom left", "bottom middle", "bottom right"];
console.log(grid[2 + 1 * 3]) */

// Modela o mundo
function Grid(width, height ) { 
    this.space = new Array(width * height)
    this.width = width;
    this.height = height;
}
Grid.prototype.isInside = function(vector) {
    return vector.x >= 0 && vector.x <= this.width &&
           vector.y >= 0 && vector.y <= this.height;
}
Grid.prototype.get = function(vector) {
    return this.space[vector.x + this.width * vector.y]
}
Grid.prototype.set = function(vector, value) {
    this.space[vector.x + this.width * vector.y] = value
}
Grid.prototype.forEach = function(f, context) {
    for (var y = 0; y < this.height; y++) {
        for (var x = 0; x < this.width; x++) {
            var value = this.space[x + y * this.width]
            if (value != null)
                f.call(context, value, new Vector(x, y))
        }
    }
}

/*         # PRIMEIRO TESTE #            */                  
/*                                       */
/*var grid = new Grid(5, 5);             */
/*grid.set(new Vector(1,1), 'X');        */
/*console.log(grid.get(new Vector(1,1))) */
/*                                       */
/*           --> X                       */

// Utilizado no comando move para somar a posição atual do monstro com a posição
// de destino
var directions = {
    "n" :   new Vector(0, -1),
    "ne" :  new Vector(1, -1),
    "e" :   new Vector(1, 0),
    "se" :  new Vector(1, 1),
    "s" :   new Vector(0, 1),
    "sw" :  new Vector(-1, 1),
    "w" :   new Vector(-1, 0),
    "nw":   new Vector(-1, -1)  
};

function randomElement(array) {
    return array[Math.floor(Math.random() * array.length)]
}

var directionNames = "n ne e se s sw w nw".split(" ")

// Verifica uma possivél direção para o monstro
function BouncingCritter() {
    this.direction = randomElement(directionNames)
}
// retorna um ação com tipo e direção (aleatória)
BouncingCritter.prototype.act = function (view) {
    if(view.look(this.direction) != " ")
        this.direction = view.find(" ") || "s"
    return {type: "move", direction: this.direction}
}

function elementFromChar(legend, ch) {
    //Espaço vazio não tem legenda
    if (ch == " ") 
        return null
    //Cria um elemento de acordo com o char e legenda (#, O)
    var element = new legend[ch]()
    //Qual persongam o elemento foi originalmente criado
    element.originChar = ch
    return element
}
// Cria o mundo à partir do plano (Matriz de String que representa o mapa), e
//  uma legenda que diz o que cada personagem significa.
function World(map, legend) {
    var grid = new Grid(map[0].length, map.length)
    this.grid = grid;
    this.legend = legend

    //Seta a grid de acordo com o tamanho do  mapa, e retorna um elemento 
    //pra cada posição do mapa (plan)
    map.forEach((line, y) => {
        for( var x = 0; x < line.length; x++)
            grid.set(new Vector(x, y), elementFromChar(legend, line[x]))
    })
}

//Retorna o char de um elemento para colocar no toString output
function charFromElement(element) {
    if (element == null) 
        return " "
    else 
        return element.originChar
}
//Constrói uma sequencia de mapeamento do estado atual do mundo através da grid.
World.prototype.toString = function() {
    var output = ""
    
    for (var y = 0; y < this.grid.height; y++) {
        for (var x = 0; x < this.grid.width; x++) {
            var element = this.grid.get(new Vector(x, y))                
            output += charFromElement(element)
        }
        output += "\n"
    }
    return output
}
World.prototype.turn = function() {
    var acted = [];
    this.grid.forEach(function(critter, vector){
        if (critter.act && acted.indexOf(critter) == -1) {
            acted.push(critter)
            this.letAct(critter, vector)
        }
    }, this)
}
World.prototype.letAct = function(critter, vector) {
    var action = critter.act(new View(this, vector))
    if (action && action.type == 'move'){
        var dest = this.checkDestination(action, vector);
        if (dest && this.grid.get(dest) == null){
            this.grid.set(vector, null)
            this.grid.set(dest, critter)
        }
    }
}
World.prototype.checkDestination = function(action, vector) {
    if (directions.hasOwnProperty(action.direction)) {
        var dest = vector.plus(directions[action.direction])
        if (this.grid.isInside(dest)) 
            return dest
    }
}

function View(world, vector) {
    this.world = world
    this.vector = vector
}
View.prototype.look = function(dir) {
    var target = this.vector.plus(directions[dir])
    /*console.log(
        ' x: '+target.x+
        ' y: '+target.y+
        ' char: '+charFromElement(this.world.grid.get(target)))*/
    if (this.world.grid.isInside(target)) 
        return charFromElement(this.world.grid.get(target))
    else
        return '#'
}   
View.prototype.findAll = function(ch) {
    var found = [];
    for (var dir in directions)
        if (this.look(dir) == ch)
            found.push(dir)
    return found
}
View.prototype.find = function(ch) {
    var found = this.findAll(ch);
    if (found.length == 0) return null
    return randomElement(found) 
}

function Wall () { }

function dirPlus(dir, n) {
    var index = directionNames.indexOf(dir)
    return directionNames[(index + n + 8) % 8]
}

function WallFollower() {
    this.dir = 's'
}
WallFollower.prototype.act = function(view) {
    var start = this.dir
    if (view.look(dirPlus(this.dir, -3)) != ' ')
        start = this.dir = dirPlus(this.dir, -2)
    while(view.look(this.dir) != ' ') {
        this.dir = dirPlus(this.dir, 1)
        if (this.dir == start) break
    } 
    return {type: "move", direction: this.dir}
}

function LifeLikeWorld(map, legend) {
    World.call(this, map, legend)
}
LifeLikeWorld.prototype = Object.create(World.prototype)

var actionTypes = Object.create(null)

LifeLikeWorld.prototype.letAct = function(critter, vector) {
    var action = critter.act(new View(this, vector))
    var handled = action && 
        action.type in actionTypes &&
        actionTypes[action.type].call(this, critter, vector, action)
    
    if (!handled) {
        critter.energy -= 0.2
        if (critter.energy <= 0)
            this.grid.set(vector, null)
    }
}

actionTypes.grow = function(critter) {
    critter.energy += 0.5
    return true
}
actionTypes.move = function(critter, vector, action) {
    var dest = this.checkDestination(action, vector)
    if (dest == null ||
        critter.energy <= 1 ||
        this.grid.get(dest) != null)
            return false
    critter.energy -= 1
    this.grid.set(vector, null)
    this.grid.set(dest, critter)
    return true
}
actionTypes.eat = function(critter, vector, action) {
    var dest = this.checkDestination(action, vector)
    var atDest = dest != null && this.grid.get(dest)
    if (!atDest || atDest.energy == null)  
        return false
    critter.energy += atDest.energy
    this.grid.set(dest, null)
    return true
}
actionTypes.reproduce = function(critter, vector, action) {
    var baby = elementFromChar(this.legend, critter.originChar)
    var dest = this.checkDestination(action, vector)
    if (dest == null ||
        critter.energy <= 2 * baby.energy ||
        this.grid.get(dest) != null)
            return false
    critter.energy -= 2 * baby.energy
    this.grid.set(dest, baby)
    return true
}

function Plant() {
    this.energy = 3 + Math.random() * 4
    this.color = '#fff222'
}

Plant.prototype.act = function(view) {
    if (this.energy > 15){
        var space = view.find(" ")
        if (space) 
            return {type: 'reproduce', direction: space}    
    }
    if (this.energy < 20)
        return {type: 'grow'}
}

function PlantEater() {
    this.energy = 20
}
PlantEater.prototype.act = function(view) {
    var space = view.find(" ")
    if (this.energy > 60 && space)
        return {type: 'reproduce', direction: space}
    var plant = view.find('*')
    if (plant) 
        return {type: 'eat', direction: plant}
    if (space)
        return {type: 'move', direction: space}
}

function SmartPlantEater() {
    this.energy = 30
    this.direction = 's'
}
SmartPlantEater.prototype.act = function(view) {
    var space = view.find(" ")
    if (this.energy > 90 && space)
        return {type: 'reproduce', direction: space}
    var plants = view.findAll("*")
    if (plants.length > 1) 
        return {type: 'eat', direction: randomElement(plants)}
    if (view.look(this.direction) != " " && space)
        this.direction = space
    return {type: 'move', direction: this.direction}       
}

function Tiger() {
    this.energy = 100;
    this.direction = 'w'
    this.preySeen = []
}
Tiger.prototype.act = function(view) {
    //Média de quantas presas foram vista por turno
    var seenPerTurn = this.preySeen.reduce((a, b) => { 
        return a + b 
    }, 0) / this.preySeen.length
    var prey = view.findAll("O")
    this.preySeen.push(prey.length)
    //Guarda somente o valor de 6 turnos
    if (this.preySeen.length > 6) 
        this.preySeen.shift()
    //Só podem comer se verem mais que 1/4 de presas por turno
    if (prey.length && seenPerTurn > 0.25) 
        return {type: 'eat', direction: randomElement(prey)}
    var space = view.find(" ")
    if (this.energy > 500 && space)
        return {type: 'reproduce', direction: space}
    if (view.look(this.direction) != " " && space)
        this.direction = space
    return {type: 'move', direction: this.direction}
}
var world = new LifeLikeWorld(
   ["####################################################",
    "#                 ####         ****              ###",
    "#   *  @  ##                 ########       OO    ##",
    "#   *    ##        O O                 ****       *#",
    "#       ##*                        ##########     *#",
    "#      ##***  *         ****                     **#",
    "#* **  #  *  ***      #########                  **#",
    "#* **  #      *               #   *              **#",
    "#     ##              #   O   #  ***          ######",
    "#*            @       #       #   *        O  #    #",
    "#*                    #  ######                 ** #",
    "###          ****          ***                  ** #",
    "#       O                        @         O       #",
    "#   *     ##  ##  ##  ##               ###      *  #",
    "#   **         #              *       #####  O     #",
    "##  **  O   O  #  #    ***  ***        ###      ** #",
    "###               #   *****                    ****#",
    "####################################################"],
    {"#": Wall,
     "O": SmartPlantEater,
     "*": Plant,
     "@": Tiger}
  );
  