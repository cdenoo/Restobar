module.exports = function (restobar) {

    // This function renders the favorites page if a user is logged in
    restobar._app.get('/favorites', function (req, res, next) {
        var user_id = req.cookies.user;
        if(!user_id) {
            next(400);
            return;
        }
        res.render('favorites', {title:'Favorites ', userID:user_id});
    });

    // This function is used by an ajax call in 'views/favorites.pug' to add a favorite for the logged in user
    restobar._app.put('/favorites' , function (req, res, next) {
        var user_id = req.body.userID;
        var venue_id = req.body.venueID;

        restobar.client.query({text:'SELECT * FROM user_favorites WHERE user_id=$1::int AND venue_id=$2::int',
            values: [user_id, venue_id]})
        .on('error' , function (err) {
            // do nothing
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

    // This function is used by an ajax call in 'views/favorites.pug' to get the favorites of the logged in user
    restobar._app.get('/favorites/json', function (req, res, next) {
        var user_id = req.cookies.user;
        restobar.client.query({text:'SELECT venue_id FROM user_favorites WHERE user_id=$1::int', values:[user_id]})
            .on('error', function () {
                // do nothing
            })
            .on('end', function (result) {
                res.json(result.rows);
            });
    });
};
