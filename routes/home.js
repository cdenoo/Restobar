/**
 * Created by thijsspinoy on 22/11/2016.
 */
module.exports = function (restobar) {
    restobar._app.get('/home', function (req, res, next) {
        res.render('home', {title: 'Home'});
    });
    restobar._app.post('/register', function (req, res, next) {
        res.redirect('register', {title: 'Register'});
    });
};