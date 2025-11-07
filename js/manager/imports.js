
// Lấy các hàm helper từ file product_list.js (vì chúng dùng chung)
const getData = key => JSON.parse(localStorage.getItem(key));
const setData = (key, val) => localStorage.setItem(key, JSON.stringify(val));
const channel = new BroadcastChannel('data_update');

// HTML cho trang Quản lý Nhập hàng
export const importHtml = `
  <div class="container">
    <div class="product-actions">
      <input type="text" id="search-import" placeholder="🔍 Tìm phiếu nhập..." style="padding:10px;width:300px;border-radius:6px;border:1px solid #ccc;"/>
      <button class="add-product-btn" id="add-import-btn">➕ Tạo phiếu nhập</button>
    </div>

    <div class="product-management">
      <div class="product-header" style="grid-template-columns: 1fr 1fr 1fr 1fr;">
        <div>Mã Phiếu</div>
        <div>Ngày nhập</div>
        <div>Trạng thái</div>
        <div>Hành động</div>
      </div>
    </div>
    <div class="product-list" id="importList"></div>
  </div>

  <div class="overlay" id="importOverlay">
    <form class="form-box" id="importForm" style="width: 600px;">
        <h3 id="importFormTitle">Tạo phiếu nhập</h3>
        
        <div style="display: flex; gap: 10px; align-items: flex-end; margin-bottom: 15px;">
          <div style="flex-grow: 1;">
            <label>Chọn sản phẩm:</label>
            <select id="import-product-select" class="product-select" style="width:100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;"></select>
          </div>
          <div>
            <label>Số lượng:</label>
            <input type="number" id="import-quantity" min="1" style="width: 80px; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
          </div>
          <div>
            <label>Giá nhập (VNĐ):</label>
            <input type="text" id="import-price" style="width: 100px; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
          </div>
        </div>
        <button type="button" class="button" id="add-to-slip-btn" style="padding: 8px 12px;">Thêm</button>

        <h4>Sản phẩm trong phiếu:</h4>
        <div id="temp-product-list" style="max-height: 200px; overflow-y: auto; border: 1px solid #eee; padding: 10px; margin-bottom: 15px; border-radius: 4px;">
          </div>

        <div class="form-buttons">
            <button type="submit" class="button">Lưu Phiếu</button>
            <button type="button" class="button cancel-btn" id="cancelImportBtn">Hủy</button>
        </div>
    </form>
  </div>
`;


// Logic cho trang
export function initImportPage() {
  // Lấy các DOM element
  const importListEl = document.getElementById('importList');
  const addImportBtn = document.getElementById('add-import-btn');
  const overlay = document.getElementById('importOverlay');
  const form = document.getElementById('importForm');
  const cancelBtn = document.getElementById('cancelImportBtn');
  const productSelect = document.getElementById('import-product-select');
  const addToSlipBtn = document.getElementById('add-to-slip-btn');
  const tempProductListEl = document.getElementById('temp-product-list');
  const searchInput = document.getElementById('search-import');

  // Lấy dữ liệu
  if (!getData("importSlips")) {
    setData("importSlips", []);
  }
  let currentSlips = getData("importSlips");
  let allProducts = getData("products") || []; // Lấy danh sách sản phẩm để chọn

  let tempProducts = []; // Mảng chứa các SP trong phiếu đang tạo
  let editIndex = null;

  // --- CÁC HÀM XỬ LÝ CHÍNH ---

  // 1. Render danh sách phiếu nhập
  function renderSlips(list) {
    importListEl.innerHTML = "";
    list.forEach((slip, index) => {
      const item = document.createElement("div");
      item.className = "product-item"; // Tái sử dụng CSS từ trang product
      item.style.gridTemplateColumns = "1fr 1fr 1fr 1fr";
      
      const isCompleted = slip.status === "Hoàn thành";
      
      item.innerHTML = `
        <div>#${slip.id}</div>
        <div>${new Date(slip.date).toLocaleDateString('vi-VN')}</div>
        <div style="color: ${isCompleted ? 'green' : 'orange'}; font-weight: bold;">
          ${slip.status}
        </div>
        <div class="actions">
          ${!isCompleted ? `
            <button class="edit" onclick="editSlip(${index})">Sửa</button>
            <button class="delete" onclick="deleteSlip(${index})">Xóa</button>
            <button class="complete-btn" onclick="completeSlip(${index})" style="background: green;">Hoàn thành</button>
          ` : `
            <button class="view" onclick="viewSlip(${index})" style="background: #3498db;">Xem</button>
          `}
        </div>
      `;
      importListEl.appendChild(item);
    });
  }

  // 2. Render danh sách sản phẩm TẠM THỜI (trong popup)
  function renderTempProducts() {
    tempProductListEl.innerHTML = "";
    if (tempProducts.length === 0) {
      tempProductListEl.innerHTML = "<p style='color: #888; text-align: center;'>Chưa có sản phẩm nào.</p>";
      return;
    }
    tempProducts.forEach((p, index) => {
      tempProductListEl.innerHTML += `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 5px; border-bottom: 1px dashed #ccc;">
          <span>${p.name} (SL: ${p.quantity}, Giá: ${p.importPrice} VNĐ)</span>
          <button type="button" onclick="removeTempProduct(${index})" style="background: #e74c3c; color: white; border: none; padding: 2px 5px; cursor: pointer; border-radius: 3px;">Xóa</button>
        </div>
      `;
    });
  }

  // 3. Mở Form
  function openForm(isView = false) {
    // Nạp danh sách sản phẩm vào <select>
    productSelect.innerHTML = allProducts.map(p => 
      `<option value="${p.id}">${p.name} (Tồn kho: ${p.quantity})</option>`).join('');
    
    // Nếu là chế độ xem, vô hiệu hóa các nút
    document.getElementById('add-to-slip-btn').style.display = isView ? 'none' : 'block';
    form.querySelector('button[type="submit"]').style.display = isView ? 'none' : 'block';
    
    overlay.style.display = "flex";
  }

  // 4. Đóng Form
  function closeForm() {
    overlay.style.display = "none";
    form.reset();
    tempProducts = [];
    editIndex = null;
    renderTempProducts();
  }

  // 5. Thêm sản phẩm vào phiếu tạm
  addToSlipBtn.onclick = () => {
    const productId = parseInt(document.getElementById('import-product-select').value);
    const product = allProducts.find(p => p.id === productId);
    const quantity = parseInt(document.getElementById('import-quantity').value);
    const importPrice = document.getElementById('import-price').value;

    if (!quantity || quantity <= 0 || !importPrice) {
      alert("Vui lòng nhập đủ Số lượng và Giá nhập!");
      return;
    }

    // Thêm vào mảng tạm
    tempProducts.push({
      productId: product.id,
      name: product.name,
      quantity: quantity,
      importPrice: importPrice
    });

    renderTempProducts();
    // Reset ô nhập
    document.getElementById('import-quantity').value = '';
    document.getElementById('import-price').value = '';
  };
  
  // 5.1 Xóa SP khỏi phiếu tạm
  window.removeTempProduct = (index) => {
    tempProducts.splice(index, 1);
    renderTempProducts();
  }

  // 6. Sự kiện Submit Form (Lưu phiếu mới hoặc cập nhật phiếu)
  form.onsubmit = (e) => {
    e.preventDefault();
    if (tempProducts.length === 0) {
      alert("Phiếu nhập phải có ít nhất 1 sản phẩm!");
      return;
    }

    const slipData = {
      id: editIndex !== null ? currentSlips[editIndex].id : Date.now(),
      date: new Date().toISOString(),
      status: "Đang xử lý",
      products: tempProducts // Lưu mảng sản phẩm tạm
    };

    if (editIndex !== null) {
      // Sửa
      currentSlips[editIndex] = slipData;
    } else {
      // Thêm mới
      currentSlips.push(slipData);
    }

    setData("importSlips", currentSlips);
    renderSlips(currentSlips);
    closeForm();
  };

  // 7. Gán sự kiện cho các nút Sửa / Xóa / Hoàn thành
  
  // Sửa phiếu
  window.editSlip = (index) => {
    const slip = currentSlips[index];
    if (slip.status === "Hoàn thành") {
      alert("Phiếu đã hoàn thành, không thể sửa!");
      return;
    }
    editIndex = index;
    tempProducts = [...slip.products]; // Copy sản phẩm từ phiếu vào mảng tạm
    document.getElementById("importFormTitle").textContent = "Sửa phiếu nhập #" + slip.id;
    openForm();
    renderTempProducts();
  };
  
  // Xem phiếu (khi đã hoàn thành)
  window.viewSlip = (index) => {
    const slip = currentSlips[index];
    editIndex = index; // Chỉ để nhận dạng
    tempProducts = [...slip.products];
    document.getElementById("importFormTitle").textContent = "Xem phiếu nhập #" + slip.id;
    openForm(true); // Mở ở chế độ "view only"
    renderTempProducts();
  }

  // Xóa phiếu
  window.deleteSlip = (index) => {
    const slip = currentSlips[index];
    if (slip.status === "Đang xử lý" && !confirm(`Bạn có chắc muốn xóa phiếu #${slip.id} (Đang xử lý)?`)) {
      return;
    }
    if (slip.status === "Hoàn thành" && !confirm(`Bạn có chắc muốn xóa phiếu #${slip.id} (ĐÃ HOÀN THÀNH)?\n(Hành động này KHÔNG khôi phục lại tồn kho)`)) {
      return;
    }
    
    currentSlips.splice(index, 1);
    setData("importSlips", currentSlips);
    renderSlips(currentSlips);
  };

  //Hoàn thành phiếu (Cập nhật tồn kho) !!
  window.completeSlip = (index) => {
    const slip = currentSlips[index];
    if (!confirm(`Bạn có chắc muốn HOÀN THÀNH phiếu #${slip.id}?\nSố lượng tồn kho và Giá Vốn sẽ được cập nhật. Không thể hoàn tác.`)) {
      return;
    }

    // Lấy DS sản phẩm MỚI NHẤT từ kho
    let currentProductStorage = getData("products");

    // Cập nhật số lượng cho từng sản phẩm trong phiếu
    slip.products.forEach(slipProduct => {
      const productInStorage = currentProductStorage.find(p => p.id === slipProduct.productId);
      if (productInStorage) {
        
        // 1. Cập nhật Giá Vốn MỚI NHẤT
        const newCostPrice = parseFloat(slipProduct.importPrice);
        productInStorage.costPrice = newCostPrice;
        
        // 2. Cộng dồn số lượng
        productInStorage.quantity += slipProduct.quantity;
        
        // 3. TỰ ĐỘNG TÍNH LẠI GIÁ BÁN
        // Lấy % lợi nhuận đang có của sản phẩm (ví dụ: 0.2)
        const margin = productInStorage.profitMargin || 0; 
        // Tính giá bán mới
        productInStorage.price = newCostPrice * (1 + margin);

      }
    });

    // Đổi trạng thái phiếu
    slip.status = "Hoàn thành";

    // Lưu lại cả 2
    setData("products", currentProductStorage);
    setData("importSlips", currentSlips);
    
    // Tải lại giao diện
    renderSlips(currentSlips);
    
    // Gửi tín hiệu cho các tab khác (ví dụ: trang Products) cập nhật
    channel.postMessage({ type: 'products_updated' });
  };
  
  // 8. Tìm kiếm
  searchInput.addEventListener("input", () => {
    const keyword = searchInput.value.toLowerCase().trim();
    const filtered = currentSlips.filter(s => 
        String(s.id).includes(keyword) ||
        s.date.includes(keyword) ||
        s.status.toLowerCase().includes(keyword)
    );
    renderSlips(filtered);
  });

  // 9. Gán sự kiện cho các nút chính
  addImportBtn.onclick = () => {
    document.getElementById("importFormTitle").textContent = "Tạo phiếu nhập";
    openForm();
  };
  cancelBtn.onclick = closeForm;

  // Chạy lần đầu
  renderSlips(currentSlips);
}
