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
        var firstName       = req.body.firstName;
        var lastName        = req.body.lastName;
        var email           = req.body.email;
        var birthday        = req.body.birthday;
        var gender          = req.body.gender;

        var str; //Een string waarmee we gaan controleren of de input van het juiste type is (met Regex).

        var errors = [];

        if(!username){
            errors.push("Please enter a username.");
        }
        else if (username.length < 6){
            errors.push("Username must be at least 6 characters long.")
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
            str = email;
            var pattern = new RegExp("@");
            if(!pattern.test(str)){
                errors.push("Please enter a valid email address.");
            }
        }

        if(!birthday){
            errors.push("Please enter your birthday.");
        }
        else{
            //Calculate the date/time object for the birthday.
            var birthdayArray = birthday.split("/");
            var birthdayDate  = new Date();
            birthdayDate.setDate(birthdayArray[0]);
            birthdayDate.setMonth(birthdayArray[1]);
            birthdayDate.setYear(birthdayArray[2]);
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
            text: "UPDATE users SET username=$2, first_name=$3, last_name=$4, email=$5, birthday=$6, gender=$7 WHERE user_id=$1",
            values: [req.cookies.user, username, firstName, lastName, email, birthdayDate.getMilliseconds(), gender]
        })
        .on('error', function(error) {
            console.log(error);
            res.render('profile', {title: 'My profile', errors: ['An error occurred.'], fields: req.body});
        })
        .on('end', function(result){
            res.render('profile', {title: 'Profile updated', fields: result.rows[0]});
        })

    });
};