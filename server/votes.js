(function() {
    var database = require("./sqlite_database.js");

    function vote_for_repo( req, res )
    {
        console.log(req.body);
        var data = req.body;

        database.run(
            'INSERT OR REPLACE INTO votes(idRepo, votes) VALUES( ?, COALESCE((SELECT votes FROM votes WHERE idRepo = ?), 0) + 1);',
            data.repo_url,
            data.repo_url,
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

    module.exports.vote_for_repo = vote_for_repo;
    module.exports.get_top_repos = get_top_repos;
}());
