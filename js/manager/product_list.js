const getData = (key) => JSON.parse(localStorage.getItem(key));
const setData = (key, val) => localStorage.setItem(key, JSON.stringify(val));

export function initProductPage() {
  const overlay = document.getElementById("overlay");
  const addProductBtn = document.getElementById("add-product-btn");
  const cancelBtn = document.getElementById("cancelBtn");
  let deleteBtn = document.getElementById("deleteBtn");
  const productList = document.getElementById("productList");
  const form = document.getElementById("productForm");
  
  // Các phần tử cho tìm kiếm và áp dụng hàng loạt
  const searchIdInput = document.getElementById("search-id");
  const searchNameInput = document.getElementById("search-name");
  const bulkBrandSelect = document.getElementById("bulk-brand-select");
  const bulkProfitInput = document.getElementById("bulk-profit-margin");
  const applyBulkMarginBtn = document.getElementById("apply-bulk-margin-btn");
  const bulkPreviewCount = document.getElementById("bulk-preview-count");

  let editIndex = null;
  let currentProducts = getData("products") || [];

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
  };


  function renderProducts(list) {
    productList.innerHTML = "";
    if (list.length === 0) {
        productList.innerHTML = `<div style="text-align: center; padding: 20px; color: #999;">Không tìm thấy sản phẩm nào phù hợp.</div>`;
        return;
    }
    list.forEach((p) => {
      // Tìm index gốc để đảm bảo sửa đúng sản phẩm khi đang lọc
      const originalIndex = currentProducts.findIndex(prod => prod.id === p.id);
      
      const item = document.createElement("div");
      item.className = "product-item";
      item.style.gridTemplateColumns = "0.5fr 1fr 2fr 1fr 1fr 1fr 1fr 1fr 1fr";

      const lowStock = p.lowStockThreshold || 10;
      const quantity = p.quantity || 0;

      item.innerHTML = `
              <div>#${p.id}</div>
              <img src="${p.img || "https://via.placeholder.com/80"}" alt="${p.name}">
              <div title="${p.name}" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${p.name}</div>
              <div>${p.brand}</div>
              <div>${p.status}</div>
              <div style="font-weight: bold; color: ${quantity <= lowStock ? 'red' : 'inherit'};">${quantity}</div>
              <div>${formatCurrency(p.costPrice || 0)}</div>
              <div style="font-weight:bold; color:#2980b9;">${(p.profitMargin || 0) * 100}%</div>
              <div style="color: #2ecc71; font-weight: bold;">${formatCurrency(p.price || 0)}</div>
              `;
      item.style.cursor = "pointer";
      item.onclick = () => editProduct(originalIndex);
      productList.appendChild(item);
    });
  }

  // Hàm lọc thống nhất: Kết hợp cả ID, Tên và Thương hiệu đang chọn
  function filterProducts() {
      const idKeyword = searchIdInput ? searchIdInput.value.toLowerCase().trim() : "";
      const nameKeyword = searchNameInput ? searchNameInput.value.toLowerCase().trim() : "";
      const selectedBrand = bulkBrandSelect ? bulkBrandSelect.value : "";

      const filtered = currentProducts.filter(p => {
          const matchId = !idKeyword || String(p.id).toLowerCase().includes(idKeyword);
          const matchName = !nameKeyword || p.name.toLowerCase().includes(nameKeyword);
          // Nếu có chọn thương hiệu ở ô áp dụng nhanh, thì CHỈ hiện thương hiệu đó
          const matchBrand = !selectedBrand || p.brand === selectedBrand;
          return matchId && matchName && matchBrand;
      });

      renderProducts(filtered);

      // Cập nhật trạng thái khu vực áp dụng hàng loạt
      if (bulkBrandSelect && applyBulkMarginBtn && bulkPreviewCount) {
          if (selectedBrand) {
              const countByBrand = currentProducts.filter(p => p.brand === selectedBrand).length;
              bulkPreviewCount.textContent = `(Đang xem ${filtered.length}/${countByBrand} sản phẩm của ${selectedBrand})`;
              bulkPreviewCount.style.color = "#27ae60";
              applyBulkMarginBtn.disabled = false;
              applyBulkMarginBtn.style.opacity = "1";
              applyBulkMarginBtn.style.cursor = "pointer";
              applyBulkMarginBtn.textContent = `Áp dụng cho ${selectedBrand}`;
          } else {
              bulkPreviewCount.textContent = "(Vui lòng chọn thương hiệu)";
              bulkPreviewCount.style.color = "#7f8c8d";
              applyBulkMarginBtn.disabled = true;
              applyBulkMarginBtn.style.opacity = "0.5";
              applyBulkMarginBtn.style.cursor = "not-allowed";
              applyBulkMarginBtn.textContent = "Áp dụng";
          }
      }
  }

  // Gán sự kiện lọc cho tất cả các ô input/select
  if(searchIdInput) searchIdInput.addEventListener("input", filterProducts);
  if(searchNameInput) searchNameInput.addEventListener("input", filterProducts);
  if(bulkBrandSelect) bulkBrandSelect.addEventListener("change", filterProducts);

  function updateBrandSelectOptions() {
      const brands = [...new Set(currentProducts.map(p => p.brand).filter(b => b))];
      if (bulkBrandSelect) {
          // Giữ lại giá trị đang chọn nếu có
          const currentVal = bulkBrandSelect.value;
          bulkBrandSelect.innerHTML = '<option value="">-- Chọn thương hiệu để xem --</option>';
          brands.forEach(b => {
              bulkBrandSelect.innerHTML += `<option value="${b}" ${b === currentVal ? 'selected' : ''}>${b}</option>`;
          });
      }
      const datalist = document.getElementById("brandListSuggestions");
      if (datalist) {
          datalist.innerHTML = "";
          brands.forEach(b => datalist.innerHTML += `<option value="${b}">`);
      }
  }

  if (applyBulkMarginBtn) {
      applyBulkMarginBtn.onclick = () => {
          const selectedBrand = bulkBrandSelect.value;
          const marginPercent = parseFloat(bulkProfitInput.value);

          if (!selectedBrand) return;
          if (isNaN(marginPercent) || marginPercent < 0) {
              alert("Vui lòng nhập % lợi nhuận hợp lệ!"); return;
          }

          // Đếm số sản phẩm sẽ bị ảnh hưởng
          const targetProducts = currentProducts.filter(p => p.brand === selectedBrand);
          if (confirm(`Bạn chắc chắn muốn cập nhật lãi ${marginPercent}% cho ${targetProducts.length} sản phẩm thương hiệu "${selectedBrand}"?`)) {
              targetProducts.forEach(p => {
                  p.profitMargin = marginPercent / 100;
                  p.price = (p.costPrice || 0) * (1 + p.profitMargin);
              });
              setData("products", currentProducts);
              renderProducts(targetProducts); // Render lại đúng danh sách đang xem để thấy thay đổi
              alert("Cập nhật thành công!");
              bulkProfitInput.value = ""; // Reset ô nhập %
          }
      };
  }


  function openForm(isEdit = false) {
    overlay.style.display = "flex";
    document.getElementById("formTitle").textContent = isEdit ? "Sửa sản phẩm" : "Thêm sản phẩm";
    updateBrandSelectOptions();
  }

  function closeForm() {
    overlay.style.display = "none";
    form.reset();
    editIndex = null;
    if (deleteBtn) deleteBtn.style.display = "none";
  }

  if (!deleteBtn && form) {
      deleteBtn = document.createElement("button");
      deleteBtn.type = "button"; deleteBtn.id = "deleteBtn";
      deleteBtn.textContent = "Xóa Sản Phẩm";
      deleteBtn.className = "button cancel-btn";
      deleteBtn.style.background = "#e74c3c"; deleteBtn.style.display = "none";
      form.querySelector(".form-buttons").appendChild(deleteBtn);
  }
  if (deleteBtn) {
      deleteBtn.onclick = () => {
        if (editIndex === null) return;
        if (confirm(`Xóa sản phẩm "${currentProducts[editIndex].name}"?`)) {
          currentProducts.splice(editIndex, 1);
          setData("products", currentProducts);
          filterProducts(); 
          closeForm();
          updateBrandSelectOptions();
        }
      };
  }

  window.editProduct = function (index) {
    const p = currentProducts[index];
    editIndex = index;
    openForm(true);
    document.getElementById("productId").value = p.id; document.getElementById("productId").disabled = true;
    document.getElementById("productName").value = p.name;
    document.getElementById("productBrand").value = p.brand;
    document.getElementById("productStatus").value = p.status;
    document.getElementById("productProfitMargin").value = (p.profitMargin || 0) * 100;
    document.getElementById("productLowStock").value = p.lowStockThreshold || 10;
    if (deleteBtn) deleteBtn.style.display = "inline-block";
  };

  form.onsubmit = (e) => {
    e.preventDefault();
    const profitMargin = (parseFloat(document.getElementById("productProfitMargin").value) || 0) / 100;
    const pData = {
        id: document.getElementById("productId").value,
        name: document.getElementById("productName").value,
        brand: document.getElementById("productBrand").value,
        status: document.getElementById("productStatus").value,
        profitMargin: profitMargin,
        lowStockThreshold: parseInt(document.getElementById("productLowStock").value) || 10,
    };
    const imgFile = document.getElementById("productImage").files[0];

    if (editIndex !== null) {
      const p = currentProducts[editIndex];
      Object.assign(p, pData);
      p.price = (p.costPrice || 0) * (1 + profitMargin);
      if (imgFile) p.img = URL.createObjectURL(imgFile);
    } else {
      if (currentProducts.some(p => p.id === pData.id)) { alert("ID đã tồn tại!"); return; }
      pData.img = imgFile ? URL.createObjectURL(imgFile) : "https://via.placeholder.com/80";
      pData.costPrice = 0; pData.price = 0; pData.quantity = 0;
      currentProducts.push(pData);
    }
    setData("products", currentProducts);
    closeForm();
    filterProducts(); // Render lại theo bộ lọc hiện tại
    document.getElementById("productId").disabled = false;
    updateBrandSelectOptions();
  };

  if (addProductBtn) addProductBtn.onclick = () => { editIndex = null; document.getElementById("productId").disabled = false; openForm(); };
  if (cancelBtn) cancelBtn.onclick = () => { document.getElementById("productId").disabled = false; closeForm(); };

  // Khởi chạy
  updateBrandSelectOptions();
  renderProducts(currentProducts);
}