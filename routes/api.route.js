const express = require("express");
const router = express.Router();

const deviceController = require("../controllers/device.controller"); 
const sensorController = require("../controllers/sensor.controller");  
const actionHistoryController = require("../controllers/action.controller"); 

router.get("/sensors-data/latest", sensorController.getSensorsDataLatest); 
router.get("/devices/status", deviceController.getDevicesStatus);
router.post("/devices/:id/control", deviceController.controlDevice); 

router.get('/sensors-data', sensorController.getSensorsData);  
router.get('/actions-history', actionHistoryController.getActionsHistory);
module.exports = router;