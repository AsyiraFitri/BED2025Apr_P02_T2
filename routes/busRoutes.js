const express = require('express');
const router = express.Router();
const busArrivalController = require('../controllers/busController');

// define a route to fetch bus arrivals
router.get('/bus-arrivals/:busStopCode', busArrivalController.getBusArrivals);

// doute to get bus stop information based on the description (road name or landmark)
//router.get('/bus-stop-info', busArrivalController.getBusStopInfo);  // use query parameter for description

module.exports = router;
