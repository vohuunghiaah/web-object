
export const reportHtml = `
    <h2 style="text-align: center; color: #38bdf8; font-size: 26px; margin-bottom: 8px;">
        Báo cáo & Phân tích
    </h2>
    <p style="text-align: center; color: #94a3b8; font-size: 16px; margin-bottom: 25px;">
        Tổng quan doanh thu & hoạt động kinh doanh
    </p>

    <div class="report-stats">
        <div class="stat-card green">
            <h3>Tổng doanh thu</h3>
            <p class="value" id="stat-total-revenue">Đang tải...</p>
            <span class="trend" id="stat-revenue-trend">+0%</span>
        </div>
        <div class="stat-card blue">
            <h3>Tổng đơn hàng</h3>
            <p class="value" id="stat-total-orders">Đang tải...</p>
            <span class="trend" id="stat-orders-trend">+0%</span>
        </div>
        <div class="stat-card orange">
            <h3>Khách hàng mới</h3>
            <p class="value" id="stat-new-customers">Đang tải...</p>
            <span class="trend" id="stat-customers-trend">+0%</span>
        </div>
    </div>

    <div class="charts-grid">
        <div class="chart-card">
            <h3>📊 Doanh thu theo tháng</h3>
            <canvas id="revenueChart"></canvas>
        </div>
        <div class="chart-card">
            <h3>📈 Phân bố đơn hàng</h3>
            <canvas id="orderChart"></canvas>
        </div>
    </div>

    <div class="report-tables">
        <div class="table-card">
            <h3>🏆 Khách hàng mua nhiều nhất</h3>
            <table class="report-table" id="topCustomersTable">
                <thead>
                    <tr>
                        <th>Khách hàng</th>
                        <th>Số đơn</th>
                        <th>Tổng chi (₫)</th>
                    </tr>
                </thead>
                <tbody>
                    </tbody>
            </table>
        </div>

        <div class="table-card">
            <h3>Sản phẩm bán chạy nhất</h3>
            <table class="report-table" id="bestProductsTable">
                <thead>
                    <tr>
                        <th>Sản phẩm</th>
                        <th>Đã bán</th>
                        <th>Doanh thu (₫)</th>
                    </tr>
                </thead>
                <tbody>
                     </tbody>
            </table>
        </div>
    </div>

    <div style="text-align: right; margin-top: 20px">
        <button id="exportExcelBtn" class="btn-export" style="background-color: #38bdf8; border: none; color: #fff; padding: 10px 14px; border-radius: 8px; cursor: pointer;">
            <i class="fas fa-file-excel"></i> Xuất Excel
        </button>
    </div>
`;



export function initReportPage() {
    // Lấy dữ liệu (chúng ta sẽ dùng dữ liệu thật từ localStorage)
    const getData = key => JSON.parse(localStorage.getItem(key));
    const allOrders = getData("orders") || [];
    const allProducts = getData("products") || [];
    const allUsers = getData("users") || [];

    // --- 1. Xử lý Thẻ Thống Kê Nhanh ---
    const completedOrders = allOrders.filter(o => o.status === "Đã giao");
    const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0);
    const totalOrders = allOrders.length;
    const totalCustomers = allUsers.filter(u => u.role === 'Khách hàng').length;

    // Kiểm tra phần tử tồn tại trước khi gán
    const statRevenue = document.getElementById("stat-total-revenue");
    if (statRevenue) statRevenue.textContent = totalRevenue.toLocaleString('vi-VN') + '₫';
    
    const statOrders = document.getElementById("stat-total-orders");
    if (statOrders) statOrders.textContent = totalOrders;
    
    const statCustomers = document.getElementById("stat-new-customers");
    if (statCustomers) statCustomers.textContent = totalCustomers;

    const statRevenueTrend = document.getElementById("stat-revenue-trend");
    if (statRevenueTrend) statRevenueTrend.textContent = `+${(totalRevenue > 0 ? 100 : 0)}%`;
    
    const statOrdersTrend = document.getElementById("stat-orders-trend");
    if (statOrdersTrend) statOrdersTrend.textContent = `+${totalOrders > 0 ? 100 : 0}%`;
    
    const statCustomersTrend = document.getElementById("stat-customers-trend");
    if (statCustomersTrend) statCustomersTrend.textContent = `+${totalCustomers > 0 ? 100 : 0}%`;


    // --- 2. Xử lý Biểu đồ Doanh thu (Bar) ---
    const revenueByMonth = {}; // { "10/2025": 10000, "11/2025": 20000 }
    completedOrders.forEach(order => {
        const date = new Date(order.date);
        const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
        revenueByMonth[monthYear] = (revenueByMonth[monthYear] || 0) + order.total;
    });

    const ctxRevenue = document.getElementById("revenueChart");
    if (ctxRevenue) {

        if (window.myRevenueChart) {
            window.myRevenueChart.destroy();
        }
        window.myRevenueChart = new Chart(ctxRevenue, {
            type: "bar",
            data: {
                labels: Object.keys(revenueByMonth),
                datasets: [{
                    label: "Doanh thu (vn₫)",
                    data: Object.values(revenueByMonth),
                    backgroundColor: "#38bdf8",
                }],
            },
            options: {
                responsive: true,
                scales: {
                    x: { ticks: { color: "#cbd5e1" }, grid: { color: "#334155" } },
                    y: { ticks: { color: "#cbd5e1" }, grid: { color: "#334155" } },
                },
                plugins: { legend: { labels: { color: "#f8fafc" } } },
            },
        });
    }

    // --- 3. Xử lý Biểu đồ Phân bố (Doughnut) ---
    const ctxOrder = document.getElementById("orderChart");
    if (ctxOrder) {
        // Hủy biểu đồ cũ (nếu có)
        if (window.myOrderChart) {
            window.myOrderChart.destroy();
        }
        window.myOrderChart = new Chart(ctxOrder, {
            type: "doughnut",
            data: {
                labels: ["Mới đặt", "Đang xử lý", "Đã giao", "Đã hủy"],
                datasets: [{
                    data: [
                        allOrders.filter(o => o.status === 'Mới đặt').length,
                        allOrders.filter(o => o.status === 'Đang xử lý').length,
                        allOrders.filter(o => o.status === 'Đã giao').length,
                        allOrders.filter(o => o.status === 'Đã hủy').length,
                    ],
                    backgroundColor: ["#38bdf8", "#facc15", "#4ade80", "#f87171"],
                }],
            },
            options: {
                plugins: { legend: { labels: { color: "#f8fafc" } } },
            },
        });
    }
    
    // --- 4. Xử lý Bảng Top Khách Hàng ---
    const customerSpending = {}; // { "ten_khach_hang": 10000 }
    completedOrders.forEach(order => {
        customerSpending[order.user] = (customerSpending[order.user] || 0) + order.total;
    });
    const sortedCustomers = Object.entries(customerSpending)
        .map(([name, total]) => ({ name, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5); // Lấy top 5

    const topCustomersTable = document.getElementById("topCustomersTable")?.getElementsByTagName('tbody')[0];
    if (topCustomersTable) {
        topCustomersTable.innerHTML = sortedCustomers.map(c => `
            <tr>
                <td style="padding: 10px 8px">${c.name}</td>
                <td style="padding: 10px 8px; text-align: center;">
                    ${completedOrders.filter(o => o.user === c.name).length}
                </td>
                <td style="padding: 10px 8px; text-align: right;">${c.total.toLocaleString("vi-VN")}₫</td>
            </tr>
        `).join('');
    }


    // --- 5. Xử lý Bảng Sản phẩm bán chạy ---
    const productRevenue = {}; // { "product_id": { name: "Ten SP", sold: 0, revenue: 0 } }
    completedOrders.forEach(order => {
        // Lặp qua mảng products trong mỗi đơn hàng
        order.products.forEach(p => {
            const pId = p.productId;
            if (!pId) return; // Bỏ qua nếu sản phẩm không có ID

            if (!productRevenue[pId]) {
                const productInfo = allProducts.find(prod => prod.id == pId); // Dùng ==
                productRevenue[pId] = { 
                    name: productInfo ? productInfo.name : `(ID: ${pId})`, 
                    sold: 0, 
                    revenue: 0 
                };
            }
            productRevenue[pId].sold += p.quantity;
            // Tính doanh thu dựa trên giá sản phẩm * số lượng (chính xác hơn)
            productRevenue[pId].revenue += (p.price * p.quantity); 
        });
    });
    
    const sortedProducts = Object.values(productRevenue)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5); // Lấy top 5

    const bestProductsTable = document.getElementById("bestProductsTable")?.getElementsByTagName('tbody')[0];
    if (bestProductsTable) {
        bestProductsTable.innerHTML = sortedProducts.map(p => `
            <tr>
                <td style="padding: 10px 8px">${p.name}</td>
                <td style="padding: 10px 8px; text-align: center;">${p.sold}</td>
                <td style="padding: 10px 8px; text-align: right;">${p.revenue.toLocaleString("vi-VN")}₫</td>
            </tr>
        `).join('');
    }

    // --- 6. Gán sự kiện Xuất Excel ---
    const exportBtn = document.getElementById("exportExcelBtn");
    if (exportBtn) {
        // Xóa listener cũ để tránh gán đè
        const newExportBtn = exportBtn.cloneNode(true);
        exportBtn.parentNode.replaceChild(newExportBtn, exportBtn);

        newExportBtn.addEventListener("click", function () {
            const tables = document.querySelectorAll(".report-table"); // Lấy cả 2 bảng
            if (tables.length === 0) {
                alert("Không tìm thấy bảng dữ liệu để xuất!");
                return;
            }

            const wb = XLSX.utils.book_new();
            const ws_cust = XLSX.utils.table_to_sheet(tables[0]);
            XLSX.utils.book_append_sheet(wb, ws_cust, "Top Khach Hang");
            const ws_prod = XLSX.utils.table_to_sheet(tables[1]);
            XLSX.utils.book_append_sheet(wb, ws_prod, "Top San Pham");

            XLSX.writeFile(wb, "BaoCao_KinhDoanh.xlsx");
        });
    }
}
