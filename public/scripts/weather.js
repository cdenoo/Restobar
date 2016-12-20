var temp;
var description;

function getWeather(lat, lon) {
    $.ajax({ //Shorthand for a jquery ajax post request
        url: "http://api.openweathermap.org/data/2.5/weather?lat=" + lat + "&lon=" + lon + "&APPID=5cba87d4a2d2b2156035e74cc3ef8a97",
        dataType: 'json',
        crossDomain: true,
        success: function (response) {
            temp = response.main.temp;
            description = response.weather[0].description;
            //Convertion from Kelvin to Celsius.
            temp -= 273.15;
            console.log(temp);
            console.log(description);
        },
        error: function(jqXHR, textstatus, errorThrown){
            console.log(errorThrown);
        }
    });
}

function getLocation(){

    function locationCallback(location){
        console.log(location);
        if(location){
            getWeather(location.coords.latitude, location.coords.longitude);
        }
    }

    if(navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(locationCallback);
    }
}