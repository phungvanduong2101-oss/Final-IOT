const express = require("express");
const router = express.Router();

const deviceController = require("../controllers/device.controller"); 
const sensorController = require("../controllers/sensor.controller");  
const actionHistoryController = require("../controllers/action.controller");
router.get("/sensors-data/chart", sensorController.getSensorsData); 
router.get("/devices", deviceController.getDevices);
router.get("/devices/:id", deviceController.getDeviceStatus);
router.post("/devices/:id/control", deviceController.controlDevice); 

router.get('/sensors', sensorController.getSensors);  
router.get('/actions', actionHistoryController.getActions);
module.exports = router;