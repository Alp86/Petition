var map;

var coords = JSON.parse(document.getElementById("coords").value);
console.log("coords:", coords);

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 0, lng: 0},
        zoom: 1,
        mapTypeControl: false,
        streetViewControl: false,
        rotateControl: false
    });

    var labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    var markers = [];
    for (var i = 0; i < coords.length; i++) {
        if (coords[i].coord) {
            var marker = new google.maps.Marker({
                position: coords[i].coord,
                label: labels[i % labels.length]
            });
            var infowindow = new google.maps.InfoWindow({
                content: coords[i].name
            });

            marker.addListener("click", function() {
                infowindow.open(map, marker);
            });
            markers.push(marker);
        }
    }
    // var markers = coords.map(function(coord, i) {
    //     if (coord.coord) {
    //         var marker = new google.maps.Marker({
    //             position: coord.coord,
    //             label: labels[i % labels.length]
    //         });
    //         var infowindow = new google.maps.InfoWindow({
    //             content: coord.name
    //         });
    //
    //         marker.addListener("click", function() {
    //             infowindow.open(map, marker);
    //         });
    //         return marker;
    //     }
    // });

    var markerCluster = new MarkerClusterer(map, markers,
        { imagePath:
            'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'
        }
    );

}
