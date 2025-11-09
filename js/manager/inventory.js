const getData = key => JSON.parse(localStorage.getItem(key));
const formatDate = (dateString) => new Date(dateString).toLocaleDateString('vi-VN');

export const inventoryHtml = `
<div class="container" style="padding-top: 20px;">
    <h2><i class="fas fa-exclamation-triangle" style="color: orange;"></i> Cảnh Báo Tồn Kho</h2>
    <div id="low-stock-alerts" style="margin-bottom: 30px; background: #fff3cd; padding: 15px; border-radius: 8px; color: #856404; border: 1px solid #ffeeba;">
        Đang tải dữ liệu...
    </div>
    
    <hr style="border-color: #444; opacity: 0.2; margin: 30px 0;">
    
    <h2><i class="fas fa-book"></i> Sổ Chi Tiết Vật Tư (Thẻ Kho)</h2>
    <div class="inventory-filters" style="display: flex; gap: 15px; align-items: flex-end; padding: 20px; background: #2a2a2a; border-radius: 8px; margin-bottom: 20px; color: white;">
        <div style="flex-grow: 1;">
            <label style="color: #ccc;">Chọn Sản Phẩm:</label>
            <select id="ledger-product" class="product-select" style="width:100%; padding: 10px; border: 1px solid #555; border-radius: 4px; background: #333; color: white;"></select>
        </div>
        <div style="flex-grow: 1;">
            <label style="color: #ccc;">Từ ngày:</label>
            <input type="date" id="ledger-date-from" style="width: 100%; padding: 10px; border-radius: 4px; border: 1px solid #555; background: #333; color: white;">
        </div>
        <div style="flex-grow: 1;">
            <label style="color: #ccc;">Đến ngày:</label>
            <input type="date" id="ledger-date-to" style="width: 100%; padding: 10px; border-radius: 4px; border: 1px solid #555; background: #333; color: white;">
        </div>
        <button id="ledger-btn" class="button" style="padding: 10px 25px; height: 42px; background: #007bff; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">
            <i class="fas fa-search"></i> Tra cứu
        </button>
    </div>
    
    <div id="ledger-results" style="background: #2a2a2a; padding: 20px; border-radius: 8px; min-height: 200px;">
        <p style="color: #999; text-align: center;">Vui lòng chọn sản phẩm và bấm "Tra cứu" để xem lịch sử xuất nhập tồn.</p>
    </div>
</div>
`;

export function initInventoryPage() {
    const lowStockEl = document.getElementById('low-stock-alerts');
    const ledgerProductSelect = document.getElementById('ledger-product');
    const ledgerBtn = document.getElementById('ledger-btn');
    const ledgerResultsEl = document.getElementById('ledger-results');

    // Lấy dữ liệu mới nhất mỗi khi vào trang
    const allProducts = getData("products") || [];
    const allImports = getData("importSlips") || [];
    const allOrders = getData("orders") || [];

    //Cảnh Báo Tồn Kho Thấp
    function renderLowStockAlerts() {
        const lowStockProducts = allProducts.filter(p => (p.quantity || 0) <= (p.lowStockThreshold || 10));
        
        if (lowStockProducts.length === 0) {
            lowStockEl.innerHTML = "<p style='color: green; margin: 0;'><i class='fas fa-check-circle'></i> Tuyệt vời! Tất cả sản phẩm đều trên mức cảnh báo.</p>";
            lowStockEl.style.background = "#d4edda";
            lowStockEl.style.color = "#155724";
            lowStockEl.style.borderColor = "#c3e6cb";
            return;
        }
        
        let html = `<table class="table_content" style="width:100%; color: #333;">
                        <thead>
                            <tr style="background: rgba(0,0,0,0.05);">
                                <th style="text-align: left; padding: 8px;">Sản phẩm</th>
                                <th style="text-align: center; padding: 8px;">Tồn hiện tại</th>
                                <th style="text-align: center; padding: 8px;">Mức cảnh báo</th>
                                <th style="text-align: right; padding: 8px;">Cần nhập thêm</th>
                            </tr>
                        </thead>
                        <tbody>`;
        
        lowStockProducts.forEach(p => {
            html += `
                <tr>
                    <td style="padding: 8px;"><strong>${p.name}</strong> <span style="color: #666; font-size: 0.9em;">(#${p.id})</span></td>
                    <td style="color: #dc3545; font-weight: bold; text-align: center; padding: 8px; font-size: 1.2em;">${p.quantity}</td>
                    <td style="text-align: center; padding: 8px;">${p.lowStockThreshold}</td>
                     <td style="text-align: right; padding: 8px; color: #007bff;">+${p.lowStockThreshold - p.quantity + 1}</td>
                </tr>
            `;
        });
        
        html += `</tbody></table>`;
        lowStockEl.innerHTML = html;
         //Reset lại style cảnh báo nếu có lỗi
        lowStockEl.style.background = "#fff3cd";
        lowStockEl.style.color = "#856404";
        lowStockEl.style.borderColor = "#ffeeba";
    }

    //Nạp sản phẩm vào dropdown
    function loadProductSelect() {
        ledgerProductSelect.innerHTML = allProducts
            .map(p => `<option value="${p.id}">${p.name} (Hiện tồn: ${p.quantity})</option>`)
            .join('');
    }
    
    //Xử lý nút Tra cứu (Giữ nguyên logic cốt lõi của bạn)
    ledgerBtn.onclick = () => {
        const productId = parseInt(ledgerProductSelect.value);
        const product = allProducts.find(p => p.id === productId);
        if (!product) return;

        const dateFrom = document.getElementById('ledger-date-from').value;
        const dateTo = document.getElementById('ledger-date-to').value;
        
        const start = dateFrom ? new Date(dateFrom).setHours(0,0,0,0) : 0;
        const end = dateTo ? new Date(dateTo).setHours(23,59,59,999) : Infinity;
        
        let ledger = [];

        // Lọc NHẬP
        allImports.forEach(slip => {
             if (slip.status === "Hoàn thành") {
                const slipDate = new Date(slip.date).getTime();
                if (slipDate >= start && slipDate <= end) {
                    slip.products.forEach(p => {
                        if (p.productId === productId) {
                            ledger.push({
                                date: slipDate,
                                type: "NHẬP",
                                quantity: p.quantity, // Số dương
                                docId: "#NK" + slip.id,
                                note: "Nhập hàng"
                            });
                        }
                    });
                }
             }
        });

        // Lọc XUẤT (từ đơn hàng)
        allOrders.forEach(order => {

            const soldStatuses = ["Đang vận chuyển", "Giao hàng thành công"];
            const isSold = soldStatuses.includes(order.status);

            if (isSold) {
                const orderDate = new Date(order.date).getTime();
                if (orderDate >= start && orderDate <= end) {
                    if (order.products) {
                        order.products.forEach(p => {
                            if (parseInt(p.productId) === productId) {
                                ledger.push({
                                    date: orderDate,
                                    type: "XUẤT",
                                    quantity: -p.quantity, // Số âm để biểu thị xuất
                                    docId: "#XB" + order.id,
                                    note: `Bán hàng (${order.status})`
                                });
                            }
                        });
                     }
                 }
             }
        });

        // Sắp xếp theo thời gian tăng dần
        ledger.sort((a, b) => a.date - b.date);

        renderLedgerResults(product, ledger, start, end);
    };

    function renderLedgerResults(product, ledger, start, end) {
         //Tồn Đầu = Tồn Hiện Tại - (Tổng các giao dịch trong kỳ)
         
         const totalChangeInPeriod = ledger.reduce((sum, item) => sum + item.quantity, 0);
         const startStock = product.quantity - totalChangeInPeriod;
         
         let runningStock = startStock;
         let totalImport = 0;
         let totalExport = 0;

         let html = `
            <h3 style="color: #00bfff; margin-top: 0;">Thẻ kho: ${product.name}</h3>
            <p style="color: #ccc;">
                Giai đoạn: ${start === 0 ? 'Ban đầu' : formatDate(start)} 
                - ${end === Infinity ? 'Nay' : formatDate(end)}
            </p>
            
            <table class="report-table" style="width:100%; margin-top: 15px; color: #e0e0e0;">
                <thead>
                    <tr style="background: #333; color: #00bfff;">
                        <th>Ngày tháng</th>
                        <th>Chứng từ</th>
                        <th>Diễn giải</th>
                        <th style="text-align: right;">Nhập</th>
                        <th style="text-align: right;">Xuất</th>
                        <th style="text-align: right;">Tồn kho</th>
                    </tr>
                </thead>
                <tbody>
                    <tr style="background: #2f3640; font-weight: bold;">
                        <td colspan="5">SỐ DƯ ĐẦU KỲ</td>
                        <td style="text-align: right; color: #ffd700;">${startStock}</td>
                    </tr>
         `;

         if (ledger.length === 0) {
             html += `<tr><td colspan="6" style="text-align:center; padding: 15px; color: #999;">Không phát sinh giao dịch trong kỳ này.</td></tr>`;
         } else {
             ledger.forEach(item => {
                 runningStock += item.quantity;
                 if (item.quantity > 0) totalImport += item.quantity;
                 else totalExport += Math.abs(item.quantity);

                 const isImport = item.quantity > 0;

                 html += `
                    <tr style="border-bottom: 1px solid #444;">
                        <td>${formatDate(item.date)}</td>
                        <td style="color: ${isImport ? '#2ecc71' : '#e74c3c'}">${item.docId}</td>
                        <td>${item.note}</td>
                        <td style="text-align: right; color: #2ecc71;">${isImport ? item.quantity : '-'}</td>
                        <td style="text-align: right; color: #e74c3c;">${!isImport ? Math.abs(item.quantity) : '-'}</td>
                         <td style="text-align: right; font-weight: bold;">${runningStock}</td>
                    </tr>
                 `;
             });
         }

         html += `
                    <tr style="background: #2f3640; font-weight: bold;">
                        <td colspan="3">TỔNG CỘNG PHÁT SINH</td>
                        <td style="text-align: right; color: #2ecc71;">${totalImport}</td>
                         <td style="text-align: right; color: #e74c3c;">${totalExport}</td>
                        <td style="text-align: right; color: #ffd700;">${runningStock}</td>
                    </tr>
                </tbody>
            </table>
            <p style="text-align: right; margin-top: 10px; font-size: 1.1em;">
                Tồn kho hiện tại thực tế: <strong style="color: #00bfff; font-size: 1.3em;">${product.quantity}</strong>
            </p>
         `;
         
         ledgerResultsEl.innerHTML = html;
    }

    renderLowStockAlerts();
    loadProductSelect();
}