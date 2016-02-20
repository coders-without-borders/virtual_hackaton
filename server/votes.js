(function() {
    var database = require("./database.js");

    function vote_for_repo( req, res )
    {
        console.log(req.body);
        var data = req.body;

        database.run(
            'INSERT OR REPLACE INTO votes(idRepo, votes) VALUES( ?, COALESCE((SELECT votes FROM votes WHERE idRepo = ?), 0) + 1);',
            data.repo_url,
            data.repo_url,
            function( err, row ) {
                if ( err ) {
                    console.log(err);
                } else {
                    console.log("Voted for repository" );
                }
            }
        );
    }

    module.exports.vote_for_repo = vote_for_repo;
}());
