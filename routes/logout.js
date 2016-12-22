module.exports = function (restobar) {

    // This function is just to log out the user by clearing his cookies for our website
    restobar._app.get('/logout', function (req, res, next) {
        for(var ck in req.cookies){
            res.clearCookie(ck);
        }
        res.redirect('/');
    });
};