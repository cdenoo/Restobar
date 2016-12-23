module.exports = function (restobar) {
    var express = require('express');
    var router = express.Router();
    var auth = require('basic-auth');
    restobar._app.use('/api',router);

    // Returns a JSON object {success:false} to 'res'
    function jsonFail(res){
        res.json({success: false});
    }

    // To prevent code redundancy, this function queries the database and returns a JSON object to 'res'
    function objectResultQuery(query, res, next) {
        // Is the database client initialised?
        // If not, return an error 400 by using next
        if(!restobar.client){
            next(400); //TODO Database error
            return;
        }
        restobar.client.query(query)
            .on('error', function () {
                // If there is a database error, return result = false to res
                jsonFail(res);
            })
            .on('end', function (result) {
                // Check wether there is a result
                // If not, return result = false to res
                if(result.rows.length == 0){
                    jsonFail(res);
                    return;
                }
                // Return the result of the query to res
                res.json({success: true, result: result.rows});
            });
    }

    // To prevent code redundancy, this function queries the database and returns a single line of JSON to 'res'
    function singleResultQuery(query, res, next){
        // Is the database client initialised?
        // If not, return an error 400 by using next
        if(!restobar.client){
            next(400);
            return;
        }
        restobar.client.query(query)
            .on('error', function () {
                // If there is a database error, return result = false to res
                jsonFail(res);
            })
            .on('end', function (result) {
                // Check wether there is a result
                // If not, return result = false to res
                if(result.rows.length == 0){
                    jsonFail(res);
                    return;
            }
                // Return the result of the query to res
            res.json({success: true, result: result.rows[0]});
        });
    }

    // Checks if there is a user authenticated or not
    // This should be limited to a few tries, otherwise it is a possible exploit to find out passwords
    function authCheck(req, res, func) {
        var user = auth(req);

        // If the request doesn't contain credentials, deny api call
        if(!user){
            jsonFail(res);
            return;
        }

        // Query the database to compare user credentials
        restobar.client.query({
            text: 'SELECT password FROM users WHERE username=$1::varchar',
            values: [user.name]
        })
            .on('error', function () {
                // If there is a authentication error, return result = false
                jsonFail(res);
            })
            .on('end', function (result) {
                // If the result is empty or the passwords don't match, let the api call fail
                if((result.rows.length == 0) || (user.pass != result.rows[0].password)){
                    jsonFail(res);
                    return;
                }
                // If the user and password are allowed access, execute the function
                func();
            });
    }

    /************/
    /* API Docs */
    /************/

    router.get('/', function (req, res, next) {
        authCheck(req, res, function () {
            res.render('api', {title: 'API Reference'});
        })
    });

    /**************/
    /* Venues API */
    /**************/

    // GET all venues
    router.get('/venues', function (req, res, next) {
        // Check whether the user is authenticated
        // To check and regulate how many api-calls are handled from a source (not implemented)
        authCheck(req, res, function () {
            // Search the database for venue data and return it
            // Join the venues and users tables on the venues' owners' identifiers to return the owners' names instead of id
            objectResultQuery(
                {
                    text: 'SELECT venues.venue_id, venues.name, venues.street, venues.house_number, venues.postal_code, venues.country, venues.phone_number, venues.opening_hours, users.first_name AS owner_first_name, users.last_name AS owner_last_name FROM venues INNER JOIN users ON venues.owner_id=users.user_id'
                },
                res,
                next);
        });
    });

    // GET venue by id
    router.get('/venues/:id', function (req, res, next) {
        authCheck(req, res, function () {
            // The venue's identifier is retrieved from the request header
            var venue_id = req.params.id;
            // Search the database for a specific venue's data and return it
            // Join the venues and users tables on the venue's owner's identifiers to return the owner's names instead of id
            // Only return the query result which has the venue id specified in the request
            objectResultQuery(
                {
                    text: 'SELECT venues.venue_id, venues.name, venues.street, venues.house_number, venues.postal_code, venues.country, venues.phone_number, venues.opening_hours, users.first_name AS owner_first_name, users.last_name AS owner_last_name FROM venues INNER JOIN users ON venues.owner_id=users.user_id WHERE venue_id=$1::int',
                    values: [venue_id]
                },
                res,
                next
            );
        });
    });

    /*************/
    /* Favorites */
    /*************/

    // GET the favorites of the authenticated user
    router.get('/favorites', function (req, res, next) {
        var user = auth(req);

        authCheck(req, res, function () {
            // Query the database for the favorites of the currently authenticated user
            objectResultQuery({
                text: 'SELECT user_favorites.venue_id FROM user_favorites INNER JOIN users ON user_favorites.user_id=users.user_id WHERE users.username=$1::varchar',
                values: [user.name]
            }, res, next);
        });
    });

    // DELETE from the favorites of the authenticated user
    router.delete('/favorites/:venueid', function (req, res, next) {
        var user = auth(req);
        var venue_id = req.params.venueid;

        authCheck(req, res, function () {
            // If there is not venue identifier specified, there is no use to this function
            // So return false if this happens
            if(!venue_id){
                jsonFail(res);
                return;
            }

            // Find the pair (user_id, venue_id) in the table user_favorites and delete it
            restobar.client.query(
                {
                    text: 'DELETE FROM user_favorites WHERE venue_id=$1::int AND user_id IN (SELECT user_id FROM users WHERE username=$2::varchar)',
                    values: [venue_id, user.name]
                });
            res.json({success: true});
        });
    });
};