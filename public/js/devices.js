/**
 * devices.js
 * Manages device toggle switches and their visual state.
 */

'use strict';

const DevicesModule = (() => {

  /* ── Device registry ──────────────────────────────────────────────── */
  const DEVICES = [
    {
      toggleId: 'fan-toggle',
      cardId: 'device-fan',
      name: 'Quạt',
      onColor: '#f44336',
    },
    {
      toggleId: 'ac-toggle',
      cardId: 'device-ac',
      name: 'Điều hòa',
      onColor: '#2196F3',
    },
    {
      toggleId: 'light-toggle',
      cardId: 'device-light',
      name: 'Đèn',
      onColor: '#FFC107',
    },
  ];

  /* ── Apply visual state based on checkbox ─────────────────────────── */
  function applyState(device, isOn) {
    const card = document.getElementById(device.cardId);
    if (!card) return;
    if (isOn) {
      card.classList.remove('off');
    } else {
      card.classList.add('off');
    }
  }

  /* ── Bind toggle events ───────────────────────────────────────────── */
  function init() {
    DEVICES.forEach(device => {
      const toggle = document.getElementById(device.toggleId);
      if (!toggle) return;

      applyState(device, toggle.checked);

      toggle.addEventListener('change', () => {
        const card = document.getElementById(device.cardId);
        const isOn = toggle.checked;

        toggle.disabled = true;
        card?.classList.add('loading');

        // Tạo chữ Loading
        const loadingText = document.createElement('div');
        loadingText.className = 'loading-text';
        loadingText.textContent = 'Loading...';
        card?.appendChild(loadingText);

        setTimeout(() => {
          applyState(device, isOn);
          loadingText.remove();
          card?.classList.remove('loading');
          toggle.disabled = false;
        }, 1000);
      });
    });
  }

  /* ── Public: get current state of all devices ─────────────────────── */
  function getStates() {
    return DEVICES.reduce((acc, device) => {
      const toggle = document.getElementById(device.toggleId);
      acc[device.toggleId] = toggle ? toggle.checked : false;
      return acc;
    }, {});
  }

  return { init, getStates };
})();
