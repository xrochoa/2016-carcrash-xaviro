'use strict';

//state and shortcuts
var preloaderState, game, load, add;

//sprites, audio and events
var fridgeBingeLogo, progressBar;

var Preloader = function() {};

Preloader.prototype = {

    preload: function() {

        //variables
        preloaderState = this;
        load = preloaderState.load;

        //set background logo and progress bar
        preloaderState.setProgressLogo();

        //LOAD GAME /img/        //menu
        load.image('menuBg', this.game.init.source + '/img/menu.png');
        load.image('title', this.game.init.source + '/img/title.png');
        load.image('btn-start', this.game.init.source + '/img/start.png');

        //color backgrounds
        load.spritesheet('bground', this.game.init.source + '/img/backgrounds.png', 30, 60, 4); // size 30x60 and 4 frames
        //level backgrounds
        load.image('lv1', this.game.init.source + '/img/lv1.png');
        load.image('lv2', this.game.init.source + '/img/lv2.png');
        load.image('lv3', this.game.init.source + '/img/lv3.png');
        load.image('lv4', this.game.init.source + '/img/lv4.png');
        //road
        load.image('road', this.game.init.source + '/img/road.png');
        //floor backgrounds
        load.image('floor1', this.game.init.source + '/img/floor1.png');
        load.image('floor2', this.game.init.source + '/img/floor2.png');
        load.image('floor3', this.game.init.source + '/img/floor3.png');
        load.image('floor4', this.game.init.source + '/img/floor4.png');
        //sprites
        load.spritesheet('car', this.game.init.source + '/img/car.png', 5, 3, 8);
        load.spritesheet('enemy', this.game.init.source + '/img/enemy.png', 5, 3, 8);
        load.image('truck', this.game.init.source + '/img/truck.png');
        load.bitmapFont('litto', this.game.init.source + '/img/litto.png', this.game.init.source + '/res/litto.xml');
        load.image('over', this.game.init.source + '/img/over.png');
        load.image('retry', this.game.init.source + '/img/retry.png');
        load.image('highscore', this.game.init.source + '/img/highscore.png');
        load.image('top-highscore', this.game.init.source + '/img/top-highscore.png');
        load.image('level-up', this.game.init.source + '/img/levelup.png');

        //sounds - cache-bust so browsers don't serve a stale version after
        //the audio file is swapped out during development
        var audioVer = '?v=' + (this.game.init.audioVersion || 1);
        load.audio('themeSong', this.game.init.source + '/res/themesong.mp3' + audioVer);
        load.audio('explosion', this.game.init.source + '/res/explosion.mp3' + audioVer);
        load.spritesheet('btn-volume', this.game.init.source + '/img/volume.png', 7, 7, 2); // size 30x60 and 4 frames

        //winner
        load.image('winback', this.game.init.source + '/img/winback.png');
        load.image('wintitle', this.game.init.source + '/img/wintitle.png');

        //COMPLETED LISTENER: call method on load completed
        load.onLoadComplete.add(preloaderState.onLoadComplete, preloaderState);

    }

};

//CUSTOM METHODS (for modularity)
Preloader.prototype.setProgressLogo = function() {

    //variables
    game = preloaderState.game;
    add = preloaderState.add;

    //place logo and progress bar
    fridgeBingeLogo = add.tileSprite((game.init.gameWidth() / 2) - 90, (game.init.gameHeight() / 2) - 90, 30, 11, 'fblogo');
    fridgeBingeLogo.scale.x = 6;
    fridgeBingeLogo.scale.y = 6;

    progressBar = add.sprite((game.init.gameWidth() / 2) - 110, (game.init.gameHeight() / 2), 'preloader');
    progressBar.cropEnabled = false;

    //loads progress bar
    load.setPreloadSprite(progressBar);

};

Preloader.prototype.onLoadComplete = function() {
    preloaderState.state.start('Menu');
};
