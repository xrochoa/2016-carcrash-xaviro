'use strict';

var state, game, add, physics;

var Player = function(state, x, y, frame, key) {
    state = state;
    game = state.game;
    add = state.add;
    physics = state.physics;

    window.Phaser.Sprite.call(this, game, x, y, frame, key); //creates new sprite
    add.existing(this); //adds sprite to state

    //initialize
    this.animations.add('explode', [1, 2, 3, 4, 5, 6], 10, false).killOnComplete = true;
    physics.arcade.enable(this);
    this.scale.x = game.init.pixelScale;
    this.scale.y = game.init.pixelScale;
};

Player.prototype = Object.create(window.Phaser.Sprite.prototype); //inherits properties and functions from Sprite object
Player.prototype.constructor = Player; //sets a reference to the class that will create new objects

Player.prototype.moveUp = function() {
    this.accelerate();
    add.tween(this).to({
        y: game.init.lanes()[0]
    }, game.init.laneSwapDuration(), window.Phaser.Easing.Sinusoidal.InOut, true, 0);
};

Player.prototype.moveDown = function() {
    this.accelerate();
    add.tween(this).to({
        y: game.init.lanes()[1]
    }, game.init.laneSwapDuration(), window.Phaser.Easing.Sinusoidal.InOut, true, 0);
};

Player.prototype.moveRight = function() {
    this.accelerate();
};

Player.prototype.accelerate = function() {
    this.body.velocity.x = game.init.carPedal();
};
