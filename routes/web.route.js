const express = require("express");
const router = express.Router();

const controller = require("../controllers/view.controller");

router.get("/", controller.index);
router.get("/data-sensor", controller.dataSensor);
router.get("/history-action", controller.historyAction);
router.get("/profile", controller.profile);

module.exports = router;