// ============================================================================
// DASHBOARD - Trang tổng quan quản lý (WITH AUTO-UPDATE)
// ============================================================================

import {
  normalizeOrderStructure,
  getSafeOrderTotal,
} from "../utils/orderUtils.js";

// ============================================================================
// CONSTANTS
// ============================================================================

const SUCCESS_STATUSES = ["Giao hàng thành công", "Đã giao"];
const AUTO_REFRESH_INTERVAL = 30000; // 30 seconds

// ============================================================================
// UTILITIES
// ============================================================================

const getData = (key) => JSON.parse(localStorage.getItem(key) || "null");
const formatCurrency = (val) =>
  (val || 0).toLocaleString("vi-VN", { style: "currency", currency: "VND" });
const formatNumber = (val) => (val || 0).toLocaleString("vi-VN");

/**
 * ✅ Get valid date from order
 */
function getValidOrderDate(order) {
  if (order.orderDate) {
    const d = new Date(order.orderDate);
    if (!isNaN(d.getTime()) && d.getFullYear() >= 2000) return d;
  }

  if (order.date) {
    const d = new Date(order.date);
    if (!isNaN(d.getTime()) && d.getFullYear() >= 2000) return d;
  }

  if (order.id) return new Date(order.id);
  return new Date();
}

/**
 * Tính khoảng thời gian
 */
function getDateRange(range) {
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);
  const startDate = new Date();

  const daysMap = { today: 0, "7d": 6, "30d": 29, "90d": 89 };
  const days = daysMap[range] || 29;

  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  return { startDate: startDate.getTime(), endDate: endDate.getTime() };
}

/**
 * Lấy màu theo trạng thái
 */
function getStatusColor(status) {
  const colors = {
    "Chờ xác nhận": "#facc15",
    "Đang xử lý": "#3b82f6",
    "Đang vận chuyển": "#8b5cf6",
    "Giao hàng thành công": "#10b981",
    "Đã giao": "#10b981",
    "Đã hủy": "#ef4444",
  };
  return colors[status] || "#6b7280";
}

// ============================================================================
// DASHBOARD API
// ============================================================================

export const DashboardAPI = {
  getSummary(range = "30d") {
    const orders = getData("orders") || [];
    const products = getData("products") || [];
    const customers = getData("customers") || [];

    const { startDate, endDate } = getDateRange(range);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();

    // Doanh thu hôm nay
    const todayOrders = orders.filter((o) => {
      const orderDate = new Date(getValidOrderDate(o));
      orderDate.setHours(0, 0, 0, 0);
      return (
        orderDate.getTime() === todayTimestamp &&
        SUCCESS_STATUSES.includes(o.status)
      );
    });
    const revenueToday = todayOrders.reduce(
      (sum, o) => sum + getSafeOrderTotal(o),
      0
    );

    // Doanh thu trong kỳ
    const periodOrders = orders.filter((o) => {
      const orderTime = getValidOrderDate(o).getTime();
      return (
        orderTime >= startDate &&
        orderTime <= endDate &&
        SUCCESS_STATUSES.includes(o.status)
      );
    });
    const revenuePeriod = periodOrders.reduce(
      (sum, o) => sum + getSafeOrderTotal(o),
      0
    );

    // Đơn hàng mới hôm nay
    const newOrders = orders.filter((o) => {
      const orderDate = new Date(getValidOrderDate(o));
      orderDate.setHours(0, 0, 0, 0);
      return orderDate.getTime() === todayTimestamp;
    }).length;

    // Đơn đang xử lý
    const pendingOrders = orders.filter((o) =>
      ["Chờ xác nhận", "Đang xử lý", "Đang vận chuyển"].includes(o.status)
    ).length;

    return {
      revenueToday,
      revenuePeriod,
      newOrders,
      pendingOrders,
      profit: revenuePeriod * 0.3,
      totalCustomers: customers.length,
      totalProducts: products.length,
    };
  },

  getSalesTrend(range = "30d") {
    const orders = getData("orders") || [];
    const { startDate, endDate } = getDateRange(range);

    const dateMap = {};
    const current = new Date(startDate);
    while (current <= new Date(endDate)) {
      dateMap[current.toISOString().split("T")[0]] = 0;
      current.setDate(current.getDate() + 1);
    }

    orders.forEach((o) => {
      if (SUCCESS_STATUSES.includes(o.status)) {
        const dateKey = getValidOrderDate(o).toISOString().split("T")[0];
        if (dateMap.hasOwnProperty(dateKey)) {
          dateMap[dateKey] += getSafeOrderTotal(o);
        }
      }
    });

    return Object.entries(dateMap).map(([date, revenue]) => ({
      date,
      revenue,
    }));
  },

  getOrderStatusCount() {
    const orders = getData("orders") || [];
    const statusCount = {};
    orders.forEach((o) => {
      const status = o.status || "Chờ xác nhận";
      statusCount[status] = (statusCount[status] || 0) + 1;
    });
    return statusCount;
  },

  getTopProducts(limit = 10) {
    const orders = getData("orders") || [];
    const products = getData("products") || [];
    const productMap = {};

    orders.forEach((order) => {
      if (SUCCESS_STATUSES.includes(order.status) && order.products) {
        order.products.forEach((item) => {
          const pid = item.productId || item.id;
          if (!pid) return;

          if (!productMap[pid]) {
            productMap[pid] = { productId: pid, qtySold: 0, revenue: 0 };
          }
          productMap[pid].qtySold += item.quantity || 0;
          productMap[pid].revenue += (item.quantity || 0) * (item.price || 0);
        });
      }
    });

    const result = Object.values(productMap).map((item) => {
      const product = products.find((p) => p.id === item.productId);
      return {
        ...item,
        name: product ? product.name : `Product #${item.productId}`,
        image: product?.image || product?.img,
      };
    });

    return result.sort((a, b) => b.revenue - a.revenue).slice(0, limit);
  },

  getRecentOrders(limit = 10) {
    const orders = getData("orders") || [];
    return [...orders]
      .sort(
        (a, b) =>
          getValidOrderDate(b).getTime() - getValidOrderDate(a).getTime()
      )
      .slice(0, limit)
      .map((o) => ({
        id: o.id,
        customerName:
          o.customerName || o.address?.name || o.user || "Khách hàng",
        total: getSafeOrderTotal(o),
        status: o.status,
        date: getValidOrderDate(o).toISOString(),
      }));
  },

  getLowStockAlerts(threshold = 10) {
    const products = getData("products") || [];
    return products
      .filter((p) => (p.quantity || 0) <= threshold)
      .map((p) => ({
        productId: p.id,
        name: p.name,
        stock: p.quantity,
        image: p.image || p.img,
      }))
      .sort((a, b) => a.stock - b.stock);
  },
};

// ============================================================================
// RENDER FUNCTIONS
// ============================================================================

let salesChart = null;
let statusChart = null;

function renderDashboard(range) {
  renderKPICards(range);
  renderSalesChart(range);
  renderStatusChart();
  renderTopProducts();
  renderRecentOrders();
  renderLowStockAlerts();
}

function renderKPICards(range) {
  const summary = DashboardAPI.getSummary(range);
  const container = document.getElementById("kpi-section");

  const rangeLabel = {
    today: "hôm nay",
    "7d": "7 ngày",
    "30d": "30 ngày",
    "90d": "90 ngày",
  }[range];

  container.innerHTML = `
    <div class="kpi-card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 12px; color: white; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
      <div style="display: flex; justify-content: space-between; align-items: start;">
        <div>
          <h4 style="margin: 0; font-size: 13px; opacity: 0.9; text-transform: uppercase;">Doanh thu hôm nay</h4>
          <div style="font-size: 28px; font-weight: bold; margin: 10px 0;">${formatCurrency(
            summary.revenueToday
          )}</div>
        </div>
        <i class="fas fa-money-bill-wave" style="font-size: 32px; opacity: 0.3;"></i>
      </div>
    </div>

    <div class="kpi-card" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 20px; border-radius: 12px; color: white; box-shadow: 0 4px 15px rgba(240, 147, 251, 0.3);">
      <div style="display: flex; justify-content: space-between; align-items: start;">
        <div>
          <h4 style="margin: 0; font-size: 13px; opacity: 0.9; text-transform: uppercase;">Doanh thu ${rangeLabel}</h4>
          <div style="font-size: 28px; font-weight: bold; margin: 10px 0;">${formatCurrency(
            summary.revenuePeriod
          )}</div>
        </div>
        <i class="fas fa-chart-line" style="font-size: 32px; opacity: 0.3;"></i>
      </div>
    </div>

    <div class="kpi-card" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 20px; border-radius: 12px; color: white; box-shadow: 0 4px 15px rgba(79, 172, 254, 0.3);">
      <div style="display: flex; justify-content: space-between; align-items: start;">
        <div>
          <h4 style="margin: 0; font-size: 13px; opacity: 0.9; text-transform: uppercase;">Đơn mới hôm nay</h4>
          <div style="font-size: 28px; font-weight: bold; margin: 10px 0;">${formatNumber(
            summary.newOrders
          )}</div>
        </div>
        <i class="fas fa-cart-plus" style="font-size: 32px; opacity: 0.3;"></i>
      </div>
    </div>

    <div class="kpi-card" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); padding: 20px; border-radius: 12px; color: white; box-shadow: 0 4px 15px rgba(250, 112, 154, 0.3);">
      <div style="display: flex; justify-content: space-between; align-items: start;">
        <div>
          <h4 style="margin: 0; font-size: 13px; opacity: 0.9; text-transform: uppercase;">Đơn đang xử lý</h4>
          <div style="font-size: 28px; font-weight: bold; margin: 10px 0;">${formatNumber(
            summary.pendingOrders
          )}</div>
        </div>
        <i class="fas fa-hourglass-half" style="font-size: 32px; opacity: 0.3;"></i>
      </div>
    </div>

    <div class="kpi-card" style="background: linear-gradient(135deg, #30cfd0 0%, #330867 100%); padding: 20px; border-radius: 12px; color: white; box-shadow: 0 4px 15px rgba(48, 207, 208, 0.3);">
      <div style="display: flex; justify-content: space-between; align-items: start;">
        <div>
          <h4 style="margin: 0; font-size: 13px; opacity: 0.9; text-transform: uppercase;">Lợi nhuận (30%)</h4>
          <div style="font-size: 28px; font-weight: bold; margin: 10px 0;">${formatCurrency(
            summary.profit
          )}</div>
        </div>
        <i class="fas fa-piggy-bank" style="font-size: 32px; opacity: 0.3;"></i>
      </div>
    </div>

    <div class="kpi-card" style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); padding: 20px; border-radius: 12px; color: #333; box-shadow: 0 4px 15px rgba(168, 237, 234, 0.3);">
      <div style="display: flex; justify-content: space-between; align-items: start;">
        <div>
          <h4 style="margin: 0; font-size: 13px; opacity: 0.8; text-transform: uppercase;">Tổng khách hàng</h4>
          <div style="font-size: 28px; font-weight: bold; margin: 10px 0;">${formatNumber(
            summary.totalCustomers
          )}</div>
        </div>
        <i class="fas fa-users" style="font-size: 32px; opacity: 0.3;"></i>
      </div>
    </div>

    <div class="kpi-card" style="background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%); padding: 20px; border-radius: 12px; color: #333; box-shadow: 0 4px 15px rgba(255, 236, 210, 0.3);">
      <div style="display: flex; justify-content: space-between; align-items: start;">
        <div>
          <h4 style="margin: 0; font-size: 13px; opacity: 0.8; text-transform: uppercase;">Tổng sản phẩm</h4>
          <div style="font-size: 28px; font-weight: bold; margin: 10px 0;">${formatNumber(
            summary.totalProducts
          )}</div>
        </div>
        <i class="fas fa-box" style="font-size: 32px; opacity: 0.3;"></i>
      </div>
    </div>
  `;
}

function renderSalesChart(range) {
  const data = DashboardAPI.getSalesTrend(range);
  const ctx = document.getElementById("sales-chart");
  if (!ctx) return;

  if (salesChart) salesChart.destroy();

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
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointBackgroundColor: "#00bfff",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { labels: { color: "#fff" } },
        tooltip: {
          callbacks: { label: (ctx) => formatCurrency(ctx.parsed.y) },
        },
      },
      scales: {
        y: {
          ticks: { color: "#999", callback: (val) => formatCurrency(val) },
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

function renderStatusChart() {
  const statusData = DashboardAPI.getOrderStatusCount();
  const ctx = document.getElementById("status-chart");
  if (!ctx) return;

  if (statusChart) statusChart.destroy();

  const labels = Object.keys(statusData);
  const values = Object.values(statusData);

  statusChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: labels,
      datasets: [
        {
          data: values,
          backgroundColor: [
            "#facc15",
            "#3b82f6",
            "#8b5cf6",
            "#10b981",
            "#ef4444",
          ],
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom", labels: { color: "#fff", padding: 15 } },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              const pct = ((ctx.parsed / total) * 100).toFixed(1);
              return `${ctx.label}: ${ctx.parsed} (${pct}%)`;
            },
          },
        },
      },
    },
  });
}

function renderTopProducts() {
  const products = DashboardAPI.getTopProducts(10);
  const container = document.getElementById("top-products-list");
  if (!container) return;

  if (products.length === 0) {
    container.innerHTML =
      '<p style="color: #666; text-align: center; padding: 20px;">Chưa có dữ liệu</p>';
    return;
  }

  container.innerHTML = products
    .map(
      (p, i) => `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: #333; border-radius: 8px; margin-bottom: 10px;">
        <div style="display: flex; align-items: center; gap: 15px; flex: 1;">
          <div style="font-size: 20px; font-weight: bold; color: ${
            i < 3 ? "#ffd700" : "#00bfff"
          }; min-width: 30px;">
            ${i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
          </div>
          ${
            p.image
              ? `<img src="${p.image}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px;">`
              : '<div style="width: 50px; height: 50px; background: #555; border-radius: 8px;"></div>'
          }
          <div>
            <div style="color: white; font-weight: bold;">${p.name}</div>
            <div style="color: #999; font-size: 13px;">Đã bán: ${formatNumber(
              p.qtySold
            )}</div>
          </div>
        </div>
        <div style="color: #4ade80; font-weight: bold;">${formatCurrency(
          p.revenue
        )}</div>
      </div>
    `
    )
    .join("");
}

function renderRecentOrders() {
  const orders = DashboardAPI.getRecentOrders(10);
  const container = document.getElementById("recent-orders-list");
  if (!container) return;

  if (orders.length === 0) {
    container.innerHTML =
      '<p style="color: #666; text-align: center; padding: 20px;">Chưa có đơn hàng</p>';
    return;
  }

  container.innerHTML = orders
    .map((o) => {
      const color = getStatusColor(o.status);
      const date = new Date(o.date).toLocaleString("vi-VN");
      return `
        <div style="background: #333; padding: 15px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid ${color}; cursor: pointer;" onclick="window.navigateSPA?.('orders')">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <div>
              <strong style="color: #00bfff;">Đơn #${o.id}</strong>
              <span style="background: ${color}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; margin-left: 8px;">${
        o.status
      }</span>
            </div>
            <div style="color: #4ade80; font-weight: bold;">${formatCurrency(
              o.total
            )}</div>
          </div>
          <div style="color: #999; font-size: 13px;">${o.customerName}</div>
          <div style="color: #666; font-size: 12px;">${date}</div>
        </div>
      `;
    })
    .join("");
}

function renderLowStockAlerts() {
  const alerts = DashboardAPI.getLowStockAlerts(10);
  const container = document.getElementById("low-stock-list");
  if (!container) return;

  if (alerts.length === 0) {
    container.innerHTML =
      '<p style="color: #10b981; text-align: center; padding: 20px;">✅ Tất cả sản phẩm đều đủ hàng!</p>';
    return;
  }

  container.innerHTML = `
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 15px;">
      ${alerts
        .map(
          (a) => `
        <div style="background: #333; padding: 15px; border-radius: 8px; border: 2px solid #f59e0b;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
            ${
              a.image
                ? `<img src="${a.image}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px;">`
                : '<div style="width: 50px; height: 50px; background: #555; border-radius: 8px;"></div>'
            }
            <div>
              <div style="color: white; font-weight: bold;">${a.name}</div>
              <div style="color: #f59e0b; font-size: 13px;">⚠️ Chỉ còn: ${
                a.stock
              }</div>
            </div>
          </div>
          <button onclick="window.navigateSPA?.('imports')" style="width: 100%; padding: 8px; background: #10b981; color: white; border: none; border-radius: 6px; cursor: pointer;">
            Nhập hàng ngay
          </button>
        </div>
      `
        )
        .join("")}
    </div>
  `;
}

// ============================================================================
// AUTO-UPDATE SYSTEM
// ============================================================================

let autoRefreshTimer = null;
let localStorageWatcher = null;

/**
 * ✅ Setup auto-refresh every 30 seconds
 */
function setupAutoRefresh(currentRange) {
  if (autoRefreshTimer) clearInterval(autoRefreshTimer);

  autoRefreshTimer = setInterval(() => {
    console.log("🔄 Auto-refreshing dashboard...");
    normalizeOrderStructure();
    renderDashboard(currentRange);
  }, AUTO_REFRESH_INTERVAL);

  console.log(
    `✅ Auto-refresh enabled (every ${AUTO_REFRESH_INTERVAL / 1000}s)`
  );
}

/**
 * ✅ Watch localStorage changes (for direct Console edits)
 */
function setupLocalStorageWatcher(currentRange) {
  let lastOrdersHash = JSON.stringify(getData("orders"));
  let lastProductsHash = JSON.stringify(getData("products"));

  if (localStorageWatcher) clearInterval(localStorageWatcher);

  localStorageWatcher = setInterval(() => {
    const currentOrdersHash = JSON.stringify(getData("orders"));
    const currentProductsHash = JSON.stringify(getData("products"));

    if (
      currentOrdersHash !== lastOrdersHash ||
      currentProductsHash !== lastProductsHash
    ) {
      console.log("📦 localStorage changed detected! Refreshing...");
      lastOrdersHash = currentOrdersHash;
      lastProductsHash = currentProductsHash;

      normalizeOrderStructure();
      renderDashboard(currentRange);
      showToast("🔄 Dữ liệu đã được cập nhật");
    }
  }, 2000); // Check every 2 seconds

  console.log("✅ localStorage watcher enabled");
}

// ============================================================================
// INITIALIZATION
// ============================================================================

export function initDashboardPage() {
  let currentRange = "30d";

  console.log("🔧 Initializing Dashboard...");
  normalizeOrderStructure();
  renderDashboard(currentRange);

  // ✅ Enable auto-refresh
  setupAutoRefresh(currentRange);

  // ✅ Enable localStorage watcher
  setupLocalStorageWatcher(currentRange);

  // Event listeners
  document
    .getElementById("date-range-selector")
    ?.addEventListener("change", (e) => {
      currentRange = e.target.value;
      renderDashboard(currentRange);
      setupAutoRefresh(currentRange);
      setupLocalStorageWatcher(currentRange);
    });

  document
    .getElementById("refresh-dashboard")
    ?.addEventListener("click", () => {
      normalizeOrderStructure();
      renderDashboard(currentRange);
      showToast("✅ Dữ liệu đã được làm mới!");
    });

  // Quick actions
  document
    .getElementById("quick-add-product")
    ?.addEventListener("click", () => window.navigateSPA?.("products"));
  document
    .getElementById("quick-add-order")
    ?.addEventListener("click", () => window.navigateSPA?.("orders"));
  document
    .getElementById("quick-add-import")
    ?.addEventListener("click", () => window.navigateSPA?.("imports"));
  document
    .getElementById("quick-view-reports")
    ?.addEventListener("click", () => window.navigateSPA?.("reports"));
  document
    .getElementById("quick-view-inventory")
    ?.addEventListener("click", () => window.navigateSPA?.("inventory"));

  // ✅ BroadcastChannel listener (for UI-based updates)
  const channel = new BroadcastChannel("data_update");

  channel.onmessage = (event) => {
    const { type, action, orderId } = event.data;

    if (type === "orders_updated" || type === "products_updated") {
      console.log(
        `📡 Received ${type} event${action ? ` (${action})` : ""}${
          orderId ? ` for order #${orderId}` : ""
        }`
      );

      normalizeOrderStructure();
      renderDashboard(currentRange);
      showToast(
        `📦 ${
          type === "orders_updated" ? "Đơn hàng" : "Sản phẩm"
        } đã được cập nhật`
      );
    }
  };

  // Cleanup on page unload
  window.addEventListener("beforeunload", () => {
    if (autoRefreshTimer) clearInterval(autoRefreshTimer);
    if (localStorageWatcher) clearInterval(localStorageWatcher);
    channel.close();
  });

  console.log("✅ Dashboard initialized with auto-update!");
}

/**
 * Toast notification
 */
function showToast(message) {
  const oldToast = document.getElementById("dashboard-toast");
  if (oldToast) oldToast.remove();

  const toast = document.createElement("div");
  toast.id = "dashboard-toast";
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #10b981;
    color: white;
    padding: 15px 25px;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(16, 185, 129, 0.4);
    z-index: 99999;
    font-weight: 500;
    animation: slideIn 0.3s ease-out;
  `;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = "slideOut 0.3s ease-out";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// CSS animation
if (!document.getElementById("toast-animation-styles")) {
  const style = document.createElement("style");
  style.id = "toast-animation-styles";
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(400px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(400px); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}

// ============================================================================
// HTML TEMPLATE
// ============================================================================

export const dashboardHtml = `
<div style="padding: 20px; background: #1a1a1a; min-height: 100vh;">
  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
    <h2 style="color: #00bfff; margin: 0;">
      <i class="fas fa-chart-pie"></i> Dashboard
      <span style="font-size: 12px; color: #10b981; margin-left: 10px;">● Auto-update ON</span>
    </h2>
    <div style="display: flex; gap: 10px;">
      <select id="date-range-selector" style="padding: 10px; border-radius: 8px; background: #2a2a2a; color: white; border: 1px solid #444; cursor: pointer;">
        <option value="today">Hôm nay</option>
        <option value="7d">7 ngày</option>
        <option value="30d" selected>30 ngày</option>
        <option value="90d">90 ngày</option>
      </select>
      <button id="refresh-dashboard" style="padding: 10px 20px; background: #00bfff; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">
        <i class="fas fa-sync-alt"></i> Làm mới
      </button>
    </div>
  </div>

  <div id="kpi-section" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 40px;"></div>

  <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-bottom: 20px;">
    <div style="background: #2a2a2a; padding: 25px; border-radius: 12px;">
      <h3 style="color: #00bfff; margin: 0 0 20px 0;"><i class="fas fa-chart-line"></i> Xu hướng doanh thu</h3>
      <canvas id="sales-chart" style="max-height: 300px;"></canvas>
    </div>
    <div style="background: #2a2a2a; padding: 25px; border-radius: 12px;">
      <h3 style="color: #00bfff; margin: 0 0 20px 0;"><i class="fas fa-chart-pie"></i> Trạng thái đơn hàng</h3>
      <canvas id="status-chart" style="max-height: 300px;"></canvas>
    </div>
  </div>

  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
    <div style="background: #2a2a2a; padding: 25px; border-radius: 12px;">
      <h3 style="color: #00bfff; margin: 0 0 20px 0;"><i class="fas fa-fire"></i> Top sản phẩm</h3>
      <div id="top-products-list" style="max-height: 400px; overflow-y: auto;"></div>
    </div>
    <div style="background: #2a2a2a; padding: 25px; border-radius: 12px;">
      <h3 style="color: #00bfff; margin: 0 0 20px 0;"><i class="fas fa-shopping-cart"></i> Đơn hàng gần đây</h3>
      <div id="recent-orders-list" style="max-height: 400px; overflow-y: auto;"></div>
    </div>
  </div>

  <div style="background: #2a2a2a; padding: 25px; border-radius: 12px; margin-bottom: 20px;">
    <h3 style="color: #f59e0b; margin: 0 0 20px 0;"><i class="fas fa-exclamation-triangle"></i> Cảnh báo tồn kho thấp</h3>
    <div id="low-stock-list"></div>
  </div>

  <div style="background: #2a2a2a; padding: 25px; border-radius: 12px;">
    <h3 style="color: #00bfff; margin: 0 0 20px 0;"><i class="fas fa-bolt"></i> Thao tác nhanh</h3>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
      <button id="quick-add-product" style="background: #10b981; color: white; border: none; padding: 15px; border-radius: 8px; cursor: pointer; font-size: 16px;">
        <i class="fas fa-plus-circle"></i> Thêm sản phẩm
      </button>
      <button id="quick-add-order" style="background: #3b82f6; color: white; border: none; padding: 15px; border-radius: 8px; cursor: pointer; font-size: 16px;">
        <i class="fas fa-cart-plus"></i> Tạo đơn hàng
      </button>
      <button id="quick-add-import" style="background: #8b5cf6; color: white; border: none; padding: 15px; border-radius: 8px; cursor: pointer; font-size: 16px;">
        <i class="fas fa-truck-loading"></i> Phiếu nhập
      </button>
      <button id="quick-view-reports" style="background: #f59e0b; color: white; border: none; padding: 15px; border-radius: 8px; cursor: pointer; font-size: 16px;">
        <i class="fas fa-chart-bar"></i> Báo cáo
      </button>
      <button id="quick-view-inventory" style="background: #ec4899; color: white; border: none; padding: 15px; border-radius: 8px; cursor: pointer; font-size: 16px;">
        <i class="fas fa-warehouse"></i> Quản lý kho
      </button>
    </div>
  </div>
</div>
`;

// ============================================================================
// END OF FILE
// ============================================================================
