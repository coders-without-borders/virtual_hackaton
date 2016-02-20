'use strict'

/**
 * Main object for all the Platformer stuff, containing
 * prototypes, global values and helper functions
 */
var Platformer = Platformer || {
    unit: 35.0,
    playerScale: 0.65,
    game: null,
    gravity: 450,
    padding: 100,
    speed: {
        walk: 120,
        jump: 180,
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
Platformer.createSquare = function(pos, color, scale) {
    scale = scale || 1.0;
    color = Platformer.Color.fromHex(color);
    var graphics = Platformer.game.add.bitmapData(Platformer.unit * scale, Platformer.unit * scale);
    graphics.fill(color.r, color.g, color.b, color.a);
    var square = Platformer.game.add.sprite(pos.x, pos.y, graphics);
    Platformer.game.physics.arcade.enable(square);

    return square;
}

/**
 * A helper function to create a circle with physics.
 */
Platformer.createCircle = function(pos, color, scale) {
    var size = Platformer.unit * (scale || 1.0);
    var bmd = Platformer.game.add.bitmapData(size, size);
    bmd.ctx.fillStyle = color;
    bmd.ctx.beginPath();
    bmd.ctx.arc(bmd.width / 2, bmd.height / 2, size / 2, 0, 2 * Math.PI, true);
    bmd.ctx.fill();

    var circle = Platformer.game.add.sprite(pos.x, pos.y, bmd);
    Platformer.game.physics.arcade.enable(circle);

    return circle;
}

/**
 * The World object
 */
Platformer.World = function() {
    this.bounds = {
        min: {x: 0, y: 0},
        max: {x: 0, y: 0},
    };

    this.platforms = Platformer.game.add.group();
    this.obstacles = Platformer.game.add.group();
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
        var startPositions = [];
        level.tiles.forEach(function(tile) {
            if(tile.type == null) {
                that.addPlatform(tile.position[0], tile.position[1], tile.color);
            }
            else if(tile.type == "spinner") {
                that.addSpinner(tile.position[0], tile.position[1]);
            }
            else if(tile.type == "mover") {
                that.addMover(tile.position[0], tile.position[1]);
            }
            else if(tile.type == "spawn") {
                startPositions.push(tile.position);
            }
        });

        var pos = startPositions[Math.floor(Math.random() * startPositions.length)];
        this.player = new Platformer.Player(Platformer.World.getPos(pos[0], pos[1]));

        Platformer.game.world.setBounds(
            this.bounds.min.x, this.bounds.min.y,
            this.bounds.max.x + Platformer.padding * 2,
            this.bounds.max.y + Platformer.padding * 2);
    },

    addSpinner: function(x, y) {
        var pos = Platformer.World.getPos(x, y);

        var radius = Platformer.unit * 2;
        var speed = 0.075;
        if(Math.floor(Math.random() * 10) < 5) {
            speed *= -1;
        }

        var circularOffset = function(angle) {
            return [{
                x: pos.x + Math.sin(angle) * radius,
                y: pos.y + Math.cos(angle) * radius,
            }, angle + speed];
        };

        var angle = Math.floor(Math.random() * 1000) % 360;
        var offset = circularOffset(angle);
        angle = offset[1];

        var circle = Platformer.createCircle(offset[0], "#FFFFFF", 0.85);
        circle.body.allowGravity = false;

        circle.update = function() {
            var offset = circularOffset(angle);
            angle = offset[1];
            circle.x = offset[0].x;
            circle.y = offset[0].y;
        };

        this.obstacles.add(circle);
    },

    addMover: function(x, y) {
        var pos = Platformer.World.getPos(x, y);

        var radius = Platformer.unit * 2;
        var speed = 0.075;
        if(Math.floor(Math.random() * 10) < 5) {
            speed *= -1;
        }

        var linearOffset = function(angle) {
            return [{
                x: pos.x,
                y: pos.y + Math.sin(angle) * radius
            }, angle + speed];
        };

        var angle = Math.floor(Math.random() * 1000) % 360;
        var offset = linearOffset(angle);
        angle = offset[1];

        var circle = Platformer.createCircle(offset[0], "#FFFFFF", 0.85);
        circle.body.allowGravity = false;

        circle.update = function() {
            var offset = linearOffset(angle);
            angle = offset[1];
            circle.x = offset[0].x;
            circle.y = offset[0].y;
        };

        this.obstacles.add(circle);
    },

    addPlatform: function(x, y, color) {
        var position = Platformer.World.getPos(x, y);
        var square = Platformer.createSquare(position, color);

        var max = {
            x: position.x + Platformer.unit,
            y: position.y + Platformer.unit,
        };
        if(max.x > this.bounds.max.x) {
            this.bounds.max.x = max.x;
        }
        if(max.y > this.bounds.max.y) {
            this.bounds.max.y = max.y;
        }

        square.body.allowGravity = false;
        square.body.immovable = true;

        this.platforms.add(square);
    },

    update: function() {
        this.player.collide(this.obstacles, this.onPlayerHitColission);
        this.player.collide(this.platforms);
        this.player.update();
    },

    onPlayerHitColission: function(obj, other) {
        console.log("DIE! at position", obj.x, obj.y);
    },
};

/**
 * The player object.
 */
Platformer.Player = function(pos) {
    this.square = Platformer.createSquare(
        pos, "#FFFF00", Platformer.playerScale);

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

        var allowToJump = this.square.body.touching.down;
        if (this.jumpButton.isDown && allowToJump)
        {
            this.square.body.velocity.y = -Platformer.speed.jump;
        }
    },

    collide: function(other, callback) {
        if(Platformer.game.physics.arcade.collide(this.square, other) && callback) {
            callback(this.square, other);
        }
    }
};
