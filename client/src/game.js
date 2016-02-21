$(function() {
    Platformer.ui = new UI($('#ui'));

	Platformer.game = new Phaser.Game(
        "100%", "100%", Phaser.AUTO, 'Game',
        { preload: preload, create: create, update: update });

    function preload () {
        Platformer.preload();
    }

    function create () {
        Platformer.create();
    }

    function update() {
        Platformer.update();
    }
});
