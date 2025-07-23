let map;
let geocoder;
let directionsService;
let directionsRenderer;
let userLocation;  // store user's current location

// initialize the Google Map
function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 1.3521, lng: 103.8198 }, // Default to Singapore
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
  const fromAutocomplete = new google.maps.places.Autocomplete(fromInput);
  const toAutocomplete = new google.maps.places.Autocomplete(toInput);

  // nearby Services Button Click
  //document.getElementById('showNearbyServices').addEventListener('click', showNearbyServices);

  // location Modal Handling
  //document.getElementById('submitLocationBtn').addEventListener('click', setManualLocation);
  //document.getElementById('closeLocationModal').addEventListener('click', closeLocationModal);

  // fearch Route Button Click
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
/* function fetchNearbyServices(location, category) {
  const service = new google.maps.places.PlacesService(map);

  // clear previous services in the list
  const servicesList = document.getElementById('servicesList');
  servicesList.innerHTML = '';

  if (category === 'hospital') {
    service.nearbySearch({
      location: location,
      radius: 2000,
      type: 'hospital',
    }, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        displayNearbyServices(results, 'Hospital');
      }
    });
  } else if (category === 'supermarket') {
    service.nearbySearch({
      location: location,
      radius: 2000,
      type: 'supermarket',
    }, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        displayNearbyServices(results, 'Supermarket');
      }
    });
  } else if (category === 'park') {
    service.nearbySearch({
      location: location,
      radius: 2000,
      type: 'park',
    }, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        displayNearbyServices(results, 'Park');
      }
    });
  } else if (category === 'community_center') {
    service.nearbySearch({
      location: location,
      radius: 2000,
      type: 'community_center',
    }, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        displayNearbyServices(results, 'Community Center');
      }
    });
  } else if (category === 'food') {
    service.nearbySearch({
      location: location,
      radius: 2000,
      type: 'restaurant',
    }, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        displayNearbyServices(results, 'Hawker Centers / Cafes');
      }
    });
  }
}

// display the nearby services in the UI
function displayNearbyServices(services, category) {
  const servicesList = document.getElementById('servicesList');
  const categoryHeader = document.createElement('h4');
  categoryHeader.innerText = category;
  servicesList.appendChild(categoryHeader);

  services.forEach(place => {
    const serviceItem = document.createElement('div');
    serviceItem.classList.add('service-item');
    serviceItem.innerHTML = `
      <h5>${place.name}</h5>
      <p>${place.vicinity}</p>
      <button onclick="getDirections(${place.geometry.location.lat()}, ${place.geometry.location.lng()})">Get Directions</button>
    `;
    servicesList.appendChild(serviceItem);
  });
}

// get Directions to a service from user's current location
function getDirections(lat, lng) {
  if (userLocation) {
    const destination = new google.maps.LatLng(lat, lng);
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
    alert('User location is not available');
  }
}

// show user's location and nearby services based on the selected category
function showNearbyServices() {
  const selectedCategory = document.getElementById('categorySelect').value;

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        userLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        fetchNearbyServices(userLocation, selectedCategory);
      },
      () => {
        alert('Geolocation not available');
      }
    );
  } else {
    alert('Geolocation not supported by this browser');
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
 */