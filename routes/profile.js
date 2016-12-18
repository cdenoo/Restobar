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

    restobar._app.post('/profile', function (req, res, next) {
        var username        = req.body.username;
        var password        = req.body.password;
        var confirmPassword = req.body.confirmPassword;
        var firstName       = req.body.firstName;
        var lastName        = req.body.lastName;
        var email           = req.body.email;
        var gender          = req.body.gender;

        var errors = [];

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

        if(errors.length){
            res.render('profile', {title: 'Profile', errors: errors, fields: req.body});
            return;
        }

        restobar.client.query({
            name: "update_user",
            text: "UPDATE users SET username=$2, password=$3, first_name=$4, last_name=$5, email=$6, gender=$7 WHERE user_id=$1",
            values: [req.cookies.user, username, password, firstName, lastName, email, gender]
        })
        .on('error', function(error) {
            console.log(error);
            res.render('profile', {title: 'My profile', errors: errors, fields: req.body});
        })
        .on('end', function(){
            renderShowProfile(req, res);
        })

    });
};