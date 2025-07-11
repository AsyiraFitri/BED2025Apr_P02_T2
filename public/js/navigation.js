let map;
let geocoder;
let directionsService;
let directionsRenderer;

// This function initializes the Google Map
function initMap() {
  // Create a map centered at a default location (latitude, longitude)
  map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 1.3521, lng: 103.8198 },  // Example: Singapore coordinates
    zoom: 12,
  });

  // Initialize geocoder, directions service and renderer for route display
  geocoder = new google.maps.Geocoder();
  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({
    map: map,  // This tells the renderer to display the route on this map
    panel: document.getElementById('directionsPanel') // Optional: If you want a directions panel
  });

  // Add event listener to handle route search
  document.getElementById('searchRoute').addEventListener('click', searchRoute);
}

// Function to search for a route between 'From' and 'To'
function searchRoute() {
  const fromLocation = document.getElementById('fromSelect').value;
  const toLocation = document.getElementById('toSelect').value;

  if (fromLocation && toLocation) {
    // Use geocoder to get Lat/Lng for from and to locations
    geocoder.geocode({ address: fromLocation }, (results, status) => {
      if (status === 'OK') {
        const fromLatLng = results[0].geometry.location;

        geocoder.geocode({ address: toLocation }, (results, status) => {
          if (status === 'OK') {
            const toLatLng = results[0].geometry.location;

            // Request directions
            const request = {
              origin: fromLatLng,
              destination: toLatLng,
              travelMode: google.maps.TravelMode.DRIVING,
            };

            directionsService.route(request, (response, status) => {
              if (status === 'OK') {
                directionsRenderer.setDirections(response); // Display the route
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
  } else {
    alert('Please enter both locations.');
  }
}
