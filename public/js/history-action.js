'use strict';

(() => {
  const search = document.getElementById('ha-search');
  const device = document.getElementById('ha-device');
  const action = document.getElementById('ha-action');
  const status = document.getElementById('ha-status');
  const sort = document.getElementById('ha-sort');
  let keyword = '';

  const table = createApiTable({
    endpoint: '/api/actions',
    prefix: 'ha',
    params: () => ({
      search: keyword, device: device.value, action: action.value,
      status: status.value, sort: sort.value,
    }),
    columns: row => [
      [row.device_id, 'ha-col-id'],
      [row.device?.name, 'ha-col-name'],
      [row.action, `ha-col-action ${row.action === 'ON' ? 'action-on' : 'action-off'}`],
      [row.status === 'WAITING' ? 'WAITING...' : row.status,
        `ha-col-status ${{ SUCCESS: 'status-success', FAILED: 'status-failed' }[row.status] || 'status-waiting'}`],
      [Api.time(row.created_at), 'ha-col-time'],
    ],
  });

  search.addEventListener('keydown', event => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    keyword = search.value.trim();
    table.load();
  });
  [device, action, status, sort].forEach(select => {
    select.addEventListener('change', () => table.load());
  });
  table.load();
})();
