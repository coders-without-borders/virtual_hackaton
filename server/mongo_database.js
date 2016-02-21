(function(){
    var mongoClient = require('mongodb').MongoClient;
    var database;
    function initialize(config)
    {
		config = config || {};

        var url = config.mongoDb || 'mongodb://localhost:1111/player';
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
            path: [ {x: 10, y: 20 }, {x: 12, y: 20 } ],
            message: 244234, // optional
        }
        */
        console.log("Inserting:");
        console.log(data);

        for (var i = 0; i < data.path.length; i++) {
            data.path[i].x = parseInt(data.path[i].x);
            data.path[i].y = parseInt(data.path[i].y);
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

    function getLastOnionSkins( req, res ) {
        var results = [];
        var count = parseInt(req.query.count);

        var collection = database.collection('onion_skin');
        var total = collection.find().count();
        var skip = 0;
        if(total > count) {
            skip = total - count;
        }

        var last = collection
            .find({}, {_id: 0, path: 1, color: 1, message: 1 })
            .skip(skip);

        last.toArray(function(err, result) {
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
    module.exports.getLastOnionSkins = getLastOnionSkins;
    module.exports.dropOnionSkins = dropOnionSkins;
}());
