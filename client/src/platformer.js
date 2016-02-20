'use strict'

/**
 * Main object for all the Platformer stuff, containing
 * prototypes, global values and helper functions
 */
var Platformer = Platformer || {
    unit: 35.0,
    game: null,
    gravity: 300,
    padding: 100,
    speed: {
        walk: 185,
        jump: 200,
    },
};

Platformer.Color = function(r, g, b) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = 255;
};

Platformer.Color.fromHex = function(hex) {
    var bigint = parseInt(hex.substr(1), 16);
    return new Platformer.Color(
        (bigint >> 16) & 255,
        (bigint >> 8) & 255,
        bigint & 255);
};

/**
 * Initialize the platformer stuff
 */
Platformer.init = function() {
    window.Platformer = Platformer;
    Platformer.game.physics.startSystem(Phaser.Physics.ARCADE);
    Platformer.game.physics.arcade.gravity.y = Platformer.gravity;
}

/**
 * A helper function to create a square with physics.
 */
Platformer.createSquare = function(pos, color) {
    var graphics = Platformer.game.add.bitmapData(Platformer.unit, Platformer.unit);
    graphics.fill(color.r, color.g, color.b, color.a);
    var square = Platformer.game.add.sprite(pos.x, pos.y, graphics);
    Platformer.game.physics.arcade.enable(square);

    return square;
}

/**
 * The World object
 */
Platformer.World = function() {
    this.player = new Platformer.Player({x: 400, y: 800});
    this.tiles = [];
    this.bounds = {
        min: {x: 0, y: 0},
        max: {x: 0, y: 0},
    };
};

Platformer.World.getPos = function(x, y) {
    return {
        x: x * Platformer.unit + Platformer.padding,
        y: y * Platformer.unit + Platformer.padding,
    };
};

Platformer.World.prototype = {
    start: function(level) {
        var that = this;
        level.tiles.forEach(function(tile) {
            var position = Platformer.World.getPos(tile.position[0], tile.position[1]);

            var square = Platformer.createSquare(
                position, Platformer.Color.fromHex(tile.color));

            var max = {
                x: position.x + Platformer.unit,
                y: position.y + Platformer.unit,
            };
            if(max.x > that.bounds.max.x) {
                that.bounds.max.x = max.x;
            }
            if(max.y > that.bounds.max.y) {
                that.bounds.max.y = max.y;
            }

            square.body.allowGravity = false;
            square.body.immovable = true;

            that.tiles.push(square);
        });

        Platformer.game.world.setBounds(
            this.bounds.min.x, this.bounds.min.y,
            this.bounds.max.x + Platformer.padding * 2,
            this.bounds.max.y + Platformer.padding * 2);
    },

    update: function() {
        var that = this;
        this.tiles.forEach(function(tile) {
            that.player.collide(tile);
        });

        this.player.update();
    },
};

/**
 * The player object.
 */
Platformer.Player = function(pos) {
    this.square = Platformer.createSquare(
        pos, Platformer.Color.fromHex("#FFFF00"));

    Platformer.game.camera.follow(this.square);

    this.square.body.bounce.y = 0;
    this.square.body.collideWorldBounds = true;

    this.cursors = Platformer.game.input.keyboard.createCursorKeys();
    this.jumpButton = Platformer.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
};

Platformer.Player.prototype = {
    update: function() {

        this.square.body.velocity.x = 0;
        if (this.cursors.left.isDown)
        {
            this.square.body.velocity.x = -Platformer.speed.walk;
        }
        else if (this.cursors.right.isDown)
        {
            this.square.body.velocity.x = Platformer.speed.walk;
        }

        var allowToJump = true;
        if (this.jumpButton.isDown && allowToJump)
        {
            this.square.body.velocity.y = -Platformer.speed.jump;
        }
    },

    collide: function(other) {
        Platformer.game.physics.arcade.collide(this.square, other);
    }
};
