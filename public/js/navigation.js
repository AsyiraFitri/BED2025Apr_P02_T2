let map;
let geocoder;
let directionsService;
let directionsRenderer;
let userLocation;  // store user's current location
let serviceMarkers = []; // store all service markers on map

// initialize the Google Map
function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 1.3521, lng: 103.8198 }, // default to Singapore
    zoom: 12,
  });

  // initialize services
  geocoder = new google.maps.Geocoder();
  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({
    map: map,
    panel: document.querySelector('.step-guide'),
  });

  // autocomplete for "From" and "To" locations
  const fromInput = document.getElementById('fromSelect');
  const toInput = document.getElementById('toSelect');
  // autocomplete restricted to Singapore (SG)
  const fromAutocomplete = new google.maps.places.Autocomplete(fromInput);
  fromAutocomplete.setComponentRestrictions({ country: ['SG'] });

  const toAutocomplete = new google.maps.places.Autocomplete(toInput);
  toAutocomplete.setComponentRestrictions({ country: ['SG'] });

  // nearby Services Button Click
  document.getElementById('showNearbyServices').addEventListener('click', showNearbyServices);

  // location Modal Handling
  document.getElementById('submitLocationBtn').addEventListener('click', setManualLocation);
  document.getElementById('closeLocationModal').addEventListener('click', closeLocationModal);

  //  search route button click
  document.getElementById('searchRoute').addEventListener('click', searchRoute);
}

// function to search for a route between 'From' and 'To'
function searchRoute() {
  const fromLocation = document.getElementById('fromSelect').value;
  const toLocation = document.getElementById('toSelect').value;
  const selectedMode = document.getElementById('travelMode').value;

  if (!fromLocation || !toLocation) {
    alert('Please enter both locations.');
    return;
  }

  // geocode the "From" location
  geocoder.geocode({ address: fromLocation }, (results, status) => {
    if (status === 'OK' && results[0]) {
      const fromLatLng = results[0].geometry.location;

      // geocode the "To" location
      geocoder.geocode({ address: toLocation }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const toLatLng = results[0].geometry.location;

          // set up the route request
          const request = {
            origin: fromLatLng,
            destination: toLatLng,
            travelMode: google.maps.TravelMode[selectedMode],
            provideRouteAlternatives: true,
          };

          // request the route
          directionsService.route(request, (response, status) => {
            if (status === 'OK') {
              // directly use the response without optimization
              directionsRenderer.setDirections(response);
            } else {
              alert('Directions request failed due to ' + status);
            }
          });

        } else {
          alert('Geocode failed for "To" address: ' + status);
        }
      });

    } else {
      alert('Geocode failed for "From" address: ' + status);
    }
  });
}

// fetch and categorize nearby services based on the location (user's or preferred)
function fetchNearbyServices(location, category) {

  const service = new google.maps.places.PlacesService(map);
  const servicesList = document.getElementById('servicesList');
  // clear previous markers from map
  serviceMarkers.forEach(marker => marker.setMap(null));
  serviceMarkers = [];
  servicesList.innerHTML = ''; // Clear previous results

  let queries = [];

  switch (category) {
    case 'healthcare':
      queries = [
        'hospital',
        'clinic',
        'polyclinic',
        'dental clinic',
        'pharmacy',
        'nursing home'
      ];
      break;

    case 'market':
      queries = [
        'supermarket',
        'wet market',
        'mini mart',
        'convenience store'
      ];
      break;

    case 'park':
      queries = [
        'park',
        'neighbourhood park',
        'nature park'
      ];
      break;

    case 'community_services':
      queries = [
        'community club',
        'community centre',
        'eldercare centre',
        'dementia friendly go-to-point'
      ];
      break;

    case 'food':
      queries = [
        'hawker centre',
        'restaurant',
        'cafe',
        'food court',
        'food stall'
      ];
      break;

    default:
      alert('Unknown category selected.');
      return;
  }

  const seenPlaceIds = new Set(); // to avoid duplicates

queries.forEach(query => {
  service.textSearch({
    location: location,
    radius: 1000, // increased radius for a broader search area
    query: query
  }, (results, status) => {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      results.forEach(place => {
        // calculate distance between user's location and place location
        const distance = google.maps.geometry.spherical.computeDistanceBetween(location, place.geometry.location);

        // only show places within 100 meters of the user
        if (distance <= 800 && !seenPlaceIds.has(place.place_id)) {
          seenPlaceIds.add(place.place_id);
          displayNearbyService(place); // Render individually
        }
      });
    }
  });
});
}


// display the nearby services in the UI
function displayNearbyService(place) {
  const servicesList = document.getElementById('servicesList');

  // create HTML list item
  const serviceItem = document.createElement('div');
  serviceItem.classList.add('service-item');
  serviceItem.innerHTML = `
    <h5>${place.name}</h5>
    <p>${place.formatted_address || place.vicinity}</p>
    <button onclick="getDirections(${place.geometry.location.lat()}, ${place.geometry.location.lng()}, '${place.name.replace(/'/g, "\\'")}')">Get Directions</button>
  `;
  servicesList.appendChild(serviceItem);

  // Create marker on map
  const marker = new google.maps.Marker({
    position: place.geometry.location,
    map: map,
    title: place.name,
  });

  // add info window on click
  const infowindow = new google.maps.InfoWindow({
    content: `<strong>${place.name}</strong><br>${place.formatted_address || place.vicinity}`,
  });

  marker.addListener('click', () => {
    infowindow.open(map, marker);
  });

  // store marker globally so you can clear it later
  serviceMarkers.push(marker);
}


// get Directions to a service from user's current location
function getDirections(lat, lng, placeName) {
  if (!userLocation) {
    alert('User location is not available');
    return;
  }

  const destination = new google.maps.LatLng(lat, lng);

  // set the "To" field to the name instead of address
  document.getElementById('toSelect').value = placeName;

  // reverse geocode to fill in "From" field
  geocoder.geocode({ location: userLocation }, (originResults, originStatus) => {
    if (originStatus === 'OK' && originResults[0]) {
      const fromAddress = originResults[0].formatted_address;
      document.getElementById('fromSelect').value = fromAddress;

      const request = {
        origin: userLocation,
        destination: destination,
        travelMode: google.maps.TravelMode.TRANSIT,
      };

      directionsService.route(request, (response, status) => {
        if (status === 'OK') {
          directionsRenderer.setDirections(response);
        } else {
          alert('Directions request failed due to ' + status);
        }
      });

    } else {
      alert('Failed to get user address: ' + originStatus);
    }
  });
}


// show user's location and nearby services based on the selected category
function showNearbyServices() {
  const selectedCategory = document.getElementById('categorySelect').value;

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        userLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        map.setCenter(userLocation);
        new google.maps.Marker({
        position: userLocation,
        map: map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#4285F4',
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: 'white'
        },
        title: 'You are here'
      });
        map.setZoom(15);
        fetchNearbyServices(userLocation, selectedCategory);
      },
      (error) => {
        // if location access denied or error, show the modal
        console.warn('Geolocation error:', error.message);
        document.getElementById('locationModal').style.display = 'block';
      }
    );
  } else {
    // geolocation not supported
    document.getElementById('locationModal').style.display = 'block';
  }
}


// set Manual Location
function setManualLocation() {
  const manualLocation = document.getElementById('manualLocation').value;

  if (manualLocation) {
    geocoder.geocode({ address: manualLocation }, (results, status) => {
      if (status === 'OK' && results[0]) {
        userLocation = results[0].geometry.location;
        closeLocationModal();
        fetchNearbyServices(userLocation, document.getElementById('categorySelect').value);
      } else {
        alert('Could not find the location.');
      }
    });
  }
}

// close the location modal
function closeLocationModal() {
  document.getElementById('locationModal').style.display = 'none';
}

// add event listener for "Clear" button
document.getElementById('clearNearbyServices').addEventListener('click', clearNearbyServices);

// function to clear nearby services and remove markers
function clearNearbyServices() {
  // clear the services list in the UI
  const servicesList = document.getElementById('servicesList');
  servicesList.innerHTML = '';

  // remove all service markers from the map
  serviceMarkers.forEach(marker => marker.setMap(null));
  serviceMarkers = []; // clear the marker array

  // reset the map view
  map.setCenter(userLocation); // reset map center to user location
  map.setZoom(15); // reset zoom level
}
