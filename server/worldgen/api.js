const express = require('express'),
	  worldgen = require('./worldgen');

function WorldGenAPI(config) {
	this.config = config || {};
	this.generator = new worldgen.WorldGenerator(this.config);
	this.router = express.Router();
	this.debug = config.debug || false;
	this.currentLevel = null;
	this.levelGenPromise = null;
	this._nextLevel = { user: 'rust-lang', repo: 'rust' };

	if(this.config.githubToken) {
		this.generator.github.authenticate({
			type: "oauth",
			token: this.config.githubToken
		});
	}

	this.setupRoutes();
};
module.exports = WorldGenAPI;

WorldGenAPI.prototype.ensureDebug = function(req, resp) {
	if(this.debug)
		return true;
	resp.status(404).send();
	return false;
};

WorldGenAPI.prototype.getLevelData = function() {
	if(this.levelGenPromise)
		return this.levelGenPromise;

	if(this.currentLevel)
		return Promise.resolved(this.currentLevel);

	this.levelGenPromise = this.generator.generateLevel({
		user: this._nextLevel.user,
		repo: this._nextLevel.repo,
	}).then(function(levelData) {
		this.currentLevel = levelData;
		this.levelGenPromise = null;
		return levelData;
	}).catch(function(e) {
		this.levelGenPromise = null;
		console.log(e);
		throw e;
	});
	return this.levelGenPromise;
};

WorldGenAPI.prototype.triggerNextLevel = function(level) {
	if(level)
		this._nextLevel = level;
	this.currentLevel = null;
}

// Routing
WorldGenAPI.prototype.setupRoutes = function() {
	const self = this;

	self.router.get('/levelData', function(req, res) {
		self.getLevelData().then(function(levelData) {
			res.send(levelData);
		}).catch(function(e) {
			console.log(e);
			res.status(500).send('error getting level data');
		});
	});

	// Debugging routes
	self.router.get('/_nextLevel/:user/:repo', function(req, res) {
		self.triggerNextLevel({ user: req.params.user, repo: req.params.repo });
		res.send();
	});

	self.router.get('/_generate/:user/:repo', function(req, res) {
		if(!self.ensureDebug())
			return;

		self.generator.generateLevel({
			user: req.params.user,
			repo: req.params.repo,
		}).then(function(levelData) {
			res.send(levelData);
		}).catch(function(e) {
			console.log(e, e.stack.split('\n'));
			res.status(500).send('error generating level');
		});
	});
}
