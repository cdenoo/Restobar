module.exports = function (restobar) {
    var express = require('express');
    var router = express.Router();
    restobar._app.use('/api',router);

    function jsonFail(res){
        res.json({success: false});
    }

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

    function loginCheck(req, res, func) {
        var auth = true; //TODO change to authorisation
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

    /*************/
    /* Users API */
    /*************/

    // GET all users
    router.get('/users', function (req, res, next) {
        loginCheck(req, res, function () {
            objectResultQuery(
                {
                    name: 'select_all',
                    text: 'SELECT first_name, last_name FROM users'
                },
                res,
                next);
        });
    });

    // GET user by id
    router.get('/users/:id', function (req, res, next) {
        loginCheck(req, res, function () {
            var user_id = req.params.id;
            singleResultQuery(
                {
                    name: 'select_user',
                    text: 'SELECT * FROM users WHERE user_id=$1',
                    values: [user_id]
                },
                res,
                next);
        });
    });

    /**************/
    /* Venues API */
    /**************/

    // GET all venues
    router.get('/venues', function (req, res, next) {
        loginCheck(req, res, function () {
            objectResultQuery(
                {
                    text: 'SELECT * FROM venues'
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
                    text: 'SELECT * FROM venues WHERE venue_id=$1::int',
                    values: [venue_id]
                },
                res,
                next
            );
        });
    });
};