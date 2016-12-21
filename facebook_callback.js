module.exports = function (restobar, accessToken, profile){
    restobar.client.query({
        name: 'facebook_callback',
        text: 'SELECT * FROM users WHERE fb_user_id=$1',
        values: [profile.id]
    })
        .on('error', function(error){
            console.log(error);
        })
        .on('end', function(result){
            if(!result.rowCount){ //There is no user with this fb_user_id so we register a new user.
                facebook_register();
            }
            else{ //This is an existing user, so we can log in.
                facebook_login();
            }
        });

    function facebook_register(){
        console.log('facebook_register');
        restobar.client.query({
            name: 'facebook_register',
            text: 'INSERT INTO users(username, password, first_name, last_name, email, birthday, gender, fb_user_id, fb_access_token) values($1, $2, $3, $4, $5, $6, $7, $8, $9)',
            //All fields are actually mandatory, so to those we have no information from facebook, we assign an empty string.
            values: [profile.displayName, '', '', '', '', 0, restobar.user_other, profile.id, accessToken]
        })
            .on('error', function(error){
                console.log('error');
                console.log(error);
            })
    }


    function facebook_login(){
        restobar.client.query({
            name: 'facebook_login',
            text: 'UPDATE users SET fb_access_token=$1 WHERE fb_user_id=$2',
            //For each time a user logs in, he has a new accessToken, so we update this in the database.
            values: [accessToken, profile.id]
        })
            .on('error', function(error){
                console.log('error');
                console.log(error);
            })
    }
};