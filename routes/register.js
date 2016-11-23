module.exports = function (app) {
    app.get('/register', function (req, res, next) {
        res.render('register', {title: 'Register'});
    });

    app.post('/register', function (req, res, next) {
        console.log(req.body);
        res.render('register', {title: 'Registered'});
    });
};