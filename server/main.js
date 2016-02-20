var express = require('express');
var database = require('./database.js');
var votes = require("./votes.js");

var app = express();

app.get('/', function (req, res) {
  res.send('The backend server');
});

app.post('/votes/vote_for_repo', votes.vote_for_repo );

database.initialize();

var server = app.listen(3000, function() {
    console.log("server listening on port 3000");
})

console.log("NodeJS web server running on 0.0.0.0:3000");
