const getData = key => JSON.parse(localStorage.getItem(key));
const formatCurrency = (val) => (val || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

export const dashboardHtml = `
<div style="padding: 20px;">
    <h2 style="color: #00bfff; margin-bottom: 20px;">Tổng quan hôm nay</h2>

    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 40px;">
        <div class="stat-card" style="background: #1e293b; padding: 20px; border-radius: 12px; color: white;">
            <h3 style="color: #94a3b8; font-size: 16px; margin-top: 0;">Đơn hàng chờ xử lý</h3>
            <div id="kpi-pending-orders" style="font-size: 36px; font-weight: bold; color: #facc15;">--</div>
        </div>
        <div class="stat-card" style="background: #1e293b; padding: 20px; border-radius: 12px; color: white;">
            <h3 style="color: #94a3b8; font-size: 16px; margin-top: 0;">Doanh thu tạm tính</h3>
             <div id="kpi-revenue" style="font-size: 36px; font-weight: bold; color: #4ade80;">--</div>
        </div>
        <div class="stat-card" style="background: #1e293b; padding: 20px; border-radius: 12px; color: white;">
            <h3 style="color: #94a3b8; font-size: 16px; margin-top: 0;">Sản phẩm sắp hết hàng</h3>
             <div id="kpi-low-stock" style="font-size: 36px; font-weight: bold; color: #f87171;">--</div>
        </div>
    </div>

    <div style="background: #2a2a2a; padding: 20px; border-radius: 12px; color: white; text-align: center; border: 1px dashed #555;">
        <i class="fas fa-chart-line" style="font-size: 48px; color: #444; margin-bottom: 20px;"></i>
        <p>Các biểu đồ thống kê chi tiết vui lòng xem tại trang <strong>Reports</strong>.</p>
    </div>

</div>
`;

export function initDashboardPage() {
    // Lấy dữ liệu
    const orders = getData("orders") || [];
    const products = getData("products") || [];

    //Tính đơn chờ
    const pendingCount = orders.filter(o => o.status === "Chờ xác nhận" || o.status === "Đang xử lý").length;
    document.getElementById('kpi-pending-orders').textContent = pendingCount;

    //Tính doanh thu (đơn giản - chỉ tính đơn thành công)
    const revenue = orders
        .filter(o => o.status === "Giao hàng thành công")
        .reduce((sum, o) => sum + (o.total || 0), 0);
    document.getElementById('kpi-revenue').textContent = formatCurrency(revenue);

    //Tính SP sắp hết
    const lowStockCount = products.filter(p => (p.quantity || 0) <= (p.lowStockThreshold || 10)).length;
    document.getElementById('kpi-low-stock').textContent = lowStockCount;
}