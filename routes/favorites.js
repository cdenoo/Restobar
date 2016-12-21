module.exports = function (restobar) {
    restobar._app.put('/favorites' , function (req, res, next) {
        var user_id = req.body.userID;
        var venue_id = req.body.venueID;

        console.log(user_id);
        console.log(venue_id);

        restobar.client.query({text:'SELECT * FROM user_favorites WHERE user_id=$1::int AND venue_id=$2::int',
            values: [user_id, venue_id]})
        .on('error' , function (err) {
            // do nothing
            console.warn("db error:" + err)
        })
        .on('end' , function (result) {
            if(result.rows.length == 0){
                console.log("inserting");
                restobar.client.query({text: 'INSERT INTO user_favorites VALUES ($1::int, $2::int)',
                values: [user_id, venue_id]})
                    .on('error' , function () {
                        // do nothing
                    });
            }else{
                console.log("removing");
                restobar.client.query({text:'DELETE FROM user_favorites WHERE user_id=$1::int AND venue_id=$2::int',
                    values: [user_id, venue_id]});
            }
        });
    });
}