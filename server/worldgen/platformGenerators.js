Math.trunc = Math.trunc || function(x) {
  return x < 0 ? Math.ceil(x) : Math.floor(x);
}

function easyStraightLine(levelData, platforms) {
	var count = Math.min(platforms.length, levelData.random.integer({min: 3, max: 5}));
	var angle = levelData.random.floating({min: -Math.PI*0.4, max: Math.PI*0.2});
	var dist = levelData.random.floating({min: 5, max: 7});

	if(count <= 0)
		return;

	var lastPos = platforms[0].prev ? platforms[0].prev.position : [0, 0];

	while(count > 0) {
		var commit = platforms.splice(0,1)[0];
		count -= 1;

		lastPos = commit.prev ? commit.prev.position : [0, 0];

		var nextPos = [
			Math.trunc(lastPos[0] + Math.cos(angle)*dist),
			Math.trunc(lastPos[1] + Math.sin(angle)*dist*0.5)];
		commit.position = nextPos;
		lastPos = nextPos;
	}
};

function miniCluster(levelData, platforms) {
	var count = Math.min(platforms.length, levelData.random.integer({min: 8, max: 16}));

	if(count <= 0)
		return;

	var lastPos = platforms[0].prev ? platforms[0].prev.position : [0, 0];

	while(count > 0) {
		var commit = platforms.splice(0,1)[0];
		count -= 1;

		var angle = levelData.random.floating({min: 0, max: Math.PI*2});
		var dist = levelData.random.floating({min: 2.5, max: 5.5});

		lastPos = commit.prev ? commit.prev.position : [0, 0];

		var nextPos = [
			Math.trunc(lastPos[0] + Math.cos(angle)*dist),
			Math.trunc(lastPos[1] + Math.sin(angle)*dist)];
		commit.position = nextPos;
		commit.width = 1;
		commit.height = 1;

		lastPos = nextPos;
	}
};

function loneSpinner(levelData, platforms) {
	var platform = platforms.splice(0,1)[0];

	var angle = levelData.random.floating({min: 0, max: Math.PI*2});
	var dist = 15;

	var pointA = platform.prev ? platform.prev.position : [0, 0];
	var pointC = [
		Math.trunc(pointA[0] + Math.cos(angle)*dist),
		Math.trunc(pointA[1] + Math.sin(angle)*dist)];
	var pointB = [
		Math.trunc((pointA[0] + pointC[0])*0.5),
		Math.trunc((pointA[1] + pointC[1])*0.5)];

	levelData.tiles.push({
		type: 'spinner',
		position: pointB,
	});

	platform.position = pointC;
};

function moverPlatform(levelData, platforms) {
	var platform = platforms.splice(0,1)[0];

	var angle = levelData.random.floating({min: -Math.PI*0.1, max: Math.PI*.2});
	var dist = 6;

	var pointA = platform.prev ? platform.prev.position : [0, 0];
	var pointB = [
		Math.trunc(pointA[0] + Math.cos(angle)*dist),
		Math.trunc(pointA[1] + Math.sin(angle)*dist)];

	platform.position = pointB;
	platform.width = 5;

	for(var i = 0; i < platform.width; i += 1) {
		var pos = [
			Math.trunc(platform.position[0] - platform.width*0.5 + i),
			platform.position[1]];
		levelData.tiles.push({
			type: 'mover',
			position: pos,
		});
	}
};

const functions = [
	easyStraightLine,
	miniCluster,
	loneSpinner,
	moverPlatform,
];
const weights = [
	10,
	3,
	2,
	1,
];

exports.generatePlatforms = function(levelData, platforms) {
	return levelData.random.weighted(functions, weights).call(this, levelData, platforms);
};
