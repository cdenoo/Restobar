/**
 * Created by thijsspinoy on 22/11/2016.
 */
module.exports = function (restobar) {

    function renderRegisterForm(req, res, errorMessages) {

        //Test if the user is actually logged in: redirect to the homepage
        //if(restobar.userID > 0){
        //    res.redirect('/');
        //    return;
        //}
        res.render('register', {title: 'Register', errors: errorMessages});
    }

    restobar._app.get('/register', function (req, res, next) {
        renderRegisterForm(req, res, '');
    });

    restobar._app.post('/register', function (req, res, next) {
        console.log('Registered with credentials: ' + JSON.stringify(req.body));

        var username        = req.body.username;
        var password        = req.body.password;
        var confirmPassword = req.body.confirmPassword;
        var firstName       = req.body.firstName;
        var lastName        = req.body.lastName;
        var email           = req.body.email;
        var birthday        = req.body.birthday;
        var gender          = req.body.gender;

        var str; //Een string waarmee we gaan controleren of de input van het juiste type is.

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
            //renderRegisterForm(req, res, errors);
            res.render('register', {title: 'Register', errors: errorMessages, fields: req.body});
            return;
        }

        restobar.client.query({
            name: "add_user",
            text: "INSERT INTO users(username, password, first_name, last_name, email, birthday, gender) " +
                  "values($1, $2, $3, $4, $5, $6, $7)",
            values: [username, password, firstName, lastName, email, birthdayDate.getMilliseconds(), gender]
        }, function(err, result) {
            console.log(err);
            console.log(result);
            /*
             if(!result.rowCount){
             //No results found
             errors.push("We found no user with this username and password.");
             renderRegisterForm(req, res, errors);
             return
             }

             var user = result.rows[0];

             res.cookie('user', user.user_id, {maxAge: 1000 * 60 * 60 * 12}); //A login is 12 hours valid
             */
            res.render('register_success', {title: 'Registered'});
        });
    });
};