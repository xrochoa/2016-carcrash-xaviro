'use strict';

var init = {

    pixelScale: 10,
    gameSpeed: 0.5,

    gameInit: false,
    gameOver: false,
    enemySpeed: 300,
    ajax: true,

    score: 0,
    levelIndex: 0,

    nextLevel: [10, 100, 1000],

    win: 1000,
    highscore: 0,
    highscoreTriggered: false,


    //network
    gameId: 'carcrash',
    //Backend integration was part of the original FridgeBinge platform
    //(user accounts, stored highscores). Disabled for the standalone
    //portfolio build so the game runs on any static host.
    network: false,

    source: './games/carcrash/assets',

    mute: true,

    //depend on gameSpeed
    gameSpeedSlower: function() {
        return this.gameSpeed / 2;
    },
    gameSpeedSlowest: function() {
        return this.gameSpeed / 10;
    },


    //depend on pixelscale
    lanes: function() {
        var lane1 = 36 * this.pixelScale;
        var lane2 = 42 * this.pixelScale;
        var middleLane = 40.5 * this.pixelScale;
        return [lane1, lane2, middleLane];
    },
    gravity: function() {
        return -35 * this.pixelScale;
    },
    carPedal: function() {
        return 10 * this.pixelScale;
    },
    gameWidth: function() {
        return 30 * this.pixelScale;
    },
    gameHeight: function() {
        return 60 * this.pixelScale;
    }


};
