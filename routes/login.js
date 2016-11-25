/**
 * Created by thijsspinoy on 22/11/2016.
 */
module.exports = function (restobar) {
    restobar._app.get('/login', function (req, res, next) {
        res.render('login', {title: 'Login'});
    });
    restobar._app.post('/register', function (req, res, next) {
        res.redirect('register', {title: 'Register'});
    });
};