var express = require('express');
var fs = require('fs');
var bodyparser = require('body-parser');
var favicon = require('serve-favicon');
var pg = require('pg');
var cookieParser = require('cookie-parser');
var googleMaps = require('@google/maps');

var RestobarApp = function () {

    this.initVariables = function () {
        this._port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080;
        this._app = express();
        this._app.use(bodyparser.urlencoded({
            extended: true
        }));
        this._app.use(bodyparser.json());
        this._app.use(cookieParser());
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

        //Pages for registered users
        var createVenue = require('./routes/create_venue.js');
        createVenue(this);

        //Pages for visitors
        var login = require('./routes/login');
        login(this);

    };

    this.initErrorHandling = function () {
        this._app.use(function (err, req, res, next) {

            console.log(err);

            switch(err){
                case 400:
                    res.status(400);
                    res.render('errorpage', {title: '400: Bad request'});
                    break;
                case 404:
                    res.status(404);
                    res.render('errorpage', {title: '404: Page not found'});
                    break;
                case 500:
                    res.status(500);
                    res.render('errorpage', {title: 'Something bad happened!'});
                    break;
                default:
                    res.render('errorpage', {title: 'Unhandled error'});
                    break;
            }
        });
    };

    this.devWarn = function (value) {
        if(process.env.NODE_ENV === 'development' || true){
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

    this.initGoogleMaps = function(){

        this.googleMapsClient = googleMaps.createClient({
            key: "AIzaSyAXfKp21e6rPXmjGDzCWRmptzvk5k041O4"
        });

    }

    this.initServer = function () {
        this.initVariables();
        this.initPublicDir();
        this.initViews();
        this.initRoutes();
        this.initErrorHandling();
        this.initDB();
        this.initGoogleMaps();
        this._app.listen(this._port);

        this.devWarn('Server started on http://127.0.0.1:8080/');
    };
};

var app = new RestobarApp();
app.initServer();