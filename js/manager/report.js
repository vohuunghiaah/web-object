// ============================================================================
// REPORT PAGE - Báo cáo và phân tích doanh thu
// ============================================================================

import { getSafeOrderTotal } from "../utils/orderUtils.js";

// ============================================================================
// CONSTANTS
// ============================================================================

const SUCCESS_STATUSES = ["Giao hàng thành công", "Đã giao"];

// ============================================================================
// UTILITIES
// ============================================================================

const getData = (key) => JSON.parse(localStorage.getItem(key) || "null");
const formatCurrency = (val) => (val || 0).toLocaleString("vi-VN") + "₫";
const formatNumber = (val) => (val || 0).toLocaleString("vi-VN");

/**
 * ✅ Get valid date from order (prefer orderDate over invalid date)
 */
function getValidOrderDate(order) {
  if (order.orderDate) {
    const d = new Date(order.orderDate);
    if (!isNaN(d.getTime()) && d.getFullYear() >= 2000) {
      return d;
    }
  }

  if (order.date) {
    const d = new Date(order.date);
    if (!isNaN(d.getTime()) && d.getFullYear() >= 2000) {
      return d;
    }
  }

  if (order.id) {
    return new Date(order.id);
  }

  return new Date();
}

/**
 * ✅ Get customers from localStorage (supports both keys)
 */
function getCustomers() {
  // Priority 1: Check customers key
  const customers = getData("customers");
  if (customers && Array.isArray(customers) && customers.length > 0) {
    console.log("📦 Using 'customers' key:", customers.length, "customers");
    return customers;
  }

  // Priority 2: Fallback to users with role "Khách hàng"
  const users = getData("users") || [];
  const customerUsers = users.filter((u) => u.role === "Khách hàng");
  console.log(
    "📦 Using 'users' key with role filter:",
    customerUsers.length,
    "customers"
  );
  return customerUsers;
}

// ============================================================================
// HTML TEMPLATE
// ============================================================================

export const reportHtml = `
<div style="padding: 20px; background: #1a1a1a; min-height: 100vh; color: white;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h2 style="color: #38bdf8; font-size: 28px; margin: 0 0 8px 0;">
      <i class="fas fa-chart-line"></i> Báo cáo & Phân tích
    </h2>
    <p style="color: #94a3b8; font-size: 16px; margin: 0;">
      Tổng quan doanh thu & hoạt động kinh doanh
    </p>
  </div>

  <!-- Stats Cards -->
  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 30px;">
    <div style="background: linear-gradient(135deg, #059669 100%); padding: 24px; border-radius: 12px; box-shadow: 0 4px 20px rgba(16, 185, 129, 0.3);">
      <div style="display: flex; justify-content: space-between; align-items: start;">
        <div style="flex: 1;">
          <h3 style="margin: 0; font-size: 13px; opacity: 0.9; text-transform: uppercase; letter-spacing: 0.5px;">Tổng doanh thu</h3>
          <p id="stat-total-revenue" style="font-size: 32px; font-weight: bold; margin: 12px 0 8px 0;">Đang tải...</p>
          <span id="stat-revenue-trend" style="font-size: 12px; display: block; line-height: 1.5; opacity: 0.9;"></span>
        </div>
        <i class="fas fa-dollar-sign" style="font-size: 36px; opacity: 0.3;"></i>
      </div>
    </div>

    <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 24px; border-radius: 12px; box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);">
      <div style="display: flex; justify-content: space-between; align-items: start;">
        <div style="flex: 1;">
          <h3 style="margin: 0; font-size: 13px; opacity: 0.9; text-transform: uppercase; letter-spacing: 0.5px;">Đơn đã giao</h3>
          <p id="stat-completed-orders" style="font-size: 32px; font-weight: bold; margin: 12px 0 8px 0;">Đang tải...</p>
          <span id="stat-orders-trend" style="font-size: 12px; display: block; line-height: 1.5; opacity: 0.9;">📦 Tổng: 0</span>
        </div>
        <i class="fas fa-shopping-cart" style="font-size: 36px; opacity: 0.3;"></i>
      </div>
    </div>

    <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 24px; border-radius: 12px; box-shadow: 0 4px 20px rgba(245, 158, 11, 0.3);">
      <div style="display: flex; justify-content: space-between; align-items: start;">
        <div style="flex: 1;">
          <h3 style="margin: 0; font-size: 13px; opacity: 0.9; text-transform: uppercase; letter-spacing: 0.5px;">Khách hàng</h3>
          <p id="stat-total-customers" style="font-size: 32px; font-weight: bold; margin: 12px 0 8px 0;">Đang tải...</p>
          <span id="stat-customers-trend" style="font-size: 12px; display: block; line-height: 1.5; opacity: 0.9;">👥 Tổng số khách</span>
        </div>
        <i class="fas fa-users" style="font-size: 36px; opacity: 0.3;"></i>
      </div>
    </div>
  </div>

  <!-- Charts -->
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
    <div style="background: #2a2a2a; padding: 25px; border-radius: 12px;">
      <h3 style="color: #38bdf8; margin: 0 0 20px 0;">
        <i class="fas fa-chart-bar"></i> Doanh thu theo tháng
      </h3>
      <canvas id="revenueChart" style="max-height: 350px;"></canvas>
    </div>

    <div style="background: #2a2a2a; padding: 25px; border-radius: 12px;">
      <h3 style="color: #38bdf8; margin: 0 0 20px 0;">
        <i class="fas fa-chart-pie"></i> Phân bố đơn hàng
      </h3>
      <canvas id="orderChart" style="max-height: 350px;"></canvas>
    </div>
  </div>

  <!-- Tables -->
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
    <div style="background: #2a2a2a; padding: 25px; border-radius: 12px;">
      <h3 style="color: #38bdf8; margin: 0 0 20px 0;">
        <i class="fas fa-crown"></i> Top khách hàng VIP
      </h3>
      <div style="overflow-x: auto;">
        <table id="topCustomersTable" style="width: 100%; border-collapse: collapse; color: white;">
          <thead style="background: #1a1a1a;">
            <tr>
              <th style="padding: 12px 8px; text-align: left; border-bottom: 2px solid #334155;">Khách hàng</th>
              <th style="padding: 12px 8px; text-align: center; border-bottom: 2px solid #334155;">Số đơn</th>
              <th style="padding: 12px 8px; text-align: right; border-bottom: 2px solid #334155;">Tổng chi</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>
    </div>

    <div style="background: #2a2a2a; padding: 25px; border-radius: 12px;">
      <h3 style="color: #38bdf8; margin: 0 0 20px 0;">
        <i class="fas fa-fire"></i> Sản phẩm bán chạy
      </h3>
      <div style="overflow-x: auto;">
        <table id="bestProductsTable" style="width: 100%; border-collapse: collapse; color: white;">
          <thead style="background: #1a1a1a;">
            <tr>
              <th style="padding: 12px 8px; text-align: left; border-bottom: 2px solid #334155;">Sản phẩm</th>
              <th style="padding: 12px 8px; text-align: center; border-bottom: 2px solid #334155;">Đã bán</th>
              <th style="padding: 12px 8px; text-align: right; border-bottom: 2px solid #334155;">Doanh thu</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- Export Button -->
  <div style="text-align: right;">
    <button id="exportExcelBtn" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border: none; color: white; padding: 14px 28px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 15px; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3); transition: all 0.3s;">
      <i class="fas fa-file-excel"></i> Xuất báo cáo Excel
    </button>
  </div>
</div>
`;

// ============================================================================
// DATA PROCESSING
// ============================================================================

function processReportData() {
  const allOrders = getData("orders") || [];
  const allProducts = getData("products") || [];
  const allCustomers = getCustomers(); // ✅ Use correct function

  console.log("📊 Report: Processing data...");
  console.log(`📦 Total orders: ${allOrders.length}`);
  console.log(`👥 Total customers: ${allCustomers.length}`);
  console.log("Orders sample:", allOrders[0]);
  console.log("Customers sample:", allCustomers[0]);

  // Filter completed orders
  const completedOrders = allOrders.filter((o) =>
    SUCCESS_STATUSES.includes(o.status)
  );
  console.log(`✅ Completed orders: ${completedOrders.length}`);

  // Calculate totals
  const totalRevenue = completedOrders.reduce(
    (sum, o) => sum + getSafeOrderTotal(o),
    0
  );
  const totalOrders = allOrders.length;
  const totalCustomers = allCustomers.length;

  console.log(`💰 Total revenue: ${formatCurrency(totalRevenue)}`);

  // Revenue by month
  const monthlyData = {};
  completedOrders.forEach((order) => {
    const date = getValidOrderDate(order);
    const monthKey = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}`;
    monthlyData[monthKey] =
      (monthlyData[monthKey] || 0) + getSafeOrderTotal(order);
  });

  const sortedMonths = Object.keys(monthlyData).sort();
  const revenueByMonth = {};
  sortedMonths.forEach((key) => {
    const [year, month] = key.split("-");
    const displayKey = `Tháng ${parseInt(month)}/${year}`;
    revenueByMonth[displayKey] = monthlyData[key];
  });

  console.log("📅 Revenue by month:", revenueByMonth);

  // Order distribution
  const orderDistribution = {
    "Chờ xác nhận": allOrders.filter((o) => o.status === "Chờ xác nhận").length,
    "Đang xử lý": allOrders.filter((o) => o.status === "Đang xử lý").length,
    "Đang vận chuyển": allOrders.filter((o) => o.status === "Đang vận chuyển")
      .length,
    "Đã giao": completedOrders.length,
    "Đã hủy": allOrders.filter((o) => o.status === "Đã hủy").length,
  };

  // Top customers
  const customerMap = {};
  completedOrders.forEach((order) => {
    const name =
      order.customerName || order.address?.name || order.user || "Khách lẻ";
    if (!customerMap[name]) {
      customerMap[name] = { name, total: 0, orderCount: 0 };
    }
    customerMap[name].total += getSafeOrderTotal(order);
    customerMap[name].orderCount += 1;
  });

  const topCustomers = Object.values(customerMap)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);
  console.log("👥 Top customers:", topCustomers);

  // Top products
  const productMap = {};
  completedOrders.forEach((order) => {
    if (!order.products || !Array.isArray(order.products)) return;

    order.products.forEach((item) => {
      const pid = item.productId || item.id;
      if (!pid) return;

      if (!productMap[pid]) {
        const product = allProducts.find((p) => p.id == pid);
        productMap[pid] = {
          name: item.productName || product?.name || `Product #${pid}`,
          sold: 0,
          revenue: 0,
        };
      }
      productMap[pid].sold += item.quantity || 0;
      productMap[pid].revenue += (item.price || 0) * (item.quantity || 0);
    });
  });

  const topProducts = Object.values(productMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
  console.log("🔥 Top products:", topProducts);

  return {
    totalRevenue,
    totalOrders,
    completedOrders: completedOrders.length,
    totalCustomers,
    revenueByMonth,
    orderDistribution,
    topCustomers,
    topProducts,
  };
}

// ============================================================================
// GROWTH STATISTICS
// ============================================================================

function calculateGrowthStats() {
  const allOrders = getData("orders") || [];
  const allCustomers = getCustomers(); // ✅ Use correct function

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

  console.log(
    `📅 Growth comparison: ${prevMonth}/${prevYear} vs ${currentMonth}/${currentYear}`
  );

  const getOrdersByMonth = (year, month, statusFilter = null) => {
    return allOrders.filter((o) => {
      const orderDate = getValidOrderDate(o);
      const matchesMonth =
        orderDate.getFullYear() === year && orderDate.getMonth() + 1 === month;
      const matchesStatus = statusFilter
        ? SUCCESS_STATUSES.includes(o.status)
        : true;
      return matchesMonth && matchesStatus;
    });
  };

  // Revenue
  const currentMonthRevenue = getOrdersByMonth(
    currentYear,
    currentMonth,
    true
  ).reduce((sum, o) => sum + getSafeOrderTotal(o), 0);
  const prevMonthRevenue = getOrdersByMonth(prevYear, prevMonth, true).reduce(
    (sum, o) => sum + getSafeOrderTotal(o),
    0
  );

  // Orders
  const currentMonthOrders = getOrdersByMonth(
    currentYear,
    currentMonth,
    false
  ).length;
  const prevMonthOrders = getOrdersByMonth(prevYear, prevMonth, false).length;

  // ✅ Customers - Support multiple date fields
  const getNewCustomersByMonth = (year, month) => {
    return allCustomers.filter((c) => {
      const dateField =
        c.createdAt || c.registrationDate || c.createdDate || c.joinDate;
      if (!dateField) return false;

      const createdDate = new Date(dateField);
      if (isNaN(createdDate.getTime())) return false;

      return (
        createdDate.getFullYear() === year &&
        createdDate.getMonth() + 1 === month
      );
    }).length;
  };

  const currentMonthCustomers = getNewCustomersByMonth(
    currentYear,
    currentMonth
  );
  const prevMonthCustomers = getNewCustomersByMonth(prevYear, prevMonth);

  console.log(
    `📊 Current month customers: ${currentMonthCustomers}, Previous: ${prevMonthCustomers}`
  );

  const calculateGrowth = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return parseFloat((((current - previous) / previous) * 100).toFixed(1));
  };

  const revenueGrowth = calculateGrowth(currentMonthRevenue, prevMonthRevenue);
  const ordersGrowth = calculateGrowth(currentMonthOrders, prevMonthOrders);
  const customersGrowth = calculateGrowth(
    currentMonthCustomers,
    prevMonthCustomers
  );

  return {
    revenue: {
      current: currentMonthRevenue,
      previous: prevMonthRevenue,
      growth: revenueGrowth,
      growthText:
        revenueGrowth > 0 ? `+${revenueGrowth}%` : `${revenueGrowth}%`,
      isPositive: revenueGrowth >= 0,
    },
    orders: {
      current: currentMonthOrders,
      previous: prevMonthOrders,
      growth: ordersGrowth,
      growthText: ordersGrowth > 0 ? `+${ordersGrowth}%` : `${ordersGrowth}%`,
      isPositive: ordersGrowth >= 0,
    },
    customers: {
      current: currentMonthCustomers,
      previous: prevMonthCustomers,
      growth: customersGrowth,
      growthText:
        customersGrowth > 0 ? `+${customersGrowth}%` : `${customersGrowth}%`,
      isPositive: customersGrowth >= 0,
    },
  };
}

// ============================================================================
// RENDER FUNCTIONS
// ============================================================================

function renderStats(data) {
  const growthStats = calculateGrowthStats();

  console.log("📊 Rendering stats with growth data:", growthStats);

  // Revenue
  document.getElementById("stat-total-revenue").textContent = formatCurrency(
    data.totalRevenue
  );
  // Orders
  document.getElementById("stat-completed-orders").textContent = formatNumber(
    data.completedOrders
  );
  const ordersTrend = document.getElementById("stat-orders-trend");
  const ordersIcon = growthStats.orders.isPositive ? "📦" : "📉";
  const ordersColor = growthStats.orders.isPositive ? "#10b981" : "#ef4444";
  ordersTrend.innerHTML = `${ordersIcon} Tổng: <strong>${data.totalOrders}</strong> | <span style="color: ${ordersColor}; font-weight: bold;">${growthStats.orders.growthText}</span> vs kì trước `;

  // Customers
  document.getElementById("stat-total-customers").textContent = formatNumber(
    data.totalCustomers
  );
  const customersTrend = document.getElementById("stat-customers-trend");
  const customersIcon = growthStats.customers.isPositive ? "👥" : "📉";
  const customersColor = growthStats.customers.isPositive
    ? "#10b981"
    : "#ef4444";
  customersTrend.innerHTML = `${customersIcon} Khách mới: <strong>${growthStats.customers.current}</strong> | <span style="color: ${customersColor}; font-weight: bold;">${growthStats.customers.growthText}</span>`;
}

function renderRevenueChart(revenueByMonth) {
  const ctx = document.getElementById("revenueChart");
  if (!ctx) return;

  if (window.myRevenueChart) window.myRevenueChart.destroy();

  const labels = Object.keys(revenueByMonth);
  const values = Object.values(revenueByMonth);

  if (labels.length === 0) {
    ctx.parentElement.innerHTML +=
      '<p style="text-align: center; color: #999; padding: 40px; margin-top: -350px;">Chưa có dữ liệu doanh thu</p>';
    return;
  }

  window.myRevenueChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Doanh thu (VNĐ)",
          data: values,
          backgroundColor: "rgba(56, 189, 248, 0.8)",
          borderColor: "#38bdf8",
          borderWidth: 2,
          borderRadius: 8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          labels: { color: "#f8fafc", font: { size: 13 } },
          display: true,
        },
        tooltip: {
          callbacks: {
            label: (ctx) => `Doanh thu: ${formatCurrency(ctx.parsed.y)}`,
          },
        },
      },
      scales: {
        x: {
          ticks: { color: "#cbd5e1", font: { size: 12 } },
          grid: { color: "#334155" },
        },
        y: {
          ticks: {
            color: "#cbd5e1",
            font: { size: 12 },
            callback: (val) => formatCurrency(val),
          },
          grid: { color: "#334155" },
        },
      },
    },
  });
}

function renderOrderChart(orderDistribution) {
  const ctx = document.getElementById("orderChart");
  if (!ctx) return;

  if (window.myOrderChart) window.myOrderChart.destroy();

  const labels = Object.keys(orderDistribution);
  const values = Object.values(orderDistribution);

  window.myOrderChart = new Chart(ctx, {
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
          borderWidth: 3,
          borderColor: "#1a1a1a",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: "bottom",
          labels: { color: "#f8fafc", padding: 15, font: { size: 13 } },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              const pct =
                total > 0 ? ((ctx.parsed / total) * 100).toFixed(1) : 0;
              return `${ctx.label}: ${ctx.parsed} đơn (${pct}%)`;
            },
          },
        },
      },
    },
  });
}

function renderTopCustomersTable(topCustomers) {
  const tbody = document.querySelector("#topCustomersTable tbody");
  if (!tbody) return;

  if (topCustomers.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="3" style="text-align: center; padding: 30px; color: #999;">Chưa có dữ liệu khách hàng</td></tr>';
    return;
  }

  tbody.innerHTML = topCustomers
    .map(
      (c, i) => `
      <tr style="border-bottom: 1px solid #334155;">
        <td style="padding: 14px 8px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="color: ${
              i < 3 ? "#ffd700" : "#38bdf8"
            }; font-weight: bold; min-width: 24px;">
              ${i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
            </span>
            <span>${c.name}</span>
          </div>
        </td>
        <td style="padding: 14px 8px; text-align: center; color: #94a3b8;">${
          c.orderCount
        }</td>
        <td style="padding: 14px 8px; text-align: right; color: #10b981; font-weight: bold;">${formatCurrency(
          c.total
        )}</td>
      </tr>
    `
    )
    .join("");
}

function renderBestProductsTable(topProducts) {
  const tbody = document.querySelector("#bestProductsTable tbody");
  if (!tbody) return;

  if (topProducts.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="3" style="text-align: center; padding: 30px; color: #999;">Chưa có dữ liệu sản phẩm</td></tr>';
    return;
  }

  tbody.innerHTML = topProducts
    .map(
      (p, i) => `
      <tr style="border-bottom: 1px solid #334155;">
        <td style="padding: 14px 8px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="color: ${
              i < 3 ? "#ffd700" : "#38bdf8"
            }; font-weight: bold; min-width: 24px;">
              ${i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
            </span>
            <span>${p.name}</span>
          </div>
        </td>
        <td style="padding: 14px 8px; text-align: center; color: #94a3b8;">${formatNumber(
          p.sold
        )}</td>
        <td style="padding: 14px 8px; text-align: right; color: #10b981; font-weight: bold;">${formatCurrency(
          p.revenue
        )}</td>
      </tr>
    `
    )
    .join("");
}

// ============================================================================
// EXPORT EXCEL
// ============================================================================

function exportToExcel() {
  const tables = document.querySelectorAll("table");
  if (tables.length === 0) {
    alert("Không tìm thấy bảng dữ liệu để xuất!");
    return;
  }

  const wb = XLSX.utils.book_new();
  const ws_cust = XLSX.utils.table_to_sheet(tables[0]);
  XLSX.utils.book_append_sheet(wb, ws_cust, "Top Khach Hang");

  const ws_prod = XLSX.utils.table_to_sheet(tables[1]);
  XLSX.utils.book_append_sheet(wb, ws_prod, "San Pham Ban Chay");

  const today = new Date().toISOString().split("T")[0];
  XLSX.writeFile(wb, `BaoCao_DoanhThu_${today}.xlsx`);
  console.log("✅ Exported Excel successfully!");
}

// ============================================================================
// INITIALIZATION
// ============================================================================

export function initReportPage() {
  console.log("📊 Initializing Report Page...");
  console.log("📦 localStorage keys:", Object.keys(localStorage));

  try {
    const reportData = processReportData();

    renderStats(reportData);
    renderRevenueChart(reportData.revenueByMonth);
    renderOrderChart(reportData.orderDistribution);
    renderTopCustomersTable(reportData.topCustomers);
    renderBestProductsTable(reportData.topProducts);

    const exportBtn = document.getElementById("exportExcelBtn");
    if (exportBtn) {
      const newBtn = exportBtn.cloneNode(true);
      exportBtn.parentNode.replaceChild(newBtn, exportBtn);
      newBtn.addEventListener("click", exportToExcel);
    }

    console.log("✅ Report page initialized successfully!");
  } catch (error) {
    console.error("❌ Error initializing report page:", error);
  }
}

// ============================================================================
// END OF FILE
// ============================================================================
