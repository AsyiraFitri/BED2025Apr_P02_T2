// event listener for bus stop search button
document.getElementById("submitBusStopSearch").addEventListener("click", function() {
  // get the bus stop code from the input field
  const busStopCode = document.getElementById("searchBusStop").value;
  
  // call function to fetch bus arrivals based on the bus stop code
  fetchBusArrivals(busStopCode);
});

// function to fetch bus arrivals from the server using the bus stop code
function fetchBusArrivals(busStopCode) {
  if (!busStopCode) {
    // if no bus stop code provided, alert the user
    alert("Please enter a valid bus stop code.");
    return;
  }

  // make a GET request to fetch bus arrivals data
  fetch(`${apiBaseUrl}/bus/bus-arrivals/${busStopCode}`, {
    method: 'GET',
    headers: {
      'accept': 'application/json',  // specify the expected response format
    }
  })
  .then(res => {
    // check if the response is OK, otherwise throw an error
    if (!res.ok) throw new Error('Network response was not ok');
    
    // parse the response as JSON
    return res.json();
  })
  .then(data => {
    // call function to display bus arrival data
    displayBusArrivals(data);
  })
  .catch(err => {
    // log any errors and alert the user
    console.error('Error fetching bus arrivals:', err);
    alert('Failed to fetch bus arrivals. Please try again later.');
  });
}

// function to display the bus arrivals on the page
function displayBusArrivals(data) {
  const displayDiv = document.getElementById('selectedBusStopInfo');
  
  // clear any previous bus arrival info
  displayDiv.innerHTML = '';

  // check if there are any bus services available in the response
  if (data.Services && data.Services.length > 0) {
    // loop through each service to display the arrival details
    data.Services.forEach(service => {
      const serviceEl = document.createElement('div');
      serviceEl.classList.add('bus-service');
      
      // show the bus service number
      serviceEl.innerHTML = `<span class="serviceNo" style="margin-right:20px;">Bus<br>${service.ServiceNo}</span>`;

      // array of the next 3 buses
      const intervals = [service.NextBus, service.NextBus2, service.NextBus3];

      // loop through each bus interval (next buses)
      intervals.forEach((bus) => {
        if (!bus || !bus.EstimatedArrival) return;

        // calculate the arrival time and display wheelchair accessibility, load, and vehicle type
        const arrivalTime = getArrivalTime(bus.EstimatedArrival);
        const wheelchairIcon = bus.Feature !== 'WAB'
          ? `<span class="material-symbols-outlined" style="color:red; font-size:16px; vertical-align:middle;" title="Not Accessible">not_accessible</span>`
          : '';
        const loadInfo = getLoadBar(bus.Load);
        const vehicleType = getVehicleType(bus.Type);

        serviceEl.innerHTML += `
          <div class="bus-interval" style="margin-bottom:10px;">
            <div><strong> ${arrivalTime} ${wheelchairIcon}</div>
            <div>${loadInfo}</div>
            <div style="font-size:10px; color:#555; margin-top:2px;">${vehicleType}</div>
          </div>
        `;
      });

      // append the service element to the display area
      displayDiv.appendChild(serviceEl);
    });
  } else {
    // if no bus services available, show a message
    displayDiv.textContent = "No arrival information available.";
  }
}

// function to calculate the arrival time in minutes
function getArrivalTime(isoTime) {
  if (!isoTime) return 'N/A';
  
  // create Date object from ISO string
  const arrival = new Date(isoTime);
  const now = new Date();
  const diffMin = Math.round((arrival - now) / 60000);  // convert difference from ms to minutes
  
  // if the bus is already arriving, display "Arr"
  return diffMin <= 0 ? 'Arr' : `${diffMin}<br>min${diffMin > 1 ? 's' : ''}`;
}

// function to return a load bar based on the load value
function getLoadBar(load) {
  let percent = 0;
  let color = 'gray';
  
  // set the load percentage and color based on load status
  switch (load) {
    case 'SEA': // slightly empty
      percent = 25;
      color = 'green';
      break;
    case 'SDA': // slightly crowded
      percent = 50;
      color = 'orange';
      break;
    case 'LSD': // very crowded
      percent = 75;
      color = 'red';
      break;
    default:
      return 'Unknown';  // return "Unknown" for any unexpected load type
  }

  // return a load bar HTML element
  return `
    <div style="background:#ddd; width:50px; height:5px; border-radius:5px; overflow:hidden; display:inline-block;">
      <div style="width:${percent}%; background:${color}; height:100%;"></div>
    </div>
  `;
}

// function to return the vehicle type based on the bus type
function getVehicleType(type) {
  switch (type) {
    case 'SD': return 'Single';   // single-deck bus
    case 'DD': return 'Double';   // double-deck bus
    case 'BD': return 'Bendy';    // bendy bus
    default: return 'Unknown Type';  // default if type is unknown
  }
}
