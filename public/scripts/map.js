var map, posMarker;

function initMap(){
    map = new google.maps.Map(document.getElementById("googlemap"), {
        zoom: 13
    });
}

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

function setCurrentPosition(pos){
    posMarker = createMarker(pos.coords.latitude, pos.coords.longitude, 'Current Location');

    setMapCenter(pos.coords.latitude, pos.coords.longitude);
}

function setMapCenter(latitude, longitude){
    map.panTo(new google.maps.LatLng(
        latitude,
        longitude
    ));
}

function setMarkerPosition(marker, position){
    posMarker.setPosition(
        new google.maps.LatLng(
            position.coords.latitude,
            position.coords.longitude
        )
    );
}

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