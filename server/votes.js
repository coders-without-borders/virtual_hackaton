(function() {
    var database = require("./database.js");

    function vote_for_repo( req, res )
    {
        var data = JSON.parse(req.body.json);

        database.run(
            'INSERT INTO votes(idRepo) VALUES( ? ); UPDATE votes SET votes.votes=votes.votes + 1',
            data.repo_url,
            function( err, row ) {
                if ( err ) {
                    console.log(err);
                }

                console.log("Voted for repository " + row.idRepo + " , " + row.votes );
            }
        );
    }

    module.exports.vote_for_repo = vote_for_repo;
}());
