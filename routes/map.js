module.exports = function (restobar) {
    restobar._app.get('/map', function (req, res, next) {
        res.render('map', {title: 'Map'});
    });
};