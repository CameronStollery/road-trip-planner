// Initialise Google Maps map
var mapScript = document.createElement('script');
mapScript.src = 'https://maps.googleapis.com/maps/api/js?key=&libraries=drawing,places&callback=initMap';
mapScript.defer = true;

window.initMap = function() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: -37.8136, lng: 144.9631},
        zoom: 10
      });
};

document.head.appendChild(mapScript);

// TODO Initialise Google Maps drawing library

$('#people').on('click', '.delete', function() {
  var person = $(this).parent().parent();
  person.slideUp(200, function() {
    person.remove();
  });
});

$('#people').on('click', 'input.hasCar', function() {
  var passengers = $(this).parent().next().find('input');
  passengers.prop('disabled', !passengers.prop('disabled'));
});

var numPeople = 1;

function personHtml(n) {
  return `
    <div class="row input-row person py-2 px-0 my-3" id="person-${n}"> \
      <div class="col-11"> \
          <div class="form-row"> \
              <div class="col-md-auto"> \
                  <label class="sr-only" for="name-${n}">Name</label> \
                  <input type="text" class="form-control my-2 mr-sm-0" id="name-${n}" name="name-${n}" placeholder="Name"> \
              </div> \
              <div class="col-md-4"> \
                  <label class="sr-only" for="addr-${n}">Address</label> \
                  <input type="text" class="form-control my-2 mr-sm-0" id="addr-${n}" name="addr-${n}" placeholder="Address">   \  
              </div> \
              <div class="col-md-auto form-inline ml-2"> \
                    <input class="form-check-input hasCar" type="checkbox" id="hasCar-${n}" name="hasCar-${n}"> \
                    <label class="form-check-label hasCar" for="hasCar-${n}">Has car</label> \
                  </div> \
              <div class="col-md-auto form-inline"> \
                  <input type="number" min="0" max="50" class="form-control mr-2" id="passengers-${n}" name="passengers-${n}" placeholder="0" disabled> \
                  <label class="" for="passengers-${n}">passenger seats available</label> \
              </div> \
          </div> \
          <div class="form-row"> \
              <div class="col-md-auto form-inline"> \
                  <label class="mr-2 mb-0" for="pickup-${n}">Arriving</label> \
                  <input type="date" class="form-control my-2 mr-sm-0" id="pickup-${n}" name="pickup-${n}" placeholder="Pick-up date">     \
              </div> \
              <div class="col-md-auto form-inline"> \
                  <label class="mr-2 mb-0" for="dropoff-${n}">Leaving</label> \
                  <input type="date" class="form-control my-2 mr-sm-0" id="dropoff-${n}" name="dropoff-${n}" placeholder="Drop-off date">   \  
              </div> \
          </div> \
      </div> \
      <div class="col-1 d-flex"> \
          <button type="button" class="btn d-flex align-self-center delete"> \
              <i class="fas fa-times"></i> \
          </button> \
      </div> \
    </div>
  `
};

$('#addPerson').click(function() {
  numPeople += 1;
  $('#addPersonRow').before(personHtml(numPeople));
  $(`#person-${numPeople}`).hide().slideDown(200);
});