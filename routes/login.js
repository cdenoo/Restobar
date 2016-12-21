/**
 * Created by thijsspinoy on 22/11/2016.
 */
module.exports = function (restobar) {

    function renderLoginForm(req, res, errorMessages){

        // Test if the user is actually logged in: redirect to the homepage.
        if(req.cookies.user > 0){
            // If the user is already logged in, he has nothing to do on the login page. We redirect to the homepage.
            res.redirect('/');
            return;
        }

        res.render('login', {title: 'Login', errors: errorMessages});
    }

    restobar._app.get('/login', function (req, res, next) {
        renderLoginForm(req, res);
    });

    restobar._app.post('/login', function (req, res, next) {

        // Some variables to check the input.
        var username = req.body.username;
        var password = req.body.password;

        // A variable to store all errors to be shown.
        var errors = [];

        // Some checks whether every field is filled in correctly.
        // If not, an error is added to the variable 'errors'.
        if(!username){
            errors.push("Please enter a username.");
        }

        if(!password) {
            errors.push("Please enter a password.");
        }

        // If there is one or more errors, the login page is loaded with the errors on top of it.
        if(errors.length){
            renderLoginForm(req, res, errors);
            return;
        }

        // A query to retrieve the information of the user from the database.
        restobar.client.query({
            name: "select_user",
            text: "SELECT * FROM users WHERE username=$1::text AND password=$2::text",
            values: [username, password]
        }, function(err, result){

            if(!result.rowCount){
                //No results found
                errors.push("We found no user with this username and password.");
                renderLoginForm(req, res, errors);
                return
            }

            var user = result.rows[0];

            res.cookie('user', user.user_id, {maxAge: 1000 * 60 * 60 * 12}); // A login is max 12 hours valid.

            // Everything went ok: we redirect to the homepage.
            res.redirect('/');

        });


    });
};