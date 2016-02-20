function easyStraightLine(levelData, platforms) {
	var count = Math.min(platforms.length, levelData.random.integer({min: 3, max: 5}));
	var angle = levelData.random.floating({min: -Math.PI*0.4, max: Math.PI*0.2});
	var dist = levelData.random.floating({min: 5, max: 7});

	if(count <= 0)
		return;
	console.log('easyStraightline', count);

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
	console.log('miniCluster', count);

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

const functions = [
	easyStraightLine,
	miniCluster,
];
const weights = [
	10,
	3,
];

exports.generatePlatforms = function(levelData, platforms) {
	return levelData.random.weighted(functions, weights).call(this, levelData, platforms);
};
