module.exports = function (restobar) {
    restobar._app.put('/favorites' , function (req, res, next) {
        var user_id = req.body.userID;
        var venue_id = req.body.venueID;
        var state = req.body.fav;

        restobar.client.query({text:'SELECT * FROM favorites WHERE user_id=$1::int AND venue_id=$2::int',
            values: [user_id, venue_id]})
        .on('error' , function (err) {
            // do nothing
        })
        .on('end' , function (result) {
            if(result.rows.length == 0){
                restobar.client.query({text: 'INSERT INTO favorites VALUES ($1::int, $2::int, $3::boolean)',
                values: [user_id, venue_id, state]})
                    .on('error' , function () {
                        // do nothing
                    });
            }else{
                restobar.client.query({text:'UPDATE favorites SET fav = ($1::boolean) WHERE user_id=$2::int AND venue_id=$3::int',
                    values: [state, user_id, venue_id]});
            }
        });
    });
}