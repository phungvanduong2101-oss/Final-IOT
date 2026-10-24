const { Op, Sequelize } = require("sequelize");
const ActionHistory = require("../models/action-history.model");
const Device = require("../models/device.model");
module.exports.getActions = async (req, res) => {
  try {
    const {
      search = "",
      device = "ALL",
      status = "ALL",
    } = req.query;

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);

    const requestedLimit = Number(req.query.limit);
    const limit = requestedLimit;

    const sort = req.query.sort || "DESC";
    const offset = (page - 1) * limit;

    const where = {};

    if (status !== "ALL") {
      where.status = status;
    }

    if (device !== "ALL") {
      where["$device.id$"] = device;
    }

    if (search.trim()) {
      let keyword = `%${search.trim()}%`;
      keyword = keyword.toLowerCase();
      where[Op.or] = [
        {
          action: {
            [Op.like]: keyword,
          },
        },
        Sequelize.where(
          Sequelize.cast(
            Sequelize.col("ActionHistory.created_at"),
            "CHAR"
          ),
          {
            [Op.like]: keyword,
          }
        ),
      ];
    }

    const result = await ActionHistory.findAndCountAll({
      where,
      include: [
        {
          association: "device",
          attributes: ["name"],
          required: true,
        },
      ],
      limit,
      offset,
      order: [
        ["created_at", sort],
        ["id", sort],
      ],
    });

    return res.json({
      code: "success",
      data: result.rows,
      totalPages: Math.ceil(result.count / limit),
      currentPage: page, 
      total: result.count, 
      skip: offset,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      code: "error",
      message: "Không tải được lịch sử thao tác.",
    });
  }
};