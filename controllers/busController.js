const busArrivalModel = require('../models/busModel');

// controller to get bus arrivals for a given bus stop code
async function getBusArrivals(req, res) {
  const busStopCode = req.params.busStopCode; 

  // check if busStopCode is missing
  if (!busStopCode) {
    return res.status(400).send("Bus stop code is required.");
  }

  try {
    const arrivals = await busArrivalModel.fetchBusArrivals(busStopCode);
    res.json(arrivals);
  } catch (error) {
    // Log error for debugging
    console.error("Error in getBusArrivals controller:", error.message);
    res.status(500).send("Error fetching bus arrivals: " + error.message);
  }
}

// controller to get bus stop information based on description (road name or landmark)
/* async function getBusStopInfo(req, res) {
  const description = req.query.description;  // get description from query parameters

  if (!description) {
    return res.status(400).send("Description (road name or landmark) is required.");
  }

  try {
    const busStop = await busArrivalModel.fetchBusStopInfo(description);
    res.json(busStop);  // return the bus stop info
  } catch (error) {
    console.error("Error in getBusStopInfo controller:", error.message);
    res.status(500).send("Error fetching bus stop info: " + error.message);
  }
}
 */

module.exports = { getBusArrivals, };