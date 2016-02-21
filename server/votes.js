(function() {
    var database = require("./sqlite_database.js");

    function vote_for_repo( req, res )
    {
        console.log(req.body);
		var user = req.params.user;
		var repo = req.params.repo;

        database.run(
            'INSERT OR REPLACE INTO votes(username, repo, votes) VALUES( ?, ?, COALESCE((SELECT votes FROM votes WHERE username = ? AND repo = ?), 0) + 1);',
			user, repo,
			user, repo,
            function( err ) {
                if ( err ) {
                    console.log(err);
                } else {
                    console.log("Voted for repository" );
                }
                res.send("");
            }
        );
    }

    function get_top_repos( req, res )
    {
        database.all(
            'SELECT * FROM votes ORDER BY votes DESC LIMIT 5',
            [],
            function( err, rows ) {
                if ( err ) {
                    console.log(err);
                    res.send("{}");
                } else {
                    var result = {
                        rows: rows
                    };
                    console.log("Getting top repos");
                    res.jsonp(result);
                }
            }
        );
    }

	function reset_votes(cb) {
        database.run(
            'UPDATE votes SET votes = 0;',
            function( err ) {
				if(cb)
					cb(err);
            }
        );
	}

	function get_top_repo(cb) {
        database.get(
            'SELECT * FROM votes ORDER BY votes DESC',
            function( err, row ) {
				cb(err, row);
            }
        );
	}

    module.exports.vote_for_repo = vote_for_repo;
    module.exports.get_top_repos = get_top_repos;
    module.exports.reset_votes = reset_votes;
	module.exports.get_top_repo = get_top_repo;
}());
