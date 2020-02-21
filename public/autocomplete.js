var autocomplete;

var componentForm = {
    locality: 'long_name',
    country: 'long_name',
};

function initAutocomplete() {
    autocomplete = new google.maps.places.Autocomplete(
        document.getElementById('autocomplete'), {types: ['geocode']}
    );

    autocomplete.setFields(['address_component']);
}

var map;
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {
            lat: ,
            lng: 
        },
        zoom: 8
    });
}
