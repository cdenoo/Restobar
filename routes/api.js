module.exports = function (restobar) {
    var express = require('express');
    var router = express.Router();
    restobar._app.use('/api',router);

    router.get('/', function (req, res, next) {
        // Check if user is logged in
        // TODO
        var loggedIn = true;
        if(!loggedIn){
            next(400);
            return;
        }
        res.render('api', {title: 'API Reference'});
    });

    function jsonFail(res){
        res.json({success: false});
    }

    function standardQuery(query, res, next) {
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

    router.get('/users', function (req, res, next) {
        standardQuery(
            {
                name: 'select_all',
                text: 'SELECT * FROM users'
            },
            res,
            next);
    });

    router.get('/users/:id', function (req, res, next) {
        var user_id = req.params.id;
        standardQuery(
            {
                name: 'select_user',
                text: 'SELECT * FROM users WHERE user_id=$1',
                values: [user_id]
            },
            res,
            next);
    });

    router.get('/users/:id/first_name', function (req, res, next) {
        var user_id = req.params.id;
        standardQuery(
            {
                name: 'select_user_firstname',
                text: 'SELECT (first_name) FROM users WHERE user_id=$1',
                values: [user_id]
            },
            res,
            next);
    });

    router.get('/users/:id/last_name', function (req, res, next) {
        var user_id = req.params.id;
        standardQuery(
            {
                name: 'select_user_lastname',
                text: 'SELECT (last_name) FROM users WHERE user_id=$1',
                values: [user_id]
            },
            res,
            next);
    });

    router.get('/venues', function (req, res, next) {
        standardQuery(
            {
                text: 'SELECT * FROM venues'
            },
            res,
            next);
    });
};