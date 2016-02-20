(function(){
    var mongoClient = require('mongodb').MongoClient;
    var database;
    function initialize()
    {
        var url = 'mongodb://localhost:1111/player';
        mongoClient.connect(url, function(err, db) {
          if( err ) {
              console.log(err);
          } else {
              database = db;
              console.log("Connected correctly to server.");
          }
      });
    }

    function addOnionSkin( req, res )
    {
        var data = req.body;
        /* data should be in the form of:
        {
            color: "#aabbcc",
            positions: [ {x: 10, y: 20 }, {x: 12, y: 20 } ]
        }
        */
        console.log("Inserting:");
        console.log(data);

        for (var i = 0; i < data.positions.length; i++) {
            data.positions[i].x = parseInt(data.positions[i].x);
            data.positions[i].y = parseInt(data.positions[i].y);
        }

        database.collection('onion_skin').insertOne( data, function( err, result ) {
            if ( err ) {
                console.log(err);
            } else {
                console.log("Inserted onion shell");
            }
            res.send("");
        } );
    }

    function getVisibleOnionSkins( req, res ) {
        var results = [];
        var top = parseInt(req.body.top);
        var right = parseInt(req.body.right);
        var bottom = parseInt(req.body.bottom);
        var left = parseInt(req.body.left);

        var data = database.collection('onion_skin')
            .aggregate([
                { $unwind: "$positions" },
                { $match: { "positions.x": { $lt :  right, $gt: left }, "positions.y": { $lt : top, $gt: bottom } } },
                { $project: { _id : 0, positions: 1, color: 1 } }
            ]).toArray( function( err, result ) {
                if ( err ) {
                    console.log(err);
                } else {
                    res.json({ results: result });
                }
            });
    }

    function dropOnionSkins( req, res ) {
        database.collection('onion_skin').drop();
    }

    module.exports.initialize = initialize;
    module.exports.addOnionSkin = addOnionSkin;
    module.exports.getVisibleOnionSkins = getVisibleOnionSkins;
    module.exports.dropOnionSkins = dropOnionSkins;
}());
