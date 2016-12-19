/**
 * Created by thijsspinoy on 22/11/2016.
 */
module.exports = function (restobar) {

    function renderSearch(req, res, errorMessages, query){

        restobar.client.query({
            name: "select_possible_venue_types",
            text: "SELECT * FROM possible_venue_types ORDER BY type_name ASC"
        })
        .on('error', function(){
            res.render('index', {title: 'Restobar | ERROR', userID: req.cookies.user, errors: ['An error occurred. Please try again later.'],  fields: req.body});
        })
        .on('end', function(typesResult){

            restobar.client.query({
                name: "select_possible_features",
                text: "SELECT * FROM features ORDER BY name ASC"
            })
            .on('error', function(){
                res.render('index', {title: 'Restobar | ERROR', userID: req.cookies.user, errors: ['An error occurred. Please try again later.'],  fields: req.body});
            })
            .on('end', function(featuresResult){
                res.render('search', {title: 'Restobar | Search', userID: req.cookies.user, errors: errorMessages, query: query, types: typesResult.rows, features: featuresResult.rows});
            });

        });
    }

    restobar._app.get('/search', function (req, res, next) {
        renderSearch(req, res);
    });

    restobar._app.get('/search/*', function (req, res, next) {

        //Get the query from the url
        var urlPieces = req.originalUrl.split("/");
        var query = urlPieces[2];

        renderSearch(req, res, null, query);
    });

    restobar._app.post('/search', function(req, res, next){

        console.log(req.body);

        var query = req.body.query;
        var country = req.body.country;
        var city = req.body.city;

        if(query == "" && country == "" && city == "" &&  Object.keys(req.body).length == 3){
            //No fields given: load initial result
            returnAllVenues(res);
            return;
        }

        var sqlQuery = "SELECT * FROM venues WHERE ";
        var venueTypeSelection = "";
        var featureSelection = "";

        if(query){
            sqlQuery += "(name LIKE '%" + query + "%' OR email LIKE '%" + query + "%') AND ";
        }

        if(country){
            sqlQuery += "country LIKE '%" + country + "%' AND ";
        }

        if(city){
            sqlQuery += "city LIKE '%" + city + "%' AND ";
        }

        //Go over the selected venue types
        //TODO add button to set an or here instead of an and
        console.log(req.body.venue_type);
        for(index in req.body.venue_type){
            venueTypeSelection += "type_id=" + req.body.venue_type[index] + " AND ";
        }

        //Go over the selected featuers
        for(index in req.body.feature){
            featureSelection += "feature_id=" + req.body.feature[index] + " AND ";
        }

        //We have a selector for the type: add it to the query
        if(venueTypeSelection){
            var cleanSelectionSQL = venueTypeSelection.substring(0, venueTypeSelection.length - 5);
            sqlQuery += "venue_id IN (SELECT venue_id FROM venue_types WHERE " + cleanSelectionSQL + ") AND ";
        }

        if(featureSelection){
            var cleanSelectionSQL = featureSelection.substring(0, featureSelection.length - 5);
            sqlQuery += "venue_id IN (SELECT venue_id FROM venue_features WHERE " + cleanSelectionSQL + ") AND ";
        }

        //Now make the clean query (it currently always ends with ... AND
        var cleanQuery = sqlQuery.substring(0, sqlQuery.length - 5);

        //Execute the query
        restobar.client.query(cleanQuery) //We use this approach to make sure the query is always executed again
        .on('error', function(error){
            res.json(["ERROR", "An error occurred while accessing the database."]);
        })
        .on('end', function(result){

            res.json(["SUCCESS", result.rows]);

        });

    });

    function returnAllVenues(res){
        restobar.client.query({
            name: "select_all_venues_alphabetically",
            text: "SELECT * FROM venues ORDER BY name ASC"
        })
        .on('error', function(){
            res.json(["ERROR", "An error occurred while accessing the database."]);
        })
        .on('end', function(result){

            res.json(["SUCCESS", result.rows]);

        });
    }
};