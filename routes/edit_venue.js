module.exports = function (restobar) {

    var thisVenueID;

    function renderEditVenue(req, res, errorMessages){

        if(!req.cookies.user){
            //We will render the login page if the user is not logged in.
            var errors = ["You need to be logged in to view this page"];
            res.render('login', {title: 'login', errors: errors});
        }

        // The venueID is visible in the URL. We need this now and then.
        thisVenueID = req.originalUrl.split('/')[2];

        var possibleVenueTypes;
        var marked_type_ids = [];
        var possibleFeatures;
        var marked_feature_ids = [];

        //The first query selects all the venuetype ids of the venue we will edit.
        restobar.client.query({
            name: "select_venue_type_ids",
            text: "SELECT type_id FROM venue_types WHERE venue_id=$1",
            values: [thisVenueID] //The venue_id can be found in the URL.
        })
            .on("row", function(row){
                marked_type_ids.push(row.type_id);
        })
            .on("end", function(){

                //The second query makes sure that the selected types will be marked as selected.
                restobar.client.query({
                    name: "select_possible_venue_types_for_edit",
                    text: "SELECT * FROM possible_venue_types ORDER BY type_name ASC"
                })
                .on("row", function(row, venueTypesResult){
                    if(row.type_id in marked_type_ids){
                        row.selected = true;
                    }
                    venueTypesResult.addRow(row);
                })
                .on("error", function(){
                    res.render('edit_venue', {title: 'Edit Venue', userID: req.cookies.user, errors: ['An error occurred. Please try again later.'], fields: req.body});
                })
                .on("end", function(venueTypesResult){
                    possibleVenueTypes = venueTypesResult.rows;

                    //The third query selects all feature ids of the venue that will be edited.
                    restobar.client.query({
                        name: "select_venue_feature_ids",
                        text: "SELECT feature_id FROM venue_features WHERE venue_id=$1",
                        values: [thisVenueID] //The venue_id can be found in the URL.
                    })
                        .on("row", function(row){
                            marked_feature_ids.push(row.feature_id);
                        })
                        .on("end", function(){

                            //The fourth query makes sure that the selected features will be marked as selected.
                            restobar.client.query({
                                name: "select_possible_venue_features_for_edit",
                                text: "SELECT * FROM features ORDER BY name ASC"
                            })
                                .on('row', function(row, featuresResult){
                                    if(row.feature_id in marked_feature_ids){
                                        row.selected = true;
                                    }
                                    featuresResult.addRow(row);
                                })
                                .on('error', function(){
                                    res.render('edit_venue', {title: 'Edit Venue', userID: req.cookies.user, errors: ['An error occurred. Please try again later.'], fields: req.body});
                                })
                                .on('end', function(featuresResult){
                                    possibleFeatures = featuresResult.rows;

                                    //The last query selects all the other information about the venue to be edited.
                                    restobar.client.query({
                                        name: "select_venue_for_edit",
                                        text: "SELECT * FROM venues WHERE venue_id=$1",
                                        values: [thisVenueID] //The venue_id can be found in the URL.
                                    })
                                        .on('error', function(){
                                            res.render('edit_venue', {title: 'Edit Venue', userID: req.cookies.user, errors: ['An error occurred. Please try again later.'], fields: req.body});
                                        })
                                        .on('end', function(result){
                                            res.render('edit_venue', {title: 'Edit Venue', userID: req.cookies.user, errors: errorMessages, possibleVenueTypes: possibleVenueTypes, possibleFeatures: possibleFeatures, fields: result.rows[0]});
                                        })
                                })
                        });
                });
        })
    }

    restobar._app.get('/edit_venue/[0-9]*/', function (req, res, next) {
        renderEditVenue(req, res);
    });

    restobar._app.post('/edit_venue/[0-9]*/', function (req, res, next) {

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

        // A variable to store all errors to be shown.
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

        // If there is one or more errors, the edit_venue page is loaded with the errors on top of it.
        if(errors.length){
            renderEditVenue(req, res, errors);
            return;
        }

        //Get the coordinates from Google.
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

            // A query that updates information of the venue in the database.
            restobar.client.query({
                name: "edit_venue",
                text: "UPDATE venues SET name=$1, street=$2, house_number=$3, postal_code=$4, city=$5, country=$6, x_coordinate=$7, y_coordinate=$8, phone_number=$9, email=$10, opening_hours=$11 WHERE venue_id=$12",
                values: [name, street, houseNumber, postalCode, city, country, longitude, latitude, phoneNumber, email, openingHours, thisVenueID]
            }, function(err, result){

                if(err){
                    errors.push("Something went wrong. Please try again");
                    console.warn("Database error: " + err);
                    renderEditVenue(req, res, errors);
                    return
                }

                // Everything went well. Insert all the types now.
                // This is done by first deleting the old ones and then inserting the new.
                deleteOldVenueTypes(req, res, errors, thisVenueID);
            });
        });
    });

    // First we delete the old venue types.
    function deleteOldVenueTypes(req, res, errors, venueID){
        restobar.client.query({
            name: "delete_old_venuetypes",
            text: "DELETE FROM venue_types WHERE venue_id=$1",
            values: [venueID]
        })
            .on('end', function(){
                // When the old types are deleted, we insert the new.
                insertVenueTypes(req, res, errors, venueID)
            })
    }

    // Then we insert the new venue types.
    function insertVenueTypes(req, res, errors, venueID){

        var typeArray = [];

        if(!Array.isArray(req.body.type)){
            typeArray.push(Number(req.body.type)); //A form sends all information as a string, now we convert it to an int.
        }
        else{
            typeArray = req.body.type;
        }

        var notInserted = typeArray.length;

        // Insert each type of venue, one after the other.
        typeArray.forEach(function(type){
            restobar.client.query({
                name: "link_venue_and_type",
                text: "INSERT INTO venue_types (venue_id, type_id) VALUES($1, $2)",
                values: [venueID, type]
            }, function(typeErr, typeResult){

                if(typeErr){
                    errors.push("Something went wrong while saving the venue type. All other data has been saved.");
                    renderEditVenue(req, res, errors);
                    return;
                }

                notInserted--;

                if(notInserted == 0){
                    //We are finished with the venue types, we continue with the venue features.
                    deleteOldFeatures(req, res, errors, venueID)
                }
            });
        });

        // Similar to the venue types, we first delete the old venue features.
        function deleteOldFeatures(req, res, errors, venueID){
            restobar.client.query({
                name: "delete_old_features",
                text: "DELETE FROM venue_features WHERE venue_id=$1",
                values: [venueID]
            })
                .on('end', function(){
                    // When the old features are deleted, we insert the new.
                    insertVenueFeatures(req, res, errors, venueID)
                })
        }

        // Then we insert the new venue features.
        function insertVenueFeatures(req, res, errors, venueID) {

            var featureArray = [];

            if (!Array.isArray(req.body.type)) {
                featureArray.push(Number(req.body.type)); //A form sends all information as a string, now we convert it to an int.
            }
            else {
                featureArray = req.body.type;
            }

            var notInserted = featureArray.length;

            //Insert each feature of venue
            featureArray.forEach(function (feature) {
                restobar.client.query({
                    name: "link_venue_and_feature",
                    text: "INSERT INTO venue_features (venue_id, feature_id) VALUES($1, $2)",
                    values: [venueID, feature]
                }, function (featureErr, typeResult) {

                    if (featureErr) {
                        errors.push("Something went wrong while saving the venue type. All other data has been saved.");
                        renderEditVenue(req, res, errors);
                        return;
                    }

                    notInserted--;

                    if (notInserted == 0) {
                        //We are finished executing: render page.
                        res.redirect('/venue/' + venueID);
                    }
                });
            });
        }
    }
};