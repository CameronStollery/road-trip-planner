// Dictionary of objects providing autocomplete functionality to address fields
var autocompleteContainer = {};

// Dictionary of objects for map markers
var markerContainer = {
  numMarkers: 0,
  markers: {},
  markerBounds: {
    south: 0,
    north: 0,
    west: 0,
    east: 0
  }
};

// Get centre point of all markers
markerContainer.avgCoord = function() {
  var totalLat = 0, totalLng = 0;
  for (const marker in markerContainer.markers) {
    totalLat += markerContainer.markers[marker].position.lat();
    totalLng += markerContainer.markers[marker].position.lng();
  };
  var avgLat = totalLat / markerContainer.numMarkers;
  var avgLng = totalLng / markerContainer.numMarkers;
  return {lat: avgLat, lng: avgLng};
};

var userLoc,                // Object to store user's location, if available
    addAutocompleteField,   // Function for enabling autocomplete on an address field
    bounds,                 // Object to store bounds of map
    recentre;               // Function to adjust the map viewport appropriately

// Function to set up functionality from Google Maps JavaScript API, called once Google scripts has loaded
function initMap() {
  // Initialise map centred on Melbourne by default
  map = new google.maps.Map($('#map')[0], {
    center: {lat: -37.8136, lng: 144.9631},
    zoom: 8
  });

  // Options parameter for autocomplete objects
  var options = {};

  // Attach autocomplete functionality to address field with given id
  addAutocompleteField = function(id, addressFieldId) {
    autocompleteContainer[id] = new google.maps.places.Autocomplete($('#' + addressFieldId)[0], options);
    autocompleteContainer[id].setFields(['formatted_address', 'geometry']);       // Only need address and coordinates
    autocompleteContainer[id].addListener('place_changed', getPlaceDetails(id));  // Fire event when a place is selected
    autocompleteContainer[id].bindTo('bounds', map);                              // Keep biasing location results to the map's viewport
  }

  // Initialise with autocomplete objects for addr-dest and addr-1
  addAutocompleteField('dest', 'addr-dest');
  addAutocompleteField('person-1', 'addr-1');

  recentre = function() {
    if (markerContainer.numMarkers === 1) {
      // Centre map on the marker without changing zoom level
      var markerId = Object.keys(markerContainer.markers)[0];
      map.panTo(markerContainer.markers[markerId].getPosition());
    } else if (markerContainer.numMarkers > 1) {
      map.panTo(markerContainer.avgCoord());
      // Pan/zoom the map to show all markers
      map.fitBounds(markerContainer.markerBounds, 50);
    };
  };

  // Add marker with a given location and label relating to a given id
  markerContainer.addMarker = function(id, location, name) {
    // Remove any existing marker for this id
    if (markerContainer.markers[id]) {
      markerContainer.deleteMarker(id);
    }

    // Update min/max lat/lng
    if (location.lat() > markerContainer.markerBounds.north || markerContainer.numMarkers == 0) {
      markerContainer.markerBounds.north = location.lat();
    }
    if (location.lat() < markerContainer.markerBounds.south || markerContainer.numMarkers == 0) {
      markerContainer.markerBounds.south = location.lat();
    }
    if (location.lng() > markerContainer.markerBounds.east || markerContainer.numMarkers == 0) {
      markerContainer.markerBounds.east = location.lng();
    }
    if (location.lng() < markerContainer.markerBounds.west || markerContainer.numMarkers == 0) {
      markerContainer.markerBounds.west = location.lng();
    }

    // Add new marker for this id
    markerContainer.markers[id] = new google.maps.Marker({
      position: location,
      map: map,
      title: name,    // TODO make this label more visible?
      label: name[0]
    });

    markerContainer.numMarkers += 1;

    recentre();    // Centre map to show all markers
  };

  // Delete marker with a given id
  markerContainer.deleteMarker = function(id) {
    if (markerContainer.markers[id]) {
      markerContainer.markers[id].setMap(null);  // Remove marker's association with map
      delete markerContainer.markers[id];        // Delete marker object
      markerContainer.numMarkers -= 1;
  
      if (markerContainer.numMarkers > 0) {
        // Recalculate min/max lat/lng
        var markers = Object.keys(markerContainer.markers).map(id => markerContainer.markers[id]);
        var lats = markers.map(m => m.getPosition().lat());
        var lngs = markers.map(m => m.getPosition().lng());
        markerContainer.markerBounds.south = Math.min(...lats);
        markerContainer.markerBounds.north = Math.max(...lats);
        markerContainer.markerBounds.west = Math.min(...lngs);
        markerContainer.markerBounds.east = Math.max(...lngs);
      }
  
      recentre();   // Centre map on remaining markers
    }
  }

  if (navigator.geolocation) {
    // Set userLoc to user's location if available
    navigator.geolocation.getCurrentPosition(
      // Location successfully retrieved
      function(position) {
        userLoc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        map.setCenter(userLoc);
      },
      // Location not retrieved
      function() {
      },
      // Set timeout to be 2 seconds
      {
        timeout: 2000
      }
    ); 
  };
};

// Return a function specific to a text field that will fire when the location in that field is changed
function getPlaceDetails(id) {
  return function() {
    var placeDetails = autocompleteContainer[id].getPlace();                // Get details of chosen place
    var rowIdentifier = (id === 'dest') ? id : id.slice(7);                 // Get end of id, e.g. '1' or 'dest'
    var loc = placeDetails.geometry.location
    $('#coords-' + rowIdentifier).val(loc);                                 // Put place's coordinates address in dummy field
    markerContainer.addMarker(
      id,
      loc,
      (id === 'dest') ? "Destination" : $('#name-' + rowIdentifier).val()
    );                                                                      // Add marker for new place on map
  }
};

// Add functionality to UI controls

var numPeople = 1;  // Total number of people rows that have existed - includes deleted rows

function personHtml(n) {
  return `
    <div class="row input-row person py-2 px-0 my-3 details-row" id="person-${n}">
      <div class="col-11">
          <div class="form-row">
              <div class="col-md-auto">
                  <label class="sr-only" for="name-${n}">Name</label>
                  <input type="text" class="form-control my-2 mr-sm-0 name-field" id="name-${n}" name="name-${n}" placeholder="Name" required>
              </div>
              <div class="col-md-4">
                  <label class="sr-only" for="addr-${n}">Address</label>
                  <input type="text" class="form-control my-2 mr-sm-0 addr-field" id="addr-${n}" name="addr-${n}" placeholder="Address" required>
                  <input type="text" class="d-none coords-field" id="coords-${n}" name="coords-${n}">
              </div>
              <div class="col-md-auto form-inline ml-2">
                    <input class="form-check-input hasCar" type="checkbox" id="hasCar-${n}" name="hasCar-${n}">
                    <label class="form-check-label hasCar" for="hasCar-${n}">Has car</label>
                  </div>
              <div class="col-md-auto form-inline">
                  <input type="number" min="0" max="50" class="form-control mr-2" id="passengers-${n}" name="passengers-${n}" placeholder="0" disabled>
                  <label class="" for="passengers-${n}">passenger seats available</label>
              </div>
          </div>
          <div class="form-row">
              <div class="col-md-auto form-inline">
                  <label class="mr-2 mb-0" for="start-${n}">Arriving</label>
                  <input type="date" class="form-control my-2 mr-sm-0 start-field" id="start-${n}" name="start-${n}" placeholder="Pick-up date" required>
              </div>
              <div class="col-md-auto form-inline">
                  <label class="mr-2 mb-0" for="end-${n}">Leaving</label>
                  <input type="date" class="form-control my-2 mr-sm-0 end-field" id="end-${n}" name="end-${n}" placeholder="Drop-off date" required>
              </div>
          </div>
      </div>
      <div class="col-1 d-flex">
          <button type="button" class="btn d-flex align-self-center delete">
              <i class="fas fa-times"></i>
          </button>
      </div>
    </div>
  `
};

// Add a new person to the form when "add person" is clicked
$('#addPerson').click(function() {
  numPeople += 1;
  $('#addPersonRow').before(personHtml(numPeople));
  $(`#person-${numPeople}`).hide().slideDown(200);
  $(`#start-${numPeople}`).val($('#start-dest').val());   // Set arrival date to match trip arrival date
  $(`#end-${numPeople}`).val($('#end-dest').val()); // Set departure date to match trip departure date
  addAutocompleteField(`person-${numPeople}`, `addr-${numPeople}`);
});

// Enable number of passengers field when selected that person has a car
$('#people').on('click', 'input.hasCar', function() {
  var passengers = $(this).parent().next().find('input');
  passengers.prop('disabled', !passengers.prop('disabled'));
});

// Delete buttons
$('#people').on('click', '.delete', function() {
  var person = $(this).parentsUntil('.details-section', '.details-row');
  var id = person.attr('id');
  delete autocompleteContainer[person.attr('id')];          // Remove autcomplete functionality from address field
  markerContainer.deleteMarker(id);
  person.slideUp(200, function() {
    person.remove();
  });
});

// Update marker label when a name is changed
$('#people').on('change', '.name-field', function() {
  var detailsRow = $(this).parentsUntil('.details-section', '.details-row');
  var id = detailsRow.attr('id');                           // Get id of row, e.g. 'person-2'
  if (markerContainer.markers[id]) {
    var name = detailsRow.find('.name-field').val();
    markerContainer.markers[id].setTitle(name);
    markerContainer.markers[id].setLabel(name[0]);
  }
});

// Remove marker when address changed to not be address
$('#details').on('change', '.addr-field', function() {
  var detailsRow = $(this).parentsUntil('.details-section', '.details-row');
  var id = detailsRow.attr('id');                           // Get id of row, e.g. 'person-2'

  // Address changed to differ from autocomplete object's address
  if (autocompleteContainer[id].getPlace() && $(this).val() !== autocompleteContainer[id].getPlace().formatted_address) {
    detailsRow.find('.coords-field').val('');               // Remove old coordinates from dummy field
    if (markerContainer.markers[id]) {
      markerContainer.deleteMarker(id);
    }
  };
});

// Update any empty date fields to match destination date fields
$('#start-dest').on('change', function() {
  // If the date field is currently empty, set its value to equal that of destination, otherwise set to current value
  $('#people').find('.start-field').val((_, currentVal) => currentVal === '' ? $('#start-dest').val() : currentVal);
});
$('#end-dest').on('change', function() {
  $('#people').find('.end-field').val((_, currentVal) => currentVal === '' ? $('#end-dest').val() : currentVal);
})
// TODO make new date fields default to dest values

// Prevent form from submitting when user presses enter key (from https://www.hashbangcode.com/article/prevent-enter-key-submitting-forms-jquery)
$('form input').keydown(function (e) {
  if (e.keyCode == 13) {
      e.preventDefault();
      return false;
  }
});

