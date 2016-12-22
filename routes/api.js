module.exports = function (restobar) {
    var express = require('express');
    var router = express.Router();
    restobar._app.use('/api',router);

    // Returns a JSON object {success:false} to 'res'
    function jsonFail(res){
        res.json({success: false});
    }

    // To prevent code redundancy, this function queries the database and returns a JSON object to 'res'
    function objectResultQuery(query, res, next) {
        if(!restobar.client){
            next(400); //TODO Database error
            return;
        }
        restobar.client.query(query)
            .on('error', function () {
                jsonFail(res);
            })
            .on('end', function (result) {
                if(result.rows.length == 0){
                    jsonFail(res);
                    return;
                }
                res.json({success: true, result: result.rows});
            });
    }

    // To prevent code redundancy, this function queries the database and returns a single line of JSON to 'res'
    function singleResultQuery(query, res, next){
        if(!restobar.client){
            next(400);
            return;
        }
        restobar.client.query(query)
            .on('error', function () {
                jsonFail(res);
            })
            .on('end', function (result) {
                if(result.rows.length == 0){
                    jsonFail(res);
                    return;
            }
            res.json({success: true, result: result.rows[0]});
        });
    }

    // Checks if there is a user authenticated or not
    function loginCheck(req, res, func) {
        var auth = true; //TODO add real authentication
        if(auth){
            func();
        }else{
            jsonFail(res);
        }
    }

    /************/
    /* API Docs */
    /************/

    router.get('/', function (req, res, next) {
        loginCheck(req, res, function () {
            res.render('api', {title: 'API Reference'});
        })
    });

    /**************/
    /* Venues API */
    /**************/

    // GET all venues
    router.get('/venues', function (req, res, next) {
        loginCheck(req, res, function () {
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
        loginCheck(req, res, function () {
            var venue_id = req.params.id;
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
};