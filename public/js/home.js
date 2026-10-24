"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const message = document.getElementById("dashboard-message");
  const socket = io({ autoConnect: false });

  // =========================
  // BIỂU ĐỒ
  // =========================
  function createChart(id, label, color, background, min, max, step, unit) {
    return new Chart(document.getElementById(id), {
      type: "line",
      data: {
        labels: [],
        datasets: [{
          label,
          data: [],
          borderColor: color,
          backgroundColor: background,
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        scales: {
          x: {
            ticks: {
              font: { size: 10 },
              color: "#888",
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 10,
            },
            grid: { color: "#d0d0d0" },
          },
          y: {
            min,
            max,
            ticks: {
              stepSize: step,
              font: { size: 10 },
              color: "#888",
            },
            grid: { color: "#d0d0d0" },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: context => `${context.parsed.y} ${unit}`,
            },
          },
        },
      },
    });
  }

  const tempChart = createChart(
    "tempChart",
    "Nhiệt độ",
    "#f44336",
    "rgba(244,67,54,0.08)",
    5, 50, 5, "°C"
  );

  const humidChart = createChart(
    "humidChart",
    "Độ ẩm",
    "#2196F3",
    "rgba(33,150,243,0.08)",
    0, 100, 10, "%"
  );

  const lightChart = createChart(
    "lightChart",
    "Ánh sáng",
    "#FFC107",
    "rgba(255,193,7,0.08)",
    0, 1000, 100, "LX"
  );

  function setChartData(chart, records) {
    // API trả mới nhất trước, đảo lại để vẽ cũ đến mới.
    const rows = [...records].reverse();

    chart.data.labels = rows.map(row =>
      new Date(row.created_at).toLocaleTimeString("vi-VN")
    );

    chart.data.datasets[0].data = rows.map(row => row.value);
    chart.update("none");
  }

  async function loadSensors() {
    const response = await fetch("/api/sensors-data/chart", {
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error("Không tải được dữ liệu cảm biến.");
    }

    const result = await response.json();

    if (result.code !== "success") {
      throw new Error(result.message || "Không tải được dữ liệu cảm biến.");
    }

    setChartData(tempChart, result.Temperature);
    setChartData(humidChart, result.Humidity);
    setChartData(lightChart, result.Light);

    document.getElementById("temp-value").textContent =
      `${result.Temperature[0]?.value ?? "--"}°C`;

    document.getElementById("humid-value").textContent =
      `${result.Humidity[0]?.value ?? "--"}%`;

    document.getElementById("light-value").textContent =
      `${result.Light[0]?.value ?? "--"} LX`;
  }

  function addPoint(chart, row) {
    chart.data.labels.push(
      new Date(row.created_at).toLocaleTimeString("vi-VN")
    );

    chart.data.datasets[0].data.push(row.value);

    // Chỉ giữ tối đa 10 điểm.
    while (chart.data.labels.length > 10) {
      chart.data.labels.shift();
      chart.data.datasets[0].data.shift();
    }

    chart.update("none");
  }

  // =========================
  // SOCKET CẢM BIẾN
  // =========================
  socket.on("sensors:update", records => {
    for (const row of records) {
      if (row.measurement_type === "Temperature") {
        addPoint(tempChart, row);

        document.getElementById("temp-value").textContent =
          `${row.value}°C`;
      }

      if (row.measurement_type === "Humidity") {
        addPoint(humidChart, row);

        document.getElementById("humid-value").textContent =
          `${row.value}%`;
      }

      if (row.measurement_type === "Light") {
        addPoint(lightChart, row);

        document.getElementById("light-value").textContent =
          `${row.value} LX`;
      }
    }

    message.textContent = "";
  });

  socket.on("connect", () => {
    message.textContent = "";
  });

  socket.on("connect_error", () => {
    message.textContent = "Không kết nối được cập nhật trực tiếp.";
  });

  socket.on("disconnect", () => {
    message.textContent = "Mất kết nối cập nhật trực tiếp.";
  });

  // =========================
  // THIẾT BỊ
  // =========================
  const devices = [
    { key: "fan", name: "Quạt" },
    { key: "ac", name: "Điều hòa" },
    { key: "light", name: "Đèn" },
  ];

  async function sendCommand(device) {
    const action = device.toggle.checked ? "ON" : "OFF";

    device.toggle.checked = device.status === "ON";
    device.toggle.disabled = true;
    device.card.classList.add("loading");
    device.note.textContent = "Đang gửi lệnh...";

    try {
      const response = await fetch(`/api/devices/${device.id}/control`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
        signal: AbortSignal.timeout(10000),
      });

      const result = await response.json();

      if (!response.ok || result.code !== "success") {
        throw new Error(result.message || "Gửi lệnh thất bại.");
      }

      device.note.textContent = "Đang chờ thiết bị...";

      // Phần thiết bị vẫn kiểm tra trạng thái qua API.
      for (let i = 0; i < 10; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));

        const statusResponse = await fetch(`/api/devices/${device.id}`, {
          signal: AbortSignal.timeout(3000),
        });

        const data = await statusResponse.json();

        if (!statusResponse.ok || data.code !== "success") {
          throw new Error(data.message || "Không đọc được trạng thái.");
        }

        const status = data.device?.current_status;

        if (!["ON", "OFF"].includes(status)) {
          throw new Error("Trạng thái thiết bị không hợp lệ.");
        }

        device.status = status;
        device.toggle.checked = status === "ON";
        device.card.classList.toggle("off", status !== "ON");

        if (status === action) {
          device.note.textContent = "";
          return;
        }
      }

      device.note.textContent =
        "Chưa xác nhận được trạng thái thiết bị. Vui lòng thử lại.";
    } catch (error) {
      device.note.textContent = error.message;
    } finally {
      device.card.classList.remove("loading");
      device.toggle.disabled = false;
    }
  }

  async function loadDevices() {
    for (const device of devices) {
      device.toggle = document.getElementById(`${device.key}-toggle`);
      device.card = document.getElementById(`device-${device.key}`);

      device.toggle.disabled = true;

      device.note = document.createElement("p");
      device.note.classList.add("loading-text");
      device.note.setAttribute("role", "status");
      device.note.textContent = "Đang tải trạng thái...";
      device.card.append(device.note);

      device.toggle.addEventListener("change", () => {
        sendCommand(device);
      });
    }

    try {
      const response = await fetch("/api/devices", {
        signal: AbortSignal.timeout(10000),
      });

      const result = await response.json();

      if (!response.ok || result.code !== "success") {
        throw new Error(result.message || "Không tải được danh sách thiết bị.");
      }

      for (const device of devices) {
        const record = result.data.find(row => row.name === device.name);

        if (!record) {
          device.note.textContent = "Không tìm thấy thiết bị.";
          continue;
        }

        if (!["ON", "OFF"].includes(record.current_status)) {
          device.note.textContent = "Trạng thái thiết bị không hợp lệ.";
          continue;
        }

        device.id = record.id;
        device.status = record.current_status;
        device.toggle.checked = record.current_status === "ON";

        device.card.classList.toggle(
          "off",
          record.current_status !== "ON"
        );

        device.note.textContent = "";
        device.toggle.disabled = false;
      }
    } catch (error) {
      for (const device of devices) {
        device.note.textContent = error.message;
      }
    }
  }

  // =========================
  // KHỞI ĐỘNG
  // =========================
  async function initSensors() {
    try {
      // Tải và vẽ 10 điểm trước.
      await loadSensors();
    } catch (error) {
      message.textContent = error.message;
    } finally {
      // Sau khi API kết thúc mới kết nối socket.
      // Nếu API lỗi, vẫn nhận được các lần đo mới.
      socket.connect();
    }
  }

  initSensors();
  loadDevices();
});