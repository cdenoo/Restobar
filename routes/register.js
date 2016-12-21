/**
 * Created by thijsspinoy on 22/11/2016.
 */
module.exports = function (restobar) {

    function renderRegisterForm(req, res, errorMessages) {

        // Test if the user is actually logged in.
        if(restobar.userID > 0){
            // If so, we redirect to the homepage, it is not necessarry to register because this user already has an account.
            res.redirect('/');
            return;
        }

        // Otherwise we go to the registerpage.
        res.render('register', {title: 'Register', errors: errorMessages, fields: req.body});
    }

    restobar._app.get('/register', function (req, res, next) {
        renderRegisterForm(req, res);
    });

    restobar._app.post('/register', function (req, res, next) {

        // Some variables to check the input.
        var username        = req.body.username;
        var password        = req.body.password;
        var confirmPassword = req.body.confirmPassword;
        var firstName       = req.body.firstName;
        var lastName        = req.body.lastName;
        var email           = req.body.email;
        var birthday        = req.body.birthday;
        var gender          = req.body.gender;

        var str; // A string for Regex checks.

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
            str = email;
            var pattern = new RegExp("@");
            if(!pattern.test(str)){
                errors.push("Please enter a valid email address.");
            }
        }

        if(!birthday){
            errors.push("Please enter your birthday.");
        }

        var birthdayDate = new Date();

        // We have 2 possibilities for birthdays: some browsers (like Safari) do not support type="date".
        // Case 1: supporting browsers. Format: YYYY-MM-DD.
        if(birthday){
            // Calculate the date/time object for the birthday.
            var birthdayArray = birthday.split("-");
            birthdayDate.setYear(birthdayArray[0]);
            birthdayDate.setMonth(birthdayArray[1]);
            birthdayDate.setDate(birthdayArray[2]);
        }


        // Case 2: non-supporting browsers. Format: DD/MM_YYYY.
        if(isNaN(birthdayDate.getTime())){
            // Calculate the date/time object for the birthday.
            var birthdayArray = birthday.split("/");
            var birthdayDate  = new Date();
            birthdayDate.setDate(birthdayArray[0]);
            birthdayDate.setMonth(birthdayArray[1]);
            birthdayDate.setYear(birthdayArray[2]);
        }

        if(isNaN(birthdayDate.getTime())){
            // Still an invalid date: error.
            errors.push("Please enter a valid date as birthday.");
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

        // If there is one or more errors, the register page is loaded with the errors on top of it.
        if(errors.length){
            renderRegisterForm(req, res, errors);
            return;
        }

        // A query to insert the information of the user in the database.
        restobar.client.query({
            name: "add_user",
            text: "INSERT INTO users(username, password, first_name, last_name, email, birthday, gender)" +
                  "values($1, $2, $3, $4, $5, $6, $7)",
            values: [username, password, firstName, lastName, email, birthdayDate.getMilliseconds(), gender]
        }, function(err, result) {
            // After the information is inserted, we let the user know everything went well: the register_success-page is loaded.
            res.render('register_success', {title: 'Registered'});
        });
    });
};