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
