/**
 * Created by thijsspinoy on 22/11/2016.
 */
module.exports = function (restobar) {

    function renderLoginForm(req, res, errorMessages){

        //Test if the user is actually logged in: redirect to the homepage
        if(restobar.userID > 0){
            res.redirect('/');
            return;
        }

        res.render('login', {title: 'Login', errors: errorMessages});
    }

    restobar._app.get('/login', function (req, res, next) {
        renderLoginForm(req, res);
    });
    restobar._app.post('/login', function (req, res, next) {
        console.log('Logged in with credentials: ' + JSON.stringify(req.body));

        var username = req.body.username;
        var password = req.body.password;
        var errors = [];

        if(!username){
            errors.push("Please enter a username.");
        }

        if(!password) {
            errors.push("Please enter a password.");
        }

        if(errors.length){
            renderLoginForm(req, res, errors);
            return;
        }

        restobar.client.query({
            name: "select_user",
            text: "SELECT * FROM users WHERE username=$1::text AND password=$2::text",
            values: [username, password]
        }, function(err, result){

            if(!result.rowCount){
                //No results found
                console.log("no rowse");
                errors.push("We found no user with this username and password.");
                renderLoginForm(req, res, errors);
                return
            }

            var user = result.rows[0];

            res.cookie('user', user.user_id, {maxAge: 1000 * 60 * 15});

            res.render('login', {title: 'Logged in'});

        });


    });
};