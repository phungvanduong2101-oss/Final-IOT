const deviceModel = require("../models/device.model"); 
const actionHistoryModel = require("../models/action-history.model");
const mqttClient = require("../config/mqtt");
 module.exports.getDeviceStatus = async (req, res) => {
  try {
    const device = await deviceModel.findByPk(req.params.id);

    res.json({ 
      code: "success",
      device,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
} 
 
module.exports.getDevices = async (req, res) => {
  try {
    const devices = await deviceModel.findAll();
    res.json({ 
      code: "success",
      data: devices,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
module.exports.controlDevice = async (req, res) => {
  try {
    const { action } = req.body;

    if (!["ON", "OFF"].includes(action)) {
      return res.status(400).json({
        message: "Lệnh phải là ON hoặc OFF.",
      });
    }

    const device = await deviceModel.findByPk(req.params.id);

    if (!device) {
      return res.status(404).json({
        message: "Không tìm thấy thiết bị.",
      });
    }

    if (!mqttClient.connected) {
      return res.status(503).json({
        message: "MQTT chưa kết nối.",
      });
    }

    const history = await actionHistoryModel.create({
      device_id: device.id,
      action,
      status: "WAITING",
    });

    mqttClient.publish(
      `device/${device.id}/command`,
      JSON.stringify({
        action,
        action_id: history.id,
      }),
      { retain: false },
      async error => {
        try {
          if (error) {
            await history.update({ status: "FAILED" });

            return res.status(500).json({
              message: "Gửi lệnh MQTT thất bại.",
            });
          }

          return res.json({
            code: "success",
            data: {
              idAction: history.id,
              status: "WAITING",
            },
          });
        } catch (error) {
          return res.status(500).json({
            message: error.message,
          });
        }
      }
    ); 

    res.json({ 
      code: "success",
      data: {
        ActionID: history.id, 
        DeviceID: device.id,
        status: "WAITING",
      },
    })
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};