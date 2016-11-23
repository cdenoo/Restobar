var express = require('express');
var fs = require('fs');
var path = require('path');

var RestobarApp = function () {
    this.initVariables = function () {
        this.port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080;
        this.app = express();
    };

    this.initPublicDir = function () {
        this.app.use(express.static('public'));
    };

    this.initViews = function () {
        this.app.set('views', 'views');
        this.app.set('view engine', 'pug');
    };

    this.initRoutes = function () {
        var index = require('./routes/index');
        index(this.app);

        var register = require('./routes/register');
        register(this.app);

        var home = require('./routes/home');
        home(this.app);
    };

    this.initErrorHandling = function () {
        this.app.use(function(err, req, res, next){
            console.error(err.stack);
            res.status(500).send('Something bad happened!');
        });
    };

    this.initServer = function () {
        this.initVariables();
        this.initPublicDir();
        this.initViews();
        this.initRoutes();
        this.initErrorHandling();
        this.app.listen(this.port);
    };
};

var app = new RestobarApp();
app.initServer();