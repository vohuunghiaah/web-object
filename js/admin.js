// ============================================================================
// ADMIN PAGE - Quản lý users, products, orders
// ============================================================================

import { inventoryHtml, initInventoryPage } from "./manager/inventory.js";
import { productHtml } from "./manager/product.js";
import { initProductPage } from "./manager/product_list.js";
import { orders as initialOrders } from "./data/orders.js";
import { importHtml, initImportPage } from "./manager/imports.js";
import { dashboardHtml, initDashboardPage } from "./manager/dashboard.js";
import { reportHtml, initReportPage } from "./manager/report.js";
import {
  normalizeOrderStructure,
  getSafeOrderTotal,
} from "./utils/orderUtils.js";
import "../database.js";

// ============================================================================
// SPA NAVIGATION
// ============================================================================

async function navigateSPA(pageId, isInitialLoad = false) {
  const content = document.getElementById("content");
  const sidebar = document.getElementById("sidebar");

  if (!isInitialLoad && content && sidebar) {
    content.classList.add("fade");
    sidebar.classList.add("hide");
    await new Promise((res) => setTimeout(res, 400));
  }

  document.querySelectorAll("#content .page").forEach((page) => {
    page.style.display = "none";
    page.classList.remove("active");
  });

  const targetPage = document.getElementById(pageId);
  if (targetPage) {
    targetPage.style.display = "block";
    targetPage.classList.add("active");
  }

  document
    .querySelectorAll("#sidebar button")
    .forEach((btn) => btn.classList.remove("active"));
  document.getElementById(`menu-${pageId}`)?.classList.add("active");

  if (!isInitialLoad && content && sidebar) {
    content.classList.remove("fade");
    sidebar.classList.remove("hide");
  }
}
window.navigateSPA = navigateSPA;

// ============================================================================
// PAGE INITIALIZATION
// ============================================================================

document.addEventListener("DOMContentLoaded", function () {
  const toggleBtn = document.getElementById("toggle-sidebar-btn");
  const closeBtn = document.getElementById("close-btn");
  const wrapper = document.getElementById("admin-wrapper");

  toggleBtn?.addEventListener("click", () =>
    wrapper.classList.toggle("sidebar-hidden")
  );
  closeBtn?.addEventListener("click", () =>
    wrapper.classList.add("sidebar-hidden")
  );

  // Initialize all pages
  const pages = [
    { id: "inventory", html: inventoryHtml, init: initInventoryPage },
    { id: "dashboard", html: dashboardHtml, init: initDashboardPage },
    { id: "products", html: productHtml, init: initProductPage },
    { id: "imports", html: importHtml, init: initImportPage },
    { id: "reports", html: reportHtml, init: initReportPage },
  ];

  pages.forEach(({ id, html, init }) => {
    const div = document.getElementById(id);
    if (div) {
      div.innerHTML = html;
      init();
    } else {
      console.error(`❌ Cannot initialize <div id='${id}'>`);
    }
  });

  initOrdersPage();

  // Navigate to default page
  const defaultBtn = document.querySelector("#sidebar button.active");
  const defaultPageId = defaultBtn
    ? defaultBtn.id.replace("menu-", "")
    : "dashboard";
  navigateSPA(defaultPageId, true);

  // Logout
  document.getElementById("logout-btn")?.addEventListener("click", () => {
    if (confirm("Bạn có chắc muốn đăng xuất?")) {
      localStorage.removeItem("currentAdmin");
      window.location.href = "login.html";
    }
  });
});

// ============================================================================
// ORDERS PAGE - Quản lý đơn hàng
// ============================================================================

function initOrdersPage() {
  const getData = (key) => JSON.parse(localStorage.getItem(key) || "null");
  const setData = (key, val) => localStorage.setItem(key, JSON.stringify(val));

  // ✅ FIX: Define BroadcastChannel NGAY ĐẦU để có thể dùng trong các function
  const channel = new BroadcastChannel("data_update");
  console.log("✅ Admin: BroadcastChannel đã được khởi tạo");

  // Migrate old data structure
  function migrateOrderData() {
    let orders = getData("orders");
    if (!orders || orders.length === 0) return;

    if (!orders[0].date) {
      orders.forEach((o) => (o.date = o.date || new Date(o.id).toISOString()));
      setData("orders", orders);
      console.log("✅ Migrated order dates");
    }
  }

  migrateOrderData();
  normalizeOrderStructure();

  const sidebar1 = document.getElementById("sidebar1");
  const content1 = document.getElementById("content1");
  const menuButtons = document.querySelectorAll(".button_linear");
  const popup = document.getElementById("popup");
  const popupFields = document.getElementById("popupFields");
  const popupTitle = document.getElementById("popupTitle");
  const saveBtn = document.getElementById("saveBtn");
  const cancelBtn1 = document.getElementById("cancelBtn1");

  // Show popup modal
  function showPopup(title, fieldsHTML, onSave) {
    popupTitle.textContent = title;
    popupFields.innerHTML =
      typeof fieldsHTML === "function" ? fieldsHTML() : fieldsHTML;
    popup.classList.add("active");

    saveBtn.onclick = () => {
      const values = {};
      popupFields
        .querySelectorAll("input, select")
        .forEach((i) => (values[i.name] = i.value));
      onSave(values);
    };
    cancelBtn1.onclick = () => popup.classList.remove("active");
  }

  // Initialize orders if empty
  if (!getData("orders")?.length) {
    setData("orders", initialOrders);
  }

  // Animate sidebar change
  async function animateSidebarChange(newSidebarHTML, newContentHTML) {
    sidebar1.classList.add("hide");
    content1.classList.add("fade");
    await new Promise((res) => setTimeout(res, 400));
    sidebar1.innerHTML = newSidebarHTML;
    content1.innerHTML = newContentHTML;
    sidebar1.classList.remove("hide");
    content1.classList.remove("fade");
  }

  // Menu navigation
  menuButtons.forEach((btn) =>
    btn.addEventListener("click", () => {
      menuButtons.forEach((b) => b.classList.remove("active-mode"));
      btn.classList.add("active-mode");
      loadMode(btn.dataset.mode);
    })
  );

  // ============================================================================
  // LOAD MODE
  // ============================================================================

  function loadMode(mode) {
    if (mode === "users") {
      loadUsersMode();
    } else if (mode === "products") {
      navigateSPA("products");
    } else if (mode === "orders") {
      loadOrdersMode();
    }
  }

  // --------------------------------------------------------------------------
  // USERS MODE
  // --------------------------------------------------------------------------

  function loadUsersMode() {
    const users = getData("users") || [];

    function renderUserTable(userList) {
      const container = document.getElementById("user-table-container");
      if (!container) return;

      container.innerHTML = `
        <table class="table_content">
          <tr>
            <th>ID</th><th>Tên</th><th>Email</th><th>Vai trò</th><th>Trạng thái</th><th>Hành động</th>
          </tr>
          ${
            userList.length === 0
              ? `<tr><td colspan="6" style="text-align:center; color: #999;">Không có người dùng</td></tr>`
              : userList
                  .map(
                    (u) => `
              <tr>
                <td>${u.id}</td>
                <td>${u.name}</td>
                <td>${u.email}</td>
                <td>${u.role}</td>
                <td>${u.state}</td>
                <td>
                  <button class="edit-btn" data-id="${u.id}">Sửa</button>
                  <button class="delete-btn" data-id="${u.id}">Xóa</button>
                </td>
              </tr>
            `
                  )
                  .join("")
          }
        </table>
      `;

      // Edit user
      container.querySelectorAll(".edit-btn").forEach((btn) => {
        btn.onclick = () => {
          const user = users.find((u) => u.id == btn.dataset.id);
          if (!user) return;

          showPopup(
            "Sửa người dùng",
            `
            <input name="name" value="${user.name}" placeholder="Tên">
            <input name="email" value="${user.email}" placeholder="Email">
            <input name="password" type="password" value="${
              user.password
            }" placeholder="Mật khẩu">
            <select name="role">
              <option ${
                user.role === "Khách hàng" ? "selected" : ""
              }>Khách hàng</option>
              <option ${
                user.role === "Nhân viên" ? "selected" : ""
              }>Nhân viên</option>
            </select>
            <select name="state">
              <option ${user.state === "On" ? "selected" : ""}>On</option>
              <option ${user.state === "Off" ? "selected" : ""}>Off</option>
            </select>
          `,
            (vals) => {
              Object.assign(user, vals);
              setData("users", users);
              renderUserTable(users);
              popup.classList.remove("active");
            }
          );
        };
      });

      // Delete user
      container.querySelectorAll(".delete-btn").forEach((btn) => {
        btn.onclick = () => {
          const idx = users.findIndex((u) => u.id == btn.dataset.id);
          if (idx === -1) return;
          if (confirm(`Xóa ${users[idx].name}?`)) {
            users.splice(idx, 1);
            setData("users", users);
            renderUserTable(users);
          }
        };
      });
    }

    animateSidebarChange(
      `<button class="list_scrollbar" data-act="add">➕ Thêm người dùng</button>
       <input id="user-search-input" class="list-list_scrollbar" placeholder="Tìm người dùng..." 
         style="width: 90%; padding: 5px; margin-top: 10px; background: #3a3a3a; color: white; border: 1px solid #555; border-radius: 4px;">`,
      `<h2>Quản lý người dùng</h2><div id="user-table-container"></div>`
    ).then(() => {
      renderUserTable(users);

      // Search
      document.getElementById("user-search-input").oninput = (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = users.filter(
          (u) =>
            u.name.toLowerCase().includes(term) ||
            u.email.toLowerCase().includes(term)
        );
        renderUserTable(filtered);
      };

      // Add user
      document.querySelector('[data-act="add"]').onclick = () => {
        showPopup(
          "Thêm người dùng",
          `
          <input name="name" placeholder="Tên">
          <input name="email" placeholder="Email">
          <input name="password" type="password" placeholder="Mật khẩu">
          <select name="role">
            <option>Khách hàng</option>
            <option>Nhân viên</option>
          </select>
          <select name="state">
            <option>On</option>
            <option>Off</option>
          </select>
        `,
          (vals) => {
            users.push({ id: Date.now(), ...vals });
            setData("users", users);
            renderUserTable(users);
            popup.classList.remove("active");
          }
        );
      };
    });
  }

  // --------------------------------------------------------------------------
  // ORDERS MODE
  // --------------------------------------------------------------------------

  function loadOrdersMode() {
    let allOrders = getData("orders") || [];
    let allProducts = getData("products") || [];

    const formatCurrency = (val) =>
      (val || 0).toLocaleString("vi-VN", {
        style: "currency",
        currency: "VND",
      });
    const formatDate = (dateStr) =>
      new Date(dateStr).toLocaleDateString("vi-VN");
    const getStatusColor = (status) =>
      ({
        "Chờ xác nhận": "#808080",
        "Đang xử lý": "#fd7e14",
        "Đang vận chuyển": "#0000FF",
        "Giao hàng thành công": "#008000",
        "Đã hủy": "#FF0000",
      }[status] || "#ccc");

    // Render order table
    function renderOrderTable(ordersList) {
      const container = document.getElementById("order-table-container");
      if (!container) return;

      if (ordersList.length === 0) {
        container.innerHTML = `<p style="text-align: center; color: #999;">Không tìm thấy đơn hàng</p>`;
        return;
      }

      container.innerHTML = `
        <table class="table_content">
          <tr>
            <th>ID</th><th>Ngày</th><th>Khách hàng</th><th>Tổng tiền</th><th>Trạng thái</th><th>Hành động</th>
          </tr>
          ${ordersList
            .map((o) => {
              const total = getSafeOrderTotal(o);
              const hasError = !o.products?.length || total === 0;
              return `
              <tr class="order-row" data-order-id="${
                o.id
              }" style="cursor: pointer; ${
                hasError ? "background: #4a2020;" : ""
              }">
                <td>#${o.id}</td>
                <td>${formatDate(o.date)}</td>
                <td>${o.address?.name || o.user || "N/A"}</td>
                <td>${formatCurrency(total)} ${hasError ? "⚠️" : ""}</td>
                <td><strong style="color: ${getStatusColor(o.status)}">${
                o.status
              }</strong></td>
                <td>
                  <button class="delete-order-btn" data-order-id="${o.id}" 
                    style="background: #e74c3c; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">
                    🗑️ Xóa
                  </button>
                </td>
              </tr>
            `;
            })
            .join("")}
        </table>
      `;
    }

    // Filter and render
    function applyFiltersAndRender() {
      allOrders = getData("orders") || [];
      const dateFrom = document.getElementById("date-from").value;
      const dateTo = document.getElementById("date-to").value;
      const status = document.getElementById("status-filter").value;
      const searchTerm =
        document.getElementById("order-search-input")?.value.toLowerCase() ||
        "";

      const startTime = dateFrom ? new Date(dateFrom).getTime() : 0;
      const endTime = dateTo ? new Date(dateTo).getTime() + 86400000 : Infinity;

      const filtered = allOrders.filter((o) => {
        const orderTime = new Date(o.date).getTime();
        const statusMatch = status === "all" || o.status === status;
        const dateMatch = orderTime >= startTime && orderTime <= endTime;
        const customerName = o.address?.name || o.user || "";
        const searchMatch =
          !searchTerm ||
          customerName.toLowerCase().includes(searchTerm) ||
          String(o.id).includes(searchTerm);
        return statusMatch && dateMatch && searchMatch;
      });

      filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
      renderOrderTable(filtered);
    }

    // Render UI
    animateSidebarChange(
      `<button class="list_scrollbar" data-act="add">➕ Thêm đơn hàng</button>
       <input id="order-search-input" class="list-list_scrollbar" placeholder="Tìm đơn hàng..." 
         style="width: 90%; padding: 5px; margin-top: 10px; background: #3a3a3a; color: white; border: 1px solid #555; border-radius: 4px;">
       <p style="padding: 10px; color: #777; font-size: 0.9em;">💡 Click vào đơn để xem chi tiết</p>`,
      `<h2>Quản lý đơn hàng</h2>
       <div class="order-filters" style="display: flex; gap: 15px; padding: 15px; background: #2a2a2a; border-radius: 8px; margin-bottom: 20px;">
         <div style="flex: 1;">
           <label style="color: #ccc; font-size: 0.9em;">Từ ngày:</label>
           <input type="date" id="date-from" style="width: 100%; padding: 8px; border-radius: 4px; border: none; background: #3a3a3a; color: white;">
         </div>
         <div style="flex: 1;">
           <label style="color: #ccc; font-size: 0.9em;">Đến ngày:</label>
           <input type="date" id="date-to" style="width: 100%; padding: 8px; border-radius: 4px; border: none; background: #3a3a3a; color: white;">
         </div>
         <div style="flex: 1;">
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
         <button id="filter-btn" style="align-self: flex-end; padding: 8px 15px;">Lọc</button>
       </div>
       <div id="order-table-container"></div>`
    ).then(() => {
      document.getElementById("filter-btn").onclick = applyFiltersAndRender;
      document.getElementById("status-filter").onchange = applyFiltersAndRender;
      document.getElementById("date-from").onchange = applyFiltersAndRender;
      document.getElementById("date-to").onchange = applyFiltersAndRender;
      document.getElementById("order-search-input").oninput =
        applyFiltersAndRender;

      // Click handlers
      document
        .getElementById("order-table-container")
        .addEventListener("click", (e) => {
          // Delete button
          const deleteBtn = e.target.closest(".delete-order-btn");
          if (deleteBtn) {
            const orderId = deleteBtn.dataset.orderId;
            const idx = allOrders.findIndex((o) => o.id == orderId);
            if (idx >= 0 && confirm(`Xóa đơn #${orderId}?`)) {
              allOrders.splice(idx, 1);
              setData("orders", allOrders);

              // ✅ Broadcast orders_updated khi xóa
              setTimeout(() => {
                channel.postMessage({
                  type: "orders_updated",
                  action: "deleted",
                  orderId: orderId,
                });
                console.log(
                  `✅ Admin: Đã broadcast orders_updated (deleted) for order #${orderId}`
                );
              }, 50);

              applyFiltersAndRender();
            }
            return;
          }

          // Row click - show detail
          const row = e.target.closest(".order-row");
          if (!row) return;

          const order = allOrders.find((o) => o.id == row.dataset.orderId);
          if (!order) return alert("❌ Không tìm thấy đơn hàng");

          const oldStatus = order.status;

          showPopup(
            `Chi tiết đơn hàng #${order.id}`,
            () => {
              const products = order.products || [];
              const total = getSafeOrderTotal(order);

              let productsHtml =
                products.length === 0
                  ? '<p style="color: #ff6b6b;">⚠️ Đơn hàng không có sản phẩm</p>'
                  : products
                      .map(
                        (p) =>
                          `<p>• ${p.name || "N/A"} (SL: ${
                            p.quantity || 0
                          }) - ${formatCurrency(p.price || 0)}</p>`
                      )
                      .join("");

              const STATUS_RANKS = {
                "Chờ xác nhận": 1,
                "Đang xử lý": 2,
                "Đang vận chuyển": 3,
                "Giao hàng thành công": 4,
                "Đã hủy": 5,
              };
              const ALL_STATUSES = Object.keys(STATUS_RANKS);
              const oldRank = STATUS_RANKS[oldStatus] || 0;

              let statusHTML = "";
              if (
                oldStatus === "Giao hàng thành công" ||
                oldStatus === "Đã hủy"
              ) {
                statusHTML = `<strong style="color: ${getStatusColor(
                  oldStatus
                )}">${oldStatus}</strong>
              <p style="color: #999; font-size: 0.9em;">(Không thể thay đổi)</p>
              <select name="status" style="display:none;"><option value="${oldStatus}"></option></select>`;
              } else {
                const availableStatuses = ALL_STATUSES.filter(
                  (s) => s === "Đã hủy" || STATUS_RANKS[s] >= oldRank
                );
                statusHTML = `<select name="status" style="width: 100%; padding: 8px; border-radius: 4px; background: #3a3a3a; color: white;">
              ${availableStatuses
                .map(
                  (s) =>
                    `<option value="${s}" ${
                      s === oldStatus ? "selected" : ""
                    }>${s}</option>`
                )
                .join("")}
            </select>`;
              }

              return `
            <p style="color: #ccc;">Khách hàng: <strong>${
              order.address?.name || order.user || "N/A"
            }</strong></p>
            <div style="border: 1px solid #555; padding: 10px; margin: 12px 0; border-radius: 4px; max-height: 150px; overflow-y: auto; background: #2a2a2a;">
              <strong>Sản phẩm:</strong>${productsHtml}
            </div>
            <p style="color: #ccc;">Tổng tiền: <strong style="color: ${
              total > 0 ? "#4CAF50" : "#ff6b6b"
            };">
              ${formatCurrency(total)}${total === 0 ? " ⚠️ Lỗi dữ liệu" : ""}
            </strong></p>
            <hr style="border-color: #444; margin: 15px 0;">
            <label style="color: #fff; display: block; margin-bottom: 5px;">Cập nhật trạng thái:</label>
            ${statusHTML}
          `;
            },
            (vals) => {
              if (vals.status === order.status) {
                popup.classList.remove("active");
                return;
              }

              const SOLD_STATUSES = ["Đang vận chuyển", "Giao hàng thành công"];
              const oldSold = SOLD_STATUSES.includes(order.status);
              const newSold = SOLD_STATUSES.includes(vals.status);

              order.status = vals.status;
              allProducts = getData("products") || [];
              let canProcess = true;

              // Update stock
              if (!oldSold && newSold) {
                order.products.forEach((p) => {
                  const prod = allProducts.find(
                    (item) => item.id == p.productId
                  );
                  if (!prod || prod.quantity < p.quantity) {
                    alert(`❌ Không đủ hàng: ${p.name}`);
                    canProcess = false;
                  } else {
                    prod.quantity -= p.quantity;
                  }
                });
                if (canProcess) {
                  setData("products", allProducts);
                  channel.postMessage({ type: "products_updated" });
                }
              } else if (oldSold && !newSold) {
                order.products.forEach((p) => {
                  const prod = allProducts.find(
                    (item) => item.id == p.productId
                  );
                  if (prod) prod.quantity += p.quantity;
                });
                setData("products", allProducts);
                channel.postMessage({ type: "products_updated" });
              }

              if (canProcess) {
                setData("orders", allOrders);

                // ✅ Broadcast orders_updated khi thay đổi trạng thái
                setTimeout(() => {
                  channel.postMessage({
                    type: "orders_updated",
                    action: "status_changed",
                    orderId: order.id,
                    newStatus: vals.status,
                    oldStatus: oldStatus,
                  });
                  console.log(
                    `✅ Admin: Đã broadcast orders_updated (status_changed) for order #${order.id}`
                  );
                }, 50);

                applyFiltersAndRender();
                popup.classList.remove("active");
              }
            }
          );
        });

      // Add order button
      document
        .querySelector('[data-act="add"]')
        ?.addEventListener("click", () => {
          allProducts = getData("products") || [];
          const productOpts = allProducts
            .filter((p) => p.quantity > 0)
            .map(
              (p) =>
                `<option value="${p.id}">${p.name} (Tồn: ${p.quantity})</option>`
            )
            .join("");

          showPopup(
            "Thêm đơn hàng",
            `
          <input name="user" placeholder="Tên khách hàng" required>
          <label style="color: #ccc; display:block; margin-top:10px;">Sản phẩm:</label>
          <select name="productId" style="width: 100%; padding: 8px; background: #3a3a3a; color: white;">${productOpts}</select>
          <label style="color: #ccc; display:block; margin-top:10px;">Số lượng:</label>
          <input name="quantity" type="number" min="1" required>
          <label style="color: #ccc; display:block; margin-top:10px;">Trạng thái:</label>
          <select name="status">
            <option value="Chờ xác nhận">Chờ xác nhận</option>
            <option value="Đang xử lý">Đang xử lý</option>
            <option value="Đang vận chuyển">Đang vận chuyển</option>
            <option value="Giao hàng thành công">Giao hàng thành công</option>
          </select>
        `,
            (vals) => {
              const product = allProducts.find((p) => p.id == vals.productId);
              const qty = parseInt(vals.quantity);

              if (!product || !qty || qty <= 0)
                return alert("❌ Dữ liệu không hợp lệ");
              if (product.quantity < qty) return alert("❌ Không đủ hàng");

              if (SOLD_STATUSES.includes(vals.status)) {
                product.quantity -= qty;
                setData("products", allProducts);
                channel.postMessage({ type: "products_updated" });
              }

              const newOrder = {
                id: Date.now(),
                date: new Date().toISOString(),
                user: vals.user || "Khách lẻ",
                status: vals.status,
                payMethod: "Admin",
                total: product.price * qty,
                address: { name: vals.user || "Khách lẻ" },
                products: [
                  {
                    productId: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.img,
                    quantity: qty,
                  },
                ],
              };

              allOrders = getData("orders") || [];
              allOrders.push(newOrder);
              setData("orders", allOrders);

              // ✅ Broadcast orders_updated khi thêm mới
              setTimeout(() => {
                channel.postMessage({
                  type: "orders_updated",
                  action: "created",
                  orderId: newOrder.id,
                });
                console.log(
                  `✅ Admin: Đã broadcast orders_updated (created) for order #${newOrder.id}`
                );
              }, 50);

              applyFiltersAndRender();
              popup.classList.remove("active");
            }
          );
        });

      applyFiltersAndRender();
    });
  }

  // ============================================================================
  // BROADCAST CHANNEL LISTENER - Sync across tabs
  // ============================================================================

  channel.onmessage = (event) => {
    const { type } = event.data;

    // Listen cho cả products_updated và orders_updated
    if (type !== "products_updated" && type !== "orders_updated") return;

    console.log(`📡 Admin: Nhận được ${type} từ tab khác`);

    const activePage = document.querySelector(".page.active");

    if (activePage?.id === "dashboard") {
      document.getElementById("dashboard").innerHTML = dashboardHtml;
      initDashboardPage();
    }
    if (activePage?.id === "products") {
      document.getElementById("products").innerHTML = productHtml;
      initProductPage();
    }
    if (activePage?.id === "imports") {
      document.getElementById("imports").innerHTML = importHtml;
      initImportPage();
    }
    if (activePage?.id === "orders") {
      const activeBtn = document
        .getElementById("orders")
        .querySelector(".button_linear.active-mode");
      if (activeBtn?.dataset.mode === "orders") loadOrdersMode();
    }
  };
}
