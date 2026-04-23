'use strict';

var init = {

    pixelScale: 10,

    gameInit: false,
    gameOver: false,
    ajax: true,

    score: 0,
    levelIndex: 0,

    //per-level tuning - chosen so every level lasts ~11s on average
    //given the score rate 2 * enemySpeed / 650 scores per second.
    enemySpeedsByLevel: [300, 450, 700, 1000],
    gameSpeedsByLevel: [0.5, 0.75, 1.15, 1.65],

    //score thresholds that trigger the next level (and the win state)
    nextLevel: [10, 25, 50],

    win: 85,
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

    //simulation / auto-demo mode: when true the game auto-starts and a tiny
    //reactive driver swaps lanes whenever an enemy is approaching in the
    //same lane. Toggled via the `?sim=1` URL param (see main.js).
    simulation: false,
    simulationLookahead: 18, //units of pixelScale to look ahead for danger
    simulationMinX: 2,       //minimum x (in pixelScale units) before an emergency pedal

    //current speeds - read from the per-level arrays
    enemySpeed: function() {
        return this.enemySpeedsByLevel[this.levelIndex];
    },
    gameSpeed: function() {
        return this.gameSpeedsByLevel[this.levelIndex];
    },

    //depend on gameSpeed
    gameSpeedSlower: function() {
        return this.gameSpeed() / 2;
    },
    gameSpeedSlowest: function() {
        return this.gameSpeed() / 10;
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
