module.exports = function (restobar) {

    function renderVenueImage(req, res, errorMessages){

        if(!req.cookies.user){
            //We will render the login page if the user is not logged in
            var errors = ["You need to be logged in to view this page"];
            res.render('login', {title: 'login', errors: errors});
        }

        var venueID = req.originalUrl.split('/')[2];

        if(!venueID){
            res.redirect('/');
        }

        if(isNaN(venueID)){
            res.redirect('/');
        }

        restobar.client.query({
            name: "select_venue_for_edit",
            text: "SELECT * FROM venues WHERE venue_id=$1 AND owner_id=$2",
            values: [venueID, req.cookies.user] //The venue_id can be found in the URL.
        })
            .on('error', function(){
                res.render('index', {title: 'RestoBar | ERROR', userID: req.cookies.user, errors: ['An error occurred. Please try again later.']});
            })
            .on('end', function(result){

                //We didn't find any results
                if(!result.rows.length){
                    res.redirect('/');
                }

                res.render('venue_image', {title: 'Edit Venue', userID: req.cookies.user, errors: errorMessages,  venueData: result.rows[0]});
            });
    }

    restobar._app.get('/venue_image/[0-9]*/', function (req, res, next) {
        renderVenueImage(req, res);
    });

    restobar._app.post('/venue_image/[0-9]*/', restobar.upload.single('image'), function (req, res, next) {

        var venueID = req.originalUrl.split('/')[2];

        if(!venueID){
            res.redirect('/');
        }

        //Insert the url to the image into database
        restobar.client.query({
            name: "venue_add_image",
            text: "UPDATE venues SET image_url=$1 WHERE venue_id=$2 AND owner_id=$3",
            values: ['/uploads/' + req.file.filename, venueID, req.cookies.user]
        }, function(err, result){

            if(err){
                errors.push("Something went wrong. Please try again");
                console.warn("Database error: " + err);
                renderVenueImage(req, res, errors);
                return
            }

            //Everything went well. Render the page
            renderVenueImage(req, res);
        });
    });



};