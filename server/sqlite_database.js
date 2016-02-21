(function() {
    var sqlite3 = require('sqlite3');

    function initialize(config)
    {
		config = config || {};
		
        db = new sqlite3.Database('db.sqlite', sqlite3.OPEN_READWRITE,
            function(err)
            {
                if(err)
                {
                    console.log("Creating database...");

                    db = new sqlite3.Database('db.sqlite', sqlite3.OPEN_CREATE | sqlite3.OPEN_READWRITE,
                        function()
                        {
                            var fs = require('fs');
                            fs.readFile('resources/initialize.sql', 'utf8', function (err, data) {
                                if (err)
                                {
                                    return console.log(err);
                                }
                                console.log("Executing initialize.sql...");
                                db.exec(data, onOpen);
                            });
                        });
                }
                else
                {
                    onOpen(err);
                }
            });
    }

    function onOpen(err)
    {
        if (err)
        {
            return console.log(err);
        }

        console.log('Database opened successfully.');
    }

    function run()
    {
        db.run.apply(db, arguments);
    }

    function all()
    {
        db.all.apply(db, arguments);
    }

    function get()
    {
        db.get.apply(db, arguments);
    }

    module.exports.initialize = initialize;
    module.exports.run = run;
    module.exports.all = all;
    module.exports.get = get;
}());
