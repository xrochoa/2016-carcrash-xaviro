'use strict';




//initialize game
module.exports = function() {

    //DEPENDENCIES

    //initial game values
    //=require ./main/init.js

    //utilities
    //=require './main/utils.js

    //states

    //phaser configuration
    //=require './main/states/boot.js

    //asset loading
    //=require './main/states/preloader.js

    //game menu
    //=require './main/states/menu.js

    //game logic
    //=require './main/states/game.js

    //end of game
    //=require './main/states/win.js 

    //opt into simulation / auto-demo mode via `?sim=1` in the URL
    if (typeof window !== 'undefined' && window.location && /[?&]sim=1\b/.test(window.location.search)) {
        init.simulation = true;
    }

    var game = new Phaser.Game(init.gameWidth(), init.gameHeight(), Phaser.CANVAS, 'phaser-game', null, false, false);

    //extending game with utilities
    game.utils = utils;

    //extending game with initial game values
    game.init = init;

    //game states
    game.state.add('Boot', new Boot);
    game.state.add('Preloader', new Preloader);
    game.state.add('Menu', new Menu);
    game.state.add('Game', new GameState);
    game.state.add('Win', new Win);

    //launch boot state
    game.state.start('Boot');

    return game;

}
