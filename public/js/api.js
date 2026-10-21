'use strict';

// API contract: see API-CONTRACT.md. No fallback or generated records.
const Api = (() => {
  function request(url, options = {}) {
    return fetch(url, { ...options, signal: options.signal || AbortSignal.timeout(10000) })
      .then(response => response.json().catch(() => {
        throw new Error(`API chưa sẵn sàng hoặc không trả JSON (HTTP ${response.status}).`);
      }).then(body => {
        if (!response.ok) throw new Error(body.message || `HTTP ${response.status}`);
        return body;
      }));
  }

  function get(url, params = {}, signal) {
    return request(`${url}?${new URLSearchParams(params)}`, { signal });
  }

  function message(element, text) {
    element.textContent = text;
    element.setAttribute('role', 'status');
  }

  function time(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '--';
    const pad = n => String(n).padStart(2, '0');
    return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }

  return { request, get, message, time };
})();
