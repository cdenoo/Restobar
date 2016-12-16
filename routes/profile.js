module.exports = function (restobar) {
    function renderShowProfile(req, res){
        restobar.client.query({
            name: "select_user_for_profilepage",
            text: "SELECT * FROM users WHERE user_id=$1",
            values: [req.cookies.user]
        })
        .on('error', function(error){
            res.render('profile', {title: 'My profile', userID: req.cookies.user, errors: ['An error occurred.'], fields: req.body});
        })
        .on('end', function(result){
            res.render('profile', {title: 'My profile', userID: req.cookies.user, fields: result.rows[0]});
        });
    }

    restobar._app.get('/profile', function (req, res, next) {
        renderShowProfile(req, res);
    });
};