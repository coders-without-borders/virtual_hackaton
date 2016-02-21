var bodyParser = require("body-parser");
var express = require('express');
var sqlite_database = require('./sqlite_database.js');
var mongo_database = require('./mongo_database.js');
var votes = require("./votes.js");
const WorldGenAPI = require('./worldgen/api');
const yargs = require('yargs');

var args = yargs.argv;
var app = express();
var wg = new WorldGenAPI(args);

app.use(bodyParser.urlencoded({ extended: true }));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/', function (req, res) {
  res.send('The backend server');
});

app.use('/world', wg.router);

app.post('/votes/vote_for_repo', votes.vote_for_repo );
app.get('/votes/get_top_repos', votes.get_top_repos);

app.post('/onion_skin/drop', mongo_database.dropOnionSkins);
app.post('/onion_skin/add', mongo_database.addOnionSkin);
app.post('/onion_skin/get_visible', mongo_database.getVisibleOnionSkins);

sqlite_database.initialize(args);
mongo_database.initialize(args);

var server = app.listen(3000, function() {
    console.log("server listening on port 3000");
});

console.log("NodeJS web server running on 0.0.0.0:3000");
