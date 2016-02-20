"use strict";

const GitHubApi = require('github'),
      Promise = require('promise'),
	  Chance = require('chance'),
	  util = require('util');

const githubLevelData = {
	getRepo: function(wg, opts, cb) { return wg.github.repos.get(opts, cb); },
	getCommits: function(wg, opts, cb) { return wg.github.repos.getCommits(opts, cb); },
};

const testLevelData = {
	getRepo: function(wg, opts, cb) {
		cb(null, {
			default_branch: 'master',
		});
	},

	getCommits: function(wg, opts, cb) {
		if (opts.page > 0)
			return cb(null, []);

		const author = { email: "a@b" };
		
		return cb(null, [
			{
				sha: "B",
				parents: [{sha: "A"}],
				commit: { author: author },
			},
			{
				sha: "A",
				parents: [],
				commit: { author: author },
			},
		]);
	},
};

exports.githubLevelData = githubLevelData;
exports.testLevelData = testLevelData;

function WorldGenerator(opts) {
	this.config = opts || {};
	this.github = new GitHubApi({ version: '3.0.0' });
	this.levelData = opts.levelData || githubLevelData;
	
	this.maxCommits = opts.maxCommits || 200;
	
};
exports.WorldGenerator = WorldGenerator;

WorldGenerator.prototype.getLevelData = function(opts) {
	const self = this;
	const user = opts.user;
	const repo = opts.repo;
	const maxCommits = this.maxCommits;
	const levelData = this.levelData;

	var commits = {};
	var numCommits = 0;
	var leaves = [];
	var target = null;
	
	return new Promise(function (a, r) {
		levelData.getRepo(self, {
			user: opts.user,
			repo: opts.repo,
		}, function (err, repo) {
			if(err) {
				r(err);
				return;
			}

			console.log(repo.meta);

			const per_page = 100;
			var page = 0;
			const branch = repo.default_branch;

			const finish = function() {
				a({
					commits: commits,
					leaves: leaves,
					target: target,
				});
			};
			
			const next = function() {
				if (numCommits >= maxCommits) {
					finish();
					return;
				}

				// Get commits in batch and then transform them a bit so they're
				// nicer to deal with in memory.

				levelData.getCommits(self, {
					user: opts.user,
					repo: opts.repo,
					page: page,
					per_page: per_page,
				}, function (err, resp) {
					if(err) {
						console.log(err);
						finish();
					} else {
						resp.forEach(function (commit) {

							if(target == null) {
								target = commit;
								leaves.push(commit.sha);
							}

							commit.children = []

							commit.parents.forEach(function (parent) {
								const value = commits[parent.sha];
								if(value) {
									value.children.push(commit);
								}
							});
							
							const leafIdx = leaves.indexOf(commit.sha);
							if(leafIdx >= 0) {
								const args = [leafIdx, 1].concat(commit.parents.map(function(x) { return x.sha; }));
								leaves.splice.apply(leaves, args);
							}

							commits[commit.sha] = commit;
							numCommits += 1;
						});

						if(resp.length < per_page) {
							finish();
						} else {
							next();
						}
					}
				});
				page = page + 1;
			};
			
			next();
		});
	});
}

WorldGenerator.prototype.generatePlatforms = function(levelData) {
	var next = [levelData.target.sha];//levelData.leaves.map(function (x) { return x.sha; });
	levelData.maxSpawnY = -10000;

	while(next.length > 0) {
		const commitSha = next.splice(0,1)[0];
		const commit = levelData.commits[commitSha];
		if(!commit) {
			continue;
		}
		
		const random = new Chance(commit.sha);
		const authorRandom = new Chance(commit.commit.author.email);

		var parent = null;
		if (commit.parents.length > 0)
			parent = levelData.commits[commit.parents[0].sha];
		
		next.push.apply(next, commit.parents.map(function (x) { return x.sha; }));

		const basePos = (parent ? parent.position : null) || [0, 0];
		const angle = random.floating({min: -Math.PI * 0.25, max: Math.PI * 0.25});
		const dist = random.floating({min: 3, max: 7});
		
		commit.position = [
			Math.trunc(basePos[0] - Math.sin(angle)*dist),
			Math.trunc(basePos[1] + Math.cos(angle)*dist)];
		commit.color = authorRandom.color({format: 'hex'});

		commit.width = 3;
		commit.height = 1;

		// Only add new properties at the bottom to preserve the existing
		// values generated by the RNG.

		if(levelData.leaves.indexOf(commit.sha) >= 0) {
			if(commit.position[1] > levelData.maxSpawnY)
				levelData.maxSpawnY = commit.position[1];
		}
	}	

	return levelData;
};

WorldGenerator.prototype.generateLevel = function(opts) {
	const self = this;
	return self.getLevelData(opts).then(function (levelData) {
		self.generatePlatforms(levelData);

		var result = {
			tiles: [],
		};
		
		for(var index in levelData.commits) {
			if (levelData.commits.hasOwnProperty(index)) {
				var commit = levelData.commits[index];
				const pos = commit.position || [-1,-1];

				for (var x = 0; x < commit.width; x += 1) {
					for (var y = 0; y < commit.height; y += 1) {

						const tpos = [
							Math.trunc(pos[0] + x - (commit.width * 0.5)),
							Math.trunc(pos[1] + y - (commit.height * 0.5))];

						// If we're on a leaf commit and we're within 5 blocks of the lowest
						// leaf commit - we're a valid spawn platform, render spawn points.
						if ((levelData.leaves.indexOf(commit.sha) >= 0) &&
							(tpos[1] + 5 > levelData.maxSpawnY)) {
							const spos = [tpos[0], tpos[1]-1];
							result.tiles.push({
								type: "spawn",
								position: spos,
								color: 'green',
							});
						}
						
						result.tiles.push({
							position: tpos,
							color: commit.color,
						});
					}
				}
			}
		}
		
		return result;
	});
};
