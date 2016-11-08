var express = require('express');
var fs = require('fs');
var path = require('path');

/**
 *  Define the sample application.
 */
var RestobarApp = function() {
    var self = this;
    self.setupVariables = function () {
        self.ipaddress = process.env.OPENSHIFT_NODEJS_IP;
        self.port = process.env.OPENSHIFT_NODEJS_PORT || 8080;

        if (typeof self.ipaddress === "undefined") {
            console.warn('No OPENSHIFT_NODEJS_IP var, using 127.0.0.1');
            self.ipaddress = "127.0.0.1";
        }
    };

    self.terminator = function (sig) {
        if (typeof sig === "string") {
            console.log('%s: Received %s - terminating sample app ...',
                Date(Date.now()), sig);
            process.exit(1);
        }
        console.log('%s: Node server stopped.', Date(Date.now()));
    };

    self.setupTerminationHandlers = function () {
        process.on('exit', function () {
            self.terminator();
        });

        ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
            'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
        ].forEach(function (element, index, array) {
            process.on(element, function () {
                self.terminator(element);
            });
        });
    };

    self.createRoutes = function () {
        self.routes = {};

        self.routes['/'] = function (req, res, next) {
            //res.setHeader('Content-Type', 'text/html');
            res.render('index', {title: 'Home', home_active: 'active'});
        };
    };

    function secureRedirect(req, res, next) {
        if (req.headers['x-forwarded-proto'] == 'http') {
            res.redirect('https://' + req.headers.host + req.path);
        } else {
            return next();
        }
    }

    self.initializeServer = function () {
        self.createRoutes();
        self.app = express();

        for (var r in self.routes) {
            self.app.get(r, secureRedirect, self.routes[r]);
        }
    };

    self.initializeViewEngine = function () {
        self.app.set('view engine', 'pug');
        self.app.set('views', '../views');
    };

    self.initialize = function () {
        self.setupVariables();
        self.setupTerminationHandlers();
        self.initializeServer();
        self.initializeViewEngine();
    };

    self.start = function () {
        self.app.listen(self.port, self.ipaddress, function () {
            console.log('%s: Node server started on %s:%d ...',
                Date(Date.now()), self.ipaddress, self.port);
        });
    };
};

var restobar = new RestobarApp();
restobar.initialize();
restobar.start();