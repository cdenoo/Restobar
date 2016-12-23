module.exports = function (restobar) {

    // This function is just to log out the user by clearing his cookies for our website
    restobar._app.get('/logout', function (req, res, next) {
        // Loop over all values in the request's cookies
        for(var ck in req.cookies){
            // Clear the cookie
            res.clearCookie(ck);
        }
        // Redirect the browser to the homepage
        res.redirect('/');
    });
};