var express = require('express');
var fs = require('fs');
var path = require('path');
var url = require('url');

var app = express();

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080;
var routes = { };

createRoutes = function(){
    routes['/'] = function(req, res, next) {
        res.render('index');
    };
};

requireHTTPS = function(req, res, next) {
    if(req.headers["x-forwarded-proto"] === "https"){
        return next();
    }
    res.redirect('https://' + req.headers.host + req.url);
};

initRoutes = function(){
    createRoutes();

    for (var r in routes) {
        app.get(r, requireHTTPS, routes[r]);
    }
};

initErrorHandling = function(){
    app.use(function(err, req, res, next){
        console.error(err.stack);
        res.status(500).send('Something bad happened!');
    });
};

initViews = function(){
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'pug');
};

initServer = function(){
    // Initialize view engine and directory
    initViews();
    // Initialize the routes
    initRoutes();
    // Initialize handling of errors
    initErrorHandling();
    // Make the server listen
    app.listen(port);

    console.log("Server running at " + process.env.IP + ":" + process.env.PORT);
};

initServer();
module.exports = app;