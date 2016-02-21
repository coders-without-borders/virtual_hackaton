"use strict";

const GitHubApi = require('github'),
      Promise = require('promise'),
	  Chance = require('chance'),
	  util = require('util'),
	  platformGenerators = require('./platformGenerators'),
      Palette = require('./palette');

const githubLevelData = {
	getRepo: function(wg, opts, cb) { return wg.github.repos.get(opts, cb); },
	getCommits: function(wg, opts, cb) { return wg.github.repos.getCommits(opts, cb); },
    getContributors: function(wg, opts, cb) { return wg.github.repos.getStatsContributors(opts, cb); }
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

    getContributors: function(wg, opts, cb) {
        return cb(null, [
            {
                author: {
                    login : "octocat",
                },
                total: 20
            },
            {
                author: {
                    login : "NuclearCookie",
                },
                total: 100
            },
            {
                author: {
                    login : "GlenDC",
                },
                total: 120
            },
            {
                author: {
                    login : "Ricky26",
                },
                total: 95
            }
        ]);
    }
};

exports.githubLevelData = githubLevelData;
exports.testLevelData = testLevelData;

function WorldGenerator(opts) {
	this.config = opts || {};
	this.github = new GitHubApi({ version: '3.0.0' });
	this.levelData = opts.levelData || githubLevelData;

	this.maxCommits = opts.maxCommits || 500;

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
    var contributors = [];
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
                    contributors: contributors
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
								target = commit.sha;
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

							if(commits[commits.sha]) {
								console.log('dupe commit', commits.sha);
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

            levelData.getContributors(self, {
                user: opts.user,
                repo: opts.repo
            }, function(err, contributors) {
                if ( err ) {
                    r(err);
                    return;
                } else {
                    contributors = contributors;
                    contributors.sort( function( a, b ) {
                        return a.total > b.total;
                    }).slice(10);

	                next();
                }
            });
		});
	});
}

WorldGenerator.prototype.generatePlatforms = function(levelData) {
	var next = [levelData.target];
	levelData.maxSpawnY = -10000;

	var platforms = [];
	var extraPlatforms = [];
	var seen = {};
	seen[levelData.target] = true;
	levelData.goal = levelData.commits[levelData.target];
	levelData.spawn = levelData.goal;

	levelData.commits[levelData.target].isMaster = true;

    var colorPalette = Palette.palette('tol-sq', levelData.contributors.length);

	// Mark mainline
	var mainNode = levelData.commits[levelData.target];
	while(mainNode) {
		mainNode.isMaster = true;
		levelData.goal = mainNode;

		if(mainNode.parents.length < 1)
			break;
		mainNode = levelData.commits[mainNode.parents[0].sha];
	}

	// Generate base platform metadata.
	while(next.length > 0) {
		const commitSha = next.splice(0,1)[0];
		const commit = levelData.commits[commitSha];
		if(!commit) {
			continue;
		}

		if (commit.parents.length > 0) {
			commit.parent = levelData.commits[commit.parents[0].sha];
			commit.parents.forEach(function(parent) {
				if(seen[parent.sha]) {
					return;
				}
				seen[parent.sha] = true;
				next.push(parent.sha);

				var pcommit = levelData.commits[parent.sha];
				if(pcommit)
					pcommit.prev = commit;
			});
		}

		if(commit.platformGen)
			continue;

		commit.platformGen = true;

		const authorRandom = new Chance(commit.commit.author.email);

		commit.position = null;
		commit.color = colorPalette[authorRandom.natural({max: levelData.contributors.length - 1})];

		commit.width = 3;
		commit.height = 1;

		// Only add new properties at the bottom to preserve the existing
		// values generated by the RNG.

		if(commit.isMaster) {
			commit.included = true;
		}
		platforms.push(commit);
	}

	platforms.reverse();

	var sortedPlatforms = [];
	function recursiveAdd(dest, commit) {
		if(commit.prev)
			recursiveAdd(dest, commit.prev);

		if(commit.sorted)
			return;
		commit.sorted = true;
		dest.push(commit);
	};
	platforms.forEach(function (commit) { recursiveAdd(sortedPlatforms, commit); });

	// Generate platforms.
	levelData.random = new Chance(levelData.target.sha);
	var toProcess = sortedPlatforms.slice(0);
	while(toProcess.length > 0) {
		platformGenerators.generatePlatforms(levelData, toProcess);
	}

	var finalPlatforms = [];
	sortedPlatforms.forEach(function(a) {
		if(a.isMaster) {
			finalPlatforms.push(a);
			return;
		}

		if(!a.prev.included)
			return;

		var blocked = false;
		sortedPlatforms.forEach(function(b) {
			if(!b.isMaster || (b.sha == a.sha))
				return;

			const pleft = (b.position[0] - b.width*0.5 - 1),
				  pright = (b.position[0] + b.width*0.5 + 1),
				  ptop = (b.position[1] - b.height*0.5 - 1),
				  pbottom = (b.position[1] + b.height*0.5 + 1),
				  eleft = (a.position[0] - a.width*0.5),
				  eright = (a.position[0] + a.width*0.5),
				  etop = (a.position[1] - a.height*0.5),
				  ebottom = (a.position[1] + a.height*0.5);

			if((pleft < eright) && (pright > eleft) &&
			   (ptop < ebottom) && (pbottom > etop))
				blocked = true;
		});

		if(blocked)
			return;

		a.included = true;
		finalPlatforms.push(a);
	});

	levelData.platforms = finalPlatforms;

	// Update maxSpawnY
	finalPlatforms.forEach(function(commit) {
		if(levelData.leaves.indexOf(commit.sha) >= 0) {
			if(commit.position[1] > levelData.maxSpawnY)
				levelData.maxSpawnY = commit.position[1];
		}
	});

	return levelData;
};

WorldGenerator.prototype.generateLevel = function(opts) {
	const self = this;
	return self.getLevelData(opts).then(function (levelData) {
		levelData.tiles = [];

		self.generatePlatforms(levelData);

		var result = {
			tiles: levelData.tiles,
		};

		levelData.platforms.forEach(function(commit) {
			const pos = commit.position || [-1,-1];

			for (var x = 0; x < commit.width; x += 1) {
				for (var y = 0; y < commit.height; y += 1) {

					const tpos = [
						Math.trunc(pos[0] + x - (commit.width * 0.5)),
						Math.trunc(pos[1] + y - (commit.height * 0.5))];

					// If we're on the spawn or goal:
					if (levelData.spawn.sha == commit.sha) {
						const spos = [tpos[0], tpos[1]-1];
						result.tiles.push({
							type: "spawn",
							position: spos,
							color: 'green',
						});
					} else if (levelData.goal.sha == commit.sha) {
						const spos = [tpos[0], tpos[1]-1];
						result.tiles.push({
							type: "goal",
							position: spos,
							color: 'blue',
						});
					}

					result.tiles.push({
						position: tpos,
						color: commit.color,
						id: commit.sha,
						pid: commit.parent ? commit.parent.sha : null,
						master: commit.isMaster,
					});
				}
			}
		});

		return result;
	}).catch(function(e) {
		console.log(e, e.stack);
		throw e;
	});
};
