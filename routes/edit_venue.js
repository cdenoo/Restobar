module.exports = function (restobar) {

    function renderEditVenue(req, res, errorMessages){

        if(!req.cookies.user){
            //We will render the login page if the user is not logged in
            var erros = array("You need to be logged in to view this page");
            res.render('login', {title: 'login', errors: errors});
        }

        var possibleVenueTypes;
        var marked_type_ids = [];

        restobar.client.query({
            name: "select_venue_type_ids",
            text: "SELECT type_id FROM venue_types WHERE venue_id=$1",
            values: [req.originalUrl.split('/')[2]] //The venue_id can be found in the URL.
        })
            .on("row", function(row){
                marked_type_ids.push(row.type_id);
        })
            .on("end", function(result){
            restobar.client.query({
                name: "select_possible_venue_types_for_edit",
                text: "SELECT * FROM possible_venue_types ORDER BY type_name ASC"
            })
                .on('row', function(row, result){
                    if(row.venue_type_id in marked_type_ids){
                        row.selected = true;
                    }
                    result.addRow(row);
                })
                .on('error', function(){
                    res.render('edit_venue', {title: 'Edit Venue', userID: req.cookies.user, errors: ['An error occurred. Please try again later.'], fields: req.body});
                })
                .on('end', function(result){
                    possibleVenueTypes = result.rows;
                    console.log(marked_type_ids);
                    restobar.client.query({
                        name: "select_venue_for_edit",
                        text: "SELECT * FROM venues WHERE venue_id=$1",
                        values: [req.originalUrl.split('/')[2]] //The venue_id can be found in the URL.
                    })
                        .on('error', function(){
                            res.render('edit_venue', {title: 'Edit Venue', userID: req.cookies.user, errors: ['An error occurred. Please try again later.'], fields: req.body});
                        })
                        .on('end', function(result){
                            //  console.log(result.rows[0]);
                            res.render('edit_venue', {title: 'Edit Venue', userID: req.cookies.user, errors: errorMessages,  possibleVenueTypes: possibleVenueTypes, fields: result.rows[0]});
                        });
                });
        })
    }

    restobar._app.get('/edit_venue/[0-9]*/', function (req, res, next) {
        renderEditVenue(req, res);
    });

    restobar._app.post('/edit_venue/[0-9]*/', function (req, res, next) {

        var name = req.body.name;
        var street = req.body.street;
        var houseNumber = req.body.houseNumber;
        var postalCode = req.body.postalCode;
        var city = req.body.city;
        var country = req.body.country;
        var phoneNumber = req.body.phoneNumber;
        var openingHours = req.body.openingHours;
        var errors = [];

        if(!name){
            errors.push("Please enter a name for the venue.");
        }

        if(!street) {
            errors.push("Please enter a street.");
        }

        if(!houseNumber) {
            errors.push("Please enter a house number.");
        }

        if(!postalCode) {
            errors.push("Please enter a postal code.");
        }

        if(!city) {
            errors.push("Please enter a city.");
        }

        if(!country) {
            errors.push("Please enter a country.");
        }

        if(errors.length){
            renderCreateVenue(req, res, errors);
            return;
        }

        //Get the coordinates of google
        restobar.googleMapsClient.geocode({
            address: street + ' ' + houseNumber + ', ' + postalCode + ' ' +  city + ', ' + country
        }, function(err, response) {

            var latitude;
            var longitude;

            if (!err) {
                var results = response.json.results;
                var firstResultCoordinates = results[0].geometry.location;

                latitude = firstResultCoordinates.lat;
                longitude = firstResultCoordinates.lng;
            }

            if(!latitude){
                latitude = -1;
            }

            if(!longitude){
                longitude = -1;
            }

            restobar.client.query({
                name: "edit_venue",
                text: "UPDATE venues SET name=$1, street=$2, house_number=$3, postal_code=$4, city=$5, country=$6, x_coordinate=$7, y_coordinate=$8, phone_number=$9, opening_hours=$10 WHERE venue_id=$11",
                values: [name, street, houseNumber, postalCode, city, country, longitude, latitude, phoneNumber, openingHours, req.originalUrl.split('/')[2]]
            }, function(err, result){

                if(err){
                    errors.push("Something went wrong. Please try again");
                    console.warn("Database error: " + err);
                    renderEditVenue(req, res, errors);
                    return
                }

                //Everything went well. Insert all the types now.
                //insertVenueTypes(req, res, errors, result.oid);
                res.redirect('../venue/' + req.originalUrl.split('/')[2]);
            });
        });
    });

    function insertVenueTypes(req, res, errors, venueID){

        //Insert each type of venue
        req.body.type.forEach(function(type){
            restobar.client.query({
                name: "link_venue_and_type",
                text: "INSERT INTO venue_types (venue_id, type_id) " +
                "VALUES($1, $2)",
                values: [venueID, type]
            }, function(typeErr, typeResult){

                if(err){
                    errors.push("Something went wrong while saving the venue type. All other data has been saved.");
                    //TODO open render modify venue form instead, as all other information has been saved.
                    renderCreateVenue(req, res, errors);
                    return
                }

            });
        });

        //Everything went ok: render the venue page
        res.render('venue', {title: 'Venue', userID: req.cookies.user, venueID: venueID});
    }
};