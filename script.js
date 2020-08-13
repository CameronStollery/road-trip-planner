// Initialise map
var script = document.createElement('script');
script.src = 'https://maps.googleapis.com/maps/api/js?key=&callback=initMap';
script.defer = true;

window.initMap = function() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: -37.8136, lng: 144.9631},
        zoom: 10
      });
};

document.head.appendChild(script);

$('#addPerson').on('click', function(){
  alert('testttt');
});