module.exports = function (restobar) {
    restobar._app.get('/register', function (req, res, next) {
        res.render('register', {title: 'Register'});
    });

    restobar._app.post('/register', function (req, res, next) {
        restobar.devWarn(req.body);
        res.render('register', {title: 'Registered'});
    });
};