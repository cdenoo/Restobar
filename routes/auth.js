module.exports = function (restobar) {

    restobar._app.get('/auth/facebook', restobar.passport.authenticate('facebook'));

    restobar._app.get('/auth/facebook/callback', restobar.passport.authenticate('facebook'), function(req, res, next){
        console.log('auth');
        res.redirect('/');
    });

};