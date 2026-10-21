"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const message = document.getElementById("dashboard-message");

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

  async function loadSensors() {
    try {
      const response = await fetch("/api/sensors-data/chart", {
        signal: AbortSignal.timeout(2000),
      });

      if (!response.ok) {
        throw new Error("Không tải được cảm biến.");
      }

      const result = await response.json();

      // API trả mới nhất trước, đảo lại để vẽ cũ đến mới.
      const temperatures = [...result.Temperature].reverse();
      const humidities = [...result.Humidity].reverse();
      const lights = [...result.Light].reverse();

      tempChart.data.labels = temperatures.map(row =>
        new Date(row.created_at).toLocaleTimeString("vi-VN")
      );
      tempChart.data.datasets[0].data =
        temperatures.map(row => row.value);
      tempChart.update("none");

      humidChart.data.labels = humidities.map(row =>
        new Date(row.created_at).toLocaleTimeString("vi-VN")
      );
      humidChart.data.datasets[0].data =
        humidities.map(row => row.value);
      humidChart.update("none");

      lightChart.data.labels = lights.map(row =>
        new Date(row.created_at).toLocaleTimeString("vi-VN")
      );
      lightChart.data.datasets[0].data =
        lights.map(row => row.value);
      lightChart.update("none");

      document.getElementById("temp-value").textContent =
        `${result.Temperature[0]?.value ?? "--"}°C`;

      document.getElementById("humid-value").textContent =
        `${result.Humidity[0]?.value ?? "--"}%`;

      document.getElementById("light-value").textContent =
        `${result.Light[0]?.value ?? "--"} LX`;

      message.textContent = "";
    } catch (error) {
      message.textContent = error.message;
    } finally {
      setTimeout(loadSensors, 2000);
    }
  }

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

  // Giữ nút ở trạng thái cũ trong khi chờ
  device.toggle.checked = device.status === "ON";
  device.toggle.disabled = true;
  device.card.classList.add("loading");
  device.note.textContent = "Đang gửi lệnh...";

  try {
    // 1. Gửi lệnh
    const response = await fetch(`/api/devices/${device.id}/control`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action }),
      signal: AbortSignal.timeout(10000),
    });

    const result = await response.json();

    if (result.code !== "success") {
      throw new Error(result.message || "Gửi lệnh thất bại.");
    }

    device.note.textContent = "Đang chờ thiết bị...";

    // 2. Kiểm tra trạng thái tối đa 10 lần
    for (let i = 0; i < 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 500));

      const response = await fetch(`/api/devices/${device.id}`, {
        signal: AbortSignal.timeout(3000),
      });

      const data = await response.json();

      if (data.code !== "success") {
        throw new Error(data.message || "Không đọc được trạng thái.");
      }

      const status = data.device.current_status;
      device.status = status;
      device.toggle.checked = status === "ON";
      device.card.classList.toggle("off", status !== "ON");

      if (status === action) {
        device.note.textContent = "";
        return;
      }
    }

    device.note.textContent = "Bật/Tắt thất bại!Vui lòng thử lại!.";
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
      device.note.classList.add("loading-text"); // Thêm ở đây
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

      if (!response.ok) {
        throw new Error("Không tải được danh sách thiết bị.");
      }

      const result = await response.json();

      for (const device of devices) {
        const record = result.data.find(row => row.name === device.name);

        if (!record) {
          device.note.textContent = "Không tìm thấy thiết bị.";
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

  loadSensors();
  loadDevices();
});