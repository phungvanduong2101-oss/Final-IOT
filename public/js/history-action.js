'use strict';

const searchInput = document.getElementById('ha-search');
const deviceSelect = document.getElementById('ha-device');
const statusSelect = document.getElementById('ha-status');
const sortSelect = document.getElementById('ha-sort');
const itemsSelect = document.getElementById('ha-items');
const resetButton = document.getElementById('ha-reset');

const tableBody = document.getElementById('ha-table-body');
const pagination = document.getElementById('ha-pagination');

let currentPage = 1;
let keyword = '';
let loading = false;

// Lấy dữ liệu từ server.
async function loadActions() {
  if (loading) return;
  loading = true;

  tableBody.innerHTML = `
    <tr>
      <td colspan="5">Đang tải dữ liệu...</td>
    </tr>
  `;
  pagination.replaceChildren();

  try {
    const params = new URLSearchParams({
      search: keyword,
      device: deviceSelect.value,
      status: statusSelect.value,
      sort: sortSelect.value,
      limit: itemsSelect.value,
      page: currentPage,
    });

    const response = await fetch(`/api/actions?${params}`);

    if (!response.ok) {
      throw new Error('Không tải được lịch sử thao tác.');
    }

    const result = await response.json();

    // Đổi tên trường tại đây nếu API trả về tên khác.
    const actions = result.data;
    const totalPages = Number(result.totalPages);

    currentPage = Number(result.currentPage);

    renderTable(actions);
    renderPagination(totalPages); 
     
    const displayCount = document.getElementById('ha-summary');
    displayCount.textContent = `Hiển thị ${result.skip + 1} - ${result.skip + actions.length} trong tổng số ${result.total} bản ghi.`;
  } catch (error) {
    showMessage(error.message);
  } finally {
    loading = false;
  }
}

// Hiển thị thông báo trong bảng.
function showMessage(message) {
  tableBody.replaceChildren();

  const row = document.createElement('tr');
  const cell = document.createElement('td');

  cell.colSpan = 5;
  cell.textContent = message;

  row.appendChild(cell);
  tableBody.appendChild(row);
}

// Tạo một ô dữ liệu.
function createCell(value, className) {
  const cell = document.createElement('td');

  cell.textContent = value ?? '—';
  cell.className = className;

  return cell;
}

// Hiển thị danh sách thao tác.
function renderTable(actions) {
  tableBody.replaceChildren();

  if (actions.length === 0) {
    showMessage('Không có dữ liệu.');
    return;
  }

  for (const action of actions) {
    const row = document.createElement('tr');

    let actionClass = 'action-off';

    if (action.action === 'ON') {
      actionClass = 'action-on';
    }

    let statusClass = 'status-waiting';

    if (action.status === 'SUCCESS') {
      statusClass = 'status-success';
    } else if (action.status === 'FAILED') {
      statusClass = 'status-failed';
    }

    let statusText = action.status;

    if (action.status === 'WAITING') {
      statusText = 'WAITING...';
    }

    row.append(
      createCell(action.device_id, 'ha-col-id'),
      createCell(action.device?.name, 'ha-col-name'),
      createCell(action.action, `ha-col-action ${actionClass}`),
      createCell(statusText, `ha-col-status ${statusClass}`),
      createCell(Api.time(action.created_at), 'ha-col-time'),
    );

    tableBody.appendChild(row);
  }
}

// Hiển thị các nút phân trang.
function renderPagination(totalPages) {
  pagination.replaceChildren();

  if (totalPages <= 1) return;
       
  if(currentPage!=1) 
  addPageButton('<', currentPage - 1, currentPage === 1);

  // Hiển thị tối đa 5 nút số trang.
  const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
  const end = Math.min(totalPages, start + 4);

  for (let page = start; page <= end; page++) {
    addPageButton(String(page), page, page === currentPage);
  }

  addPageButton('>', currentPage + 1, currentPage === totalPages); 

}

// Tạo một nút chuyển trang.
function addPageButton(text, page, disabled) {
  const button = document.createElement('button');

  button.type = 'button'; 
  button.classList.add('pg-btn');
  button.textContent = text;
  button.disabled = disabled;

  if (page === currentPage && text === String(page)) {
    button.classList.add('active');
  }

  button.addEventListener('click', () => {
    if (loading) return;

    currentPage = page;
    loadActions();
  });

  pagination.appendChild(button);
}

// Khi tìm kiếm hoặc đổi bộ lọc, quay về trang 1.
function reloadFromFirstPage() {
  if (loading) return;

  currentPage = 1;
  loadActions();
}

// Nhấn Enter để tìm kiếm.
searchInput.addEventListener('keydown', event => {
  if (event.key !== 'Enter' || loading) return;

  event.preventDefault();
  keyword = searchInput.value.trim();

  reloadFromFirstPage();
});

// Đổi bộ lọc hoặc số dòng mỗi trang.
deviceSelect.addEventListener('change', reloadFromFirstPage);
statusSelect.addEventListener('change', reloadFromFirstPage);
sortSelect.addEventListener('change', reloadFromFirstPage);
itemsSelect.addEventListener('change', reloadFromFirstPage);

// Đặt lại bộ lọc.
resetButton.addEventListener('click', () => {
  if (loading) return;

  searchInput.value = '';
  keyword = '';

  deviceSelect.value = 'ALL';
  statusSelect.value = 'ALL';
  sortSelect.value = 'DESC';
  itemsSelect.value = '10';

  reloadFromFirstPage();
});

// Tải dữ liệu khi mở trang.
loadActions();