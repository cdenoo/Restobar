module.exports = function (restobar) {

    function renderIndex(req, res, errors, recommendations, recentlyRated, recentlyAdded, userFavorites){

        //We give back all possible data as there are a lot of options
        res.render('index', {
            title: 'RestoBar',
            userID: req.cookies.user,
            errors: errors,
            recommendations: recommendations,
            nmbRecommendations: recommendations ? recommendations.length : 0,
            recentlyRated: recentlyRated,
            recentlyAdded: recentlyAdded,
            userFavorites: userFavorites
        });
    }

    restobar._app.get('/', function (req, res, next) {

        var oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        //Load the 4 best (and most) rated restaurant of this week
        restobar.client.query({
            name: "get_top_and_most_rating_venues",
            text: "SELECT venue_ratings.venue_id, AVG(rating) AS avg_rating FROM venue_ratings WHERE date>" + oneWeekAgo.getTime() + " GROUP BY venue_ratings.venue_id ORDER BY avg_rating DESC LIMIT 4"
        })
        .on('error', function(error){
            renderIndex(req, res, ['An error occurred. Please try again later.']);
        })
        .on('end', function(result) {

            if(!result.rows.length){
                //No recommendations: skip this part and go to the next query
                loadRecentlyRated(req, res, null);
                return;
            }

            //We currently only have an venue_id, but we need some more information about the venue:
            //To show it on the homepage, we will also need the image_url and the name of the venue
            var idSelection = "";

            //generate the query to select all four the venues
            for(i in result.rows){
                idSelection += "venue_id=" + result.rows[i].venue_id + ' OR ';
            }

            //The idSelection-query will end with OR in the end, but this is not valid SQL. We remove this.
            var idSelectionClean = idSelection.substr(0, idSelection.length - 4);

            restobar.client.query("SELECT venue_id, name, image_url FROM venues WHERE " + idSelectionClean)
            .on('error', function(error){
                renderIndex(req, res, ['An error occurred. Please try again later.']);
            })
            .on('end', function(result) {
                //We will continue to load the other data need: next up the recently rated venues
                loadRecentlyRated(req, res, result.rows);
            });

        });
    });

    /**
     * This function will only load the recenlty rated functions.
     * After this function the recently added venues or the favorites of the user will be loaded.
     * @param req
     * @param res
     * @param recommendations An array of rows with the data of the recommended venues
     */
    function loadRecentlyRated(req, res, recommendations){

        //Load the 5 latest ratings
        restobar.client.query({
            name: "get_last_five_rating_venues",
            text: "SELECT venues.venue_id, venues.name, venues.image_url, venue_ratings.rating FROM venue_ratings INNER JOIN venues ON venues.venue_id=venue_ratings.venue_id ORDER BY venue_ratings.date DESC LIMIT 5"
        })
        .on('error', function(error){
            renderIndex(req, res, ['An error occurred. Please try again later.']);
        })
        .on('end', function(result) {

            if(req.cookies.user){
                //user is logged in: load favorites
                loadFavorites(req, res, recommendations, result.rows);
            }
            else{
                //User is not logged in
                loadRecentlyAdded(req, res, recommendations, result.rows);
            }

        });

    }

    /**
     * This function will load the 5 newes venues added to the system.
     * The page will be rendered after the execution of this function
     * @param req
     * @param res
     * @param recommendations An array of rows with the data of the recommended venues
     * @param recentlyRated An array of rows with the data of the recently rated venues
     */
    function loadRecentlyAdded(req, res, recommendations, recentlyRated){

        //Load the 5 newes venues
        restobar.client.query({
            name: "get_five_newest_venues",
            text: "SELECT venues.venue_id, venues.name, venues.image_url, (SELECT AVG(venue_ratings.rating) FROM venue_ratings WHERE venue_ratings.venue_id=venues.venue_id) AS rating, (SELECT COUNT(venue_ratings.venue_id) FROM venue_ratings WHERE venue_ratings.venue_id=venues.venue_id) AS rating_count FROM venues ORDER BY venue_id DESC LIMIT 5"
        })
        .on('error', function(error){
            renderIndex(req, res, ['An error occurred. Please try again later.']);
        })
        .on('end', function(result) {

            renderIndex(req, res, null, recommendations, recentlyRated, result.rows);

        });
    }

    /**
     * This function will load 5 of the favorite veneus of the user
     * The page will be rendered after the execution of this function
     * @param req
     * @param res
     * @param recommendations An array of rows with the data of the recommended venues
     * @param recentlyRated An array of rows with the data of the recently rated venues
     */
    function loadFavorites(req, res, recommendations, recentlyRated){

        //Load the 5 newest ratings
        restobar.client.query({
            name: "get_five_user_favorites",
            text: "SELECT venues.venue_id, venues.name, venues.image_url, (SELECT AVG(venue_ratings.rating) FROM venue_ratings WHERE venue_ratings.venue_id=venues.venue_id) AS rating, (SELECT COUNT(venue_ratings.venue_id) FROM venue_ratings WHERE venue_ratings.venue_id=venues.venue_id) AS rating_count FROM user_favorites INNER JOIN venues ON venues.venue_id=user_favorites.venue_id WHERE user_id=$1::int LIMIT 5",
            values: [req.cookies.user]
        })
        .on('error', function(error){
            renderIndex(req, res, ['An error occurred. Please try again later.']);
        })
        .on('end', function(result) {

            if(!result.rows.length){
                //No favorites
                renderIndex(req, res, null, recommendations, recentlyRated);
                return;
            }

            renderIndex(req, res, null, recommendations, recentlyRated, null, result.rows);

        });
    }

};