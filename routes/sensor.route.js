const express = require("express");
const router = express.Router();

const controller = require("../../controllers/sensor.controller");

/**
 * @openapi
 * /api/sensors:
 *   get:
 *     summary: Lấy danh sách dữ liệu cảm biến
 *     tags:
 *       - Sensors
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Trang hiện tại
 *       - in: query
 *         name: items
 *         schema:
 *           type: integer
 *           enum: [10, 20, 50]
 *           default: 10
 *         description: Số bản ghi mỗi trang
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Từ khóa tìm kiếm
 *       - in: query
 *         name: searchBy
 *         schema:
 *           type: string
 *           enum: [ALL, Temperature, Humidity, Light, Time]
 *           default: ALL
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *     responses:
 *       '200':
 *         description: Lấy dữ liệu thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       '500':
 *         description: Lỗi máy chủ
 */
router.get("/sensors", controller.getSensors);
 

/**
 * @openapi
 * /api/devices/{id}/control:
 *   post:
 *     summary: Gửi lệnh điều khiển thiết bị
 *     tags:
 *       - Devices
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID thiết bị
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [ON, OFF]
 *     responses:
 *       '200':
 *         description: Đã tiếp nhận lệnh điều khiển
 *       '400':
 *         description: Lệnh không hợp lệ
 *       '404':
 *         description: Không tìm thấy thiết bị
 *       '500':
 *         description: Lỗi máy chủ
 */
router.post("/devices/:id/control", controller.controlDevice); 

module.exports = router;