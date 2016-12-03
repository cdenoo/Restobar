var map, posMarker;

function initMap(){
    map = new google.maps.Map(document.getElementById('googlemap'), {
        zoom: 17,
        mapTypeId: google.maps.MapTypeId.HYBRID
    });
}

function setCurrentPosition(pos){
    posMarker = new google.maps.Marker({
        map:map,
        position: new google.maps.LatLng(
            pos.coords.latitude,
            pos.coords.longitude
        ),
        title: 'Current Location'
    });
    map.panTo(new google.maps.LatLng(
        pos.coords.latitude,
        pos.coords.longitude
    ));
}

function setMarkerPosition(marker, position){
    marker.setPosition(
        new google.maps.LatLng(
            position.coords.latitude,
            position.coords.longitude
        )
    );
}

function watchCurrentPosition() {
    var positionTimer = navigator.geolocation.watchPosition(
        function (position) {
            setMarkerPosition(posMarker, position);
        }
    );
}

function displayandwatch(position){
    setCurrentPosition(position);
    watchCurrentPosition(position);
}

function initLocProc() {
    initMap();
    if(navigator.geolocation){
        navigator.geolocation.getCurrentPosition(displayandwatch);
    }
}

$(document).ready(function () {
    initLocProc();
});