// ============================================
// UTILITY FUNCTIONS
// ============================================

// Lấy dữ liệu từ localStorage và parse thành object
const getData = (key) => JSON.parse(localStorage.getItem(key));

// Lưu dữ liệu vào localStorage dưới dạng JSON string
const setData = (key, data) => localStorage.setItem(key, JSON.stringify(data));

// Chuyển đổi chuỗi ngày thành định dạng Việt Nam (dd/mm/yyyy)
const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString("vi-VN");

// ============================================
// HTML TEMPLATE CHO TRANG INVENTORY
// ============================================
export const inventoryHtml = `
<div class="container" style="padding-top: 20px;">
    <!-- PHẦN CẢNH BÁO TỒN KHO -->
    <h2><i class="fas fa-exclamation-triangle" style="color: orange;"></i> Cảnh Báo Tồn Kho</h2>
    
    <!-- Input tùy chỉnh mức cảnh báo động -->
    <div style="margin-bottom: 15px; padding: 15px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #ffc107;">
        <label style="color: #333; font-weight: bold; display: block; margin-bottom: 8px;">
            <i class="fas fa-sliders-h"></i> Tùy chỉnh mức cảnh báo tồn kho:
        </label>
        <div style="display: flex; gap: 10px; align-items: center;">
            <input 
                type="number" 
                id="threshold-input" 
                placeholder="Nhập số lượng..." 
                min="1"
                value="10"
                style="padding: 10px; border: 2px solid #ffc107; border-radius: 4px; width: 200px; font-size: 16px;"
            >
            <button id="apply-threshold" style="padding: 10px 20px; background: #ffc107; color: #333; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
                <i class="fas fa-check"></i> Áp dụng
            </button>
            <span id="threshold-status" style="color: #666; font-size: 0.9em;">Hiện tại: Sản phẩm có tồn kho ≤ 10 sẽ được cảnh báo</span>
        </div>
    </div>
    
    <!-- Bảng hiển thị sản phẩm cảnh báo -->
    <div id="low-stock-alerts" style="margin-bottom: 30px; background: #fff3cd; padding: 15px; border-radius: 8px; color: #856404; border: 1px solid #ffeeba;">
        Đang tải dữ liệu...
    </div>
    
    <hr style="border-color: #444; opacity: 0.2; margin: 30px 0;">
    
    <!-- PHẦN TRA CỨU THẺ KHO -->
    <h2><i class="fas fa-book"></i> Sổ Chi Tiết Vật Tư (Thẻ Kho)</h2>
    <div class="inventory-filters" style="display: flex; gap: 15px; align-items: flex-end; padding: 20px; background: #2a2a2a; border-radius: 8px; margin-bottom: 20px; color: white;">
        <div style="flex-grow: 1;">
            <label style="color: #ccc; display: block; margin-bottom: 5px;">
                <i class="fas fa-box"></i> Chọn hoặc nhập ID Sản Phẩm:
            </label>
            <!-- Input để nhập trực tiếp ID sản phẩm -->
            <input 
                type="text" 
                id="product-id-input" 
                placeholder="Nhập ID sản phẩm (VD: 1, 2, 3...)" 
                style="width: 100%; padding: 10px; border: 1px solid #555; border-radius: 4px; background: #333; color: white; margin-bottom: 8px;"
            >
            <!-- Input search theo tên -->
            <input 
                type="text" 
                id="product-search" 
                placeholder="Hoặc tìm theo tên sản phẩm..." 
                style="width: 100%; padding: 10px; border: 1px solid #555; border-radius: 4px; background: #333; color: white; margin-bottom: 5px;"
            >
            <!-- Dropdown danh sách sản phẩm -->
            <select id="ledger-product" class="product-select" style="width:100%; padding: 10px; border: 1px solid #555; border-radius: 4px; background: #333; color: white;"></select>
        </div>
        <!-- Bộ lọc ngày tháng -->
        <div style="flex-grow: 1;">
            <label style="color: #ccc;">
                <i class="fas fa-calendar-alt"></i> Từ ngày:
            </label>
            <input type="date" id="ledger-date-from" style="width: 100%; padding: 10px; border-radius: 4px; border: 1px solid #555; background: #333; color: white;">
        </div>
        <div style="flex-grow: 1;">
            <label style="color: #ccc;">
                <i class="fas fa-calendar-check"></i> Đến ngày:
            </label>
            <input type="date" id="ledger-date-to" style="width: 100%; padding: 10px; border-radius: 4px; border: 1px solid #555; background: #333; color: white;">
        </div>
        <button id="ledger-btn" class="button" style="padding: 10px 25px; height: 42px; background: #007bff; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">
            <i class="fas fa-search"></i> Tra cứu
        </button>
    </div>
    
    <!-- Khu vực hiển thị kết quả tra cứu -->
    <div id="ledger-results" style="background: #2a2a2a; padding: 20px; border-radius: 8px; min-height: 200px;">
        <p style="color: #999; text-align: center;">Vui lòng chọn hoặc nhập ID sản phẩm và bấm "Tra cứu" để xem lịch sử xuất nhập tồn.</p>
    </div>
</div>
`;

// ============================================
// HÀM KHỞI TẠO TRANG INVENTORY
// ============================================
export function initInventoryPage() {
  // Lấy tham chiếu các DOM elements
  const lowStockEl = document.getElementById("low-stock-alerts");
  const ledgerProductSelect = document.getElementById("ledger-product");
  const productSearchInput = document.getElementById("product-search");
  const productIdInput = document.getElementById("product-id-input");
  const thresholdInput = document.getElementById("threshold-input");
  const applyThresholdBtn = document.getElementById("apply-threshold");
  const thresholdStatus = document.getElementById("threshold-status");
  const ledgerBtn = document.getElementById("ledger-btn");
  const ledgerResultsEl = document.getElementById("ledger-results");

  // ============================================
  // BIẾN GLOBAL VÀ CACHE DỮ LIỆU
  // ============================================

  // Cache dữ liệu trong memory để tránh parse localStorage nhiều lần
  let cachedProducts = null;
  let cachedImports = null;
  let cachedOrders = null;
  let filteredProducts = null;

  // Mức cảnh báo tồn kho (có thể thay đổi bởi user)
  let customThreshold = 10;

  // Hàm load/refresh cache từ localStorage
  function refreshCache() {
    cachedProducts = getData("products") || [];
    cachedImports = getData("importSlips") || [];
    cachedOrders = getData("orders") || [];
    filteredProducts = [...cachedProducts]; // Clone array để filter
  }

  // Khởi tạo cache lần đầu
  refreshCache();

  // Tạo reference ngắn gọn cho dữ liệu
  const allProducts = cachedProducts;
  const allImports = cachedImports;
  const allOrders = cachedOrders;

  // State cho pagination bảng cảnh báo
  let lowStockPage = 1;
  const lowStockItemsPerPage = 10;

  // ============================================
  // XỬ LÝ MỨC CẢNH BÁO TÙY CHỈNH
  // ============================================

  // Xử lý khi user click nút "Áp dụng" mức cảnh báo mới
  applyThresholdBtn.onclick = () => {
    const inputValue = parseInt(thresholdInput.value);

    // Validate input phải là số dương
    if (isNaN(inputValue) || inputValue < 1) {
      alert("Vui lòng nhập số lượng hợp lệ (≥ 1)!");
      thresholdInput.value = customThreshold;
      return;
    }

    // Cập nhật mức cảnh báo mới
    customThreshold = inputValue;
    thresholdStatus.textContent = `Hiện tại: Sản phẩm có tồn kho ≤ ${customThreshold} sẽ được cảnh báo`;
    thresholdStatus.style.color = "#28a745"; // Màu xanh báo thành công

    // Re-render bảng cảnh báo với mức mới
    lowStockPage = 1;
    renderLowStockAlerts(lowStockPage);

    // Reset màu về bình thường sau 2 giây
    setTimeout(() => {
      thresholdStatus.style.color = "#666";
    }, 2000);
  };

  // Cho phép nhấn Enter trong input để apply
  thresholdInput.onkeypress = (e) => {
    if (e.key === "Enter") {
      applyThresholdBtn.click();
    }
  };

  // ============================================
  // RENDER BẢNG CẢNH BÁO TỒN KHO (CÓ PAGINATION)
  // ============================================

  function renderLowStockAlerts(page = 1) {
    // Lọc sản phẩm có tồn kho <= mức cảnh báo
    const lowStockProducts = allProducts.filter(
      (p) => (p.quantity || 0) <= customThreshold
    );

    // Nếu không có sản phẩm nào cảnh báo, hiển thị thông báo tích cực
    if (lowStockProducts.length === 0) {
      lowStockEl.innerHTML = `<p style='color: green; margin: 0;'><i class='fas fa-check-circle'></i> Tuyệt vời! Tất cả sản phẩm đều có tồn kho trên <strong>${customThreshold}</strong>.</p>`;
      lowStockEl.style.background = "#d4edda";
      lowStockEl.style.color = "#155724";
      lowStockEl.style.borderColor = "#c3e6cb";
      return;
    }

    // Tính toán pagination
    const totalPages = Math.ceil(
      lowStockProducts.length / lowStockItemsPerPage
    );
    const startIdx = (page - 1) * lowStockItemsPerPage;
    const endIdx = Math.min(
      startIdx + lowStockItemsPerPage,
      lowStockProducts.length
    );
    const pageProducts = lowStockProducts.slice(startIdx, endIdx);

    // Build HTML cho bảng với pagination controls
    let html = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <p style="margin: 0; color: #856404;">
                    <strong>${
                      lowStockProducts.length
                    }</strong> sản phẩm có tồn kho ≤ <strong>${customThreshold}</strong>
                    (Hiển thị ${startIdx + 1}-${endIdx})
                </p>
                <div style="display: flex; gap: 5px; align-items: center;">
                    ${
                      page > 1
                        ? `<button onclick="window.renderLowStockPage(${
                            page - 1
                          })" style="padding: 5px 12px; background: #f0ad4e; color: white; border: none; border-radius: 4px; cursor: pointer;">◀ Trước</button>`
                        : '<button disabled style="padding: 5px 12px; background: #ccc; color: #666; border: none; border-radius: 4px; cursor: not-allowed;">◀ Trước</button>'
                    }
                    <span style="padding: 5px 10px; background: #856404; color: white; border-radius: 4px;">Trang ${page}/${totalPages}</span>
                    ${
                      page < totalPages
                        ? `<button onclick="window.renderLowStockPage(${
                            page + 1
                          })" style="padding: 5px 12px; background: #f0ad4e; color: white; border: none; border-radius: 4px; cursor: pointer;">Sau ▶</button>`
                        : '<button disabled style="padding: 5px 12px; background: #ccc; color: #666; border: none; border-radius: 4px; cursor: not-allowed;">Sau ▶</button>'
                    }
                </div>
            </div>
            <table class="table_content" style="width:100%; color: #333; border-collapse: collapse;">
                <thead>
                    <tr style="background: rgba(0,0,0,0.05);">
                        <th style="text-align: left; padding: 10px; border-bottom: 2px solid #856404;">ID</th>
                        <th style="text-align: left; padding: 10px; border-bottom: 2px solid #856404;">Sản phẩm</th>
                        <th style="text-align: center; padding: 10px; border-bottom: 2px solid #856404;">Tồn hiện tại</th>
                        <th style="text-align: center; padding: 10px; border-bottom: 2px solid #856404;">Mức cảnh báo</th>
                        <th style="text-align: right; padding: 10px; border-bottom: 2px solid #856404;">Cần nhập thêm</th>
                    </tr>
                </thead>
                <tbody>`;

    // Render từng dòng sản phẩm trong trang hiện tại
    pageProducts.forEach((p) => {
      html += `
                <tr style="border-bottom: 1px solid #ddd;">
                    <td style="padding: 10px; font-weight: bold; color: #007bff;">#${
                      p.id
                    }</td>
                    <td style="padding: 10px;"><strong>${p.name}</strong></td>
                    <td style="color: #dc3545; font-weight: bold; text-align: center; padding: 10px; font-size: 1.2em;">${
                      p.quantity
                    }</td>
                    <td style="text-align: center; padding: 10px;">≤ ${customThreshold}</td>
                    <td style="text-align: right; padding: 10px; color: #007bff; font-weight: bold;">+${Math.max(
                      1,
                      customThreshold - p.quantity + 1
                    )}</td>
                </tr>
            `;
    });

    html += `</tbody></table>`;
    lowStockEl.innerHTML = html;

    // Reset lại style về warning (vàng)
    lowStockEl.style.background = "#fff3cd";
    lowStockEl.style.color = "#856404";
    lowStockEl.style.borderColor = "#ffeeba";
  }

  // Global function để pagination buttons có thể gọi được
  window.renderLowStockPage = function (page) {
    lowStockPage = page;
    renderLowStockAlerts(page);
  };

  // ============================================
  // SEARCH & LOAD PRODUCT SELECT
  // ============================================

  // Load danh sách sản phẩm vào dropdown (giới hạn 100 items để tối ưu)
  function loadProductSelect(productsToShow = allProducts) {
    if (productsToShow.length === 0) {
      ledgerProductSelect.innerHTML =
        '<option value="">Không tìm thấy sản phẩm</option>';
      return;
    }

    // Format: #ID - Tên (Tồn: số lượng)
    ledgerProductSelect.innerHTML = productsToShow
      .slice(0, 100) // Chỉ hiển thị tối đa 100 items
      .map(
        (p) =>
          `<option value="${p.id}">#${p.id} - ${p.name} (Tồn: ${p.quantity})</option>`
      )
      .join("");
  }

  // Debounce function để tránh search quá nhiều lần khi user đang gõ
  // Wait 300ms sau khi user ngừng gõ mới thực hiện search
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Handler cho search theo tên sản phẩm (với debounce)
  const handleSearch = debounce((searchTerm) => {
    const term = searchTerm.toLowerCase().trim();

    // Nếu search rỗng, hiển thị tất cả
    if (term === "") {
      filteredProducts = [...allProducts];
    } else {
      // Filter theo tên sản phẩm
      filteredProducts = allProducts.filter((p) =>
        p.name.toLowerCase().includes(term)
      );
    }

    loadProductSelect(filteredProducts);

    // Clear ID input khi user đang search theo tên
    if (term !== "") {
      productIdInput.value = "";
    }
  }, 300);

  // Lắng nghe sự kiện input vào search box
  productSearchInput.addEventListener("input", (e) => {
    handleSearch(e.target.value);
  });

  // ============================================
  // XỬ LÝ NHẬP ID SẢN PHẨM
  // ============================================

  // Xử lý khi user nhập vào ô ID
  productIdInput.addEventListener("input", (e) => {
    const idValue = e.target.value.trim();

    // Nếu xóa hết, hiển thị lại tất cả
    if (idValue === "") {
      loadProductSelect(allProducts);
      return;
    }

    // Lọc sản phẩm có ID chứa giá trị nhập vào (support partial match)
    const matchedProducts = allProducts.filter((p) =>
      p.id.toString().includes(idValue)
    );

    loadProductSelect(matchedProducts);

    // Clear search input khi user đang nhập ID
    if (idValue !== "") {
      productSearchInput.value = "";
    }

    // Nếu nhập đúng ID (exact match), tự động select trong dropdown
    const exactMatch = allProducts.find((p) => p.id.toString() === idValue);
    if (exactMatch) {
      ledgerProductSelect.value = exactMatch.id;
    }
  });

  // Cho phép nhấn Enter trong ID input để tra cứu ngay
  productIdInput.onkeypress = (e) => {
    if (e.key === "Enter") {
      const idValue = parseInt(productIdInput.value);
      if (!isNaN(idValue)) {
        const product = allProducts.find((p) => p.id === idValue);
        if (product) {
          ledgerProductSelect.value = product.id;
          ledgerBtn.click(); // Tự động click nút tra cứu
        } else {
          alert("Không tìm thấy sản phẩm với ID: " + idValue);
        }
      }
    }
  };

  // ============================================
  // XỬ LÝ TRA CỨU THẺ KHO
  // ============================================

  ledgerBtn.onclick = () => {
    // Lấy product ID từ dropdown hoặc từ ID input
    let productId = parseInt(ledgerProductSelect.value);

    // Nếu không chọn dropdown, thử lấy từ ID input
    if (isNaN(productId)) {
      const idInputValue = parseInt(productIdInput.value);
      if (!isNaN(idInputValue)) {
        productId = idInputValue;
      }
    }

    // Tìm sản phẩm theo ID
    const product = allProducts.find((p) => p.id === productId);

    // Validate có sản phẩm không
    if (!product) {
      ledgerResultsEl.innerHTML =
        '<p style="color: #e74c3c; text-align: center; padding: 20px;"><i class="fas fa-exclamation-circle"></i> Vui lòng chọn hoặc nhập ID sản phẩm hợp lệ!</p>';
      return;
    }

    // Lấy khoảng thời gian tra cứu
    const dateFrom = document.getElementById("ledger-date-from").value;
    const dateTo = document.getElementById("ledger-date-to").value;

    // Chuyển đổi sang timestamp, nếu không nhập thì dùng giá trị mặc định
    const start = dateFrom ? new Date(dateFrom).setHours(0, 0, 0, 0) : 0; // Từ đầu nếu không nhập
    const end = dateTo ? new Date(dateTo).setHours(23, 59, 59, 999) : Infinity; // Đến hiện tại nếu không nhập

    // Mảng chứa tất cả giao dịch xuất/nhập
    let ledger = [];

    // ========================================
    // LỌC CÁC PHIẾU NHẬP KHO
    // ========================================

    // Chỉ lấy phiếu nhập đã hoàn thành và trong khoảng thời gian
    const relevantImports = allImports.filter((slip) => {
      if (slip.status !== "Hoàn thành") return false;
      const slipDate = new Date(slip.date).getTime();
      return slipDate >= start && slipDate <= end;
    });

    // Duyệt qua các phiếu nhập và lấy sản phẩm khớp
    relevantImports.forEach((slip) => {
      slip.products.forEach((p) => {
        if (p.productId === productId) {
          ledger.push({
            date: new Date(slip.date).getTime(),
            type: "NHẬP",
            quantity: p.quantity, // Số dương cho nhập
            docId: "#NK" + slip.id,
            note: "Nhập hàng",
          });
        }
      });
    });

    // ========================================
    // LỌC CÁC ĐƠN HÀNG (XUẤT KHO)
    // ========================================

    // Các trạng thái được coi là đã xuất hàng
    const soldStatuses = new Set(["Đang vận chuyển", "Giao hàng thành công"]);

    // Lọc orders đã xuất và trong khoảng thời gian
    const relevantOrders = allOrders.filter((order) => {
      if (!soldStatuses.has(order.status)) return false;
      const orderDate = new Date(order.date).getTime();
      return orderDate >= start && orderDate <= end;
    });

    // Duyệt qua orders và lấy sản phẩm khớp
    relevantOrders.forEach((order) => {
      if (order.products) {
        order.products.forEach((p) => {
          if (parseInt(p.productId) === productId) {
            ledger.push({
              date: new Date(order.date).getTime(),
              type: "XUẤT",
              quantity: -p.quantity, // Số âm cho xuất
              docId: "#XB" + order.id,
              note: `Bán hàng (${order.status})`,
            });
          }
        });
      }
    });

    // Sắp xếp các giao dịch theo thời gian tăng dần
    ledger.sort((a, b) => a.date - b.date);

    // Render bảng thẻ kho
    renderLedgerResults(product, ledger, start, end);
  };

  // ============================================
  // RENDER BẢNG THẺ KHO CHI TIẾT
  // ============================================

  function renderLedgerResults(product, ledger, start, end) {
    // Tính tồn đầu kỳ = Tồn hiện tại - Tổng phát sinh trong kỳ
    const totalChangeInPeriod = ledger.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
    const startStock = product.quantity - totalChangeInPeriod;

    // Sử dụng mức cảnh báo tùy chỉnh
    const threshold = customThreshold;

    // Pagination: 50 dòng/trang
    const ROWS_PER_PAGE = 50;
    let currentPage = 1;
    const totalPages = Math.ceil(ledger.length / ROWS_PER_PAGE);

    // Hàm render 1 trang của ledger
    function renderLedgerPage(page) {
      const startIdx = (page - 1) * ROWS_PER_PAGE;
      const endIdx = Math.min(startIdx + ROWS_PER_PAGE, ledger.length);
      const pageItems = ledger.slice(startIdx, endIdx);

      // Tính running stock (tồn kho chạy) tại điểm bắt đầu trang
      let runningStock = startStock;
      for (let i = 0; i < startIdx; i++) {
        runningStock += ledger[i].quantity;
      }

      let rows = "";

      // Render từng dòng giao dịch
      pageItems.forEach((item) => {
        runningStock += item.quantity;

        const isImport = item.quantity > 0;
        const isLowStock = runningStock <= threshold;

        // Highlight dòng nếu tồn kho thấp
        const rowStyle = isLowStock
          ? "background: rgba(231, 76, 60, 0.15); border-left: 4px solid #e74c3c;"
          : "border-bottom: 1px solid #444;";

        rows += `
                    <tr style="${rowStyle}">
                        <td style="padding: 8px;">${formatDate(item.date)}</td>
                        <td style="padding: 8px; color: ${
                          isImport ? "#2ecc71" : "#e74c3c"
                        }; font-weight: bold;">${item.docId}</td>
                        <td style="padding: 8px;">${item.note}</td>
                        <td style="text-align: right; padding: 8px; color: #2ecc71; font-weight: bold;">${
                          isImport ? item.quantity : "-"
                        }</td>
                        <td style="text-align: right; padding: 8px; color: #e74c3c; font-weight: bold;">${
                          !isImport ? Math.abs(item.quantity) : "-"
                        }</td>
                        <td style="text-align: right; padding: 8px; font-weight: bold; font-size: 1.1em; ${
                          isLowStock ? "color: #e74c3c;" : "color: #ffd700;"
                        }">${runningStock}</td>
                        <td style="text-align: center; padding: 8px;">
                            ${
                              isLowStock
                                ? '<span style="color: #e74c3c; font-weight: bold;">⚠️ Thấp</span>'
                                : '<span style="color: #2ecc71;">✓ Ổn định</span>'
                            }
                        </td>
                    </tr>
                `;
      });

      return rows;
    }

    // Tính tổng nhập/xuất cho toàn bộ kỳ
    let totalImportAll = 0;
    let totalExportAll = 0;
    ledger.forEach((item) => {
      if (item.quantity > 0) totalImportAll += item.quantity;
      else totalExportAll += Math.abs(item.quantity);
    });

    // Tồn cuối kỳ
    const endStock = startStock + totalChangeInPeriod;
    const endStockLow = endStock <= threshold;

    // Build HTML cho toàn bộ bảng
    let html = `
            <h3 style="color: #00bfff; margin-top: 0;">📋 Thẻ kho: #${
              product.id
            } - ${product.name}</h3>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <p style="color: #ccc; margin: 0;">
                    Giai đoạn: <strong>${
                      start === 0 ? "Ban đầu" : formatDate(start)
                    }</strong> 
                    → <strong>${
                      end === Infinity ? "Nay" : formatDate(end)
                    }</strong>
                    | Tổng giao dịch: <strong style="color: #00bfff;">${
                      ledger.length
                    }</strong>
                </p>
                <p style="color: #ffa500; margin: 0; font-size: 0.95em;">
                    <i class="fas fa-info-circle"></i> Mức cảnh báo hiện tại: <strong>${threshold}</strong>
                </p>
            </div>
            
            <div style="overflow-x: auto;">
                <table class="report-table" style="width:100%; margin-top: 15px; color: #e0e0e0; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #333; color: #00bfff;">
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #00bfff;">Ngày tháng</th>
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #00bfff;">Chứng từ</th>
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #00bfff;">Diễn giải</th>
                            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #00bfff;">Nhập</th>
                            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #00bfff;">Xuất</th>
                            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #00bfff;">Tồn kho</th>
                            <th style="padding: 12px; text-align: center; border-bottom: 2px solid #00bfff;">Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody id="ledger-tbody">
                        <!-- Dòng đầu tiên: Số dư đầu kỳ -->
                        <tr style="background: #2f3640; font-weight: bold;">
                            <td colspan="5" style="padding: 12px;">SỐ DƯ ĐẦU KỲ</td>
                            <td style="text-align: right; color: #ffd700; font-size: 1.2em; padding: 12px;">${startStock}</td>
                            <td style="text-align: center; padding: 12px;">
                                ${
                                  startStock <= threshold
                                    ? '<span style="color: #e74c3c; font-weight: bold;">⚠️ Thấp</span>'
                                    : '<span style="color: #2ecc71;">✓ Ổn định</span>'
                                }
                            </td>
                        </tr>
                        <!-- Các dòng giao dịch -->
                        ${
                          ledger.length === 0
                            ? '<tr><td colspan="7" style="text-align:center; padding: 20px; color: #999;">Không phát sinh giao dịch trong kỳ này.</td></tr>'
                            : renderLedgerPage(1)
                        }
                        <!-- Dòng cuối: Tổng cộng -->
                        <tr style="${
                          endStockLow
                            ? "background: rgba(231, 76, 60, 0.2); border-left: 4px solid #e74c3c;"
                            : "background: #2f3640;"
                        } font-weight: bold;">
                            <td colspan="3" style="padding: 12px; font-size: 1.1em;">TỔNG CỘNG PHÁT SINH</td>
                            <td style="text-align: right; color: #2ecc71; font-size: 1.2em; padding: 12px;">${totalImportAll}</td>
                            <td style="text-align: right; color: #e74c3c; font-size: 1.2em; padding: 12px;">${totalExportAll}</td>
                            <td style="text-align: right; color: ${
                              endStockLow ? "#e74c3c" : "#ffd700"
                            }; font-size: 1.3em; padding: 12px;">${endStock}</td>
                            <td style="text-align: center; padding: 12px;">
                                ${
                                  endStockLow
                                    ? '<span style="color: #e74c3c; font-weight: bold; font-size: 1.1em;">⚠️ CẦN NHẬP</span>'
                                    : '<span style="color: #2ecc71; font-size: 1.1em;">✓ Ổn định</span>'
                                }
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <!-- Pagination controls nếu có nhiều hơn 1 trang -->
            ${
              totalPages > 1
                ? `
                <div style="display: flex; justify-content: center; gap: 10px; margin-top: 20px; align-items: center;">
                    <button id="prev-ledger" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
                        ◀ Trước
                    </button>
                    <span id="ledger-page-info" style="color: #ccc; padding: 10px 15px; background: #333; border-radius: 4px;">
                        Trang <strong>1</strong>/<strong>${totalPages}</strong>
                    </span>
                    <button id="next-ledger" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
                        Sau ▶
                    </button>
                </div>
            `
                : ""
            }
            
            <!-- Thông tin tồn kho hiện tại thực tế -->
            <div style="margin-top: 20px; padding: 15px; background: #333; border-radius: 8px; border-left: 4px solid ${
              product.quantity <= threshold ? "#e74c3c" : "#00bfff"
            };">
                <p style="text-align: right; margin: 0; font-size: 1.2em; color: #ccc;">
                    Tồn kho hiện tại thực tế: 
                    <strong style="color: ${
                      product.quantity <= threshold ? "#e74c3c" : "#00bfff"
                    }; font-size: 1.4em;">${product.quantity}</strong>
                    ${
                      product.quantity <= threshold
                        ? '<span style="color: #e74c3c; margin-left: 15px; font-weight: bold;">⚠️ DƯỚI MỨC CẢNH BÁO</span>'
                        : '<span style="color: #2ecc71; margin-left: 15px;">✓ Đủ hàng</span>'
                    }
                </p>
            </div>
        `;

    // Render HTML vào DOM
    ledgerResultsEl.innerHTML = html;

    // ========================================
    // XỬ LÝ PAGINATION CHO BẢNG LEDGER
    // ========================================

    if (totalPages > 1) {
      const prevBtn = document.getElementById("prev-ledger");
      const nextBtn = document.getElementById("next-ledger");
      const pageInfo = document.getElementById("ledger-page-info");

      // Xử lý nút Previous
      prevBtn.onclick = () => {
        if (currentPage > 1) {
          currentPage--;
          // Re-render tbody với trang mới
          document.getElementById("ledger-tbody").innerHTML = `
                        <tr style="background: #2f3640; font-weight: bold;">
                            <td colspan="5" style="padding: 12px;">SỐ DƯ ĐẦU KỲ</td>
                            <td style="text-align: right; color: #ffd700; font-size: 1.2em; padding: 12px;">${startStock}</td>
                            <td style="text-align: center; padding: 12px;">
                                ${
                                  startStock <= threshold
                                    ? '<span style="color: #e74c3c;">⚠️</span>'
                                    : '<span style="color: #2ecc71;">✓</span>'
                                }
                            </td>
                        </tr>
                        ${renderLedgerPage(currentPage)}
                        <tr style="${
                          endStockLow
                            ? "background: rgba(231, 76, 60, 0.2);"
                            : "background: #2f3640;"
                        } font-weight: bold;">
                            <td colspan="3" style="padding: 12px;">TỔNG CỘNG</td>
                            <td style="text-align: right; color: #2ecc71; padding: 12px;">${totalImportAll}</td>
                            <td style="text-align: right; color: #e74c3c; padding: 12px;">${totalExportAll}</td>
                            <td style="text-align: right; color: ${
                              endStockLow ? "#e74c3c" : "#ffd700"
                            }; padding: 12px;">${endStock}</td>
                            <td style="text-align: center; padding: 12px;">
                                ${
                                  endStockLow
                                    ? '<span style="color: #e74c3c;">⚠️</span>'
                                    : '<span style="color: #2ecc71;">✓</span>'
                                }
                            </td>
                        </tr>
                    `;
          pageInfo.innerHTML = `Trang <strong>${currentPage}</strong>/<strong>${totalPages}</strong>`;
        }
      };

      // Xử lý nút Next
      nextBtn.onclick = () => {
        if (currentPage < totalPages) {
          currentPage++;
          // Re-render tbody với trang mới
          document.getElementById("ledger-tbody").innerHTML = `
                        <tr style="background: #2f3640; font-weight: bold;">
                            <td colspan="5" style="padding: 12px;">SỐ DƯ ĐẦU KỲ</td>
                            <td style="text-align: right; color: #ffd700; font-size: 1.2em; padding: 12px;">${startStock}</td>
                            <td style="text-align: center; padding: 12px;">
                                ${
                                  startStock <= threshold
                                    ? '<span style="color: #e74c3c;">⚠️</span>'
                                    : '<span style="color: #2ecc71;">✓</span>'
                                }
                            </td>
                        </tr>
                        ${renderLedgerPage(currentPage)}
                        <tr style="${
                          endStockLow
                            ? "background: rgba(231, 76, 60, 0.2);"
                            : "background: #2f3640;"
                        } font-weight: bold;">
                            <td colspan="3" style="padding: 12px;">TỔNG CỘNG</td>
                            <td style="text-align: right; color: #2ecc71; padding: 12px;">${totalImportAll}</td>
                            <td style="text-align: right; color: #e74c3c; padding: 12px;">${totalExportAll}</td>
                            <td style="text-align: right; color: ${
                              endStockLow ? "#e74c3c" : "#ffd700"
                            }; padding: 12px;">${endStock}</td>
                            <td style="text-align: center; padding: 12px;">
                                ${
                                  endStockLow
                                    ? '<span style="color: #e74c3c;">⚠️</span>'
                                    : '<span style="color: #2ecc71;">✓</span>'
                                }
                            </td>
                        </tr>
                    `;
          pageInfo.innerHTML = `Trang <strong>${currentPage}</strong>/<strong>${totalPages}</strong>`;
        }
      };
    }
  }

  // ============================================
  // KHỞI TẠO TRANG KHI LOAD
  // ============================================

  // Render bảng cảnh báo tồn kho
  renderLowStockAlerts(lowStockPage);

  // Load danh sách sản phẩm vào dropdown
  loadProductSelect(filteredProducts);
}
