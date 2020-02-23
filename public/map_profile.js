var autocomplete;
var map;
var markers = [];

function initMap() {

    var coord;
    if (document.getElementById("coord-input").value) {
        coord = JSON.parse(document.getElementById("coord-input").value);
    }

    map = new google.maps.Map(document.getElementById('map'), {
        center: coord || { lat: 0, lng: 0 },
        zoom: 3,
        mapTypeControl: false,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: false
    });

    var marker = new google.maps.Marker({
        position: coord,
        map: map
    });
    markers.push(marker);
}

function initAutocomplete() {
    function addMarker(coord) {
        var marker = new google.maps.Marker({
            position: coord,
            map: map
        });
        markers.push(marker);
    }

    autocomplete = new google.maps.places.Autocomplete(
        document.getElementById('autocomplete'), {
            types: ['geocode'],
            fields: ['geometry.location']
        },
    );

    autocomplete.setFields(['address_component']);

    autocomplete.addListener('place_changed', () => {
        if (markers.length > 0) {
            markers[0].setMap(null);
            markers = [];
        }
        var place = autocomplete.getPlace();
        function choose() {return Math.floor(Math.random() * (1 - 0 + 1));}
        function rfactor() {return Math.random() * [-0.01, 0.01][choose()];}
        var coord = {
            lat: place.geometry.location.lat() + rfactor(),
            lng: place.geometry.location.lng() + rfactor()
        };

        map.setCenter(coord);
        addMarker(coord);
        document.getElementById("coord-input").value = JSON.stringify(coord);
        console.log("coord-input:", document.getElementById("coord-input").value);
    });
}

function init() {
    initMap();
    initAutocomplete();
}
