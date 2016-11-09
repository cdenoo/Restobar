var express = require('express');
var fs = require('fs');
var path = require('path');

var RestobarApp = function(){
	
	this.initVariables = function(){
		this.port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080;
		this.ip = process.env.IP || process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';
	};
	
	this.createRoutes = function(){
		this.routes = { };
		
		this.routes['/'] = function(req, res, next) {
            res.send('INDEX TODO');
        };
	};
	
	this.initRoutes = function(){
		this.createRoutes();
		
		for (var r in this.routes) {
			this.app.get(r, this.routes[r]);
		};
	};
	
	this.initErrorHandling = function(){
		this.app.use(function(err, req, res, next){
			console.error(err.stack);
			res.status(500).send('Something bad happened!');
		});
	};
	
	this.initServer = function(){
		// Create server
		this.app = express();
		// Initialize the routes
		this.initRoutes();
		// Initialize handling of errors
		this.initErrorHandling();
		// Make the server listen
		this.app.listen(this.port, this.ip);
	};
	
	this.start = function(){
		this.initVariables();
		this.initServer();
	};
	
};

var rba = new RestobarApp();
rba.start();