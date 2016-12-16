module.exports = function (restobar) {
    restobar._app.get('/profile', function (req, res, next) {
        var information = [];
        /*
        restobar.client.query({
            name: "select_user",
            text: "SELECT * FROM users WHERE user_id=3"
        }, function(err, result){
            //console.log(err);
            //console.log(result);

            information = result;
            console.log(["information = ", information]);
            console.log(["result = ", result]);

            res.render('profile', {title: 'My profile'});

        });
        */
        res.render('profile', {title: 'My profile', userID: req.cookies.user});
    });
};