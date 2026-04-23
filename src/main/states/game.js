'use strict';

//state and shortcuts
var gameState, keyboard, game, add, physics;

//sprites, audio and events
var cursors, enterKey, background, level, floor, road, truckGroup,
    truck, player, enemyGroup, enemy, scoreLabel, gameOverLabel, highscoreLabel, topHighscoreLabel, levelupLabel,
    retryButton, themeSong, explosion;

//external dependencies
//=require ../entities/player.js

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


        //first click/enter starts game
        if ((game.init.gameInit === false) && (cursors.down.isDown || cursors.up.isDown || cursors.right.isDown || cursors.left.isDown || game.input.activePointer.isDown)) {
            game.utils.ajax.putHttp(game, true, false, 0, function() {}); //dont check top highscore on retry
            gameState.gameStart();
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
