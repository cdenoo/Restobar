module.exports = function (restobar) {
    function renderShowProfile(req, res){
        // A query to retrieve all information of the user.
        restobar.client.query({
            name: "select_user_for_profilepage",
            text: "SELECT * FROM users WHERE user_id=$1",
            values: [req.cookies.user] // This is the user_id of the user that is logged in.
        })
        .on('error', function(error){
            // When something went wrong we go to the profile page with an error message.
            res.render('edit_profile', {title: 'My profile', userID: req.cookies.user, errors: ['An error occurred.'], fields: req.body});
        })
        .on('end', function(result){
            // Everything went ok: we go to the profile page. The information can be read from 'fields'.
            res.render('edit_profile', {title: 'My profile', userID: req.cookies.user, fields: result.rows[0]});
        });
    }

    restobar._app.get('/edit_profile', function (req, res, next) {

        // Is someone logged in?
        if(!req.cookies.user){
            // If not: go to the login page.
            res.redirect('/login');
            return;
        }

        // Otherwise we can show everything about the user that is logged in.
        renderShowProfile(req, res);
    });

    restobar._app.post('/edit_profile', function (req, res, next) {

        if(!req.cookies.user){
            res.redirect('/login');
            return;
        }

        // Some variables to check the input.
        var username        = req.body.username;
        var password        = req.body.password;
        var confirmPassword = req.body.confirmPassword;
        var firstName       = req.body.firstName;
        var lastName        = req.body.lastName;
        var email           = req.body.email;
        var gender          = req.body.gender;

        // A variable to store all errors to be shown.
        var errors = [];

        // Some checks whether every field is filled in correctly.
        // If not, an error is added to the variable 'errors'.
        if(!username){
            errors.push("Please enter a username.");
        }
        else if (username.length < 6){
            errors.push("Username must be at least 6 characters long.")
        }

        if(!password){
            errors.push("Please enter a password.");
        }

        if(!confirmPassword){
            errors.push("Please confirm your password.");
        }
        else if(password != confirmPassword){
            errors.push("The password must be repeated.");
        }

        if(!firstName){
            errors.push("Please enter your first name.");
        }

        if(!lastName){
            errors.push("Please enter your last name.");
        }

        if(!email){
            errors.push("Please enter your email address.");
        }
        else{
            var pattern = new RegExp("@");
            if(!pattern.test(email)){
                errors.push("Please enter a valid email address.");
            }
        }

        switch(gender){
            case "male":
                gender = restobar.user_male;
                break;
            case "female":
                gender = restobar.user_female;
                break;
            case "other":
                gender = restobar.user_other;
                break;
        }

        // If there is one or more errors, the profile page is loaded with the errors on top of it.
        if(errors.length){
            res.render('edit_profile', {title: 'Profile', errors: errors, fields: req.body});
            return;
        }

        // A query to update the information about the user.
        restobar.client.query({
            name: "update_user",
            text: "UPDATE users SET username=$2, password=$3, first_name=$4, last_name=$5, email=$6, gender=$7 WHERE user_id=$1",
            values: [req.cookies.user, username, password, firstName, lastName, email, gender]
        })
        .on('error', function(error) {
            console.log(error);
            res.render('edit_profile', {title: 'My profile', errors: errors, fields: req.body});
        })
        .on('end', function(){
            // Everything went ok: we show the successfully updated profile.
            renderShowProfile(req, res);
        })

    });
};