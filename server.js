var express = require('express');
var fs = require('fs');
var bodyparser = require('body-parser');

var RestobarApp = function () {
    this.initVariables = function () {
        this._port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080;
        this._app = express();
        this._app.use(bodyparser.urlencoded({
            extended: true
        }));
        this._app.use(bodyparser.json());
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
        index(this._app);

        var register = require('./routes/register');
        register(this._app);

        var home = require('./routes/home');
        home(this._app);
    };

    this.initErrorHandling = function () {
        this._app.use(function (req, res, next) {
            res.status(404).render('pagenotfound', {title: '404'});
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

    this.initServer = function () {
        this.initVariables();
        this.initPublicDir();
        this.initViews();
        this.initRoutes();
        this.initErrorHandling();
        this._app.listen(this._port);

        this.devWarn('Server started on http://127.0.0.1:8080/');
    };
};

var app = new RestobarApp();
app.initServer();