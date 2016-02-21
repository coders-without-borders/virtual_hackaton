'use strict'

/**
 * Main "namespace" for the Platformer Stuff
 */
var Platformer = Platformer || {
    unit: 50.0,
    playerScale: 0.45,
    game: null,
    gravity: 50.0 * 13.5,
    padding: 100,
    speed: {
        walk: 50 * 4.3,
        jump: 50 * 8.4,
    },
    cache: {},
    maxOnionSkins: 500,
};

/**
 * A simple color class
 */
Platformer.Color = function(r, g, b, a) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = (a || 255) / 255.0;
};

/**
 * A static function to go from a hex string to a color object
 */
Platformer.Color.fromHex = function(hex) {
    var bigint = 0;
    if(hex.substr(0,2).toLowerCase() == "0x") {
        bigint = parseInt(hex.substr(2), 16);
    }
    else if(hex.substr(0,1) == "#") {
        bigint = parseInt(hex.substr(1), 16);
    }
    else {
        bigint = parseInt(hex, 16);
    }

    var values = [
        (bigint >> 24) & 255,
        (bigint >> 16) & 255,
        (bigint >> 8) & 255,
        bigint & 255,
    ];

    if(hex.length > 7) {
        return new Platformer.Color(
            values[0], values[1], values[2], values[3]);
    }

    return new Platformer.Color(
        values[1], values[2], values[3]);

};

/**
 * A simple bounds class (min/max)
 */
Platformer.Bounds = function(min, max) {
    this.min = min ||
        { x: 99999999, y: 99999999 };
    this.max = max ||
        { x: -99999999, y: -99999999 };
};

Platformer.Bounds.prototype = {
    addPos: function(pos) {
        if(pos.x < this.min.x) {
            this.min.x = pos.x;
        }
        if(pos.x > this.max.x) {
            this.max.x = pos.x;
        }

        if(pos.y < this.min.y) {
            this.min.y = pos.y;
        }
        if(pos.y > this.max.y) {
            this.max.y = pos.y;
        }
    },

    computeCenter: function() {
        return {
            x: ((this.max.x - this.min.x) / 2.0) + this.min.x,
            y: ((this.max.y - this.min.y) / 2.0) + this.min.y,
        };
    },
};

/**
 * Platformer GLobal Game Functions (preload, create, update)
 */
Platformer.preload = function() {
};

Platformer.create = function() {
    window.Platformer = Platformer;
    Platformer.game.stage.backgroundColor = "rgb(99, 99, 99)";

    Platformer.game.physics.startSystem(Phaser.Physics.ARCADE);
    Platformer.game.physics.arcade.gravity.y = Platformer.gravity;
    Platformer.game.scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL;
    Platformer.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;

    Platformer.game.state.add("LevelState", LevelState);
    Platformer.game.state.add("LoadState", LoadState);
    Platformer.game.state.add("DeadState", DeadState);
    Platformer.game.state.add("ResultState", ResultState);
    Platformer.game.state.start("LoadState");
    Platformer.game.scale.refresh();
};

Platformer.update = function() {

};

/**
 * Function to get fingerprint of user
 */
Platformer.getFingerprint = function(callback) {
    var fingerprint = $.cookie('hufp');

    // if we already have one, simply return it
    if(fingerprint) {
        callback(fingerprint);
        return;
    }

    // otherwise simply get it
    new Fingerprint2().get(function(result) {
        $.cookie('hufp', result, { expires: 1 });
        callback(result);
    });
};

/**
 * The main client function where we retrieve the current level data
 * from the server.
 *
 * We maintain a cached version to prevent loading everytime we die.
 */
Platformer.loadLevelData = function(callback) {
    if(Platformer.cache.levelData) {
        callback();
    }
    else {
        var levelURL = "/world/levelData";
        $.getJSON(levelURL).then(function(levelData) {
            Platformer.cache.levelData = levelData;
            callback();
        });
    }
};

/**
 * The main client function where we retrieve the current onion data from
 * the server. Each onion data package can also optionally
 * contain a message.
 *
 * [TODO]
 *   + Pull the actual message data from the server
 */
Platformer.loadMessageData = function(callback) {
    $.ajax({
        'url' : '/onion_skin/get_last',
        'type' : 'GET',
        'data' : {
            'count' : Platformer.maxOnionSkins,
        },
        'success' : function(response) {
            Platformer.cache.messageData = response.results;
            callback();
        },
    });
};

/**
 * Create the font style based on mostly common style parameters.
 * Note: this function should only be used for onion messages!
 */
Platformer.getFontStyle = function(color) {
    return {
        font: (Platformer.unit * 0.5) + "px Arial",
        fill: color,
        align: "center",
    };
}

/**
 * Add the current player to the rest of the onion data.
 * This should probably only be called when the player dies.
 *
 * [TODO] Push the data also to the server
 */
Platformer.submitOnionData = function(message) {
    var onion = Platformer.cache.onionData;
    if(onion) {
        onion.message = message;
        // instead of pushing it, let's just submit it!
        Platformer.cache.messageData.push(onion);

        Platformer.getFingerprint(function(fingerprint) {
            $.ajax({
                'url' : '/onion_skin/add',
                'type' : 'POST',
                'data' : {
                    onion: onion,
                    id: fingerprint,
                },
            });
        });
    }
};

Platformer.cachePlayerOnion = function(path, color) {
    Platformer.cache.onionData = {
        path: path, color: color,
    };
}

/**
 * A helper function to create a square with physics.
 */
Platformer.createSquare = function(pos, color, scale) {
    scale = scale || 1.0;
    color = Platformer.Color.fromHex(color);
    var graphics = Platformer.game.add.bitmapData(Platformer.unit * scale, Platformer.unit * scale);
    graphics.fill(color.r, color.g, color.b, color.a);
    var square = Platformer.game.add.sprite(pos.x, pos.y, graphics);
    Platformer.game.physics.arcade.enable(square);

    return square;
}

/**
 * A helper function to create a circle with physics.
 */
Platformer.createCircle = function(pos, color, scale) {
    var size = Platformer.unit * (scale || 1.0);
    var bmd = Platformer.game.add.bitmapData(size, size);
    bmd.ctx.fillStyle = color;
    bmd.ctx.beginPath();
    bmd.ctx.arc(bmd.width / 2, bmd.height / 2, size / 2, 0, 2 * Math.PI, true);
    bmd.ctx.fill();

    var circle = Platformer.game.add.sprite(pos.x, pos.y, bmd);
    Platformer.game.physics.arcade.enable(circle);

    return circle;
}

/**
 * The load state is called when loading the level.
 *
 * [TODO]
 *   + Add "Loading..." text or something similar
 */

var LoadState = function(){};
LoadState.prototype = {
  	create: function(){
		if(Platformer.ui) {
			this.ui = Platformer.ui.factory("loading").show();
		};

        Platformer.loadLevelData(function() {
            Platformer.loadMessageData(function() {
                Platformer.game.state.start("LevelState");
            });
        });
	},
    shutdown: function() {
		if(this.ui)
			this.ui.hide();
    },
};

/**
 * The levelState contains and manages the actual game logic.
 */
var LevelState = function(){};
LevelState.prototype = {
  	create: function() {
        this.planet = new Platformer.World(Platformer.game);
        this.planet.create(
            Platformer.cache.levelData,
            Platformer.cache.messageData);

		if(Platformer.ui) {
			this.leftSidebar = Platformer.ui.factory("left");
			this.rightSidebar = Platformer.ui.factory("right");
			this.leftSidebar.element("audioArea").removeClass('uiHidden');

            this.leftSidebar.find("#commitArea h3").html( Platformer.cache.levelData.repoString );
			this.refresh();

		}

	},
	refresh: function() {
		var self = this;

		$.getJSON("/votes/get_top_repos")
			.then(function(repos) {
				var target = self.leftSidebar.element("voteList");
				target.html('');

				$.each(repos.rows, function() {
					var data = { repo: this.repo, user: this.username, votes: this.votes };

					var repoSpan = $('<span/>').addClass('repoUserName').text(data.user + '/');
					var icon = $('<span class="iconTick"/>');
					var span = $('<span/>')
						.append(repoSpan)
						.append(document.createTextNode(data.repo + " - " + data.votes))
						.append(icon);
					var ele = $('<li class="levelBtn"/>').append(span).appendTo(target);
				});

				self.leftSidebar.element('voteArea').removeClass('uiHidden');

				self.refreshTimeout = setTimeout(function() {
					self.refreshTimeout = null;
					self.refresh();
				}, 5000);
			});
	},
    update: function() {
        this.planet.update()

		if(this.refreshTimeout)
			clearTimeout(this.refreshTimeout);
    },
	shutdown: function() {
		if(Platformer.ui) {
			var sidebar = Platformer.ui.factory("left");
			sidebar.element("commitArea").addClass('uiHidden');
			sidebar.element("voteArea").addClass('uiHidden');
			sidebar.element("audioArea").addClass('uiHidden');
		}
	},
};

/**
 * The DeadState contains the screen content for when you're dead.
 * This is empty as we now use a normal HTML5 UI;
 */
var DeadState = function(){};
DeadState.prototype = {
  	preload: function() {
		var self = this;
        this.continueButton = Platformer.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

		if(Platformer.ui) {
			this.ui = Platformer.ui.factory('dead');

			this.ui.element("spinner").show();
			this.ui.element("voteFields").addClass('uiHidden');
			this.ui.show();

			$.getJSON("/votes/get_top_repos")
				.then(function(repos) {
					var target = self.ui.element("voteFields");
					target.html('');

					$.each(repos.rows, function() {
						var data = { repo: this.repo, user: this.username };

						var repoSpan = $('<span/>').addClass('repoUserName').text(data.user + '/');
						var span = $('<span/>').append(repoSpan).append(document.createTextNode(data.repo));
						var input = $('<input type="radio" name="nextLevel"/>').val(JSON.stringify(data));
						var label = $('<label class="levelBtn"/>').append(input).append(span).appendTo(target);
					});

					self.ui.element("spinner").hide();
					self.ui.element("voteFields").removeClass('uiHidden');
				});

			this.ui.element("deadForm").submit(function() {
				self.finishScreen();
				return false;
			});
		}
    },
	finishScreen: function() {
		var message = String.fromCodePoint(128169);
		if(this.ui) {
			var newMessage = this.ui.activeRadio("message").val();
			if(newMessage)
				message = newMessage;

			var customRepo = this.ui.element("customLevel").val();
			var vote = this.ui.activeRadio("nextLevel").val()



			if(customRepo) {
				var parts = customRepo.split('/');
				if(parts.length == 2) {
					vote = { user: parts[0], repo: parts[1] };
				}
			}

			if(vote) {
				vote = JSON.parse(vote);

				console.log("voting", vote);
				$.post("/votes/vote_for_repo/" + encodeURIComponent(vote.user) + "/" + encodeURIComponent(vote.repo))
					.then(function(result) {
						console.log("voted: ", result);
					});
			}
		}

        Platformer.submitOnionData(message);
        Platformer.game.state.start("LoadState");
	},
    update: function() {
        if(this.continueButton.isDown) {
			this.finishScreen();
        }
    },
    shutdown: function() {
		if(this.ui)
			this.ui.hide();
    },
};

/**
 * The Result State contains the screen content for when the game is over.
 * This is empty as we now use a normal HTML5 UI;
 */
var ResultState = function(){};
ResultState.prototype = {
    // [TODO] Implementation
  	preload: function() {
		var self = this;
        this.continueButton = Platformer.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

		if(Platformer.ui) {
			this.ui = Platformer.ui.factory('won').show();
			this.ui.element("wonForm").submit(function() {
				self.finishScreen();
				return false;
			});
		}
    },
	finishScreen: function() {
        Platformer.game.state.start("LoadState");
	},
    update: function() {
        if(this.continueButton.isDown) {
			this.finishScreen();
        }
    },
    shutdown: function() {
		if(this.ui)
			this.ui.hide();
    },
};

/**
 * The World object manages everything in the game.
 * This contains also the player.
 */
Platformer.World = function() {
    this.bounds = {
        min: {x: 0, y: 0},
        max: {x: 0, y: 0},
    };

    this.platforms = Platformer.game.add.group();
    this.obstacles = Platformer.game.add.group();
    this.goals = Platformer.game.add.group();
};

/**
 * Helper functions to go from Json position to WorldPosition,
 * and the other way around.
 */
Platformer.World.getPos = function(x, y) {
    return {
        x: x * Platformer.unit + Platformer.padding,
        y: y * Platformer.unit + Platformer.padding,
    };
};
Platformer.World.getJsonPos = function(pos) {
    return {
        x: (pos.x - Platformer.padding) / Platformer.unit,
        y: (pos.y - Platformer.padding) / Platformer.unit,
    };
};

Platformer.World.prototype = {
    create: function(levelData, messageData) {
        var that = this;

        var startPositions = [];
        levelData.tiles.forEach(function(tile) {
            if(tile.type == null) {
                that.addPlatform(tile.position[0], tile.position[1], tile.color, tile);
            }
            else if(tile.type == "spinner") {
                that.addSpinner(tile.position[0], tile.position[1]);
            }
            else if(tile.type == "mover") {
                that.addMover(tile.position[0], tile.position[1]);
            }
            else if(tile.type == "spawn") {
                startPositions.push(tile.position);
            }
            else if(tile.type == "goal") {
                that.addGoal(tile.position[0], tile.position[1], tile.color);
            }
        });

        var pos = startPositions[Math.floor(Math.random() * startPositions.length)];
        this.player = new Platformer.Player(Platformer.World.getPos(pos[0], pos[1]), Platformer.game);

        this.bounds.min.x -= Platformer.padding;
        this.bounds.min.y -= Platformer.padding;
        this.bounds.max.x += Platformer.padding;
        this.bounds.max.y += Platformer.padding;

        Platformer.game.world.setBounds(
            this.bounds.min.x, this.bounds.min.y,
            this.bounds.max.x - this.bounds.min.x,
            this.bounds.max.y - this.bounds.min.y);

        messageData.forEach(this.addOnion);
    },

    addSpinner: function(x, y) {
        var pos = Platformer.World.getPos(x, y);

        var radius = Platformer.unit * 1.98;
        var speed = 0.075;
        if(Math.floor(Math.random() * 10) < 5) {
            speed *= -1;
        }

        var circularOffset = function(angle) {
            return [{
                x: pos.x + Math.sin(angle) * radius,
                y: pos.y + Math.cos(angle) * radius,
            }, angle + speed];
        };

        var angle = Math.floor(Math.random() * 1000) % 360;
        var offset = circularOffset(angle);
        angle = offset[1];

        var circle = Platformer.createCircle(offset[0], "#b2182b", 0.85);
        circle.body.allowGravity = false;

        circle.update = function() {
            var offset = circularOffset(angle);
            angle = offset[1];
            circle.x = offset[0].x;
            circle.y = offset[0].y;
        };

        this.obstacles.add(circle);
    },

    addMover: function(x, y) {
        var pos = Platformer.World.getPos(x, y);

        var radius = Platformer.unit * 1.98;
        var speed = 0.075;
        if(Math.floor(Math.random() * 10) < 5) {
            speed *= -1;
        }

        var linearOffset = function(angle) {
            return [{
                x: pos.x,
                y: pos.y + Math.sin(angle) * radius
            }, angle + speed];
        };

        var angle = Math.floor(Math.random() * 1000) % 360;
        var offset = linearOffset(angle);
        angle = offset[1];

        var circle = Platformer.createCircle(offset[0], "#b2182b", 0.85);
        circle.body.allowGravity = false;

        circle.update = function() {
            var offset = linearOffset(angle);
            angle = offset[1];
            circle.x = offset[0].x;
            circle.y = offset[0].y;
        };

        this.obstacles.add(circle);
    },

    addPlatform: function(x, y, color, data) {
        var pos = Platformer.World.getPos(x, y);
        var square = Platformer.createSquare(pos, color);
		square.platformData = data;

        var max = {
            x: pos.x + Platformer.unit,
            y: pos.y + Platformer.unit,
        };
        if(max.x > this.bounds.max.x) {
            this.bounds.max.x = max.x;
        }
        else if(pos.x < this.bounds.min.x) {
            this.bounds.min.x = pos.x;
        }
        if(max.y > this.bounds.max.y) {
            this.bounds.max.y = max.y;
        }
        else if(pos.y < this.bounds.min.y) {
            this.bounds.min.y = pos.y;
        }

        square.body.allowGravity = false;
        square.body.immovable = true;

        this.platforms.add(square);
    },

    addGoal: function(x, y, color) {
        var position = Platformer.World.getPos(x, y);
        var square = Platformer.createSquare(position, color);

        square.body.allowGravity = false;
        square.body.immovable = true;
        Platformer.game.add.tween(square.scale).to( { x: 0.8, y: 0.8 }, 1000, Phaser.Easing.Linear.None, true, 0, -1, true);

        this.goals.add(square);
    },

    addOnion: function(onion) {
        var c = onion.path.length;
        var step = 1.0 / c;
        var bounds = new Platformer.Bounds();

        for(var i = 0; i < c; ++i) {
            var alpha = ((step + (step * i)) * 125).toString(16).substr(0,2);
            var pos = onion.path[i];
			pos = { x: parseFloat(pos.x), y: parseFloat(pos.y) };
            bounds.addPos(pos);
            var square = Platformer.createSquare(
                pos, onion.color + alpha,
                Platformer.playerScale);

            square.body.allowGravity = false;
            square.body.immovable = true;
        }

        if(onion.message) {
            var msgPos = bounds.computeCenter();
			console.log(msgPos, onion, Platformer.getFontStyle(onion.color));
            var text = Platformer.game.add.text(
                msgPos.x, msgPos.y - (Platformer.unit / 1.25),
                onion.message,
                Platformer.getFontStyle(onion.color));

                text.anchor.set(0.5);
        }
    },

    update: function() {
		var self = this;

		this.commitAssignedThisFrame = false;
        this.player.collide(this.obstacles, this.onPlayerDie);
        this.player.collide(this.goals, this.onPlayerReachGoal);
        this.player.collide(this.platforms, function (a, b) { self.onPlayerTouchedPlatform(a, b) });
        this.player.update();

        // Check if we're not outside the level (dead)
        var pos = this.player.getPos();
        if(pos.x < Platformer.padding
                || (this.bounds.max.x - pos.x) < Platformer.padding
                || (this.bounds.max.y - pos.y) < Platformer.padding) {
            this.onPlayerDie(this.player.square);
        }
    },

    onPlayerDie: function(player) {
        Platformer.cachePlayerOnion(
            player.player.getPath(),
            '#' + player.player.color);

        Platformer.game.state.start("DeadState");
    },

    onPlayerReachGoal: function() {
        console.log("WIN!");
		$.post("/nextLevel").then(function() {
			Platformer.game.state.start("ResultState");
		});
    },

	onPlayerTouchedPlatform: function(player, platform) {
		if(this.commitAssignedThisFrame || !Platformer.ui || !platform.platformData)
			return;

		var data = platform.platformData;

		if(player.lastPlatform != data.id) {
			player.lastPlatform = data.id;
			this.commitAssignedThisFrame = true;

			var ui = Platformer.ui.factory("left");
			var commit = ui.element("commitArea");

			commit.find('#authorImg').attr('src', data.avatar);
			commit.find('#author').text(data.author);
			commit.find('#commitSha').text(data.id);
			commit.find('#commitMsg').text(data.message);
			commit.removeClass('uiHidden');
		}
	},
};

/**
 * The player object.
 */
Platformer.Player = function(pos) {
    var playerScheme = palette("cb-PiYG",10);

    this.color = playerScheme[Math.floor(Math.random() * 10)];
    this.square = Platformer.createSquare(
        pos, this.color, Platformer.playerScale);
	this.square.player = this;

    this.recorder = new Platformer.MovementRecorder(pos);

    Platformer.game.camera.follow(this.square);

    this.square.body.bounce.y = 0;
    this.square.body.collideWorldBounds = true;

    this.cursors = Platformer.game.input.keyboard.createCursorKeys();
    this.jumpButton = Platformer.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
};

Platformer.Player.prototype = {
    update: function() {
        this.square.body.velocity.x = 0;
        if (this.cursors.left.isDown)
        {
            this.square.body.velocity.x = -Platformer.speed.walk;
        }
        else if (this.cursors.right.isDown)
        {
            this.square.body.velocity.x = Platformer.speed.walk;
        }

        var allowToJump = this.square.body.touching.down;
        if (this.jumpButton.isDown && allowToJump)
        {
            this.square.body.velocity.y = -Platformer.speed.jump;
        }

        this.recorder.addPos({
            x: this.square.x,
            y: this.square.y,
        });
    },

    getPos: function() {
        return {
            x: this.square.x,
            y: this.square.y,
        };
    },

    getPath: function() {
        return this.recorder.getPath();
    },

    collide: function(other, callback) {
		var self = this;
		var ourCB;
		if(callback) {
			ourCB = function(a, b) {
				return callback.call(self, a, b);
			}
		}

		Platformer.game.physics.arcade.collide(this.square, other, ourCB, null, this);
    }
};

/**
 * A simple MovementRecorder Class
 */
var __MAX_MOVEMENT_POS = 8;
var __MIN_MOVEMENT_DISTANCE = Math.pow(Platformer.unit / 3, 2);
Platformer.MovementRecorder = function(pos) {
    this.path = [];
    this.last = null;

    if(pos) {
        this.addPos(pos);
    }
};

Platformer.MovementRecorder.prototype = {
    addPos: function(pos) {
        if(pos == null) return;
        // if the pos is to close, we'll skip it,
        // but store it either way, as we do want it in the end,
        // in case it is the last one
        if(!this.__checkPos(pos)) {
            this.last = pos;
            return;
        }

        this.last = null;
        this.__addPos(pos);
    },

    getPath: function() {
        // if we have a last one, we'll use it... ?! :)
        if(this.last) {
            this.__addPos(this.last);
            this.last = null;
        }

        return this.path;
    },

    __addPos: function(pos) {
        // if we are over the limit, we drop the oldest
        if(this.path.length == __MAX_MOVEMENT_POS) {
            this.path.shift();
        }

        // and finally add the new one
        this.path.push(pos);
    },

    // if the pos is too close we don't want it!
    __checkPos: function(pos) {
        if(this.path.length == 0) {
            return true;
        }

        var previous = this.path[this.path.length-1];
        var distance = Math.pow(pos.x - previous.x, 2) +
            Math.pow(pos.y - previous.y, 2);
        return distance >= __MIN_MOVEMENT_DISTANCE;
    },
};
