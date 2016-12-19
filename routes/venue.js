module.exports = function (restobar) {

    var monthNames = [
        "January", "February", "March",
        "April", "May", "June", "July",
        "August", "September", "October",
        "November", "December"
    ];

    function renderVenue(req, res, errorMessages){

        //Get venueID
        var urlPieces = req.originalUrl.split("/");
        var venueID = urlPieces[2];

        if(isNaN(venueID)){
            //The ID of the venue should be a number
            //res.render('index', {title: 'Restobar | ERROR', userID: req.cookies.user, errors: ['An error occurred. Please try again later.']})
            res.redirect('/');
            return;
        }

        restobar.client.query({
            name: "select_venue",
            text: "SELECT * FROM venues WHERE venue_id=$1",
            values: [venueID]
        })
        .on('error', function(){
            //TODO add errors to homepage
            res.render('index', {title: 'Restobar | ERROR', userID: req.cookies.user, errors: ['An error occurred. Please try again later.']});
        })
        .on('end', function(result){
            //TODO include the rating (no ratings? --> send noRating = true
            if(!result.rows.length){
                //No venue found with this ID: error
                res.render('index', {title: 'Restobar | ERROR', userID: req.cookies.user, errors: ['An error occurred. Please try again later.']});
            }

            var venueData = result.rows[0];
            venueData.noRating = true;
            venueData.rating = 0;

            //Load the ratings
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
                res.render('index', {title: 'Restobar | ERROR', userID: req.cookies.user, errors: ['An error occurred. Please try again later.']});
            })
            .on('end', function(reviewsResult){
                res.render('venue', {title: 'Restobar | ' + venueData.name, userID: req.cookies.user, venueData: venueData, fields: req.body, reviews: reviewsResult.rows, errors: errorMessages});
            });

        });
    }

    restobar._app.get('/venue/[0-9]*/', function (req, res, next) {
        renderVenue(req, res);
    });

    restobar._app.post('/venue/[0-9]*/', function (req, res, next) {

        //Get venueID
        var urlPieces = req.originalUrl.split("/");
        var venueID = urlPieces[2];

        if(isNaN(venueID)){
            //The ID of the venue should be a number
            //res.render('index', {title: 'Restobar | ERROR', userID: req.cookies.user, errors: ['An error occurred. Please try again later.']})
            res.redirect('/');
            return;
        }

        var rating = req.body.rating;
        var comments = req.body.comments;
        var errors = [];

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

        restobar.client.query({
            name: "rate_venue",
            text: "INSERT INTO venue_ratings (venue_id, user_id, rating, comments, date) " +
            "VALUES($1, $2, $3, $4::text, $5)",
            values: [venueID, req.cookies.user, rating, comments, new Date().getTime()]
        }, function(err, result){

            if(err){
                errors.push("Something went wrong. Please try again");
                console.warn("Database error: " + err);
                renderVenue(req, res, errors);
                return
            }

            //Everything went well
            renderVenue(req, res);

        });
    });
};