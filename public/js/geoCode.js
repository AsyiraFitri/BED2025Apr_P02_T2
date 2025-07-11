const dotenv = require("dotenv");
const axios = require("axios");
dotenv.config();
const GOOGLE_API_KEY = process.env.GOOGLEMAP_API_KEY 
const GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json";

async function geocodeAddress(address) {
  try {
    const response = await axios.get(GEOCODE_URL, {
  params: {
    address: address,
    key: GOOGLE_API_KEY,
  },
});

console.log(response.data);  // Log the entire response

const results = response.data.results;
if (results.length > 0) {
  const { lat, lng } = results[0].geometry.location;
  return { latitude: lat, longitude: lng };
} else {
  throw new Error("Geocoding failed: No results found for the address");
}

  } catch (error) {
    throw new Error(`Geocoding error: ${error.message}`);
  }
}

module.exports = geocodeAddress;
