var express = require('express');
var fs = require('fs');
var bodyparser = require('body-parser');
var favicon = require('serve-favicon');
var pg = require('pg');

var RestobarApp = function () {

    this.initVariables = function () {
        this._port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080;
        this._app = express();
        this._app.use(bodyparser.urlencoded({
            extended: true
        }));
        this._app.use(bodyparser.json());
        this._app.use(favicon('public/images/favicon.ico'));
    };

    this.initPublicDir = function () {
        this._app.use(express.static('public'));
    };

    this.initViews = function () {
        this._app.set('views', 'views');
        this._app.set('view engine', 'pug');
    };

    this.initRoutes = function () {
        var index = require('./routes/index');
        index(this);

        var register = require('./routes/register');
        register(this);

        var login = require('./routes/login');
        login(this);
    };

    this.initErrorHandling = function () {
        this._app.use(function (req, res, next) {
            res.status(404).render('errorpage', {title: '404: Page not found'});
        });

        this._app.use(function (err, req, res, next) {
            res.status(400).render('errorpage', {title: '400: Bad request'});
        });

        this._app.use(function(err, req, res, next){
            console.error(err.stack);
            res.status(500).send('Something bad happened!');
        });
    };

    this.devWarn = function (value) {
        if(process.env.NODE_ENV === 'development'){
            console.warn(value);
        }
    };

    this.initDB = function(){
        var client = new pg.Client("postgres://qqfcgtgxjvjzds:t-LPRK0FYf03F6P75xNjRGYpCz@ec2-54-247-119-245.eu-west-1.compute.amazonaws.com:5432/d6gkp8aja1iue6?ssl=true");

        // connect to our database
        client.connect(function (err) {
            if (err) throw err;
        });

        this.client = client;

    };

    this.initServer = function () {
        this.initVariables();
        this.initPublicDir();
        this.initViews();
        this.initRoutes();
        this.initErrorHandling();
        this.initDB();
        this._app.listen(this._port);

        this.devWarn('Server started on http://127.0.0.1:8080/');
    };
};

var app = new RestobarApp();
app.initServer();
