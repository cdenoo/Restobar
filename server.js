var express = require('express');
var fs = require('fs');
var bodyparser = require('body-parser');
var favicon = require('serve-favicon');
var pg = require('pg');
var cookieParser = require('cookie-parser');
var googleMaps = require('@google/maps');
var forecast = require('forecast');
var passport = require('passport'), FacebookStrategy = require('passport-facebook').Strategy;
var multer = require('multer');

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

        var venueImage = require('./routes/venue_image.js');
        venueImage(this);

        var edit_profile = require('./routes/edit_profile');
        edit_profile(this);

        //Pages for visitors
        var login = require('./routes/login');
        login(this);

        var auth = require('./routes/auth.js');
        auth(this);

        //Pages for test
        var map = require('./routes/map');
        map(this);

        var api = require('./routes/api');
        api(this);

        var fav = require('./routes/favorites');
        fav(this);

        var logout = require('./routes/logout');
        logout(this);
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
        if(process.env.NODE_ENV === 'development'){
            console.warn(value);
        }
    };

    this.initDB = function(){
        var client = new pg.Client("postgres://qqfcgtgxjvjzds:t-LPRK0FYf03F6P75xNjRGYpCz@ec2-54-247-119-245.eu-west-1.compute.amazonaws.com:5432/d6gkp8aja1iue6?ssl=true");

        // connect to our database
        client.connect(function (err) {
            if (err) throw err;
            app.devWarn("Connected to db");
        });

        this.client = client;

        this.client.query({text: 'CREATE TABLE IF NOT EXISTS favorites (user_id integer NOT NULL, venue_id integer NOT NULL, fav boolean NOT NULL)'});
    };

    this.initGoogleMaps = function(){

        this.googleMapsClient = googleMaps.createClient({
            key: "AIzaSyAXfKp21e6rPXmjGDzCWRmptzvk5k041O4"
        });

    };

    this.initFacebookLogin = function(){
        passport.use(new FacebookStrategy({
                clientID: "622890094588906",
                clientSecret: "2b1497398b4ca050f8827165c51049c8",
                callbackURL: "https://wtrestobar.herokuapp.com/login"
            },
            function(accessToken, refreshToken, profile, done) {
                User.findOne({ username: username }, function(err, user) {
                    if(err){
                        return done(err);
                    }
                    if(!user){
                        return done(null, false);
                    }
                    if(!user.validPassword(password)){
                        return done(null, false);
                    }
                    return done(null, user);
                });
            }
        ));
        this.passport = passport;
    };

    this.initUpload = function(){

        var storage = multer.diskStorage({
            destination: 'public/uploads',
            filename: function (req, file, cb){
                cb(null, req.cookies.user + Date.now() + file.originalname);
            }
        })

        this.upload = multer({storage: storage});
    }

    this.initServer = function () {
        this.initVariables();
        this.initPublicDir();
        this.initFacebookLogin();
        this.initUpload();
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