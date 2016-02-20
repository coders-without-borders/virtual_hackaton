var bodyParser = require("body-parser");
var express = require('express');
var database = require('./database.js');
var votes = require("./votes.js");
const worldgen = require('./worldgen/worldgen');

var app = express();

app.use(bodyParser.urlencoded({ extended: false }));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/', function (req, res) {
  res.send('The backend server');
});

app.get('/world/:user/:repo', function (req, res) {
	const wg = new worldgen.WorldGenerator({
	});

	wg.generateLevel({
		user: req.params.user,
		repo: req.params.repo,
	}).then(function(levelData) {
		res.send(levelData);
	}).catch(function(e) {
		console.log(e, e.stack.split('\n'));
		res.status(500).send('error generating level');
	});
	
});

app.post('/votes/vote_for_repo', votes.vote_for_repo );
app.get('/votes/get_top_repos', votes.get_top_repos);

database.initialize();

var server = app.listen(3000, function() {
    console.log("server listening on port 3000");
});

console.log("NodeJS web server running on 0.0.0.0:3000");
