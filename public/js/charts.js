/**
 * charts.js
 * Manages Chart.js initialization and live data updates for all sensor charts.
 */

'use strict';

/* ── Shared chart defaults ───────────────────────────────────────────── */
const CHART_DEFAULTS = {
  maxPoints: 10,
  tension:   0.4,
  borderWidth: 2,
  fill: false,
  pointRadius: 0,
  pointHoverRadius: 4,
};

/* ── Helper: build dashed grid line plugin options ───────────────────── */
function gridOptions() {
  return {
    color: '#d0d0d0',
    lineWidth: 1,
    borderDash: [4, 4],
  };
}

/* ────────────────────────────────────────────────────────────────────── */
/*  Temperature Chart                                                     */
/* ────────────────────────────────────────────────────────────────────── */
function createTempChart() {
  const ctx = document.getElementById('tempChart').getContext('2d');
  return new Chart(ctx, {
    type: 'line',
    data: {
      labels:   [],
      datasets: [{
        label:       'Nhiệt độ (°C)',
        data:        [],
        borderColor: '#f44336',
        backgroundColor: 'rgba(244,67,54,0.08)',
        fill:        true,
        tension:     CHART_DEFAULTS.tension,
        borderWidth: CHART_DEFAULTS.borderWidth,
        pointRadius: CHART_DEFAULTS.pointRadius,
        pointHoverRadius: CHART_DEFAULTS.pointHoverRadius,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      scales: {
        x: {
          ticks: { font: { size: 10 }, color: '#888', maxRotation: 0, autoSkip: true, maxTicksLimit: 10 },
          grid:  gridOptions(),
        },
        y: {
          min: 5,
          max: 50,
          ticks: { stepSize: 5, font: { size: 10 }, color: '#888' },
          grid:  gridOptions(),
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.parsed.y.toFixed(1)} °C`,
          },
        },
      },
    },
  });
}

/* ────────────────────────────────────────────────────────────────────── */
/*  Humidity Chart                                                        */
/* ────────────────────────────────────────────────────────────────────── */
function createHumidChart() {
  const ctx = document.getElementById('humidChart').getContext('2d');
  return new Chart(ctx, {
    type: 'line',
    data: {
      labels:   [],
      datasets: [{
        label:       'Độ ẩm (%)',
        data:        [],
        borderColor: '#2196F3',
        backgroundColor: 'rgba(33,150,243,0.08)',
        fill:        true,
        tension:     CHART_DEFAULTS.tension,
        borderWidth: CHART_DEFAULTS.borderWidth,
        pointRadius: CHART_DEFAULTS.pointRadius,
        pointHoverRadius: CHART_DEFAULTS.pointHoverRadius,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      scales: {
        x: {
          ticks: { font: { size: 10 }, color: '#888', maxRotation: 0, autoSkip: true, maxTicksLimit: 10 },
          grid:  gridOptions(),
        },
        y: {
          min: 0,
          max: 100,
          ticks: { stepSize: 10, font: { size: 10 }, color: '#888' },
          grid:  gridOptions(),
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.parsed.y.toFixed(1)} %`,
          },
        },
      },
    },
  });
}

/* ────────────────────────────────────────────────────────────────────── */
/*  Light Chart                                                           */
/* ────────────────────────────────────────────────────────────────────── */
function createLightChart() {
  const ctx = document.getElementById('lightChart').getContext('2d');
  return new Chart(ctx, {
    type: 'line',
    data: {
      labels:   [],
      datasets: [{
        label:       'Ánh sáng (Lux)',
        data:        [],
        borderColor: '#FFC107',
        backgroundColor: 'rgba(255,193,7,0.08)',
        fill:        true,
        tension:     CHART_DEFAULTS.tension,
        borderWidth: CHART_DEFAULTS.borderWidth,
        pointRadius: CHART_DEFAULTS.pointRadius,
        pointHoverRadius: CHART_DEFAULTS.pointHoverRadius,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      scales: {
        x: {
          ticks: { font: { size: 10 }, color: '#888', maxRotation: 0, autoSkip: true, maxTicksLimit: 10 },
          grid:  gridOptions(),
        },
        y: {
          min: 0,
          max: 1000,
          ticks: { stepSize: 100, font: { size: 10 }, color: '#888' },
          grid:  gridOptions(),
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.parsed.y.toFixed(0)} Lux`,
          },
        },
      },
    },
  });
}

/* ── Public API ──────────────────────────────────────────────────────── */
const ChartsModule = (() => {
  let tempChart, humidChart, lightChart;
 
  function init() {
    tempChart  = createTempChart();
    humidChart = createHumidChart();
    lightChart = createLightChart();
  }

  // rows are persisted SensorData records, ordered by created_at.
function update(data) {
  const charts = {
    Temperature: tempChart,
    Humidity: humidChart,
    Light: lightChart,
  };

  Object.entries(charts).forEach(([type, chart]) => {
    // Backend trả mới nhất trước → đảo lại để vẽ cũ đến mới.
    const rows = [...data[type]].reverse();

    chart.data.labels = rows.map(row =>
      new Date(row.created_at).toLocaleTimeString("vi-VN")
    );

    chart.data.datasets[0].data = rows.map(row => row.value);

    chart.update("none");
  });
}

  return { init, update };
})();
