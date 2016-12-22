module.exports = function (restobar) {

    function renderCreateVenue(req, res, errorMessages){

        if(!req.cookies.user){
            // We will render the login page if the user is not logged in.
            // This is because it is not possible to create a venue when you are not logged in.
            // The owner_id of the venue is linked to the user_id of the user, so users have to be logged in to create venues.
            var errors = ["You need to be logged in to view this page"];
            res.render('login', {title: 'login', errors: errors});
        }

        var possibleVenueTypes;

        restobar.client.query({
            name: "select_possible_venue_types",
            text: "SELECT * FROM possible_venue_types ORDER BY type_name ASC"
        })
        .on('row', function(row, resultTypes){

            // Check if the current row needs to be selected.
            if(req.body.type && req.body.type.indexOf(row.type_id + '') >= 0){
                // Element is should be selected: add an extra field in the row.
                row.selected =  'selected';
            }

            resultTypes.addRow(row);
        })
        .on('error', function(){
            res.render('create_venue', {title: 'Create a Venue', userID: req.cookies.user, errors: ['An error occurred. Please try again later.'], fields: req.body});
        })
        .on('end', function(resultTypes){
            possibleVenueTypes = resultTypes.rows;
            restobar.client.query({
                name: "select_possible_venue_features",
                text: "SELECT * FROM features ORDER BY name ASC"
            })
                .on('row', function(row, resultFeatures){

                    // Check if the current row needs to be selected.
                    if(req.body.name && req.body.name.indexOf(row.feature_id + '') >= 0){
                        // Element is should be selected: add an extra field in the row.
                        row.selected =  'selected';
                    }
                    resultFeatures.addRow(row);
                })
                .on('error', function(){
                    res.render('create_venue', {title: 'Create a Venue', userID: req.cookies.user, errors: ['An error occurred. Please try again later.'], fields: req.body});
                })
                .on('end', function(resultFeatures){
                    res.render('create_venue', {title: 'Create a Venue', userID: req.cookies.user, errors: errorMessages, possibleVenueTypes: possibleVenueTypes, possibleFeatures: resultFeatures.rows, fields: req.body});
                });
        })
    }

    restobar._app.get('/create-venue', function (req, res, next) {
        renderCreateVenue(req, res);
    });

    restobar._app.post('/create-venue', function (req, res, next) {

        // Some variables to check the input.
        var name = req.body.name;
        var street = req.body.street;
        var houseNumber = req.body.houseNumber;
        var postalCode = req.body.postalCode;
        var city = req.body.city;
        var country = req.body.country;
        var phoneNumber = req.body.phoneNumber;
        var email = req.body.email;
        var openingHours = req.body.openingHours;
        var errors = [];

        // Some checks whether every field is filled in correctly.
        // If not, an error is added to the variable 'errors'.
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

        // If there is one or more errors, the create_venue page is loaded with the errors on top of it.
        if(errors.length){
            renderCreateVenue(req, res, errors);
            return;
        }

        // Get the coordinates of google
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
                text: "INSERT INTO venues (name, street, house_number, postal_code, city, country, x_coordinate, y_coordinate, phone_number, email, opening_hours, owner_id) " +
                "VALUES($1::text, $2::text, $3::text, $4::text, $5::text, $6::text, $7, $8, $9::text, $10::text, $11::text, $12) RETURNING venue_id",
                values: [name, street, houseNumber, postalCode, city, country, longitude, latitude, phoneNumber, email, openingHours, req.cookies.user]
            }, function(err, result){

                if(err){
                    errors.push("Something went wrong. Please try again");
                    console.warn("Database error: " + err);
                    renderCreateVenue(req, res, errors);
                    return
                }

                var venueID = result.rows[0].venue_id;

                // Start with inserting the features.
                // After the features are inserted, the venue types will be inserted as well.
                insertFeatures(req, res, errors, venueID);
            });
        });
    });

    function insertFeatures(req, res, errors, venueID) {

        // An array which stores all the features of the venue.
        var featureArray = [];

        // If a venue has only one type, 'req.body.type' is not an array but just the venuetype id as a string.
        if (!Array.isArray(req.body.type)) {
            // 'req.body.type' is not an array, so we push the element in our variable.
            featureArray.push(Number(req.body.type)); // A form sends all information as a string, now we convert it to an int.
        }
        else {
            // 'req.body.type' is an array, so we can simply store it in our variable.
            featureArray = req.body.type;
        }

        // A variable that works as a counter that says how many elements are left to be inserted.
        var notInserted = featureArray.length;

        // Insert each feature of venue.
        featureArray.forEach(function(feature){
            restobar.client.query({
                name: "link_venue_and_features",
                text: "INSERT INTO venue_features (venue_id, feature_id) VALUES($1, $2)",
                values: [venueID, feature]
            }, function (featureErr, featureResult) {

                if (featureErr) {
                    errors.push("Something went wrong while saving the venue type. All other data has been saved.");
                    renderCreateVenue(req, res, errors);
                    return
                }

                // One type is inserted, so we decrement our counter.
                notInserted--;

                if(notInserted == 0) {
                    // Everything is still ok: insert venue types.
                    insertVenueTypes(req, res, errors, venueID);
                }

            });
        });
    }

    function insertVenueTypes(req, res, errors, venueID){

        // An array which stores all the types of the venue.
        var typeArray = [];

        // If a venue has only one type, 'req.body.type' is not an array but just the venuetype id as a string.
        if(!Array.isArray(req.body.type)){
            // 'req.body.type' is not an array, so we push the element in our variable.
            typeArray.push(Number(req.body.type)); // A form sends all information as a string, now we convert it to an int.
        }
        else{
            // 'req.body.type' is an array, so we can simply store it in our variable.
            typeArray = req.body.type;
        }

        // A variable that works as a counter that says how many elements are left to be inserted.
        var notInserted = typeArray.length;

        //Insert each type of venue
        typeArray.forEach(function(type){
            restobar.client.query({
                name: "link_venue_and_type",
                text: "INSERT INTO venue_types (venue_id, type_id) VALUES($1, $2)",
                values: [venueID, type]
            }, function(typeErr, typeResult){

                if(typeErr){
                    errors.push("Something went wrong while saving the venue type. All other data has been saved.");
                    renderCreateVenue(req, res, errors);
                    return
                }

                // One type is inserted, so we decrement our counter.
                notInserted--;

                if(notInserted == 0) {
                    // Everything went ok: render the venue page
                    res.redirect('venue/' + venueID);
                }

            });
        });
    }
};