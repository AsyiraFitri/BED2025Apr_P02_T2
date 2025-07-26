const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

const arrivalBaseUrl = "https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival";
//const busStopBaseUrl = "https://datamall2.mytransport.sg/ltaodataservice/BusStops";
  
const apiKey = process.env.LTA_ACCOUNT_KEY;

// function to fetch bus arrivals based on bus stop code
async function fetchBusArrivals(busStopCode) {
  try {
    const url = `${arrivalBaseUrl}?BusStopCode=${busStopCode}`;
    console.log('Request URL:', url); 
    const response = await axios.get(url, {
      headers: {
        'AccountKey': apiKey,
        'Accept': 'application/json',
      }
    });

    return response.data;  // Return the fetched data
  } catch (error) {
    throw new Error('Error fetching bus arrivals: ' + error.message);
  }
}

// function to fetch bus stop information based on road name
/* async function fetchBusStopInfo(description) {
  try {
    const response = await axios.get(busStopBaseUrl, {
      headers: {
        'AccountKey': apiKey,
        'Accept': 'application/json'
      }
    });

    const data = response.data;

    if (!data || !data.value) {
      throw new Error("No bus stops found in response.");
    }

    // find the bus stop by road name
    const busStop = data.value.find(stop => stop.description.toLowerCase() === description.toLowerCase());

    if (busStop) {
      return busStop;  // return the matched bus stop
    } else {
      throw new Error('Bus stop not found for the given road name.');
    }
    
  } catch (error) {
    throw new Error('Error fetching bus stop info: ' + error.message);
  }
} */

module.exports = { fetchBusArrivals, };