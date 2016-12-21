var temp;
var description;

function getWeather(lat, lon, $cont) {
    $.ajax({ //Shorthand for a jquery ajax post request.
        url: "http://api.openweathermap.org/data/2.5/weather?lat=" + lat + "&lon=" + lon + "&APPID=5cba87d4a2d2b2156035e74cc3ef8a97",
        dataType: 'json',
        crossDomain: true,
        success: function (response) {
            temp = response.main.temp; // This number can contain a lot of digits after the colon. This is why we do 'temp.toFixed(1)' later.
            description = response.weather[0].description;

            //Convertion from Kelvin to Celsius.
            temp -= 273.15;
            $cont.html("The forecast for your location is: " + temp.toFixed(1) + " degrees Celsius and " + description + ".");

        },
        error: function(jqXHR, textstatus, errorThrown){
            console.log(errorThrown);
        }
    });
}

function getWeatherOnLocation($cont){

    function locationCallback(location){
        if(location){
            getWeather(location.coords.latitude, location.coords.longitude, $cont);
        }
    }

    if(navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(locationCallback);
    }
}