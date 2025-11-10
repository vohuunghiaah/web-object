// ============================================
// DASHBOARD DATA API (MOCK)
// Cung cấp các endpoints giả lập để lấy dữ liệu dashboard
// Khi có backend thật, thay thế các hàm này bằng fetch('/api/...')
// ============================================

const getData = (key) => JSON.parse(localStorage.getItem(key)) || [];
const formatCurrency = (val) =>
  (val || 0).toLocaleString("vi-VN", { style: "currency", currency: "VND" });
const formatNumber = (val) => (val || 0).toLocaleString("vi-VN");

// Mock API endpoints cho dashboard
export const DashboardAPI = {
  /**
   * Lấy tổng quan các chỉ số KPI
   * @param {string} range - Khoảng thời gian: 'today', '7d', '30d', '90d'
   * @returns {Object} Tổng hợp doanh thu, đơn hàng, khách hàng, sản phẩm
   */
  getSummary(range = "30d") {
    const orders = getData("orders");
    const products = getData("products");
    const customers = getData("customers");

    const { startDate } = getDateRange(range);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Tính doanh thu hôm nay (chỉ đơn thành công)
    const todayOrders = orders.filter((o) => {
      const orderDate = new Date(o.date);
      orderDate.setHours(0, 0, 0, 0);
      return (
        orderDate.getTime() === today.getTime() &&
        o.status === "Giao hàng thành công"
      );
    });
    const revenueToday = todayOrders.reduce(
      (sum, o) => sum + (o.total || 0),
      0
    );

    // Tính doanh thu trong khoảng thời gian được chọn
    const periodOrders = orders.filter((o) => {
      const orderDate = new Date(o.date).getTime();
      return orderDate >= startDate && o.status === "Giao hàng thành công";
    });
    const revenuePeriod = periodOrders.reduce(
      (sum, o) => sum + (o.total || 0),
      0
    );

    // Đếm số đơn hàng mới trong hôm nay
    const newOrders = orders.filter((o) => {
      const orderDate = new Date(o.date);
      orderDate.setHours(0, 0, 0, 0);
      return orderDate.getTime() === today.getTime();
    }).length;

    // Đếm đơn đang xử lý (các trạng thái chưa hoàn thành)
    const pendingOrders = orders.filter((o) =>
      ["Chờ xác nhận", "Đang xử lý", "Đang vận chuyển"].includes(o.status)
    ).length;

    // Ước tính lợi nhuận (giả định margin 30%)
    const profit = revenuePeriod * 0.3;

    return {
      revenueToday,
      revenuePeriod,
      newOrders,
      pendingOrders,
      profit,
      totalCustomers: customers.length,
      totalProducts: products.length,
    };
  },

  /**
   * Lấy xu hướng doanh thu theo ngày
   * @param {string} range - Khoảng thời gian
   * @returns {Array} Mảng {date, revenue} cho mỗi ngày
   */
  getSalesTrend(range = "30d") {
    const orders = getData("orders");
    const { startDate, endDate } = getDateRange(range);

    // Khởi tạo map với tất cả các ngày trong khoảng = 0
    const dateMap = {};
    const current = new Date(startDate);

    while (current <= endDate) {
      const dateKey = current.toISOString().split("T")[0];
      dateMap[dateKey] = 0;
      current.setDate(current.getDate() + 1);
    }

    // Tổng hợp doanh thu theo ngày từ đơn hàng thành công
    orders.forEach((o) => {
      if (o.status === "Giao hàng thành công") {
        const orderDate = new Date(o.date);
        const dateKey = orderDate.toISOString().split("T")[0];
        if (dateMap.hasOwnProperty(dateKey)) {
          dateMap[dateKey] += o.total || 0;
        }
      }
    });

    // Chuyển map thành array để render chart
    return Object.entries(dateMap).map(([date, revenue]) => ({
      date,
      revenue,
    }));
  },

  /**
   * Đếm số lượng đơn hàng theo từng trạng thái
   * @returns {Object} Key = status, value = count
   */
  getOrderStatusCount() {
    const orders = getData("orders");
    const statusCount = {};

    orders.forEach((o) => {
      const status = o.status || "Chờ xác nhận";
      statusCount[status] = (statusCount[status] || 0) + 1;
    });

    return statusCount;
  },

  /**
   * Lấy danh sách sản phẩm bán chạy nhất
   * @param {number} limit - Số lượng sản phẩm cần lấy
   * @returns {Array} Sắp xếp theo doanh thu giảm dần
   */
  getTopProducts(limit = 10) {
    const orders = getData("orders");
    const products = getData("products");
    const productMap = {};

    // Tổng hợp số lượng bán và doanh thu từ tất cả order items
    orders.forEach((order) => {
      if (order.status === "Giao hàng thành công" && order.products) {
        order.products.forEach((item) => {
          const pid = item.productId;
          if (!productMap[pid]) {
            productMap[pid] = { productId: pid, qtySold: 0, revenue: 0 };
          }
          productMap[pid].qtySold += item.quantity || 0;
          productMap[pid].revenue += (item.quantity || 0) * (item.price || 0);
        });
      }
    });

    // Join với bảng products để lấy tên và hình ảnh
    const result = Object.values(productMap).map((item) => {
      const product = products.find((p) => p.id === item.productId);
      return {
        ...item,
        name: product ? product.name : `Product #${item.productId}`,
        image: product?.image,
      };
    });

    // Sắp xếp theo doanh thu giảm dần và giới hạn số lượng
    return result.sort((a, b) => b.revenue - a.revenue).slice(0, limit);
  },

  /**
   * Lấy danh sách đơn hàng gần đây nhất
   * @param {number} limit - Số lượng đơn cần lấy
   * @returns {Array} Đơn hàng sắp xếp theo thời gian mới nhất
   */
  getRecentOrders(limit = 10) {
    const orders = getData("orders");

    return [...orders]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit)
      .map((o) => ({
        id: o.id,
        customerName: o.customerName || "Khách hàng",
        total: o.total,
        status: o.status,
        date: o.date,
        products: o.products,
      }));
  },

  /**
   * Lấy danh sách sản phẩm có tồn kho thấp
   * @param {number} threshold - Mức tồn kho cảnh báo
   * @returns {Array} Sản phẩm có stock <= threshold
   */
  getLowStockAlerts(threshold = 10) {
    const products = getData("products");

    return products
      .filter((p) => (p.quantity || 0) <= threshold)
      .map((p) => ({
        productId: p.id,
        name: p.name,
        stock: p.quantity,
        threshold: p.lowStockThreshold || threshold,
        image: p.image,
      }))
      .sort((a, b) => a.stock - b.stock); // Sắp xếp theo tồn kho tăng dần
  },

  /**
   * Lấy danh sách khách hàng mới trong N ngày gần đây
   * @param {number} days - Số ngày tính từ hiện tại
   * @returns {Array} Khách hàng mới
   */
  getNewCustomers(days = 7) {
    const customers = getData("customers");
    const cutoffDate = Date.now() - days * 24 * 60 * 60 * 1000;

    return customers.filter((c) => {
      if (!c.createdAt) return false;
      return new Date(c.createdAt).getTime() >= cutoffDate;
    });
  },
};

// ============================================
// HELPER: TÍNH KHOẢNG THỜI GIAN
// ============================================

/**
 * Chuyển đổi range string thành startDate và endDate timestamp
 * @param {string} range - 'today', '7d', '30d', '90d'
 * @returns {Object} {startDate: timestamp, endDate: timestamp}
 */
function getDateRange(range) {
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);

  let startDate = new Date();

  switch (range) {
    case "today":
      startDate.setHours(0, 0, 0, 0);
      break;
    case "7d":
      startDate.setDate(startDate.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      break;
    case "30d":
      startDate.setDate(startDate.getDate() - 29);
      startDate.setHours(0, 0, 0, 0);
      break;
    case "90d":
      startDate.setDate(startDate.getDate() - 89);
      startDate.setHours(0, 0, 0, 0);
      break;
    default:
      startDate.setDate(startDate.getDate() - 29);
      startDate.setHours(0, 0, 0, 0);
  }

  return { startDate: startDate.getTime(), endDate: endDate.getTime() };
}

// ============================================
// DASHBOARD HTML TEMPLATE
// ============================================

export const dashboardHtml = `
<div style="padding: 20px; background: #1a1a1a; min-height: 100vh;">
    <!-- Header with filters -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
        <h2 style="color: #00bfff; margin: 0;">
            <i class="fas fa-chart-pie"></i> Dashboard
        </h2>
        <div style="display: flex; gap: 10px; align-items: center;">
            <!-- Date range selector -->
            <select id="date-range-selector" style="padding: 10px 15px; border-radius: 8px; border: 1px solid #444; background: #2a2a2a; color: white; cursor: pointer;">
                <option value="today">Hôm nay</option>
                <option value="7d">7 ngày</option>
                <option value="30d" selected>30 ngày</option>
                <option value="90d">90 ngày</option>
            </select>
            <!-- Refresh button -->
            <button id="refresh-dashboard" style="padding: 10px 20px; background: #00bfff; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">
                <i class="fas fa-sync-alt"></i> Làm mới
            </button>
        </div>
    </div>

    <!-- KPI Cards Grid - Hiển thị các chỉ số quan trọng -->
    <div id="kpi-section" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 40px;">
        <!-- KPI cards sẽ được render động bởi renderKPICards() -->
    </div>

    <!-- Main Content Grid: Biểu đồ chính -->
    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-bottom: 20px;">
        <!-- Left: Sales Line Chart -->
        <div style="background: #2a2a2a; padding: 25px; border-radius: 12px;">
            <h3 style="color: #00bfff; margin-top: 0; margin-bottom: 20px;">
                <i class="fas fa-chart-line"></i> Xu hướng doanh thu
            </h3>
            <canvas id="sales-chart" style="max-height: 300px;"></canvas>
        </div>

        <!-- Right: Order Status Donut Chart -->
        <div style="background: #2a2a2a; padding: 25px; border-radius: 12px;">
            <h3 style="color: #00bfff; margin-top: 0; margin-bottom: 20px;">
                <i class="fas fa-chart-pie"></i> Trạng thái đơn hàng
            </h3>
            <canvas id="status-chart" style="max-height: 300px;"></canvas>
        </div>
    </div>

    <!-- Secondary Grid: Danh sách chi tiết -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
        <!-- Top Products List -->
        <div style="background: #2a2a2a; padding: 25px; border-radius: 12px;">
            <h3 style="color: #00bfff; margin-top: 0; margin-bottom: 20px;">
                <i class="fas fa-fire"></i> Top sản phẩm bán chạy
            </h3>
            <div id="top-products-list" style="max-height: 400px; overflow-y: auto;">
                <!-- Danh sách sẽ được render bởi renderTopProducts() -->
            </div>
        </div>

        <!-- Recent Orders List -->
        <div style="background: #2a2a2a; padding: 25px; border-radius: 12px;">
            <h3 style="color: #00bfff; margin-top: 0; margin-bottom: 20px;">
                <i class="fas fa-shopping-cart"></i> Đơn hàng gần đây
            </h3>
            <div id="recent-orders-list" style="max-height: 400px; overflow-y: auto;">
                <!-- Danh sách sẽ được render bởi renderRecentOrders() -->
            </div>
        </div>
    </div>

    <!-- Low Stock Alert Section -->
    <div id="low-stock-section" style="background: #2a2a2a; padding: 25px; border-radius: 12px; margin-bottom: 20px;">
        <h3 style="color: #f59e0b; margin-top: 0; margin-bottom: 20px;">
            <i class="fas fa-exclamation-triangle"></i> Cảnh báo tồn kho thấp
        </h3>
        <div id="low-stock-list">
            <!-- Danh sách sẽ được render bởi renderLowStockAlerts() -->
        </div>
    </div>

    <!-- Quick Actions Section - Các thao tác nhanh để chuyển trang -->
    <div style="background: #2a2a2a; padding: 25px; border-radius: 12px;">
        <h3 style="color: #00bfff; margin-top: 0; margin-bottom: 20px;">
            <i class="fas fa-bolt"></i> Thao tác nhanh
        </h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
            <!-- Button chuyển đến trang Products -->
            <button id="quick-add-product" style="background: #10b981; color: white; border: none; padding: 15px; border-radius: 8px; cursor: pointer; font-size: 16px; transition: all 0.3s;" onmouseover="this.style.background='#059669'" onmouseout="this.style.background='#10b981'">
                <i class="fas fa-plus-circle"></i> Thêm sản phẩm
            </button>
            
            <!-- Button chuyển đến trang Orders -->
            <button id="quick-add-order" style="background: #3b82f6; color: white; border: none; padding: 15px; border-radius: 8px; cursor: pointer; font-size: 16px; transition: all 0.3s;" onmouseover="this.style.background='#2563eb'" onmouseout="this.style.background='#3b82f6'">
                <i class="fas fa-cart-plus"></i> Tạo đơn hàng
            </button>
            
            <!-- Button chuyển đến trang Imports -->
            <button id="quick-add-import" style="background: #8b5cf6; color: white; border: none; padding: 15px; border-radius: 8px; cursor: pointer; font-size: 16px; transition: all 0.3s;" onmouseover="this.style.background='#7c3aed'" onmouseout="this.style.background='#8b5cf6'">
                <i class="fas fa-truck-loading"></i> Phiếu nhập hàng
            </button>
            
            <!-- Button chuyển đến trang Reports -->
            <button id="quick-view-reports" style="background: #f59e0b; color: white; border: none; padding: 15px; border-radius: 8px; cursor: pointer; font-size: 16px; transition: all 0.3s;" onmouseover="this.style.background='#d97706'" onmouseout="this.style.background='#f59e0b'">
                <i class="fas fa-chart-bar"></i> Xem báo cáo
            </button>
            
            <!-- Button chuyển đến trang Customers -->
            <button id="quick-view-customers" style="background: #06b6d4; color: white; border: none; padding: 15px; border-radius: 8px; cursor: pointer; font-size: 16px; transition: all 0.3s;" onmouseover="this.style.background='#0891b2'" onmouseout="this.style.background='#06b6d4'">
                <i class="fas fa-users"></i> Khách hàng
            </button>
            
            <!-- Button chuyển đến trang Inventory -->
            <button id="quick-view-inventory" style="background: #ec4899; color: white; border: none; padding: 15px; border-radius: 8px; cursor: pointer; font-size: 16px; transition: all 0.3s;" onmouseover="this.style.background='#db2777'" onmouseout="this.style.background='#ec4899'">
                <i class="fas fa-warehouse"></i> Quản lý kho
            </button>
        </div>
    </div>
</div>
`;

// ============================================
// DASHBOARD INITIALIZATION
// ============================================

// Biến global để lưu các Chart instance (cần destroy trước khi tạo mới)
let salesChart = null;
let statusChart = null;

/**
 * Hàm khởi tạo dashboard - gọi sau khi render HTML
 * Thiết lập event listeners và render dữ liệu ban đầu
 */
export function initDashboardPage() {
  let currentRange = "30d"; // Mặc định 30 ngày

  // Render toàn bộ dashboard lần đầu
  renderDashboard(currentRange);

  // ========================================
  // EVENT LISTENERS
  // ========================================

  // Xử lý thay đổi date range selector
  document
    .getElementById("date-range-selector")
    .addEventListener("change", (e) => {
      currentRange = e.target.value;
      renderDashboard(currentRange);
    });

  // Xử lý nút refresh dashboard
  document.getElementById("refresh-dashboard").addEventListener("click", () => {
    renderDashboard(currentRange);
    showToast("Dữ liệu đã được làm mới");
  });

  // ========================================
  // QUICK ACTION BUTTONS - NAVIGATION
  // ========================================

  // Chuyển đến trang Products để thêm sản phẩm
  document.getElementById("quick-add-product").addEventListener("click", () => {
    navigateToPage("products");
  });

  // Chuyển đến trang Orders để tạo đơn hàng
  document.getElementById("quick-add-order").addEventListener("click", () => {
    navigateToPage("orders");
  });

  // Chuyển đến trang Imports để tạo phiếu nhập
  document.getElementById("quick-add-import").addEventListener("click", () => {
    navigateToPage("imports");
  });

  // Chuyển đến trang Reports để xem báo cáo chi tiết
  document
    .getElementById("quick-view-reports")
    .addEventListener("click", () => {
      navigateToPage("reports");
    });

  // Chuyển đến trang Customers
  document
    .getElementById("quick-view-customers")
    .addEventListener("click", () => {
      navigateToPage("customers");
    });

  // Chuyển đến trang Inventory để quản lý kho
  document
    .getElementById("quick-view-inventory")
    .addEventListener("click", () => {
      navigateToPage("inventory");
    });
}

// ============================================
// NAVIGATION HELPER
// ============================================

/**
 * Điều hướng đến trang khác trong admin SPA
 * @param {string} pageName - Tên trang: 'products', 'orders', 'imports', etc.
 */
function navigateToPage(pageName) {
  // Tìm menu item tương ứng và click (giả sử menu có data-page attribute)
  const menuItem = document.querySelector(`[data-page="${pageName}"]`);
  if (menuItem) {
    menuItem.click();
  } else {
    // Fallback: sử dụng function global nếu có
    if (window.loadPage && typeof window.loadPage === "function") {
      window.loadPage(pageName);
    } else {
      console.warn(`Không tìm thấy cách navigate đến trang: ${pageName}`);
    }
  }
}

// ============================================
// RENDER DASHBOARD - TỔNG HỢP
// ============================================

/**
 * Render toàn bộ dashboard với khoảng thời gian đã chọn
 * @param {string} range - Khoảng thời gian: 'today', '7d', '30d', '90d'
 */
function renderDashboard(range) {
  // 1. Render KPI Cards (7 chỉ số quan trọng)
  renderKPICards(range);

  // 2. Render Sales Line Chart (xu hướng doanh thu)
  renderSalesChart(range);

  // 3. Render Status Donut Chart (phân bổ trạng thái đơn)
  renderStatusChart();

  // 4. Render Top Products List (sản phẩm bán chạy)
  renderTopProducts();

  // 5. Render Recent Orders List (đơn hàng gần đây)
  renderRecentOrders();

  // 6. Render Low Stock Alerts (cảnh báo hết hàng)
  renderLowStockAlerts();
}

// ============================================
// RENDER KPI CARDS
// ============================================

/**
 * Render 7 KPI cards với dữ liệu tổng hợp
 * @param {string} range - Khoảng thời gian
 */
function renderKPICards(range) {
  const summary = DashboardAPI.getSummary(range);
  const container = document.getElementById("kpi-section");

  // Map range string sang label tiếng Việt
  const rangeLabel = {
    today: "hôm nay",
    "7d": "7 ngày",
    "30d": "30 ngày",
    "90d": "90 ngày",
  }[range];

  container.innerHTML = `
        <!-- Card 1: Doanh thu hôm nay -->
        <div class="kpi-card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 12px; color: white; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3); transition: transform 0.3s;" onmouseover="this.style.transform='translateY(-5px)'" onmouseout="this.style.transform='translateY(0)'">
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div>
                    <h4 style="margin: 0; font-size: 13px; opacity: 0.9; text-transform: uppercase; letter-spacing: 1px;">Doanh thu hôm nay</h4>
                    <div style="font-size: 28px; font-weight: bold; margin: 10px 0;">${formatCurrency(
                      summary.revenueToday
                    )}</div>
                </div>
                <i class="fas fa-money-bill-wave" style="font-size: 32px; opacity: 0.3;"></i>
            </div>
        </div>

        <!-- Card 2: Doanh thu trong kỳ -->
        <div class="kpi-card" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 20px; border-radius: 12px; color: white; box-shadow: 0 4px 15px rgba(240, 147, 251, 0.3); transition: transform 0.3s;" onmouseover="this.style.transform='translateY(-5px)'" onmouseout="this.style.transform='translateY(0)'">
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div>
                    <h4 style="margin: 0; font-size: 13px; opacity: 0.9; text-transform: uppercase; letter-spacing: 1px;">Doanh thu ${rangeLabel}</h4>
                    <div style="font-size: 28px; font-weight: bold; margin: 10px 0;">${formatCurrency(
                      summary.revenuePeriod
                    )}</div>
                </div>
                <i class="fas fa-chart-line" style="font-size: 32px; opacity: 0.3;"></i>
            </div>
        </div>

        <!-- Card 3: Đơn mới hôm nay -->
        <div class="kpi-card" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 20px; border-radius: 12px; color: white; box-shadow: 0 4px 15px rgba(79, 172, 254, 0.3); transition: transform 0.3s;" onmouseover="this.style.transform='translateY(-5px)'" onmouseout="this.style.transform='translateY(0)'">
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div>
                    <h4 style="margin: 0; font-size: 13px; opacity: 0.9; text-transform: uppercase; letter-spacing: 1px;">Đơn mới hôm nay</h4>
                    <div style="font-size: 28px; font-weight: bold; margin: 10px 0;">${formatNumber(
                      summary.newOrders
                    )}</div>
                </div>
                <i class="fas fa-cart-plus" style="font-size: 32px; opacity: 0.3;"></i>
            </div>
        </div>

        <!-- Card 4: Đơn đang xử lý -->
        <div class="kpi-card" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); padding: 20px; border-radius: 12px; color: white; box-shadow: 0 4px 15px rgba(250, 112, 154, 0.3); transition: transform 0.3s;" onmouseover="this.style.transform='translateY(-5px)'" onmouseout="this.style.transform='translateY(0)'">
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div>
                    <h4 style="margin: 0; font-size: 13px; opacity: 0.9; text-transform: uppercase; letter-spacing: 1px;">Đơn đang xử lý</h4>
                    <div style="font-size: 28px; font-weight: bold; margin: 10px 0;">${formatNumber(
                      summary.pendingOrders
                    )}</div>
                </div>
                <i class="fas fa-hourglass-half" style="font-size: 32px; opacity: 0.3;"></i>
            </div>
        </div>

        <!-- Card 5: Lợi nhuận ước tính -->
        <div class="kpi-card" style="background: linear-gradient(135deg, #30cfd0 0%, #330867 100%); padding: 20px; border-radius: 12px; color: white; box-shadow: 0 4px 15px rgba(48, 207, 208, 0.3); transition: transform 0.3s;" onmouseover="this.style.transform='translateY(-5px)'" onmouseout="this.style.transform='translateY(0)'">
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div>
                    <h4 style="margin: 0; font-size: 13px; opacity: 0.9; text-transform: uppercase; letter-spacing: 1px;">Lợi nhuận (30%)</h4>
                    <div style="font-size: 28px; font-weight: bold; margin: 10px 0;">${formatCurrency(
                      summary.profit
                    )}</div>
                </div>
                <i class="fas fa-piggy-bank" style="font-size: 32px; opacity: 0.3;"></i>
            </div>
        </div>

        <!-- Card 6: Tổng khách hàng -->
        <div class="kpi-card" style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); padding: 20px; border-radius: 12px; color: #333; box-shadow: 0 4px 15px rgba(168, 237, 234, 0.3); transition: transform 0.3s;" onmouseover="this.style.transform='translateY(-5px)'" onmouseout="this.style.transform='translateY(0)'">
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div>
                    <h4 style="margin: 0; font-size: 13px; opacity: 0.8; text-transform: uppercase; letter-spacing: 1px;">Tổng khách hàng</h4>
                    <div style="font-size: 28px; font-weight: bold; margin: 10px 0;">${formatNumber(
                      summary.totalCustomers
                    )}</div>
                </div>
                <i class="fas fa-users" style="font-size: 32px; opacity: 0.3;"></i>
            </div>
        </div>

        <!-- Card 7: Tổng sản phẩm -->
        <div class="kpi-card" style="background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%); padding: 20px; border-radius: 12px; color: #333; box-shadow: 0 4px 15px rgba(255, 236, 210, 0.3); transition: transform 0.3s;" onmouseover="this.style.transform='translateY(-5px)'" onmouseout="this.style.transform='translateY(0)'">
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div>
                    <h4 style="margin: 0; font-size: 13px; opacity: 0.8; text-transform: uppercase; letter-spacing: 1px;">Tổng sản phẩm</h4>
                    <div style="font-size: 28px; font-weight: bold; margin: 10px 0;">${formatNumber(
                      summary.totalProducts
                    )}</div>
                </div>
                <i class="fas fa-box" style="font-size: 32px; opacity: 0.3;"></i>
            </div>
        </div>
    `;
}

// ============================================
// RENDER SALES CHART (Chart.js Line Chart)
// ============================================

/**
 * Render biểu đồ đường xu hướng doanh thu theo ngày
 * @param {string} range - Khoảng thời gian
 */
function renderSalesChart(range) {
  const data = DashboardAPI.getSalesTrend(range);
  const ctx = document.getElementById("sales-chart");

  // Destroy chart cũ nếu tồn tại (tránh memory leak)
  if (salesChart) {
    salesChart.destroy();
  }

  // Tạo chart mới với Chart.js
  salesChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: data.map((d) =>
        new Date(d.date).toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
        })
      ),
      datasets: [
        {
          label: "Doanh thu (VNĐ)",
          data: data.map((d) => d.revenue),
          borderColor: "#00bfff",
          backgroundColor: "rgba(0, 191, 255, 0.1)",
          tension: 0.4, // Đường cong mượt
          fill: true,
          pointRadius: 4,
          pointBackgroundColor: "#00bfff",
          pointHoverRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          labels: { color: "#fff", font: { size: 14 } },
        },
        tooltip: {
          callbacks: {
            label: (context) => formatCurrency(context.parsed.y),
          },
        },
      },
      scales: {
        y: {
          ticks: {
            color: "#999",
            callback: (value) => formatCurrency(value),
          },
          grid: { color: "rgba(255,255,255,0.1)" },
        },
        x: {
          ticks: { color: "#999" },
          grid: { color: "rgba(255,255,255,0.1)" },
        },
      },
    },
  });
}

// ============================================
// RENDER STATUS CHART (Chart.js Donut Chart)
// ============================================

/**
 * Render biểu đồ donut phân bố trạng thái đơn hàng
 */
function renderStatusChart() {
  const statusData = DashboardAPI.getOrderStatusCount();
  const ctx = document.getElementById("status-chart");

  // Destroy chart cũ
  if (statusChart) {
    statusChart.destroy();
  }

  const labels = Object.keys(statusData);
  const values = Object.values(statusData);

  // Tạo donut chart
  statusChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: labels,
      datasets: [
        {
          data: values,
          backgroundColor: [
            "#facc15", // Chờ xác nhận - vàng
            "#3b82f6", // Đang xử lý - xanh dương
            "#8b5cf6", // Đang vận chuyển - tím
            "#10b981", // Giao hàng thành công - xanh lá
            "#ef4444", // Đã hủy - đỏ
          ],
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: "#fff",
            padding: 15,
            font: { size: 12 },
          },
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const label = context.label || "";
              const value = context.parsed || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${label}: ${value} (${percentage}%)`;
            },
          },
        },
      },
    },
  });
}

// ============================================
// RENDER TOP PRODUCTS LIST
// ============================================

/**
 * Render danh sách 10 sản phẩm bán chạy nhất
 */
function renderTopProducts() {
  const products = DashboardAPI.getTopProducts(10);
  const container = document.getElementById("top-products-list");

  if (products.length === 0) {
    container.innerHTML =
      '<p style="color: #666; text-align: center; padding: 20px;">Chưa có dữ liệu bán hàng</p>';
    return;
  }

  // Render từng sản phẩm với ranking
  container.innerHTML = products
    .map(
      (p, index) => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: #333; border-radius: 8px; margin-bottom: 10px; transition: background 0.3s;" onmouseover="this.style.background='#3a3a3a'" onmouseout="this.style.background='#333'">
            <div style="display: flex; align-items: center; gap: 15px; flex: 1;">
                <!-- Ranking badge -->
                <div style="font-size: 20px; font-weight: bold; color: ${
                  index < 3 ? "#ffd700" : "#00bfff"
                }; min-width: 30px;">
                    ${
                      index === 0
                        ? "🥇"
                        : index === 1
                        ? "🥈"
                        : index === 2
                        ? "🥉"
                        : `#${index + 1}`
                    }
                </div>
                <!-- Product image -->
                ${
                  p.image
                    ? `<img src="${p.image}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px;">`
                    : '<div style="width: 50px; height: 50px; background: #555; border-radius: 8px; display: flex; align-items: center; justify-content: center;"><i class="fas fa-image" style="color: #888;"></i></div>'
                }
                <!-- Product info -->
                <div style="flex: 1;">
                    <div style="color: white; font-weight: bold; margin-bottom: 5px;">${
                      p.name
                    }</div>
                    <div style="color: #999; font-size: 13px;">
                        <i class="fas fa-shopping-bag"></i> Đã bán: <strong>${formatNumber(
                          p.qtySold
                        )}</strong>
                    </div>
                </div>
            </div>
            <!-- Revenue -->
            <div style="text-align: right;">
                <div style="color: #4ade80; font-weight: bold; font-size: 16px;">${formatCurrency(
                  p.revenue
                )}</div>
            </div>
        </div>
    `
    )
    .join("");
}

// ============================================
// RENDER RECENT ORDERS LIST
// ============================================

/**
 * Render danh sách 10 đơn hàng gần đây nhất
 */
function renderRecentOrders() {
  const orders = DashboardAPI.getRecentOrders(10);
  const container = document.getElementById("recent-orders-list");

  if (orders.length === 0) {
    container.innerHTML =
      '<p style="color: #666; text-align: center; padding: 20px;">Chưa có đơn hàng nào</p>';
    return;
  }

  // Render từng đơn hàng với status color
  container.innerHTML = orders
    .map((order) => {
      const statusColor = getStatusColor(order.status);
      const orderDate = new Date(order.date).toLocaleString("vi-VN");

      return `
            <div style="background: #333; padding: 15px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid ${statusColor}; transition: background 0.3s; cursor: pointer;" onmouseover="this.style.background='#3a3a3a'" onmouseout="this.style.background='#333'" onclick="navigateToPage('orders')">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                    <div>
                        <strong style="color: #00bfff;">Đơn #${
                          order.id
                        }</strong>
                        <span style="background: ${statusColor}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; margin-left: 8px;">${
        order.status
      }</span>
                    </div>
                    <div style="color: #4ade80; font-weight: bold;">${formatCurrency(
                      order.total
                    )}</div>
                </div>
                <div style="color: #999; font-size: 13px; margin-bottom: 5px;">
                    <i class="fas fa-user"></i> ${order.customerName}
                </div>
                <div style="color: #666; font-size: 12px;">
                    <i class="fas fa-clock"></i> ${orderDate}
                </div>
            </div>
        `;
    })
    .join("");
}

// ============================================
// RENDER LOW STOCK ALERTS
// ============================================

/**
 * Render cảnh báo các sản phẩm sắp hết hàng
 */
function renderLowStockAlerts() {
  const alerts = DashboardAPI.getLowStockAlerts(10);
  const container = document.getElementById("low-stock-list");

  if (alerts.length === 0) {
    container.innerHTML =
      '<p style="color: #10b981; text-align: center; padding: 20px;"><i class="fas fa-check-circle"></i> Tất cả sản phẩm đều đủ hàng!</p>';
    return;
  }

  // Render grid các sản phẩm cảnh báo
  container.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 15px;">
            ${alerts
              .map(
                (alert) => `
                <div style="background: #333; padding: 15px; border-radius: 8px; border: 2px solid #f59e0b; transition: all 0.3s;" onmouseover="this.style.borderColor='#fbbf24'" onmouseout="this.style.borderColor='#f59e0b'">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                        ${
                          alert.image
                            ? `<img src="${alert.image}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px;">`
                            : '<div style="width: 50px; height: 50px; background: #555; border-radius: 8px; display: flex; align-items: center; justify-content: center;"><i class="fas fa-box" style="color: #888;"></i></div>'
                        }
                        <div style="flex: 1;">
                            <div style="color: white; font-weight: bold; margin-bottom: 5px;">${
                              alert.name
                            }</div>
                            <div style="color: #f59e0b; font-size: 13px;">
                                <i class="fas fa-exclamation-triangle"></i> Chỉ còn: <strong>${
                                  alert.stock
                                }</strong>
                            </div>
                        </div>
                    </div>
                    <button onclick="navigateToPage('imports')" style="width: 100%; padding: 8px; background: #10b981; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; transition: background 0.3s;" onmouseover="this.style.background='#059669'" onmouseout="this.style.background='#10b981'">
                        <i class="fas fa-plus"></i> Nhập hàng ngay
                    </button>
                </div>
            `
              )
              .join("")}
        </div>
    `;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Lấy màu status tương ứng với trạng thái đơn hàng
 * @param {string} status - Trạng thái đơn hàng
 * @returns {string} Mã màu hex
 */
function getStatusColor(status) {
  const colors = {
    "Chờ xác nhận": "#facc15",
    "Đang xử lý": "#3b82f6",
    "Đang vận chuyển": "#8b5cf6",
    "Giao hàng thành công": "#10b981",
    "Đã hủy": "#ef4444",
  };
  return colors[status] || "#6b7280";
}

/**
 * Hiển thị thông báo toast đơn giản
 * @param {string} message - Nội dung thông báo
 */
function showToast(message) {
  const toast = document.createElement("div");
  toast.textContent = message;
  toast.style.cssText = `
        position: fixed; 
        top: 20px; 
        right: 20px; 
        background: #10b981; 
        color: white; 
        padding: 15px 20px; 
        border-radius: 8px; 
        z-index: 9999;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        animation: slideIn 0.3s ease-out;
    `;
  document.body.appendChild(toast);

  // Tự động xóa sau 2 giây
  setTimeout(() => {
    toast.style.animation = "slideOut 0.3s ease-in";
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}
