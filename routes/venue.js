module.exports = function (restobar) {

    var monthNames = [
        "January", "February", "March",
        "April", "May", "June", "July",
        "August", "September", "October",
        "November", "December"
    ];

    restobar._app.get('/venue/[0-9]*/', function (req, res, next) {

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
                text: "SELECT venue_ratings.*, users.first_name, users.last_name FROM venue_ratings LEFT JOIN users ON users.user_id=venue_ratings.user_id WHERE venue_id=$1",
                values: [venueID]
            })
            .on('row', function(row, result){

                //Format the date
                var date = new Date(row['date']);
                row['formatted_date'] = monthNames[date.getMonth()] + ' ' + date.getDay() + ', ' + date.getFullYear();

                result.addRow(row);
            })
            .on('error', function(){
                res.render('index', {title: 'Restobar | ERROR', userID: req.cookies.user, errors: ['An error occurred. Please try again later.']});
            })
            .on('end', function(reviewsResult){
                res.render('venue', {title: '', userID: req.cookies.user, venueData: venueData, reviews: reviewsResult.rows});
            });

        });
    });
};