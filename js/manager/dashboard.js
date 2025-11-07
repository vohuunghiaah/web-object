

const getData = key => JSON.parse(localStorage.getItem(key));
const formatCurrency = (val) => (val || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
const formatDate = (dateString) => new Date(dateString).toLocaleDateString('vi-VN');

// HTML CỦA TRANG
export const dashboardHtml = `
<div style="padding: 20px;">
    
    <h2>Cảnh Báo Tồn Kho Thấp</h2>
    <div id="low-stock-alerts" style="margin-bottom: 30px;">
        </div>
    
    <hr style="border-color: #eee;">
    
    <h2 style="margin-top: 30px;">Tra Cứu Xuất / Nhập / Tồn</h2>
    <div class="order-filters" style="display: flex; gap: 15px; align-items: flex-end; padding: 15px; background: #f9f9f9; border-radius: 8px; margin-bottom: 20px;">
        <div style="flex-grow: 1;">
            <label>Chọn Sản Phẩm:</label>
            <select id="ledger-product" class="product-select" style="width:100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;"></select>
        </div>
        <div style="flex-grow: 1;">
            <label>Từ ngày:</label>
            <input type="date" id="ledger-date-from" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #ccc;">
        </div>
        <div style="flex-grow: 1;">
            <label>Đến ngày:</label>
            <input type="date" id="ledger-date-to" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #ccc;">
        </div>
        <button id="ledger-btn" class="button" style="padding: 8px 15px; height: 38px;">Tra cứu</button>
    </div>
    
    <div id="ledger-results"></div>
    
</div>
`;

// LOGIC CỦA TRANG
export function initDashboardPage() {
    
    const lowStockEl = document.getElementById('low-stock-alerts');
    const ledgerProductSelect = document.getElementById('ledger-product');
    const ledgerBtn = document.getElementById('ledger-btn');
    const ledgerResultsEl = document.getElementById('ledger-results');

    // Lấy dữ liệu
    const allProducts = getData("products") || [];
    const allImports = getData("importSlips") || [];
    const allOrders = getData("orders") || [];

    // --- 1. Chạy Cảnh Báo Tồn Kho Thấp ---
    function renderLowStockAlerts() {
        const lowStockProducts = allProducts.filter(p => p.quantity <= p.lowStockThreshold);
        
        if (lowStockProducts.length === 0) {
            lowStockEl.innerHTML = "<p style='color: green;'>Tất cả sản phẩm đều còn hàng.</p>";
            return;
        }
        
        lowStockEl.innerHTML = `
            <table class="table_content" style="width:100%; color: #333; border: 1px solid #ddd;">
                <tr style="background: #f2f2f2;">
                    <th style="color: #333; text-shadow: none;">Sản phẩm</th>
                    <th style="color: #333; text-shadow: none;">Tồn kho</th>
                    <th style="color: #333; text-shadow: none;">Mức cảnh báo</th>
                </tr>
                ${lowStockProducts.map(p => `
                    <tr style="background: #fff;">
                        <td>${p.name} (#${p.id})</td>
                        <td style="color: red; font-weight: bold;">${p.quantity}</td>
                        <td>${p.lowStockThreshold}</td>
                    </tr>
                `).join('')}
            </table>
        `;
    }

    // --- 2. Nạp sản phẩm vào ô tra cứu ---
    function loadProductSelect() {
        ledgerProductSelect.innerHTML = allProducts
            .map(p => `<option value="${p.id}">${p.name} (Tồn: ${p.quantity})</option>`)
            .join('');
    }
    
    // --- 3. Chạy Tra Cứu X-N-T ---
    ledgerBtn.onclick = () => {
        const productId = parseInt(ledgerProductSelect.value);
        const product = allProducts.find(p => p.id === productId);
        if (!product) return;

        const dateFrom = document.getElementById('ledger-date-from').value;
        const dateTo = document.getElementById('ledger-date-to').value;
        
        const start = dateFrom ? new Date(dateFrom).getTime() : 0;
        const end = dateTo ? new Date(dateTo).getTime() + 86400000 : Infinity;
        let ledger = []; // Sổ cái

        // Lọc "NHẬP" (IN)
        allImports.forEach(slip => {
            const slipDate = new Date(slip.date).getTime();
            if (slip.status === "Hoàn thành" && slipDate >= start && slipDate <= end) {
                slip.products.forEach(p => {
                    if (p.productId === productId) {
                        ledger.push({
                            date: slipDate,
                            type: "NHẬP",
                            quantity: p.quantity,
                            docId: slip.id
                        });
                    }
                });
            }
        });

        // Lọc "XUẤT" (OUT)
        allOrders.forEach(order => {
            const orderDate = new Date(order.date).getTime();
            const isSold = order.status === "Đang xử lý" || order.status === "Đã giao"; 
            
            if (isSold && orderDate >= start && orderDate <= end) {
                // Lặp qua các sản phẩm trong đơn hàng
                if (order.products) { // Kiểm tra nếu có mảng products
                    order.products.forEach(p => {
                        if (p.productId == productId) { 
                            ledger.push({
                                date: orderDate,
                                type: "XUẤT",
                                quantity: -p.quantity, // Số âm
                                docId: order.id
                            });
                        }
                    });
                }
            }
        });
        
        // Sắp xếp theo ngày
        ledger.sort((a, b) => a.date - b.date);
        
        // Render kết quả
        renderLedgerResults(product, ledger);
    };
    
    function renderLedgerResults(product, ledger) {
        if (ledger.length === 0) {
            ledgerResultsEl.innerHTML = `
                <h3 style="color: #333;">Sản phẩm: ${product.name}</h3>
                <p style="color: #888;">Không tìm thấy giao dịch nhập/xuất nào trong khoảng thời gian đã chọn.</p>
                <p style="font-size: 1.2em;"><strong>Tồn kho hiện tại: ${product.quantity}</strong></p>
            `;
            return;
        }

        let runningTotal = product.quantity; // Bắt đầu từ tồn kho hiện tại
        
        // Tính toán tồn kho cuối kỳ
        const totalIn = ledger.filter(l => l.type === "NHẬP").reduce((sum, l) => sum + l.quantity, 0);
        const totalOut = ledger.filter(l => l.type === "XUẤT").reduce((sum, l) => sum + l.quantity, 0);
        
        // Tồn đầu kỳ = Tồn hiện tại - Nhập + Xuất
        const startStock = product.quantity - totalIn - totalOut; 
        runningTotal = startStock; // Đặt lại biến đếm

        ledgerResultsEl.innerHTML = `
            <h3 style="color: #333;">Báo cáo XNT: ${product.name}</h3>
            <p style="font-size: 1.2em;"><strong>Tồn kho hiện tại: ${product.quantity}</strong></p>
            
            <table class="table_content" style="width:100%; color: #333; border: 1px solid #ddd;">
                <tr style="background: #f2f2f2;">
                    <th style="color: #333; text-shadow: none;">Ngày</th>
                    <th style="color: #333; text-shadow: none;">Loại</th>
                    <th style="color: #333; text-shadow: none;">Mã C.Từ</th>
                    <th style="color: #333; text-shadow: none;">Nhập</th>
                    <th style="color: #333; text-shadow: none;">Xuất</th>
                    <th style="color: #333; text-shadow: none;">Tồn cuối</th>
                </tr>
                <tr style="background: #fff; font-weight: bold;">
                    <td colspan="5">TỒN ĐẦU KỲ</td>
                    <td>${startStock}</td>
                </tr>
                ${ledger.map(item => {
                    runningTotal += item.quantity;
                    const isIn = item.type === "NHẬP";
                    return `
                    <tr style="background: #fff;">
                        <td>${formatDate(new Date(item.date))}</td>
                        <td style="color: ${isIn ? 'green' : 'red'};">${item.type}</td>
                        <td>#${item.docId}</td>
                        <td>${isIn ? item.quantity : 0}</td>
                        <td>${!isIn ? -item.quantity : 0}</td>
                        <td>${runningTotal}</td>
                    </tr>
                    `
                }).join('')}
                <tr style="background: #f2f2f2; font-weight: bold;">
                    <td colspan="3">TỔNG CỘNG</td>
                    <td>${totalIn}</td>
                    <td>${-totalOut}</td>
                    <td>${runningTotal}</td>
                </tr>
            </table>
        `;
    }

    // Chạy khi tải trang
    renderLowStockAlerts();
    loadProductSelect();
}
