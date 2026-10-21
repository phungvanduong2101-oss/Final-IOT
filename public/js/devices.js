"use strict";

const DevicesModule = (() => {
  const devices = [
    { key: "fan", name: "Quạt" },
    { key: "ac", name: "Điều hòa" },
    { key: "light", name: "Đèn" },
  ];

  function applyState(device, status) {
    device.status = status;
    device.toggle.checked = status === "ON";
    device.card.classList.toggle("off", status !== "ON");
  }

  async function readDevice(device) {
    const response = await fetch(`/api/devices/${device.id}`, {
      signal: AbortSignal.timeout(10000),
    });

    const result = await response.json();

    if (!response.ok || result.code !== "success") {
      throw new Error(result.message || "Không tải được thiết bị.");
    }

    const status = result.device?.current_status;

    if (!["ON", "OFF"].includes(status)) {
      throw new Error("API trả trạng thái thiết bị không hợp lệ.");
    }

    applyState(device, status);

    return status;
  }

  async function waitForState(device, expected) {
    for (let i = 0; i < 10; i++) {
      const status = await readDevice(device);

      if (status === expected) return;

      if (i < 9) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    throw new Error("Chưa xác nhận được trạng thái mong muốn.");
  }

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

      const status = result.data?.status;

      if (status === "FAILED") {
        throw new Error(result.message || "Thiết bị thực hiện lệnh thất bại.");
      }

      if (!["SUCCESS", "WAITING", "FAILED"].includes(status)) {
        throw new Error("API trả trạng thái lệnh không hợp lệ.");
      }

      device.note.textContent = "Đang chờ trạng thái thiết bị...";

      await waitForState(device, action);

      device.note.textContent = "";
    } catch (error) {
      device.note.textContent = error.message;

      try {
        await readDevice(device);
      } catch {
        device.status = null;
        device.note.textContent += " Không đọc được trạng thái; tải lại trang.";
      }
    } finally {
      device.card.classList.remove("loading");
      device.toggle.disabled = device.status === null;
    }
  }

  async function init() {
    for (const device of devices) {
      device.toggle = document.getElementById(`${device.key}-toggle`);
      device.card = document.getElementById(`device-${device.key}`);

      device.note = document.createElement("p");
      device.note.setAttribute("role", "status");
      device.card.append(device.note);

      device.toggle.disabled = true;
      device.note.textContent = "Đang tải trạng thái...";

      device.toggle.addEventListener("change", () => {
        sendCommand(device);
      });
    }

    try {
      const response = await fetch("/api/devices", {
        signal: AbortSignal.timeout(10000),
      });

      const result = await response.json();

      if (!response.ok || !Array.isArray(result.data)) {
        throw new Error(result.message || "Không tải được danh sách thiết bị.");
      }

      for (const device of devices) {
        const record = result.data.find(item => item.name === device.name);

        if (!record || !["ON", "OFF"].includes(record.current_status)) {
          device.note.textContent = "Chưa có thiết bị hoặc trạng thái không hợp lệ.";
          continue;
        }

        device.id = record.id;

        applyState(device, record.current_status);

        device.note.textContent = "";
        device.toggle.disabled = false;
      }
    } catch (error) {
      for (const device of devices) {
        device.note.textContent = error.message;
      }
    }
  }

  return { init };
})();