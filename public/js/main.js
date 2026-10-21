'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const message = document.getElementById('dashboard-message');
  const displays = { Temp: ['temp-value', '°C'], Hum: ['humid-value', '%'], Lux: ['light-value', ' LX'] };
  if (typeof Chart !== 'undefined') ChartsModule.init();
  DevicesModule.init();
  let stopped = false;
  let timer;

  function loadSensors() {
    fetch('/api/sensors-data/chart', { signal: AbortSignal.timeout(10000) })
      .then(res => res.json()).then(data => {
        if (data.code === 'success') {
          ChartsModule.update(data);
          document.getElementById("temp-value").textContent =
            `${data.Temperature[0]?.value ?? "--"}°C`;

          document.getElementById("humid-value").textContent =
            `${data.Humidity[0]?.value ?? "--"}%`;

          document.getElementById("light-value").textContent =
            `${data.Light[0]?.value ?? "--"} LX`;
        }
      }).catch(error => {
        console.error("Lỗi tải cảm biến:", error.message);
      }).finally(() => {
        setTimeout(loadSensors, 2000);
      });
  }

  loadSensors();
  window.addEventListener('pagehide', () => { stopped = true; clearTimeout(timer); });
  window.addEventListener('pageshow', event => {
    if (event.persisted) { stopped = false; loadSensors(); }
  });
});
