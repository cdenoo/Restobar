module.exports = function (restobar) {
    restobar._app.get('/logout', function (req, res, next) {
        for(var ck in req.cookies){
            res.clearCookie(ck);
        }
        res.redirect('/');
    });
};