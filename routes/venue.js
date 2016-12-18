module.exports = function (restobar) {

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
            values: [1]
        })
        .on('error', function(){
            res.render('index', {title: 'Restobar | ERROR', userID: req.cookies.user, errors: ['An error occurred. Please try again later.']});
        })
        .on('end', function(result){

            if(!result.rows.length){
                //No venue found with this ID: error
                res.render('index', {title: 'Restobar | ERROR', userID: req.cookies.user, errors: ['An error occurred. Please try again later.']});
            }

            res.render('venue', {title: '', userID: req.cookies.user, venueData: result.rows[0]});
        });
    });
};