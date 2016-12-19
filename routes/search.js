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

        console.log("going strong");

        //We expect an ajax call to retreive search results -> return a json object!
        //res.json(['ERROR', 'TBA']);

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