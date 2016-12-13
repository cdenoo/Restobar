module.exports = function (restobar) {

    function renderCreateVenue(req, res, errorMessages){

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
            //TODO only show page if the user is logged in
            res.render('create_venue', {title: 'Create a Venue', userID: req.cookies.user, errors: ['An error occurred.'],  fields: req.body});
        })
        .on('end', function(result){
            //TODO only show page if the user is logged in
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

        restobar.client.query({
            name: "create_venue",
            text: "INSERT INTO venues (name, street, house_number, postal_code, city, country, phone_number, opening_hours, owner_id) " +
                    "VALUES($1::text, $2::text, $3::text, $4::text, $5::text, $6::text, $7::text, $8::text, $9)",
            values: [name, street, houseNumber, postalCode, city, country, phoneNumber, openingHours, req.cookies.user]
        }, function(err, result){

            if(err){
                errors.push("Something went wrong. Please try again");
                console.warn("Database error: " + err);
                renderCreateVenue(req, res, errors);
                return
            }

            //Everything went well. Insert all the types now.
            req.body.type.forEach(function(type){
                restobar.client.query({
                    name: "link_venue_and_type",
                    text: "INSERT INTO venue_types (venue_id, type_id) " +
                    "VALUES($1, $2)",
                    values: [result.oid, type]
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
            res.render('index', {title: 'Venue', userID: req.cookies.user});

        });


    });
};