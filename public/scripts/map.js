var map, posMarker;

/**
 * This function will initialize the Google Map in the element with ID googlemap
 */
function initMap(){
    map = new google.maps.Map(document.getElementById("googlemap"), {
        zoom: 13
    });
}

/**
 * This function will create a new marker and add it to the map
 * @param latitude The latitude of the location of the marker
 * @param longitude The longitude of the location of the marker
 * @param title The title of the marker
 */
function createMarker(latitude, longitude, title){
    new google.maps.Marker({
        map:map,
        position: new google.maps.LatLng(
            latitude,
            longitude
        ),
        title: title
    });
}

/**
 * This function will create a marker at the current (given) location
 * @param pos The current location, given back by the location API
 */
function setCurrentPosition(pos){
    posMarker = createMarker(pos.coords.latitude, pos.coords.longitude, 'Current Location');

    setMapCenter(pos.coords.latitude, pos.coords.longitude);
}

/**
 * This function will change the center of the map to the given coordinates
 * @param latitude
 * @param longitude
 */
function setMapCenter(latitude, longitude){
    map.panTo(new google.maps.LatLng(
        latitude,
        longitude
    ));
}

/**
 * This function will change the position of a marker on the map
 * @param marker The marker that should be moved
 * @param position The new position of the marker
 */
function setMarkerPosition(marker, position){
    posMarker.setPosition(
        new google.maps.LatLng(
            position.coords.latitude,
            position.coords.longitude
        )
    );
}

/**
 * The callback url to show the location of the user on the map (and update it if the location changes)
 */
function watchCurrentPosition() {
    var positionTimer = navigator.geolocation.watchPosition(
        function (position) {
            if(posMarker){
                setMarkerPosition(posMarker, position);
            }
            else{
                createMarker(position.coords.latitude, position.coords.longitude, 'Current Location');
            }
        }
    );
}

function displayandwatch(position){
    setCurrentPosition(position);
    watchCurrentPosition(position);
}

function createMap(showUserLocation) {
    initMap();

    if(navigator.geolocation && showUserLocation){
        navigator.geolocation.getCurrentPosition(displayandwatch);
    }
}