let map;
let geocoder;
let directionsService;
let directionsRenderer;
let userLocation;  // store user's current location
let serviceMarkers = []; // store all service markers on map
const apiBaseUrl = "http://localhost:3000/api";

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
              const routeLeg = response.routes[0].legs[0];
              routeLeg.steps.forEach(step => {
                if (step.travel_mode === 'TRANSIT' && step.transit) {
                  const transitDetails = step.transit;
                  console.log(step.transit);
                  /* const busStopName = transitDetails.departure_stop.name;
                  // display bus stop info from the server
                  getBusStopInfoFromServer(busStopName);
                  // display name in UI
                  const selectedStopDiv = document.getElementById('selectedBusStopInfo');
                  selectedStopDiv.innerHTML = `<p><strong>${busStopName}</strong></p>`; */
                  }
              });
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
  servicesList.innerHTML = ''; // clear previous results

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

  // create marker on map
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


// set manual location
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
///////////////////////

/* async function getBusStopInfoFromServer(busStopName) {
  try {
    // Assume apiBaseUrl has your local API that contains the bus stop data
    const response = await fetch(`${apiBaseUrl}/bus/bus-stop-info?description=${encodeURIComponent(busStopName)}`);

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();

    // find the bus stop based on the description matching the bus stop name
    const busStop = data.value.find(stop => stop.Description.toLowerCase() === busStopName.toLowerCase());

    if (busStop) {
      const busStopCode = busStop.BusStopCode;
      console.log('Bus Stop Code:', busStopCode);

      // use the bus stop code for fetching arrivals
      getBusArrivalsFromServer(busStopCode);

      // display bus stop info in the UI
      const selectedStopDiv = document.getElementById('selectedBusStopInfo');
      selectedStopDiv.innerHTML = `
        <p><strong>${busStopName}</strong></p>
        <p>Bus Stop Code: ${busStopCode}</p>
        <p>Road Name: ${busStop.RoadName}</p>
        <p>Description: ${busStop.Description}</p>
        <p>Latitude: ${busStop.Latitude}</p>
        <p>Longitude: ${busStop.Longitude}</p>
      `;
    } else {
      console.error('No bus stop found with the name:', busStopName);
    }

  } catch (error) {
    console.error('Error fetching bus stop info:', error.message);
  }
}


async function getBusArrivalsFromServer(busStopCode) {
  try {
    // send a GET request to fetch bus arrivals based on bus stop code
    const response = await fetch(`${apiBaseUrl}/api/bus/bus-arrivals/${busStopCode}`);

    // check if the response is ok (status 200-299)
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    // parse the response as JSON
    const data = await response.json();

    if (data) {
      console.log('Bus Arrivals:', data);

      // display bus arrivals in the UI
      const arrivalsDiv = document.getElementById('busArrivals');
      arrivalsDiv.innerHTML = `<p><strong>Upcoming Bus Arrivals:</strong></p>`;

      // assuming response contains an array of bus arrival times
      data.forEach(busArrival => {
        arrivalsDiv.innerHTML += `
          <p>Bus Number: ${busArrival.ServiceNo} - Arrival Time: ${busArrival.ExpectedArrival}</p>
        `;
      });
    }
  } catch (error) {
    console.error('Error fetching bus arrivals:', error.message);
  }
}
 */