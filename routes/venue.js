module.exports = function (restobar) {

    var monthNames = [
        "January", "February", "March",
        "April", "May", "June", "July",
        "August", "September", "October",
        "November", "December"
    ];

    /**
     * Render the venue page
     * @param req
     * @param res
     * @param errorMessages An array of error messages that should be shown to the user
     */
    function renderVenue(req, res, errorMessages){

        //Get venue_id
        var urlPieces = req.originalUrl.split("/");
        var venueID = urlPieces[2];

        if(isNaN(venueID)){
            //The ID of the venue should be a number
            //We redirect the user to the homepage if this is not the case
            res.redirect('/');
            return;
        }

        //Get all data of this venue
        restobar.client.query({
            name: "select_venue",
            text: "SELECT venues.*, (SELECT AVG(venue_ratings.rating) FROM venue_ratings WHERE venue_ratings.venue_id=venues.venue_id) AS rating, (SELECT COUNT(venue_ratings.venue_id) FROM venue_ratings WHERE venue_ratings.venue_id=venues.venue_id) AS rating_count FROM venues WHERE venue_id=$1",
            values: [venueID]
        })
        .on('error', function(error){
            res.render('index', {title: 'Restobar | ERROR', userID: req.cookies.user, errors: ['An error occurred. Please try again later.']});
        })
        .on('end', function(result){

            if(!result.rows.length){
                res.redirect('/');
            }

            var venueData = result.rows[0];

            venueData.rating = parseFloat(venueData.rating).toFixed(1); //We only return one digit of precision

            //Load the ratings (or reviews)
            restobar.client.query({
                name: "select_venue_ratings",
                text: "SELECT venue_ratings.*, users.* FROM venue_ratings LEFT JOIN users ON users.user_id=venue_ratings.user_id WHERE venue_id=$1",
                values: [venueID]
            })
            .on('row', function(row, result){

                //Format the date
                var date = new Date(parseInt(row.date));
                row.formatted_date = monthNames[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear();

                result.addRow(row);
            })
            .on('error', function(){
                res.redirect('/');
            })
            .on('end', function(reviewsResult){

                //The last check: see if this venue is a favorite of the user
                restobar.client.query({text:'SELECT * FROM user_favorites WHERE user_id=$1::int AND venue_id=$2::int', values: [req.cookies.user, venueID]})
                    .on('error', function (err) {
                        res.render('venue', {title: 'Restobar | ' + venueData.name, userID: req.cookies.user, venueData: venueData, fields: req.body, reviews: reviewsResult.rows, errors: errorMessages, favorite:false});
                    })
                    .on('end', function (result) {

                        var favorite = result.rows.length;

                        //We have all info: render the page
                        res.render('venue', {title: 'Restobar | ' + venueData.name, userID: req.cookies.user, venueData: venueData, fields: req.body, reviews: reviewsResult.rows, errors: errorMessages, favorite:favorite});
                    });
            });
        });
    }

    restobar._app.get('/venue/[0-9]*/', function (req, res, next) {
        renderVenue(req, res);
    });

    restobar._app.post('/venue/[0-9]*/', function (req, res, next) {

        //A POST request means that the review form has been submitted

        //Get venueID
        var urlPieces = req.originalUrl.split("/");
        var venueID = urlPieces[2];

        if(isNaN(venueID)){
            //The ID of the venue should be a number
            res.redirect('/');
            return;
        }

        var rating = req.body.rating;
        var comments = req.body.comments;
        var errors = [];

        //Check if the required fields are filled in
        if(!rating || isNaN(rating)){
            errors.push("Please rate this venue.");
        }

        if(!comments){
            errors.push("Please provide a little info why you chose this score.");
        }

        if(errors.length){
            renderVenue(req, res, errors);
            return;
        }

        //All fields are filled in: insert the data into the database
        restobar.client.query({
            name: "rate_venue",
            text: "INSERT INTO venue_ratings (venue_id, user_id, rating, comments, date) " +
            "VALUES($1, $2, $3, $4::text, $5)",
            values: [venueID, req.cookies.user, rating, comments, new Date().getTime()]
        }, function(err, result){

            if(err){
                errors.push("Something went wrong. Please try again");
                renderVenue(req, res, errors);
                return
            }

            //Everything went well: render the page again
            renderVenue(req, res);

        });
    });
};