var express = require('express');
var fs = require('fs');
var bodyparser = require('body-parser');
var favicon = require('serve-favicon');
var pg = require('pg');
var cookieParser = require('cookie-parser');
var googleMaps = require('@google/maps');
var forecast = require('forecast');
var passport = require('passport'), FacebookStrategy = require('passport-facebook').Strategy;

var RestobarApp = function () {

    this.user_other = 0;
    this.user_male = 1;
    this.user_female = 2;

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

        var search = require('./routes/search');
        search(this);

        //Pages for registered users
        var createVenue = require('./routes/create_venue.js');
        createVenue(this);

        var venue = require('./routes/venue.js');
        venue(this);

        var editVenue = require('./routes/edit_venue.js');
        editVenue(this);

        var profile = require('./routes/profile');
        profile(this);

        //Pages for visitors
        var login = require('./routes/login');
        login(this);

        this.auth = require('./routes/auth.js');
        this.auth(this);

        //Pages for test
        var map = require('./routes/map');
        map(this);
    };

    this.initErrorHandling = function () {
        this._app.use(function (err, req, res, next) {

            //console.log(err);

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
                    res.render('errorpage', {title: 'Unhandled error', error: err});
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

    };

    this.initFacebookLogin = function(){
        //passport.initialize();
        passport.use(new FacebookStrategy({
                clientID: "622890094588906",
                clientSecret: "2b1497398b4ca050f8827165c51049c8",
                callbackURL: "https://wtrestobar.herokuapp.com/auth/facebook/callback"
            },
            function(accessToken, refreshToken, profile, done) {
                console.log(accessToken);
                console.log(profile);

                facebookCallback = require('./facebook_callback.js');
                facebookCallback(app, accessToken, profile);
                //this.auth.facebookCallback(this, accessToken, profile);
                return done(null, 5);
            }
        ));
        this.passport = passport;
    };

    this.initServer = function () {
        this.initVariables();
        this.initPublicDir();
        this.initViews();
        this.initDB();
        this.initFacebookLogin();
        this.initRoutes();
        this.initErrorHandling();
        this.initGoogleMaps();
        this._app.listen(this._port);

        /*
        var testprofile = { id: '1550444234972996',
            username: undefined,
            displayName: 'Thijs Spinoy',
            name:
            { familyName: undefined,
                givenName: undefined,
                middleName: undefined },
            gender: undefined,
            profileUrl: undefined,
            provider: 'facebook',
            _raw: '{"name":"Thijs Spinoy","id":"1550444234972996"}',
            _json: { name: 'Thijs Spinoy', id: '1550444234972996' } };

        this.auth.facebookCallback(this, "AAA", testprofile);
        */

        this.devWarn('Server started on http://127.0.0.1:8080/');
    };
};

var app = new RestobarApp();
app.initServer();