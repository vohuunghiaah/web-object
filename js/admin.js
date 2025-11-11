import { inventoryHtml, initInventoryPage } from "./manager/inventory.js";
import { productHtml } from "./manager/product.js";
import { initProductPage } from "./manager/product_list.js";
import { orders as initialOrders } from "./data/orders.js";
import { importHtml, initImportPage } from "./manager/imports.js";
import { dashboardHtml, initDashboardPage } from "./manager/dashboard.js";
import "../database.js";
import { reportHtml, initReportPage } from "./manager/report.js";


async function navigateSPA(pageId, isInitialLoad = false) {

  const content = document.getElementById("content");
  const sidebar = document.getElementById("sidebar");

  if (!isInitialLoad && content && sidebar) {
    content.classList.add("fade");
    sidebar.classList.add("hide");
    await new Promise((res) => setTimeout(res, 400));
  }

  const pages = document.querySelectorAll("#content .page");
  pages.forEach((page) => {
    page.style.display = "none";
    page.classList.remove("active");
  });

  const targetPage = document.getElementById(pageId);
  if (targetPage) {
    targetPage.style.display = "block";
    targetPage.classList.add("active");
  } else {
    console.error("Lỗi: Không tìm thấy trang với ID: ", pageId);
  }

  const menuButtons = document.querySelectorAll("#sidebar button");
  menuButtons.forEach((button) => {
    button.classList.remove("active");
  });

  const activeButton = document.getElementById(`menu-${pageId}`);
  if (activeButton) {
    activeButton.classList.add("active");
  }

  if (!isInitialLoad && content && sidebar) {
    content.classList.remove("fade");
    sidebar.classList.remove("hide");
  }
}
window.navigateSPA = navigateSPA;

document.addEventListener("DOMContentLoaded", function () {
  const toggleBtn = document.getElementById("toggle-sidebar-btn");
  const closeBtn = document.getElementById("close-btn");
  const wrapper = document.getElementById("admin-wrapper");

  if (toggleBtn && closeBtn && wrapper) {
    toggleBtn.onclick = function () {
      wrapper.classList.toggle("sidebar-hidden");
    };
    closeBtn.onclick = function () {
      wrapper.classList.add("sidebar-hidden");
    };
  }
  const inventoryPageDiv = document.getElementById("inventory");
  if (inventoryPageDiv) {
    inventoryPageDiv.innerHTML = inventoryHtml;
    initInventoryPage();
  } else {
    console.error("Lỗi: Không thể khởi tạo <div id='inventory'>!");
  }

  const dashboardPageDiv = document.getElementById("dashboard");
  if (dashboardPageDiv) {
    dashboardPageDiv.innerHTML = dashboardHtml;
    initDashboardPage();
  } else {
    console.error("Lỗi: Không thể khởi tạo <div id='dashboard'>!");
  }

  const productsPageDiv = document.getElementById("products");
  if (productsPageDiv) {
    productsPageDiv.innerHTML = productHtml;
    initProductPage();
  } else {
    console.error("Lỗi: Không thể khởi tạo <div id='products'> để nạp trang!");
  }

  const importPageDiv = document.getElementById("imports");
  if (importPageDiv) {
    importPageDiv.innerHTML = importHtml;
    initImportPage();
  } else {
    console.error("Lỗi: Không thể khởi tạo <div id='imports'> để nạp trang!");
  }

  const reportPageDiv = document.getElementById("reports");
  if (reportPageDiv) {
    reportPageDiv.innerHTML = reportHtml;
    initReportPage();
  } else {
    console.error("Lỗi: Không thể khởi tạo <div id='reports'> để nạp trang!");
  }

  initOrdersPage();

  const defaultActiveButton = document.querySelector("#sidebar button.active");
  if (defaultActiveButton) {
    const defaultPageId = defaultActiveButton.id.replace("menu-", "");
    navigateSPA(defaultPageId, true);
  } else {
    navigateSPA("dashboard", true);
  }

  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.onclick = function () {
      if (confirm("Bạn có chắc muốn đăng xuất không?")) {
        localStorage.removeItem("currentAdmin");
        window.location.href = "login.html";
      }
    };
  }
});

function initOrdersPage() {
  function migrateOrderData() {
    const getData = (key) => JSON.parse(localStorage.getItem(key));
    const setData = (key, val) => localStorage.setItem(key, JSON.stringify(val));

    let orders = getData("orders");
    if (!orders || orders.length === 0) return;

    if (typeof orders[0].date === "undefined") {
      console.warn("Phát hiện dữ liệu đơn hàng cũ, đang nâng cấp...");
      orders.forEach((o) => {
        if (!o.date) o.date = new Date(o.id).toISOString();
      });
      setData("orders", orders);
      console.log("Nâng cấp dữ liệu đơn hàng thành công!");
    }
  }
  migrateOrderData();

  const sidebar1 = document.getElementById("sidebar1");
  const content1 = document.getElementById("content1");
  const menuButtons = document.querySelectorAll(".button_linear");
  const popup = document.getElementById("popup");
  const popupFields = document.getElementById("popupFields");
  const popupTitle = document.getElementById("popupTitle");
  const saveBtn = document.getElementById("saveBtn");
  const cancelBtn1 = document.getElementById("cancelBtn1");

  function showPopup(title, fieldsHTML, onSave) {
    popupTitle.textContent = title;
    // Hỗ trợ cả HTML string và Function trả về HTML string
    if (typeof fieldsHTML === "function") {
      popupFields.innerHTML = fieldsHTML();
    } else {
      popupFields.innerHTML = fieldsHTML;
    }
    popup.classList.add("active");
    saveBtn.onclick = () => {
      const inputs = popupFields.querySelectorAll("input, select");
      const values = {};
      inputs.forEach((i) => (values[i.name] = i.value));
      onSave(values);
    };
    cancelBtn1.onclick = () => popup.classList.remove("active");
  }

  const getData = (key) => JSON.parse(localStorage.getItem(key));
  const setData = (key, val) => localStorage.setItem(key, JSON.stringify(val));

  const currentOrders = getData("orders");
  if (!currentOrders || currentOrders.length === 0) {
    setData("orders", initialOrders);
  }

  async function animateSidebarChange(newHTML, newContentHTML) {
    sidebar1.classList.add("hide");
    content1.classList.add("fade");
    await new Promise((res) => setTimeout(res, 400));
    sidebar1.innerHTML = newHTML;
    content1.innerHTML = newContentHTML;
    sidebar1.classList.remove("hide");
    content1.classList.remove("fade");
  }

  menuButtons.forEach((btn) =>
    btn.addEventListener("click", () => {
      menuButtons.forEach((b) => b.classList.remove("active-mode"));
      btn.classList.add("active-mode");
      loadMode(btn.dataset.mode);
    })
  );

  function loadMode(mode) {
    if (mode === "users") {
      const users = JSON.parse(localStorage.getItem("users")) || [];
      
      function renderUserTable(userToRender) {
        const container = document.getElementById("user-table-container");
        if (!container) {
          console.error("Lỗi. Không tìm thấy #user-table-container");
          return;
        }
        container.innerHTML = `<table class="table_content">
              <tr>
                <th>ID</th>
                <th>Tên</th>
                <th>Email</th>
                <th>Mật khẩu</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th>Chỉnh sửa</th>
              </tr>
              ${
                userToRender.length === 0
                  ? `<tr><td colspan="7" style="text-align:center; padding: 20px; color: #999;">Không tìm thấy người dùng.</td></tr>`
                  : userToRender
                      .map(
                        (u) => `
                  <tr>
                    <td>${u.id}</td>
                    <td>${u.name}</td>
                    <td>${u.email}</td>
                    <td>${u.password}</td>
                    <td>${u.role}</td>
                    <td>${u.state} ${
                          u.state === "Off"
                            ? `<i class="fa-solid fa-lock" style="color:red"></i>`
                            : `<i class="fa-solid fa-unlock" style="color:green"></i>`
                        }</td>
                    <td>
                      <button class="edit-btn" id="${u.id}">Sửa</button>
                      <button class="delete-btn" id="${u.id}">Xóa</button>
                    </td> 
                  </tr>`
                      )
                      .join("")
              }
            </table>`;
            
        container.querySelectorAll(".edit-btn").forEach((btn) => {
          btn.addEventListener("click", () => {
            const id = btn.id;
            const u = users.find((u) => u.id == id);
            showPopup(
              "Sửa người dùng",
              `
              <label>Tên:</label>
              <input name="name" value="${u.name}">
              <label>Email:</label>
              <input name="email" value="${u.email}">
              <label>Mật khẩu:</label>
              <input name="password" type="password" value="${u.password}">
              <label>Vai trò:</label>
              <select name="role">
                <option ${u.role === "Khách hàng" ? "selected" : ""}>Khách hàng</option>
                <option ${u.role === "Nhân viên" ? "selected" : ""}>Nhân viên</option>
              </select>
              <label>Trạng thái:</label>
              <select name="state">
                <option ${u.state === "On" ? "selected" : ""}> On </option>
                <option ${u.state === "Off" ? "selected" : ""}> Off </option>
              </select>`,
              (val) => {
                Object.assign(u, val);
                setData("users", users);
                renderUserTable(users); 
                popup.classList.remove("active");
              }
            );
          });
        });

        container.querySelectorAll(".delete-btn").forEach((btn) => {
          btn.addEventListener("click", () => {
            const id = btn.id;
            const userIndex = users.findIndex((u) => u.id == id);
            if (userIndex === -1) return alert("Lỗi: Không tìm thấy người dùng!");
            showPopup(
              `Bạn có chắc chắn muốn xóa ${users[userIndex].name}?`,
              ``,
              (val) => {
                users.splice(userIndex, 1);
                setData("users", users);
                renderUserTable(users);
                popup.classList.remove("active");
              }
            );
          });
        });
      }

      animateSidebarChange(
        `
        <button class="list_scrollbar" data-act="add">➕ Thêm người dùng</button>
        <input id="user-search-input" class="list-list_scrollbar" placeholder="Tìm theo tên hoặc email..." 
          style="width: 90%; padding: 5px; margin-top: 10px; background: #3a3a3a; color: white; border: 1px solid #555; border-radius: 4px;">
        `,
        `
        <h2>Quản lý người dùng</h2>
        <div id="user-table-container"></div>
        `
      ).then(() => {
        renderUserTable(users);
        document.getElementById("user-search-input").addEventListener("input", (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            const filterUsers = users.filter(
              (u) =>
                u.name.toLowerCase().includes(searchTerm) ||
                u.email.toLowerCase().includes(searchTerm)
            );
            renderUserTable(filterUsers);
          });

        document.querySelectorAll(".list_scrollbar").forEach((btn) => {
          btn.addEventListener("click", (e) => {
            const act = e.target.dataset.act;
            if (act === "add") {
              showPopup(
                "Thêm người dùng",
                `
                <input name="name" placeholder="Tên người dùng">
                <input name="email" placeholder="Email">
                <input name="password" placeholder="Mật khẩu" type="password">
                <select name="role">
                  <option>Khách hàng</option>
                  <option>Nhân viên</option>
                </select>
                <select name="state">
                  <option> On </option>
                  <option> Off </option>
                </select>
              `,
                (vals) => {
                  users.push({ id: Date.now(), ...vals });
                  setData("users", users);
                  renderUserTable(users);
                  popup.classList.remove("active");
                }
              );
            }
          });
        });
      });
    } else if (mode === "products") {
        console.log("Điều hướng đến trang Products chính...");
        navigateSPA("products");
    } else if (mode === "orders") {
        let allOrders = getData("orders") || [];
        let allProducts = getData("products") || [];

        if (allOrders.length > 0 && typeof allOrders[0].productId === "undefined") {
          console.warn("Đang nâng cấp đơn hàng cũ...");
          allOrders.forEach((o) => {
            if (!o.productId) {
              const foundProduct = allProducts.find((p) => p.name === o.product);
              if (foundProduct) o.productId = foundProduct.id;
              else o.productId = null;
            }
          });
          setData("orders", allOrders);
      }

        const formatCurrency = (val) => (val || 0).toLocaleString("vi-VN", { style: "currency", currency: "VND" });
        const formatDate = (dateString) => new Date(dateString).toLocaleDateString("vi-VN");

        function renderOrderTable(ordersToRender) {
          const tableContainer = document.getElementById("order-table-container");
          if (!tableContainer) return;

          if (ordersToRender.length === 0) {
            tableContainer.innerHTML = `<p style="text-align: center; color: #999; padding-top: 20px;">Không tìm thấy đơn hàng nào.</p>`;
            return;
          }
          tableContainer.innerHTML = `
              <table class="table_content">
                <tr>
                  <th>ID Đơn hàng</th>
                  <th>Ngày đặt</th>
                  <th>Khách hàng</th>
                  <th>Tổng tiền</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
                ${ordersToRender.map((o) => `
                  <tr class="order-row" data-order-id="${o.id}" style="cursor: pointer;">
                    <td>#${o.id}</td>
                    <td>${formatDate(o.date)}</td>
                    <td>${o.address?.name || o.user || o.userEmail || 'Không rõ'}</td>
                    <td>${formatCurrency(o.total)}</td>
                    <td><strong style="color: ${getStatusColor(o.status)}">${o.status}</strong></td>
                    <td style="text-align: center;">
                      <button class="delete-order-btn" data-order-id="${o.id}" style="background-color: #e74c3c; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">🗑️ Xóa
                      </button>
                    </td>
                  </tr>`).join("")}
              </table>`;
        }

        function applyFiltersAndRender() {
          allOrders = getData("orders") || [];
          const dateFrom = document.getElementById("date-from").value;
          const dateTo = document.getElementById("date-to").value;
          const status = document.getElementById("status-filter").value;
          const searchInput = document.getElementById("order-search-input");
          const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : "";

          const start = dateFrom ? new Date(dateFrom).getTime() : 0;
          const end = dateTo ? new Date(dateTo).getTime() + 86400000 : Infinity;

          const filtered = allOrders.filter((o) => {
            const orderDate = new Date(o.date).getTime();
            const statusMatch = status === "all" || o.status === status;
            const dateMatch = orderDate >= start && orderDate <= end;
            
            //Tìm kiếm theo tên khách hàng
            const customerName = o.address?.name || o.user || o.userEmail || '';
            const searchMatch = !searchTerm || 
              customerName.toLowerCase().includes(searchTerm) || 
              String(o.id).includes(searchTerm);
            
            return statusMatch && dateMatch && searchMatch;
          });

          filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
          renderOrderTable(filtered);
        }

        function getStatusColor(status) {
          switch (status) {
            case "Chờ xử lý": return "#808080";
            case "Chờ xác nhận": return "#808080";
            case "Đang xử lý": return "#fd7e14";
            case "Đang vận chuyển": return "#0000FF";
            case "Giao hàng thành công": return "#008000";
            case "Đã hủy": return "#FF0000";
            default: return "#ccc";
          }
        }

      animateSidebarChange(
        `
        <button class="list_scrollbar" data-act="add">➕ Thêm đơn hàng</button>
        <button class="list_scrollbar" data-act="del">🗑️ Xóa đơn hàng</button>
        <input id="order-search-input" class="list-list_scrollbar" placeholder="Tìm theo Tên hoặc ID Đơn..." 
            style="width: 90%; padding: 5px; margin-top: 10px; background: #3a3a3a; color: white; border: 1px solid #555; border-radius: 4px;">
        <p style="padding: 10px; color: #777; font-size: 0.9em;">Click vào một đơn hàng trong bảng để xem chi tiết và cập nhật trạng thái.</p>
        `,
        `
        <h2>Quản lý đơn hàng</h2>
        <div class="order-filters" style="display: flex; gap: 15px; align-items: center; padding: 15px; background: #2a2a2a; border-radius: 8px; margin-bottom: 20px;">
            <div style="flex-grow: 1;">
              <label style="color: #ccc; font-size: 0.9em;">Từ ngày:</label>
              <input type="date" id="date-from" style="width: 100%; padding: 8px; border-radius: 4px; border: none; background: #3a3a3a; color: white;">
            </div>
            <div style="flex-grow: 1;">
              <label style="color: #ccc; font-size: 0.9em;">Đến ngày:</label>
              <input type="date" id="date-to" style="width: 100%; padding: 8px; border-radius: 4px; border: none; background: #3a3a3a; color: white;">
            </div>
            <div style="flex-grow: 1;">
              <label style="color: #ccc; font-size: 0.9em;">Trạng thái:</label>
              <select id="status-filter" style="width: 100%; padding: 8px; border-radius: 4px; border: none; background: #3a3a3a; color: white;">
                <option value="all">Tất cả</option>
                <option value="Chờ xác nhận">Chờ xác nhận</option>
                <option value="Đang xử lý">Đang xử lý</option>
                <option value="Đang vận chuyển">Đang vận chuyển</option>
                <option value="Giao hàng thành công">Giao hàng thành công</option>
                <option value="Đã hủy">Đã hủy</option>
              </select>
            </div>
            <button id="filter-btn" class="button_linear" style="align-self: flex-end; padding: 8px 15px;">Lọc</button>
          </div>
          <div id="order-table-container"></div>
        `
      ).then(() => {
        document.getElementById("filter-btn").onclick = applyFiltersAndRender;
        document.getElementById("status-filter").onchange = applyFiltersAndRender;
        document.getElementById("date-from").onchange = applyFiltersAndRender;
        document.getElementById("date-to").onchange = applyFiltersAndRender;
        document.getElementById("order-search-input").addEventListener("input", applyFiltersAndRender);

        document.getElementById("order-table-container").addEventListener("click", (e) => {
          const deleteBtn = e.target.closest(".delete-order-btn");
          if(deleteBtn){
            const orderId = deleteBtn.dataset.orderId;
            const idx = allOrders.findIndex((o) => o.id == orderId);
            if(idx >= 0){
              if(confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn đơn hàng không #${orderId}`)){
                allOrders.splice(idx, 1);
                setData("orders", allOrders);
                applyFiltersAndRender();//Vẽ lại bảng 
              }
            }
              return;
            }
          const row = e.target.closest(".order-row");
          if (!row)
            return;
          const orderId = row.dataset.orderId;
          allOrders = getData("orders") || [];
          const order = allOrders.find((o) => o.id == orderId);
          if (!order) return alert("Không tìm thấy đơn hàng!");

          const oldStatus = order.status;

          showPopup(`Chi tiết đơn hàng #${order.id}`, () => {
              const STATUS_RANKS = {
                "Chờ xác nhận": 1,
                "Đang xử lý": 2,
                "Đang vận chuyển": 3,
                "Giao hàng thành công": 4,
                "Đã hủy": 5,
              };
              const allStatuses = ["Chờ xác nhận", "Đang xử lý", "Đang vận chuyển", "Giao hàng thành công", "Đã hủy"];
              const oldRank = STATUS_RANKS[oldStatus] || 0;
              let statusDropdownHTML = "";

              if (oldStatus === "Giao hàng thành công" || oldStatus === "Đã hủy") {
                statusDropdownHTML = `
                  <strong style="color: ${getStatusColor(oldStatus)}; font-size: 1.1em;">${oldStatus}</strong>
                  <p style="color: #999; font-size: 0.9em; margin-top: 5px;">(Trạng thái cuối, không thể thay đổi)</p>
                  <select name="status" style="display: none;"><option value="${oldStatus}" selected></option></select>
                `;
              } else {
                const availableStatuses = allStatuses.filter((status) => {
                  if (status === "Đã hủy") return true; // Luôn cho phép hủy
                  return (STATUS_RANKS[status] || 0) >= oldRank; // Chỉ cho phép đi tới
                });
                statusDropdownHTML = `
                    <select name="status" style="width: 100%; padding: 8px; border-radius: 4px; border: none; background: #3a3a3a; color: white;">
                      ${availableStatuses.map((status) => `<option value="${status}" ${oldStatus === status ? "selected" : ""}>${status}</option>`).join("")}
                    </select>`;
              }

              return `
                <p style="color: #ccc;">Khách hàng: <strong>${order.address?.name || order.user || order.userEmail || 'Không rõ'}</strong></p>
                <div style="color: #ccc; border: 1px solid #555; padding: 5px; margin-top: 12px; border-radius: 4px; max-height: 150px; overflow-y: auto;">
                  <strong>Sản phẩm:</strong>
                  ${order.products.map((p) => `<p style="margin: 2px 0 2px 10px;">- ${p.name} (SL: ${p.quantity})</p>`).join("")}
                </div>
                <p style="color: #ccc; margin-top: 12px;">Tổng tiền: <strong>${formatCurrency(order.total)}</strong></p>
                <hr style="border-color: #444; margin: 15px 0;">
                <label style="color: #fff; display: block; margin-top: 15px; margin-bottom: 5px;">Cập nhật trạng thái:</label>
                ${statusDropdownHTML}
                `;
            },
            (vals) => {
              const newStatus = vals.status;
              // Nếu trạng thái không đổi thì không làm gì cả
              if (newStatus === order.status) {
                  popup.classList.remove("active");
                  return;
              }
              const SOLD_STATUSES = ["Đang vận chuyển", "Giao hàng thành công"];
              const oldIsSold = SOLD_STATUSES.includes(order.status);
              const newIsSold = SOLD_STATUSES.includes(newStatus);

              order.status = newStatus;
              allProducts = getData("products") || [];
              let canProcess = true;
              let stockUpdates = [];

              if (!oldIsSold && newIsSold) {
                //Chuyển từ "Chưa trừ" -> "Đã trừ"
                order.products.forEach((p) => {
                  const productInStock = allProducts.find((item) => item.id == p.productId);
                  if (!productInStock) {
                    alert(`Lỗi: Không tìm thấy sản phẩm "${p.name}" trong kho.`);
                    canProcess = false;
                  } else if (productInStock.quantity < p.quantity) {
                    alert(`Không đủ hàng: "${p.name}" (còn ${productInStock.quantity}).`);
                    canProcess = false;
                  } else {
                    stockUpdates.push({ product: productInStock, change: -p.quantity });
                  }
                });
                if (canProcess) {
                  stockUpdates.forEach((u) => (u.product.quantity += u.change));
                  setData("products", allProducts);
                  channel.postMessage({ type: "products_updated" });
                }
              } else if (oldIsSold && !newIsSold) {
                //Chuyển từ "Đã trừ" -> "Chưa trừ"
                 order.products.forEach((p) => {
                  const productInStock = allProducts.find((item) => item.id == p.productId);
                  if (productInStock) productInStock.quantity += p.quantity;
                });
                setData("products", allProducts);
                channel.postMessage({ type: "products_updated" });
              }

              if (canProcess) {
                setData("orders", allOrders);
                applyFiltersAndRender();
                popup.classList.remove("active");
              }
            }
          );
        });

        document.querySelectorAll(".list_scrollbar").forEach((btn) => {
          btn.addEventListener("click", (e) => {
            const act = e.target.dataset.act;
            if (act === "add") {
              allProducts = getData("products") || [];
              const productOptions = allProducts
                .filter((p) => p.quantity > 0)
                .map((p) => `<option value="${p.id}">${p.name} (Tồn: ${p.quantity})</option>`)
                .join("");

              showPopup(
                "Thêm đơn hàng",
                `
                  <input name="user" placeholder="Tên khách hàng">
                  <label style="color: #ccc; display:block; margin-top:10px;">Sản phẩm:</label>
                  <select name="productId" style="width: 100%; padding: 8px; border-radius: 4px; border: none; background: #3a3a3a; color: white;">${productOptions}</select>
                  <label style="color: #ccc; display:block; margin-top:10px;">Số lượng bán:</label>
                  <input name="quantity" placeholder="Số lượng" type="number" min="1">
                  <label style="color: #ccc; display:block; margin-top:10px;">Trạng thái:</label>
                  <select name="status">
                      <option value="Chờ xác nhận" selected>Chờ xác nhận</option>
                      <option value="Đang xử lý">Đang xử lý</option>
                      <option value="Đang vận chuyển">Đang vận chuyển</option>
                      <option value="Giao hàng thành công">Giao hàng thành công</option>
                  </select>
                `,
                (vals) => {
                  allProducts = getData("products") || [];
                  const product = allProducts.find((p) => p.id == vals.productId);
                  const quantity = parseInt(vals.quantity);

                  if (!product || !quantity || quantity <= 0) return alert("Dữ liệu không hợp lệ!");
                  if (product.quantity < quantity) return alert("Không đủ hàng trong kho!");

                  if (vals.status === "Giao hàng thành công") {
                    product.quantity -= quantity;
                    setData("products", allProducts);
                    channel.postMessage({ type: "products_updated" });
                  }

                  const newOrder = {
                    id: Date.now(),
                    date: new Date().toISOString(),
                    user: vals.user || "Khách lẻ",
                    status: vals.status,
                    payMethod: "Admin",
                    total: product.price * quantity,
                    address: { name: vals.user || "Khách lẻ" },
                    products: [{ productId: product.id, name: product.name, price: product.price, image: product.img, quantity: quantity }],
                  };

                  allOrders = getData("orders") || [];
                  allOrders.push(newOrder);
                  setData("orders", allOrders);
                  applyFiltersAndRender();
                  popup.classList.remove("active");
                }
              );
            }
            if (act === "del") {
                // ... (giữ nguyên logic xóa của bạn nếu cần)
                 const id = prompt("Nhập ID đơn hàng muốn xóa:");
                 if (!id) return;
                 allOrders = getData("orders") || [];
                 const idx = allOrders.findIndex(o => o.id == id);
                 if(idx !== -1 && confirm("Xóa vĩnh viễn đơn này?")) {
                     allOrders.splice(idx, 1);
                     setData("orders", allOrders);
                     applyFiltersAndRender();
                 } else if (idx === -1) {
                     alert("Không tìm thấy đơn hàng!");
                 }
            }
          });
        });
        applyFiltersAndRender();
      });
    }
  }

  const channel = new BroadcastChannel("data_update");
  channel.onmessage = (event) => {
    if (event.data.type !== "products_updated") return;
    console.log("Phát hiện cập nhật sản phẩm...");
    // Reload các trang nếu đang mở
    const activePage = document.querySelector(".page.active");
    if (activePage && activePage.id === "dashboard") {
        document.getElementById("dashboard").innerHTML = dashboardHtml;
        initDashboardPage();
    }
    if (activePage && activePage.id === "products") {
         document.getElementById("products").innerHTML = productHtml;
         initProductPage();
    }
    if (activePage && activePage.id === "imports") {
        document.getElementById("imports").innerHTML = importHtml;
        initImportPage();
    }
    // Nếu đang ở tab Orders, reload lại danh sách
    if (activePage && activePage.id === "orders") {
      const activeModeBtn = document.getElementById("orders").querySelector(".button_linear.active-mode");
      if (activeModeBtn && activeModeBtn.dataset.mode === "orders") {
        loadMode("orders");
      }
    }
  };
}