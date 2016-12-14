module.exports = function (restobar) {
    restobar._app.get('/register', function (req, res, next) {
        res.render('register', {title: 'Register'});
    });

    restobar._app.post('/register', function (req, res, next){
        var obj = req.body;
        for(var e in obj){
            if(!obj[e]){
                next(400);
                return;
            }
        }
        restobar.devWarn('Registered with: ' + JSON.stringify(req.body));
        res.render('register_success', {title: 'Registered'})
    });
};