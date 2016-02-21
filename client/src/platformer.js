'use strict'

/**
 * Main "namespace" for the Platformer Stuff
 */
var Platformer = Platformer || {
    unit: 50.0,
    playerScale: 0.45,
    game: null,
    gravity: 50.0 * 13.5,
    padding: 100,
    speed: {
        walk: 50 * 4.3,
        jump: 50 * 8.4,
    },
    cache: {},
};

/**
 * A simple color class
 */
Platformer.Color = function(r, g, b, a) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a || 255;
};

/**
 * A static function to go from a hex string to a color object
 */
Platformer.Color.fromHex = function(hex) {
    var bigint = parseInt(hex.substr(1), 16);
    var values = [
        (bigint >> 24) & 255,
        (bigint >> 16) & 255,
        (bigint >> 8) & 255,
        bigint & 255,
    ];

    if(hex.length > 7) {
        return new Platformer.Color(
            values[0], values[1], values[2], values[3]);
    }

    return new Platformer.Color(
        values[1], values[2], values[3]);

};

/**
 * Platformer GLobal Game Functions (preload, create, update)
 */
Platformer.preload = function() {
};

Platformer.create = function() {
    window.Platformer = Platformer;
    Platformer.game.physics.startSystem(Phaser.Physics.ARCADE);
    Platformer.game.physics.arcade.gravity.y = Platformer.gravity;
    Platformer.game.scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL;
    Platformer.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;

    Platformer.game.state.add("LevelState", LevelState);
    Platformer.game.state.add("LoadState", LoadState);
    Platformer.game.state.start("LoadState");
    Platformer.game.scale.refresh();
};

Platformer.update = function() {

};

/**
 * The main client function where we retrieve the current level data
 * from the server.
 *
 * We maintain a cached version to prevent loading everytime we die.
 */
Platformer.loadLevelData = function(callback) {
    if(Platformer.cache.levelData) {
        callback();
    }
    else {
        var levelURL = "/world/levelData";
        $.getJSON(levelURL).then(function(levelData) {
            Platformer.cache.levelData = levelData;
            callback();
        });
    }
};

/**
 * The main client function where we retrieve the current onion data from
 * the server. Each onion data package can also optionally
 * contain a message (integer) id.
 *
 * [TODO]
 *   + Pull the actual message data from the server
 */
Platformer.loadMessageData = function(callback) {
    if(Platformer.cache.messageData) {
        callback();
    }
    else {
        Platformer.cache.messageData = [
            {
                onion: {pos: {x: 5, y: 4}, color: "#FF0000"},
                message: 1,
            },
            {
                onion: {pos: {x: 0, y: 0}, color: "#0FFF00"},
            },
        ];

        callback();
    }
};

/**
 * A simple helper function to retrieve a message string
 * based on a message id
 */
Platformer.getMessage = function(id) {
    if(id == 1) {
        return "Hello, Message!";
    }

    return "Err...";
};

/**
 * Create the font style based on mostly common style parameters.
 * Note: this function should only be used for onion messages!
 */
Platformer.getFontStyle = function(color) {
    return {
        font: (Platformer.unit * 0.25) + "px Arial",
        fill: color,
        align: "center",
    };
}

/**
 * Add the current player to the rest of the onion data.
 * This should probably only be called when the player dies.
 *
 * [TODO] Push the data also to the server
 */
Platformer.pushOnionData = function(pos, color, msg) {
    var onion = {
        onion: {pos: pos, color: color},
        msg: msg
    };

    Platformer.cache.messageData.push(onion);
};

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
 * The load state is called when loading the level.
 *
 * [TODO]
 *   + Add "Loading..." text or something similar
 */

var LoadState = function(){};
LoadState.prototype = {
  	create: function(){
        Platformer.loadLevelData(function() {
            Platformer.loadMessageData(function() {
                Platformer.game.state.start("LevelState");
            });
        });
	},
};

/**
 * The levelState contains and manages the actual game logic.
 */
var LevelState = function(){};
LevelState.prototype = {
  	create: function() {
        this.planet = new Platformer.World(Platformer.game);
        this.planet.create(
            Platformer.cache.levelData,
            Platformer.cache.messageData);
	},
    update: function() {
        this.planet.update();
    },
};

/**
 * The World object manages everything in the game.
 * This contains also the player.
 */
Platformer.World = function() {
    this.bounds = {
        min: {x: 0, y: 0},
        max: {x: 0, y: 0},
    };

    this.platforms = Platformer.game.add.group();
    this.obstacles = Platformer.game.add.group();
    this.goals = Platformer.game.add.group();
};

/**
 * Helper functions to go from Json position to WorldPosition,
 * and the other way around.
 */
Platformer.World.getPos = function(x, y) {
    return {
        x: x * Platformer.unit + Platformer.padding,
        y: y * Platformer.unit + Platformer.padding,
    };
};
Platformer.World.getJsonPos = function(pos) {
    return {
        x: (pos.x - Platformer.padding) / Platformer.unit,
        y: (pos.y - Platformer.padding) / Platformer.unit,
    };
};

Platformer.World.prototype = {
    create: function(levelData, messageData) {
        var that = this;

        var startPositions = [];
        levelData.tiles.forEach(function(tile) {
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
            else if(tile.type == "goal") {
                that.addGoal(tile.position[0], tile.position[1], tile.color);
            }
        });

        var pos = startPositions[Math.floor(Math.random() * startPositions.length)];
        this.player = new Platformer.Player(Platformer.World.getPos(pos[0], pos[1]), Platformer.game);

        this.bounds.min.x -= Platformer.padding;
        this.bounds.min.y -= Platformer.padding;
        this.bounds.max.x += Platformer.padding;
        this.bounds.max.y += Platformer.padding;

        Platformer.game.world.setBounds(
            this.bounds.min.x, this.bounds.min.y,
            this.bounds.max.x - this.bounds.min.x,
            this.bounds.max.y - this.bounds.min.y);

        messageData.forEach(this.addOnion);
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
        var pos = Platformer.World.getPos(x, y);
        var square = Platformer.createSquare(pos, color);

        var max = {
            x: pos.x + Platformer.unit,
            y: pos.y + Platformer.unit,
        };
        if(max.x > this.bounds.max.x) {
            this.bounds.max.x = max.x;
        }
        else if(pos.x < this.bounds.min.x) {
            this.bounds.min.x = pos.x;
        }
        if(max.y > this.bounds.max.y) {
            this.bounds.max.y = max.y;
        }
        else if(pos.y < this.bounds.min.y) {
            this.bounds.min.y = pos.y;
        }

        square.body.allowGravity = false;
        square.body.immovable = true;

        this.platforms.add(square);
    },

    addGoal: function(x, y, color) {
        var position = Platformer.World.getPos(x, y);
        var square = Platformer.createSquare(position, color);

        square.body.allowGravity = false;
        square.body.immovable = true;

        this.goals.add(square);
    },

    addOnion: function(data) {
        var pos = Platformer.World.getPos(
            data.onion.pos.x, data.onion.pos.y);
        var square = Platformer.createSquare(
            pos, data.onion.color + "90",
            Platformer.playerScale);

        square.body.allowGravity = false;
        square.body.immovable = true;

        if(data.message) {
            var text = Platformer.game.add.text(
                pos.x, pos.y - (Platformer.unit / 2),
                Platformer.getMessage(data.message),
                Platformer.getFontStyle(data.onion.color));

                text.anchor.set(0.5);
        }
    },

    update: function() {
        this.player.collide(this.obstacles, this.onPlayerDie);
        this.player.collide(this.goals, this.onPlayerReachGoal);
        this.player.collide(this.platforms);
        this.player.update();

        // Check if we're not outside the level (dead)
        var pos = this.player.getPos();
        if(pos.x < Platformer.padding
                || (this.bounds.max.x - pos.x) < Platformer.padding
                || (this.bounds.max.y - pos.y) < Platformer.padding) {
            this.onPlayerDie(this.player);
        }
    },

    onPlayerDie: function(player) {
        console.log("DIE!");
        // todo: MSG SELECT LOGIC
        Platformer.pushOnionData(
            Platformer.World.getJsonPos(player.getPos()),
            player.color);
        Platformer.game.state.start("LoadState");
    },

    onPlayerReachGoal: function() {
        console.log("WIN!");
        Platformer.game.state.start("LoadState");
    },
};

/**
 * The player object.
 */
Platformer.Player = function(pos) {
    this.color = "#FFFF00";
    this.square = Platformer.createSquare(
        pos, this.color, Platformer.playerScale);

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

    getPos: function() {
        return {
            x: this.square.x,
            y: this.square.y,
        };
    },

    collide: function(other, callback) {
        if(Platformer.game.physics.arcade.collide(this.square, other) && callback) {
            callback(this);
        }
    }
};
