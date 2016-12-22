module.exports = function (restobar) {

    restobar._app.get('/venues_around_me', function(req, res, next){

        var lat = parseFloat(req.query.lat); //Y-coordinate
        var long = parseFloat(req.query.long); //X-coordinate

        restobar.client.query({
            name: "select_venues_around_me",
            text: "SELECT venues.* FROM venues WHERE x_coordinate BETWEEN $1 AND $2 AND y_coordinate BETWEEN $3 AND $4",
            values: [long - 1, long + 1, lat - 1, lat + 1]
        })
            .on('error', function(error){
                console.log(error);
                res.json(["ERROR", "An error occurred while accessing the database."]);
            })
            .on('end', function(result){

                res.json(["SUCCESS", result.rows]);

            });

    });
};