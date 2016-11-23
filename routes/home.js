/**
 * Created by thijsspinoy on 22/11/2016.
 */
module.exports = function (app) {
    app.get('/home', function (req, res, next) {
        res.render('home', {title: 'Home'});
    });
    app.post('/register', function (req, res, next) {
        res.redirect('register', {title: 'Register'});
    });
};