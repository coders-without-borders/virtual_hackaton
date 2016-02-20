'use strict'

/**
 * Main object for all the Platformer stuff, containing
 * prototypes, global values and helper functions
 */
var Platformer = Platformer || {
    unit: 50.0,
    startPosition: {
        x: 100,
        y: 100,
    },
    game: null,
    gravity: 300,
};

/**
 * Initialize the platformer stuff
 */
Platformer.init = function() {
    window.Platformer = Platformer;
    Platformer.game.physics.startSystem(Phaser.Physics.ARCADE);
}

/**
 * A helper function to create a square with physics.
 */
Platformer.createSquare = function(x, y, width, height, r, g, b) {
    var graphics = Platformer.game.add.bitmapData(width, height);
    graphics.fill(r, g, b,255);

    var square = Platformer.game.add.sprite(0, 0, graphics);
    Platformer.game.physics.arcade.enable(square);

    return square;
}

/**
 * The player object.
 */
Platformer.Player = function () {
    this.square = Platformer.createSquare(
        Platformer.startPosition.x, Platformer.startPosition.y,
        Platformer.unit, Platformer.unit, 255, 0, 0);

    this.square.body.bounce.y = 0.1;
    this.square.body.gravity.y = Platformer.gravity;
    this.square.body.collideWorldBounds = true;
};

Platformer.Player.prototype = {
    update: function() {
        var cursors = Platformer.game.input.keyboard.createCursorKeys();

        this.square.body.velocity.x = 0;
        if (cursors.left.isDown)
        {
            this.square.body.velocity.x = -150;
        }
        else if (cursors.right.isDown)
        {
            this.square.body.velocity.x = 150;
        }

        if (cursors.up.isDown && this.square.body.touching.down)
        {
            this.square.body.velocity.y = -350;
        }
    },
};
