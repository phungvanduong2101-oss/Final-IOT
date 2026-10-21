
const sensorsData = require("../models/sensor-data.model");
const { Op, Sequelize } = require("sequelize");
const Sensor = require("../models/sensor.model");
module.exports.getSensorsData = async (req, res) => {
  try {
    const dataTemperature = await sensorsData.findAll({
      where: { measurement_type: "Temperature" },
      limit: 10,
      order: [["created_at", "DESC"], ["id", "DESC"]],
    });

    const dataHumidity = await sensorsData.findAll({
      where: { measurement_type: "Humidity" },
      limit: 10,
      order: [["created_at", "DESC"], ["id", "DESC"]],
    });

    const dataLight = await sensorsData.findAll({
      where: { measurement_type: "Light" },
      limit: 10,
      order: [["created_at", "DESC"], ["id", "DESC"]],
    });

    res.json({
      code: "success",
      Temperature: dataTemperature,
      Humidity: dataHumidity,
      Light: dataLight,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports.getSensors = async (req, res) => {
  try {
    const { search, searchBy, items, sort } = req.query;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * items;
   
    console.log(search, searchBy, items, sort);
    const where = {};


    if (searchBy == 'ALL') {
      where[Op.or] = [
        Sequelize.where(
          Sequelize.cast(Sequelize.col("value"), "CHAR"),
          { [Op.like]: `%${search}%` }
        ),
        { measurement_type: { [Op.like]: `%${search}%` } },
        Sequelize.where(
          Sequelize.cast(Sequelize.col("created_at"), "CHAR"),
          { [Op.like]: `%${search}%` }
        )
      ]
    } else if (searchBy == 'Temperature') {
      where.measurement_type = 'Temperature';
      where[Op.or] = [
        Sequelize.where(
          Sequelize.cast(Sequelize.col("value"), "CHAR"),
          { [Op.like]: `%${search}%` }
        ),
        Sequelize.where(
          Sequelize.cast(Sequelize.col("created_at"), "CHAR"),
          { [Op.like]: `%${search}%` }
        )
      ]
    } else if (searchBy == 'Humidity') {
      where.measurement_type = 'Humidity';
      where[Op.or] = [
        Sequelize.where(
          Sequelize.cast(Sequelize.col("value"), "CHAR"),
          { [Op.like]: `%${search}%` }
        ),
        Sequelize.where(
          Sequelize.cast(Sequelize.col("created_at"), "CHAR"),
          { [Op.like]: `%${search}%` }
        )
      ]
    } else if (searchBy == 'Light') {
      where.measurement_type = 'Light';
      where[Op.or] = [
        Sequelize.where(
          Sequelize.cast(Sequelize.col("value"), "CHAR"),
          { [Op.like]: `%${search}%` }
        ),
        Sequelize.where(
          Sequelize.cast(Sequelize.col("created_at"), "CHAR"),
          { [Op.like]: `%${search}%` }
        )
      ]
    } else if (searchBy === "Time" && search?.trim()) {
      where[Op.and] = [
        Sequelize.where(
          Sequelize.fn(
            "DATE_FORMAT",
            Sequelize.fn(
              "CONVERT_TZ",
              Sequelize.col("created_at"),
              "+00:00",
              "+07:00"
            ),
            "%H:%i:%s %d/%m/%Y"
          ),
          { [Op.like]: `%${search.trim()}%` }
        )
      ];
    }
    const sensors = await sensorsData.findAll({
      where,
      limit: Number(items),
      offset: offset,
      order: [["created_at", sort]],
      include: {
        model: Sensor,
        as: "sensor",
        attributes: ["type"]
      }
    });

    const count = await sensorsData.count({
      where,
    });

    const totalPages = Math.ceil(count / items);


    res.json({
      code: "success",
      data: sensors,
      currentPage: page,
      totalPages,
      totalItems: count,
      skip: offset
    });


  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};