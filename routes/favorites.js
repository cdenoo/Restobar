module.exports = function (restobar) {

    // This function renders the favorites page if a user is logged in
    restobar._app.get('/favorites', function (req, res, next) {
        var user_id = req.cookies.user;
        // Is the user logged in?
        // If not, call next with a 400 error
        if(!user_id) {
            next(400);
            return;
        }
        // Render the favorites page
        res.render('favorites', {title:'Favorites ', userID:user_id});
    });

    // This function is used by an ajax call in 'views/favorites.pug' to add a favorite for the logged in user
    restobar._app.put('/favorites' , function (req, res, next) {
        // The id of the currently logged in user
        var user_id = req.body.userID;
        // The id of the venue that is being watched
        var venue_id = req.body.venueID;

        // This function has no use if either the user or venue is specified
        // Return 400 error if either isn't specified
        if(user_id && venue_id){
            next(400);
            return;
        }

        // Query the database to update the user_favorites table
        restobar.client.query({text:'SELECT * FROM user_favorites WHERE user_id=$1::int AND venue_id=$2::int',
            values: [user_id, venue_id]})
        .on('error' , function (err) {
            // do nothing
            // This is here to catch the error if it happens
        })
        .on('end' , function (result) {
            if(result.rows.length == 0){
                // Debugging
                restobar.devWarn("inserting");
                // If the pair (user_id, venue_id) doesn't exist, insert it into the user_favorites table
                restobar.client.query({text: 'INSERT INTO user_favorites VALUES ($1::int, $2::int)',
                values: [user_id, venue_id]})
                    .on('error' , function () {
                        // do nothing
                        // This is here to catch the error if it happens
                    });
            }else{
                // Debugging
                restobar.devWarn("removing");
                // If the pair (user_id, venue_id) does exist, delete it from the user_favorites
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
                // This is here to catch the error if it happens
            })
            .on('end', function (result) {
                // If successful, return the result
                res.json(result.rows);
            });
    });
};
