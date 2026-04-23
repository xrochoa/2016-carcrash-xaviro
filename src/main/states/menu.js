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
