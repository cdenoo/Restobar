module.exports = function (restobar) {
    restobar._app.get('/', function (req, res, next) {
        res.render('index', {title: 'Index'});
    });
};