'use strict';




//initialize game
module.exports = function() {

    //DEPENDENCIES

    //initial game values

/* === included: main/init.js === */
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

/* === end: main/init.js === */

    //utilities

/* === included: main/utils.js === */
'use strict';

var utils = {

    //solution for circular dependencies = dependency injection
    fadeOut: function(sprite, seconds, dependency) {
        dependency.game.add.tween(sprite).to({
            alpha: 0
        }, seconds, Phaser.Easing.Sinusoidal.InOut, true, 0);
    },
    fadeIn: function(sprite, seconds, dependency, delay) {
        dependency.game.add.tween(sprite).to({
            alpha: 1
        }, seconds, Phaser.Easing.Sinusoidal.InOut, true, delay);
    },
    tileAnimation: function(sprite, speed) {
        sprite.tilePosition.x -= speed;
    },
    moveUp: function(sprite, seconds, y, dependency) {
        dependency.game.add.tween(sprite).to({
            y: y
        }, seconds, Phaser.Easing.Sinusoidal.InOut, true, 0);
    },
    bounceLoop: function(sprite, dur, delay, inScale, outScale, dependency) {

        sprite.anchor.setTo(0.5, 0.5);

        sprite.scale.x = inScale * dependency.init.pixelScale;
        sprite.scale.y = inScale * dependency.init.pixelScale;

        var tween = dependency.add.tween(sprite.scale).to({
            x: outScale * dependency.init.pixelScale,
            y: outScale * dependency.init.pixelScale
        }, dur, Phaser.Easing.Sinusoidal.InOut, true, delay);

        tween.onComplete.add(function() {
            dependency.utils.bounceLoop(sprite, dur, delay, outScale, inScale, game);
        }, this);

    }
};

utils.ajax = {

    putHttp: function(game, plays, wins, score, cb) {

        //skip network calls when running as a standalone static build
        if (!game.init.network) { return; }

        var req = new XMLHttpRequest();
        req.open('PUT', './api/user');
        req.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
        req.onload = function() {
            //if response returns
            //console.log(req.response); //check - delete
            if (req.status >= 200 && req.status < 400) {
                //on success
                var resp = req.response;
                if (resp === 'HIGHSCORE') {
                    cb();
                }
                game.utils.ajax.timedError(game, false);
            } else if (req.status === 401) {
                game.utils.ajax.timedError(game, 'Please login to save your gaming stats.')
            } else {
                game.utils.ajax.timedError(game, 'We couldn\'t update your gaming stats. There was a server error.');
            }
        };
        //if response never leaves
        req.onerror = function() {
            game.utils.ajax.timedError(game, 'We couldn\'t update your user data. There was a connection error.');
        };
        //sends request
        var data = JSON.stringify({
            game: game.init.gameId,
            wins: wins,
            plays: plays,
            highscore: score,
            level: game.init.levelIndex //in another game they can be different
        })
        req.send(data);
    },

    getHttp: function() {

        //skip network calls when running as a standalone static build
        if (!game || !game.init || !game.init.network) { return; }

        var req = new XMLHttpRequest();
        req.open('GET', './api/user');
        req.onload = function() {
            //if response returns
            if (req.status >= 200 && req.status < 400) {
                //on success
                var resp = JSON.parse(req.response);
                //console.log(resp);
                var games = resp.data.stats;

                for (var i = 0; i < games.length; i++) {
                    if (games[i].game === game.init.gameId) {
                        game.init.highscore = games[i].highscore;
                    }
                }

                game.utils.ajax.timedError(game, false);
            } else if (req.status === 401) {
                game.utils.ajax.timedError(game, 'Please login to save your gaming stats.')
            } else {
                game.utils.ajax.timedError(game, 'We couldn\'t get information about your stats. There was a server error.');
            }
        };
        //if response never leaves
        req.onerror = function() {
            game.utils.ajax.timedError(game, 'We couldn\'t get information about your stats. There was a connection error.');
        };

        req.send();
    },

    timedError: function(game, message) {
        window.dispatchEvent(new CustomEvent('timedError', { detail: message }));
    }
};

/* === end: main/utils.js === */

    //states

    //phaser configuration

/* === included: main/states/boot.js === */
'use strict';

//state and shortcuts
var bootState, game, load, scale;

var Boot = function() {};

//'this' is the Boot state that also has a reference to game as a property this.game (very similar)
Boot.prototype = {

    preload: function() {
        //variables
        bootState = this;
        load = bootState.load;

        load.image('preloader', this.game.init.source + '/img/preloader.png');
        load.image('fblogo', this.game.init.source + '/img/fblogow.png');
    },

    create: function() {
        //variables
        game = bootState.game;
        scale = bootState.scale;

        bootState.input.maxPointers = 1;

        if (game.device.desktop) {
            scale.pageAlignHorizontally = true;
            scale.pageAlignVertically = true;
            scale.refresh();
        } else {
            scale.scaleMode = Phaser.ScaleManager.EXACT_FIT;
            scale.minWidth = window.innerHeight / 1.5;
            scale.minHeight = window.innerHeight;
            scale.maxWidth = window.innerHeight / 1.5;
            scale.maxHeight = window.innerHeight;
            scale.forceLandscape = true;
            scale.pageAlignHorizontally = true;
        }

        //game.scale.fullScreenScaleMode = Phaser.ScaleManager.EXACT_FIT;
        //game.scale.startFullScreen(true);

        bootState.state.start('Preloader');

    }
};

/* === end: main/states/boot.js === */

    //asset loading

/* === included: main/states/preloader.js === */
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

        //sounds
        load.audio('themeSong', this.game.init.source + '/res/themesong.m4a');
        load.audio('explosion', this.game.init.source + '/res/explosion.mp3');
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

/* === end: main/states/preloader.js === */

    //game menu

/* === included: main/states/menu.js === */
'use strict';

var Menu = function() {};

//state and shortcuts
var menuState, game, add;

//sprites, audio and events
var menuBg, title, miniLogo, themeSong, enterKey, btnStart, btnVolume;


Menu.prototype = {

    create: function() {

        //variables
        menuState = this;
        game = menuState.game;
        add = menuState.add;


        //creates menu background
        menuState.stage.backgroundColor = 0x323333;
        menuBg = add.tileSprite(0, 0, 30, 60, 'menuBg');
        menuState.scaleSprite(menuBg);



        //creates car crash logo
        title = add.tileSprite(0, 20 * game.init.pixelScale, 30, 7, 'title');
        menuState.scaleSprite(title);
        title.alpha = 0;

        //fades title
        menuState.game.utils.fadeIn(title, 500, this);
        menuState.game.utils.moveUp(title, 500, 15 * game.init.pixelScale, this);

        //creates start button
        btnStart = add.tileSprite(15 * game.init.pixelScale, 45 * game.init.pixelScale, 16, 6, 'btn-start');
        menuState.scaleSprite(btnStart);
        btnStart.alpha = 0;


        //fades and loops start button
        menuState.game.utils.fadeIn(btnStart, 500, this, 1000);

        //bounce loop
        game.utils.bounceLoop(btnStart, 200, 200, 0.75, 1, game);

        //creates mini fridgebinge logo
        miniLogo = add.tileSprite(game.init.gameWidth() - 70, game.init.gameHeight() - 32, 30, 11, 'fblogo');
        miniLogo.scale.x = 2;
        miniLogo.scale.y = 2;

        /*----------  SOUND  ----------*/
        game.sound.mute = game.init.mute; //master mute



        //loads and starts song
        themeSong = add.audio('themeSong');
        menuState.sound.setDecodedCallback(themeSong, menuState.startSong, menuState);

        //creates volume button
        btnVolume = add.sprite(10, game.init.gameHeight() - 30, 'btn-volume');
        btnVolume.frame = (game.init.mute) ? 0 : 1;
        btnVolume.scale.setTo(3, 3);

        //click volume event
        btnVolume.inputEnabled = true; //necessary for events to work
        btnVolume.input.useHandCursor = true; //cursor style
        btnVolume.events.onInputDown.add(menuState.toggleVolume, menuState);

        //creates listener for enter ley
        enterKey = game.input.keyboard.addKey(Phaser.Keyboard.ENTER);
        enterKey.onDown.add(menuState.startGame, menuState);

        //click or enter and start game
        btnStart.inputEnabled = true;
        btnStart.input.useHandCursor = true; //cursor style
        btnStart.events.onInputDown.addOnce(menuState.startGame, menuState);

        //get user data
        menuState.game.utils.ajax.getHttp();

        //simulation mode: auto-start after a short delay so the menu still flashes
        if (game.init.simulation) {
            game.time.events.add(Phaser.Timer.SECOND * 1.2, menuState.startGame, menuState);
        }

    },

    update: function() {

        //dont put tweens here
        //tween are fired as tweenStart here which was cionfigured in create


    }

};

//CUSTOM METHODS

Menu.prototype.scaleSprite = function(sprite) {
    sprite.scale.x = this.game.init.pixelScale;
    sprite.scale.y = this.game.init.pixelScale;
};

Menu.prototype.startGame = function() {
    //game.utils.ajax.putHttp(game, true, false);
    themeSong.stop();
    menuState.state.start('Game');
};

Menu.prototype.startSong = function() {
    themeSong.loopFull(0.5);
};

Menu.prototype.toggleVolume = function() {

    game.init.mute = !game.init.mute;

    game.sound.mute = game.init.mute;
    btnVolume.frame = (game.init.mute) ? 0 : 1;

}

/* === end: main/states/menu.js === */

    //game logic

/* === included: main/states/game.js === */
'use strict';

//state and shortcuts
var gameState, keyboard, game, add, physics;

//sprites, audio and events
var cursors, enterKey, background, level, floor, road, truckGroup,
    truck, player, enemyGroup, enemy, scoreLabel, gameOverLabel, highscoreLabel, topHighscoreLabel, levelupLabel,
    retryButton, themeSong, explosion;

//external dependencies

/* === included: main/entities/player.js === */
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
    }, 300, window.Phaser.Easing.Sinusoidal.InOut, true, 0);
};

Player.prototype.moveDown = function() {
    this.accelerate();
    add.tween(this).to({
        y: game.init.lanes()[1]
    }, 300, window.Phaser.Easing.Sinusoidal.InOut, true, 0);
};

Player.prototype.moveRight = function() {
    this.accelerate();
};

Player.prototype.accelerate = function() {
    this.body.velocity.x = game.init.carPedal();
};

/* === end: main/entities/player.js === */

var GameState = function() {};

GameState.prototype = {

    create: function() {

        //variables
        gameState = this;
        keyboard = gameState.input.keyboard;
        game = gameState.game;
        add = gameState.add;
        physics = gameState.physics;

        //enable the Arcade Physics system
        physics.startSystem(Phaser.Physics.ARCADE);

        //enable key up, down, etc
        cursors = keyboard.createCursorKeys();
        enterKey = keyboard.addKey(Phaser.Keyboard.ENTER);

        //color background
        game.stage.backgroundColor = 0xff5040;

        //background
        background = add.sprite(0, 0, 'bground');
        background.scale.setTo(this.game.init.pixelScale, this.game.init.pixelScale);

        //level 1
        level = add.tileSprite(0, 0, 30, 60 * game.init.pixelScale, 'lv1');
        level.scale.setTo(this.game.init.pixelScale, this.game.init.pixelScale);

        //floor1
        floor = add.tileSprite(0, 45 * game.init.pixelScale, 30, 15, 'floor1');
        floor.scale.setTo(this.game.init.pixelScale, this.game.init.pixelScale);

        //road
        road = add.tileSprite(0, 34 * game.init.pixelScale, 30, 13, 'road');
        road.scale.setTo(this.game.init.pixelScale, this.game.init.pixelScale);

        //trucks
        truckGroup = add.group();
        truckGroup.enableBody = true;
        physics.arcade.enable(truckGroup);
        for (var i = 0; i < 2; i++) {
            truck = truckGroup.create(-9 * game.init.pixelScale, game.init.lanes()[i], 'truck');
            truck.scale.setTo(game.init.pixelScale, game.init.pixelScale);
        }

        //enemy = red cars
        enemyGroup = add.group();
        enemyGroup.enableBody = true;
        physics.arcade.enable(enemyGroup);
        for (var i = 0; i < 2; i++) {
            enemy = enemyGroup.create(30 * game.init.pixelScale * (1 + i), game.init.lanes()[i], 'enemy');
            enemy.scale.setTo(game.init.pixelScale, game.init.pixelScale);
            enemy.animations.add('explodeRed', [1, 2, 3, 4, 5, 6], 10, false).killOnComplete = true;
        }

        //player = blue car
        player = new Player(gameState, 5 * game.init.pixelScale, 36 * game.init.pixelScale, 'car');

        //score label
        scoreLabel = add.bitmapText(0, 5 * game.init.pixelScale, 'litto', 0, game.init.pixelScale);

        //gameover label
        gameOverLabel = add.sprite(5 * game.init.pixelScale, 20 * game.init.pixelScale, 'over');
        gameOverLabel.scale.setTo(this.game.init.pixelScale, this.game.init.pixelScale);
        gameOverLabel.alpha = 0;

        //highscore label
        highscoreLabel = add.sprite(6.75 * game.init.pixelScale, 20 * game.init.pixelScale, 'highscore');
        highscoreLabel.scale.setTo(this.game.init.pixelScale / 2, this.game.init.pixelScale / 2);
        highscoreLabel.alpha = 0;

        //level up label
        levelupLabel = add.sprite(9.75 * game.init.pixelScale, -15 * game.init.pixelScale, 'level-up');
        levelupLabel.scale.setTo(this.game.init.pixelScale / 2, this.game.init.pixelScale / 2);
        levelupLabel.alpha = 0;

        //top highscore label
        topHighscoreLabel = add.sprite(15 * game.init.pixelScale, 53 * game.init.pixelScale, 'top-highscore');
        topHighscoreLabel.alpha = 0;
        //bounce loop effect
        game.utils.bounceLoop(topHighscoreLabel, 100, 100, 0.5, 0.6, game);

        //retry button
        retryButton = add.button(15 * game.init.pixelScale, 40.5 * game.init.pixelScale, 'retry');
        retryButton.scale.setTo(this.game.init.pixelScale, this.game.init.pixelScale);
        retryButton.alpha = 0;
        retryButton.anchor.setTo(0.5, 0.5);

        //bounce loop effect
        //game.utils.bounceLoop(retryButton, 200, 200, 0.75, 1, game);

        /*----------  SOUND  ----------*/
        game.sound.mute = game.init.mute; //master mute

        //song
        themeSong = add.audio('themeSong');

        //creates volume button !!carcrash1 will only have this on menu, because I would have to re write a lot of stuff
        //im moving to typescript anyways
        // btnVolume = add.sprite(10, game.init.gameHeight() - 30, 'btn-volume');
        // btnVolume.frame = (game.init.mute) ? 0 : 1;
        // btnVolume.scale.setTo(3, 3);

        //click volume
        // btnVolume.inputEnabled = true; //necessary for events to work
        // btnVolume.input.useHandCursor = true; //cursor style
        // btnVolume.events.onInputDown.add(gameState.toggleVolume, gameState);

        //explosion
        explosion = add.audio('explosion');

        gameState.sound.setDecodedCallback(themeSong, gameState.startSong, gameState);



    },

    update: function() {

        //animate background
        gameState.animateBackground();


        //first click/enter starts game (or auto-start in simulation mode)
        if (game.init.gameInit === false && (
                cursors.down.isDown || cursors.up.isDown || cursors.right.isDown || cursors.left.isDown ||
                game.input.activePointer.isDown ||
                game.init.simulation)) {
            game.utils.ajax.putHttp(game, true, false, 0, function() {}); //dont check top highscore on retry
            gameState.gameStart();
        }

        //simulation / auto-demo: reactive lane-swapping driver
        if (game.init.simulation && game.init.gameInit && !game.init.gameOver) {
            gameState.simulationTick();
        }

        //next level
        if (game.init.nextLevel[game.init.levelIndex] === game.init.score) {
            gameState.newLevelStart();
        }

        //game over
        if (game.init.gameOver === true && game.init.ajax === true) {
            gameState.gameOver();
        };

        //game win
        if (game.init.score === game.init.win) {
            gameState.gameWin();
        }

        //check highscores
        if ((game.init.score > game.init.highscore) && (game.init.highscoreTriggered === false)) {
            gameState.newHighscore();
        }

        //PLAYER EVENTS
        //car movement with click or mouse
        if ((cursors.up.isDown || (game.input.activePointer.isDown && game.input.activePointer.position.y < game.init.lanes()[2])) && ((player.y === game.init.lanes()[0]) || (player.y === game.init.lanes()[1]))) {
            player.moveUp();
        } else if (
            (cursors.down.isDown || (game.input.activePointer.isDown && game.input.activePointer.position.y > game.init.lanes()[2])) && ((player.y === game.init.lanes()[0]) || (player.y === game.init.lanes()[1]))) {
            player.moveDown();
        } else if (cursors.right.isDown) {
            player.moveRight();
        }
        //ENEMY RECYCLE -> INCREASE SCORE -> UPDATE SCORE LABEL
        gameState.enemyScoreUpdate();

        //COLLISIONS
        //playerEnemyCollisionssssssssssssssssssssssssssssssss
        physics.arcade.overlap(player, enemyGroup, gameState.playerEnemyCollision);
        //playerTruckCollision
        physics.arcade.overlap(player, truckGroup, gameState.playerTruckCollision);
        //enemyTruckCollision
        physics.arcade.overlap(truckGroup, enemyGroup, gameState.enemyTruckCollision);

    },

    render: function() {
        //console.log(init.fadeInLevel, this.game.init.levelIndex);
        //console.log(init.highscore);
    }

};

//CUSTOM METHODS

//GAME START - GAME OVER - RETRY

GameState.prototype.gameStart = function() {
    //player and enemy move
    player.body.gravity.x = game.init.gravity();
    enemyGroup.setAll('body.velocity.x', -game.init.enemySpeed()); //speed for all in group
    //game start
    game.init.gameInit = true;

};

GameState.prototype.gameOver = function() {
    //ajax loose
    game.utils.ajax.putHttp(game, false, false, game.init.score, gameState.topTenHighscore);
    game.init.ajax = false;

    //stop music
    themeSong.stop();

    //play explosion
    explosion.play();

    //animations
    game.utils.fadeOut(background, 0, gameState);
    game.utils.fadeOut(level, 0, gameState);
    game.utils.fadeOut(floor, 0, gameState);
    game.utils.fadeIn(gameOverLabel, 0, gameState);
    game.utils.moveUp(gameOverLabel, 500, 15 * game.init.pixelScale, this);
    game.utils.fadeIn(retryButton, 0, gameState);


    //enable retry button after half a second
    game.time.events.add(Phaser.Timer.SECOND * 0.5, function() {
        retryButton.events.onInputDown.addOnce(gameState.gameRetry, gameState);
        enterKey.onDown.add(gameState.gameRetry, gameState);
    });

};

GameState.prototype.gameRetry = function() {

    //ajax retry
    //game.utils.ajax.putHttp(game, true, false, 0, function() {}); //dont check top highscore on retry
    //game.init.ajax = false;


    //initialize level again
    game.init.gameInit = false;
    game.init.gameOver = false;
    game.init.score = 0;
    game.init.levelIndex = 0;
    game.init.highscoreTriggered = false;

    game.init.ajax = true; //activates gameover only once

    gameState.state.restart(true, false);


};

GameState.prototype.gameWin = function() {

    //ajax win
    game.utils.ajax.putHttp(game, false, true, game.init.score, function() {}); //dont check top highscore on win
    game.init.ajax = false;

    //stop song
    themeSong.stop();
    //load win state
    gameState.state.start('Win');
}

//COLLISIONS

GameState.prototype.playerEnemyCollision = function(sprite, groupSprite) {
    //animation
    sprite.animations.play('explode');
    groupSprite.animations.play('explodeRed');
    //game over
    game.init.gameOver = true;
};

GameState.prototype.playerTruckCollision = function(sprite, groupSprite) {
    //animation
    sprite.accelerate();
    sprite.animations.play('explode');
    groupSprite.body.velocity.x = game.init.enemySpeed();
    //game over
    game.init.gameOver = true;
};

GameState.prototype.enemyTruckCollision = function(truck, enemy) {
    //only destroys if truck is on screen
    if (truck.x >= 0) {
        //animation
        enemy.body.velocity.x = game.init.carPedal();
        enemy.animations.play('explodeRed');
    }
};

//ANIMATIONS

GameState.prototype.animateBackground = function() {
    game.utils.tileAnimation(level, game.init.gameSpeedSlowest());
    game.utils.tileAnimation(floor, game.init.gameSpeed());
    game.utils.tileAnimation(road, game.init.gameSpeedSlower());
};

GameState.prototype.newLevelStart = function() {
    gameState.newLevelLabel(); //label animation
    //fadeOut animation
    background.frame = game.init.levelIndex + 1;
    game.utils.fadeOut(level, 0, gameState);
    game.utils.fadeOut(floor, 0, gameState);
    //increase level index
    game.init.levelIndex++;
    //fadeIn animation
    game.time.events.add(Phaser.Timer.SECOND * 1, gameState.newLevelEnd, gameState);
};


GameState.prototype.newLevelEnd = function() {
    //if game is not over
    if (game.init.gameOver === false) {
        //load textures and fadein animations
        level.loadTexture('lv' + (game.init.levelIndex + 1));
        floor.loadTexture('floor' + (game.init.levelIndex + 1));
        game.utils.fadeIn(level, 0, gameState);
        game.utils.fadeIn(floor, 0, gameState);

        //apply new per-level enemy speed to every live enemy
        enemyGroup.setAll('body.velocity.x', -game.init.enemySpeed());
    }
};

//OTHER

GameState.prototype.enemyScoreUpdate = function() {
    //enemy world bound recycle
    enemyGroup.forEach(function(enemy) {

        if (enemy.x <= -5 * game.init.pixelScale && (game.init.gameOver === false)) {
            enemy.y = game.init.lanes()[0] + (game.init.lanes()[1] - game.init.lanes()[0]) * game.rnd.integerInRange(0, 1);
            enemy.x = 60 * game.init.pixelScale;
            game.init.score++;
        }

    });

    //update score label
    scoreLabel.text = game.init.score;
    scoreLabel.x = ((30 * game.init.pixelScale) - scoreLabel.width) / 2;

};

GameState.prototype.newHighscore = function(score) {
    game.init.highscoreTriggered = true;
    //save new highscore locally
    game.init.highscore = game.init.score;
    //aninate label
    game.utils.fadeIn(highscoreLabel, 0, gameState);
    game.utils.moveUp(highscoreLabel, 500, 15 * game.init.pixelScale, gameState);
    setTimeout(function() {
        game.utils.fadeOut(highscoreLabel, 0, gameState);
        game.utils.moveUp(highscoreLabel, 500, -15 * game.init.pixelScale, gameState);
    }, 1000)

};

GameState.prototype.newLevelLabel = function(score) {
    //aninate label
    game.utils.fadeIn(levelupLabel, 0, gameState);
    game.utils.moveUp(levelupLabel, 500, 15 * game.init.pixelScale, gameState);
    setTimeout(function() {
        game.utils.fadeOut(levelupLabel, 0, gameState);
        game.utils.moveUp(levelupLabel, 500, -15 * game.init.pixelScale, gameState);
    }, 1000)

};

GameState.prototype.topTenHighscore = function(score) {
    game.init.highscoreTriggered = true; //reused since there is no conflict
    //save new highscore locally
    game.init.highscore = game.init.score;
    //aninate label
    game.utils.fadeIn(topHighscoreLabel, 0, gameState);
    //game.utils.moveUp(topHighscoreLabel, 500, 15 * game.init.pixelScale, gameState);

};

GameState.prototype.startSong = function() {
    themeSong.loopFull(0.5);
};

//SIMULATION / AUTO-DEMO
//
//Tiny reactive driver: each frame, look a short distance ahead in the
//player's current lane. If an enemy is approaching, swap to the other
//lane. Also keeps the player's x-momentum up (gravity pulls leftward
//in normal play, so without input the car would drift off-screen).
GameState.prototype.simulationTick = function() {

    //only react while the car is sitting exactly on a lane
    //(mid-tween the player's y is between lanes, just like manual play)
    var lanes = game.init.lanes();
    var atLane = (player.y === lanes[0] || player.y === lanes[1]);

    //Do NOT pedal proactively: each lane swap internally calls accelerate(),
    //which already provides a rightward nudge. Let gravity pull the car
    //leftward between dodges (that's how a good human plays this game).
    //The only exception: if the car is about to fall off the left edge,
    //emit a single emergency pulse to keep it on screen.
    var minX = game.init.simulationMinX * game.init.pixelScale;
    if (player.x < minX) {
        player.accelerate();
    }

    if (!atLane) { return; }

    //scan for danger in the player's current lane
    var lookahead = game.init.simulationLookahead * game.init.pixelScale;
    var danger = false;
    enemyGroup.forEach(function(enemy) {
        if (!enemy.alive) { return; }
        if (enemy.y !== player.y) { return; }
        var dx = enemy.x - player.x;
        if (dx > 0 && dx < lookahead) { danger = true; }
    });

    if (danger) {
        if (player.y === lanes[0]) {
            player.moveDown();
        } else {
            player.moveUp();
        }
    }
};

/* === end: main/states/game.js === */

    //end of game

/* === included: main/states/win.js === */
'use strict';

var Win = function() {};

Win.prototype = {

    create: function() {

        //creates menu background
        this.stage.backgroundColor = 0x323333;
        this.menu = this.add.tileSprite(0, 0, 30, 60, 'winback');
        this.scaleSprite(this.menu);
        this.menu.inputEnabled = true;

        //creates car crash logo
        this.title = this.add.tileSprite(15 * this.game.init.pixelScale, 15 * this.game.init.pixelScale, 30, 5, 'wintitle');
        this.scaleSprite(this.title);
        this.title.alpha = 0;

        //creates mini fridgebinge logo
        this.fblogo = this.add.tileSprite(this.game.init.gameWidth() - 70, this.game.init.gameHeight() - 32, 30, 11, 'fblogo');
        this.fblogo.scale.x = 2;
        this.fblogo.scale.y = 2;

        //creates car
        this.car = this.add.sprite(this.game.init.gameWidth() / 2, this.game.init.gameHeight() / 1.75, 'car');
        this.scaleSpriteByFour(this.car);
        this.car.anchor = { x: 0.5, y: 0.5 };

        this.frameIndex = 0;

        //fades title
        this.game.utils.fadeIn(this.title, 120, this);
        this.game.utils.bounceLoop(this.title, 200, 200, 0.75, 1, this.game);

        this.themeSong = this.add.audio('themeSong');
        this.explosion = this.add.audio('explosion');

        this.game.sound.setDecodedCallback(this.themeSong, this.startSong, this);

    },

    update: function() {

        this.car.angle += 1;

        this.frameIndex += 1;

        if (this.frameIndex === 2) {
            this.car.frame += 1;
            this.frameIndex = 0;
        }

    }

};

Win.prototype.scaleSprite = function(sprite) {
    sprite.scale.x = this.game.init.pixelScale;
    sprite.scale.y = this.game.init.pixelScale;
};

Win.prototype.scaleSpriteByFour = function(sprite) {
    sprite.scale.x = this.game.init.pixelScale * 4;
    sprite.scale.y = this.game.init.pixelScale * 4;
};

Win.prototype.startSong = function() {
    this.themeSong.loopFull(0.5);
    this.explosion.loopFull(0.5);
};

/* === end: main/states/win.js === */

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
