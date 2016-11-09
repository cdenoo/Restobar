var express = require('express');
var fs = require('fs');
var path = require('path');

var app = express();

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080;
var ip = process.env.IP || process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';
var routes = { };

createRoutes = function(){
	routes['/'] = function(req, res, next) {
		res.send('INDEX TODO');
	};
};

initRoutes = function(){
	createRoutes();
		
	for (var r in this.routes) {
		app.get(r, this.routes[r]);
	};
};

initErrorHandling = function(){
	app.use(function(err, req, res, next){
		console.error(err.stack);
		res.status(500).send('Something bad happened!');
	});
};

initServer = function(){
	// Initialize the routes
	initRoutes();
	// Initialize handling of errors
	initErrorHandling();
	// Make the server listen
	app.listen(port, ip);
};

initServer();
module.exports = app;