module.exports = function (restobar) {

    function renderCreateVenue(req, res, errorMessages){

        if(!req.cookies.user){
            //We will render the login page if the user is not logged in
            var erros = array("You need to be logged in to view this page");
            res.render('login', {title: 'login', errors: errors});
        }

        restobar.client.query({
            name: "select_possible_venue_types",
            text: "SELECT * FROM possible_venue_types"
        })
        .on('row', function(row, result){

            //Check if the current row needs to be selected
            if(req.body.type && req.body.type.indexOf(row.type_id + '') >= 0){
                //Element is should be selected: add an extra field in the row
                row.selected =  'selected';
            }

            result.addRow(row);
        })
        .on('error', function(){
            res.render('create_venue', {title: 'Create a Venue', userID: req.cookies.user, errors: ['An error occurred. Please try again later.'],  fields: req.body});
        })
        .on('end', function(result){
            res.render('create_venue', {title: 'Create a Venue', userID: req.cookies.user, errors: errorMessages,  possibleVenueTypes: result.rows, fields: req.body});
        });
    }

    restobar._app.get('/create-venue', function (req, res, next) {
        renderCreateVenue(req, res);
    });

    restobar._app.post('/create-venue', function (req, res, next) {

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
                name: "create_venue",
                text: "INSERT INTO venues (name, street, house_number, postal_code, city, country, x_coord, y_coord, phone_number, opening_hours, owner_id) " +
                "VALUES($1::text, $2::text, $3::text, $4::text, $5::text, $6::text, $7, $8, $9::text, $10::text, $11)",
                values: [name, street, houseNumber, postalCode, city, country, longitude, latitude, phoneNumber, openingHours, req.cookies.user]
            }, function(err, result){

                if(err){
                    errors.push("Something went wrong. Please try again");
                    console.warn("Database error: " + err);
                    renderCreateVenue(req, res, errors);
                    return
                }

                //Everything went well. Insert all the types now.
                insertVenueTypes(req, res, errors, result.oid);

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
        res.redirect('venue/' + venueID);
    }
};