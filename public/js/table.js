'use strict';

// Shared API pagination. The server filters/sorts the whole dataset before paging.
function createApiTable({ endpoint, prefix, params, columns }) {
  const tbody = document.getElementById(`${prefix}-table-body`);
  const pagination = document.getElementById(`${prefix}-pagination`);
  let page = 1;
  let pending;

  function showMessage(text) {
    tbody.replaceChildren();
    const cell = tbody.insertRow().insertCell();
    cell.colSpan = 5;
    Api.message(cell, text);
  }

  function button(label, target, disabled, active = false) {
    const element = document.createElement('button');
    element.type = 'button';
    element.className = `pg-btn${active ? ' active' : ''}`;
    element.textContent = label;
    element.disabled = disabled;
    element.addEventListener('click', () => load(target));
    pagination.append(element);
  }

  function load(nextPage = 1) {
    pending?.abort();
    const controller = new AbortController();
    pending = controller;
    page = nextPage;
    showMessage('Đang tải dữ liệu...');
    pagination.replaceChildren();

    return Api.get(endpoint, { ...params(), page, limit: 10 }, controller.signal)
      .then(body => {
        if (controller.signal.aborted) return;
        if (!Array.isArray(body.data) || !Number.isInteger(body.total) || body.total < 0) {
          throw new Error('API trả sai định dạng dữ liệu.');
        }
        const totalPages = Math.max(1, Math.ceil(body.total / 10));
        if (page > totalPages) return load(totalPages);
        tbody.replaceChildren();
        if (!body.data.length) showMessage('Không có dữ liệu phù hợp.');
        body.data.forEach(record => {
          const row = tbody.insertRow();
          columns(record).forEach(([text, className]) => {
            const cell = row.insertCell();
            cell.textContent = text ?? '--';
            cell.className = className || '';
          });
        });
        button('<', page - 1, page === 1);
        const pages = [...new Set([1, page - 1, page, page + 1, totalPages])]
          .filter(p => p >= 1 && p <= totalPages).sort((a, b) => a - b);
        pages.forEach((p, index) => {
          if (index && p - pages[index - 1] > 1) button('...', page, true);
          button(String(p), p, p === page, p === page);
        });
        button('>', page + 1, page === totalPages);
      })
      .catch(error => {
        if (controller.signal.aborted) return;
        showMessage(`Không tải được dữ liệu: ${error.message}`);
        button('Thử lại', page, false);
      });
  }

  return { load };
}
