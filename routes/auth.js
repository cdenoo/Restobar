module.exports = function (restobar) {



    restobar._app.get('/auth/facebook', restobar.passport.authenticate('facebook'));

    restobar._app.get('/auth/facebook/callback', restobar.passport.authenticate('facebook', { successRedirect: '/', failureRedirect: '/login' }));

}