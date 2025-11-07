export const productHtml = `
  <div class="container"></div>
  <div class="product-actions" style="display: flex; flex-direction: column; gap: 10px; align-items: stretch;">
    <div style="display: flex; gap: 10px; justify-content: space-between;">
        <div style="display: flex; gap: 10px;">
            <input type="text" id="search-id" placeholder="🔍 Tìm theo ID..." style="padding:10px; width:150px; border-radius:6px; border:1px solid #ccc;"/>
            <input type="text" id="search-name" placeholder="🔍 Tìm theo Tên SP..." style="padding:10px; width:250px; border-radius:6px; border:1px solid #ccc;"/>
        </div>
        <button class="add-product-btn" id="add-product-btn">➕ Thêm sản phẩm</button>
    </div>

    <div style="background: #eef6fc; padding: 12px; border-radius: 6px; border: 1px solid #d6e9f8; display: flex; align-items: center; gap: 10px;">
        <strong style="white-space: nowrap; color: #2c3e50;">⚡ Cập nhật Lợi nhuận theo Thương hiệu:</strong>
        
        <select id="bulk-brand-select" style="padding: 8px; border-radius: 4px; border: 1px solid #ccc; min-width: 180px; font-weight: bold;">
            <option value="">-- Chọn thương hiệu để xem --</option>
        </select>

        <input type="number" id="bulk-profit-margin" placeholder="% Lãi mới" style="padding: 8px; width: 100px; border-radius: 4px; border: 1px solid #ccc;" step="0.1" min="0">
        
        <button id="apply-bulk-margin-btn" class="button" disabled style="padding: 8px 15px; font-size: 0.9em; opacity: 0.5; cursor: not-allowed;">Áp dụng</button>
        
        <span id="bulk-preview-count" style="color: #7f8c8d; font-size: 0.9em; margin-left: auto;">(Vui lòng chọn thương hiệu)</span>
    </div>
  </div>

  <div class="product-management" style="margin-top: 15px;">
    <div class="product-header" style="grid-template-columns: 0.5fr 1fr 2fr 1fr 1fr 1fr 1fr 1fr 1fr;">
      <div>#ID</div>
      <div>Ảnh</div>
      <div>Tên sản phẩm</div>
      <div>Thương hiệu</div>
      <div>Status</div>
      <div>Tồn kho</div>
      <div>Giá Vốn</div>
      <div>% Lãi</div>
      <div>Giá Bán</div>
    </div>
  </div>
  <div class="product-list" id="productList"></div>

  <div class="overlay" id="overlay">
    <form class="form-box" id="productForm">
        <h3 id="formTitle">Thêm sản phẩm</h3>
        <input type="text" id="productId" placeholder="Mã sản phẩm" required>
        <input type="text" id="productName" placeholder="Tên sản phẩm" required>
        <input type="text" id="productBrand" placeholder="Thương hiệu" required list="brandListSuggestions">
        <datalist id="brandListSuggestions"></datalist>
        <input type="number" id="productProfitMargin" placeholder="% Lợi nhuận (ví dụ: 20)" required step="0.1">
        <input type="number" id="productLowStock" placeholder="Mức cảnh báo tồn kho (ví dụ: 10)" required>
        <select id="productStatus" required style="width: 100%; padding: 10px; margin: 8px 0; border-radius: 6px; border: 1px solid #ccc;">
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
        </select>
        <input type="file" id="productImage" accept="image/*">
        <div class="form-buttons">
            <button type="submit" class="button">Lưu</button>
            <button type="button" class="button cancel-btn" id="cancelBtn">Hủy</button>
        </div>
    </form>
  </div>
`;