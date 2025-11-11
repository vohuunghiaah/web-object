// SPA Navigation System
// Trung tâm điều khiến SPA
class SPARouter {
  // Khởi tạo currentView = "home";
  constructor() {
    this.currentView = "home";
    this.init(); // Thiết lập tất cả lắng nghe sự kiện
  }

  init() {
    // Khởi tạo event listeners
    this.setupViewNavigation(); // Xử lý click vào link [data-view]
    this.setupModalNavigation(); // Xử lý modal (popup)
    this.setupShopNowButton(); // Xử lý nút "Shop Now"
    this.setupAllProductsButton(); // Xử lý nút "All Products"
    this.handleBrowserNavigation(); // Xử lý điều hướng trình duyệt (back/forward)
  }

  // Xử lý điều hướng giữa các view
  setupViewNavigation() {
    // Lấy tất cả các link có data-view
    const viewLinks = document.querySelectorAll("[data-view]");

    viewLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        const targetView = link.getAttribute("data-view");
        // Để products.js xử lý điều hướng + lọc + phân trang cho trang sản phẩm
        if (targetView === "products" || targetView === "product-details") {
          return;
        }
        e.preventDefault();
        this.navigateToView(targetView);
      });
    });
  }

  navigateToView(viewName) {
    // Kiểm tra quyền truy cập cho account-detail
    if (viewName === "account-detail") {
      const user = JSON.parse(localStorage.getItem("loggedInUser"));
      if (!user) {
        alert("Vui lòng đăng nhập để truy cập trang này!");
        return; // Dừng không chuyển view
      }
    }

    // Ẩn tất cả các view
    const allViews = document.querySelectorAll(".spa-view");
    allViews.forEach((view) => {
      view.classList.remove("active");
    });

    // Hiển thị view được chọn
    const targetView = document.getElementById(`view-${viewName}`);
    if (targetView) {
      targetView.classList.add("active");
      this.currentView = viewName;

      // Cập nhật navigation active state
      this.updateNavActive(viewName);

      // Khởi tạo account-detail nếu cần
      if (
        viewName === "account-detail" &&
        typeof initAccountDetail === "function"
      ) {
        window.initAccountDetail();
      }

      // Cuộn lên đầu trang một lần duy nhất với requestAnimationFrame
      requestAnimationFrame(() => {
        window.scrollTo(0, 0);
      });

      // Cập nhật URL (optional - không reload trang)
      history.pushState({ view: viewName }, "", `#${viewName}`);
    }
  }

  // Hàm cập nhật active state cho navigation
  updateNavActive(viewName) {
    // Lấy tất cả navigation links (chỉ lấy ở header__bottom__nav, không lấy dropdown)
    const navLinks = document.querySelectorAll('.header__bottom__nav > ul > li > a');
    
    navLinks.forEach(link => {
      const linkView = link.getAttribute('data-view');
      
      // Xóa active khỏi tất cả
      link.classList.remove('active');
      
      // Thêm active cho link tương ứng với view hiện tại
      if (linkView === viewName) {
        link.classList.add('active');
      }
      
      // Trường hợp đặc biệt: 
      // - Nếu view là product-details hoặc products thì active "products"
      if ((viewName === 'product-details' || viewName === 'products') && linkView === 'products') {
        link.classList.add('active');
      }
    });
  }

  // Xử lý modal (popup)
  setupModalNavigation() {
    const modalContainer = document.getElementById("modal-container");

    // Mở modal
    const openModalLinks = document.querySelectorAll(
      '[data-action="open-modal"]'
    );
    openModalLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const targetModal = link.getAttribute("data-target");
        this.openModal(targetModal);
      });
    });

    // Đóng modal
    const closeModalElements = document.querySelectorAll(
      '[data-action="close-modal"]'
    );
    closeModalElements.forEach((element) => {
      element.addEventListener("click", (e) => {
        e.preventDefault();
        this.closeModal();
      });
    });

    // Đóng modal khi nhấn ESC
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.closeModal();
      }
    });
  }

  openModal(modalId) {
    const modalContainer = document.getElementById("modal-container");
    const targetModal = document.getElementById(modalId);

    if (targetModal) {
      // Ẩn tất cả modal
      const allModals = document.querySelectorAll(".modal-content");
      allModals.forEach((modal) => {
        modal.classList.remove("active");
      });

      // Hiển thị modal container và modal được chọn
      modalContainer.classList.add("active");

      // Delay nhỏ để animation hoạt động
      setTimeout(() => {
        targetModal.classList.add("active");
      }, 10);

      // Ngăn cuộn trang khi modal mở
      document.body.style.overflow = "hidden";
    }
  }

  closeModal() {
    const modalContainer = document.getElementById("modal-container");
    const allModals = document.querySelectorAll(".modal-content");

    // Ẩn tất cả modal
    allModals.forEach((modal) => {
      modal.classList.remove("active");
    });

    // Delay để animation chạy xong trước khi ẩn container
    setTimeout(() => {
      modalContainer.classList.remove("active");
    }, 300);

    // Cho phép cuộn trang trở lại
    document.body.style.overflow = "";
  }

  // Xử lý nút Shop Now
  setupShopNowButton() {
    const shopNowBtn = document.querySelector(".hero--btn");
    if (shopNowBtn) {
      shopNowBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.navigateToView("products");
      });
    }
  }
  setupAllProductsButton() {
    const allProductsBtn = document.querySelector(".product-hottest--btn");
    if (allProductsBtn) {
      allProductsBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.navigateToView("products");
      });
    }
    // Xử lý button "Xem sản phẩm" trong trang About
    const aboutProductBtn = document.querySelector(
      ".about-top-container-button-02"
    );
    if (aboutProductBtn) {
      aboutProductBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.navigateToView("products");
      });
    }
  }
  // Xử lý browser back/forward buttons
  handleBrowserNavigation() {
    window.addEventListener("popstate", (e) => {
      if (e.state && e.state.view) {
        this.navigateToView(e.state.view);
      }
    });
  }
}
// ================= Giỏ hàng & localStorage =================
// js cho sản phẩm
let cart = JSON.parse(localStorage.getItem("cart")) || [];

window.cart = cart;

// Hoặc tạo getter/setter
window.getCart = function () {
  return cart;
};

// ================= NOTIFICATION SYSTEM =================
/**
 * Hệ thống thông báo đẹp thay thế alert()
 * @param {string} message - Nội dung thông báo
 * @param {string} type - Loại thông báo: 'error', 'success', 'warning', 'info'
 * @param {number} duration - Thời gian hiển thị (ms), mặc định 4000ms
 */
function showNotification(message, type = 'info', duration = 4000) {
  // Tạo container nếu chưa có
  let container = document.querySelector('.notification-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'notification-container';
    document.body.appendChild(container);
  }

  // Tạo notification element
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;

  // Icon dựa trên type
  const icons = {
    error: '✕',
    success: '✓',
    warning: '⚠',
    info: 'ℹ'
  };

  // Tiêu đề dựa trên type
  const titles = {
    error: 'Lỗi',
    success: 'Thành công',
    warning: 'Cảnh báo',
    info: 'Thông báo'
  };

  notification.innerHTML = `
    <div class="notification-icon">${icons[type]}</div>
    <div class="notification-content">
      <div class="notification-title">${titles[type]}</div>
      <div class="notification-message">${message}</div>
    </div>
    <button class="notification-close" aria-label="Đóng">×</button>
  `;

  // Thêm vào container
  container.appendChild(notification);

  // Xử lý nút đóng
  const closeBtn = notification.querySelector('.notification-close');
  closeBtn.addEventListener('click', () => {
    closeNotification(notification);
  });

  // Tự động đóng sau duration
  const timeoutId = setTimeout(() => {
    closeNotification(notification);
  }, duration);

  // Lưu timeoutId để có thể cancel nếu đóng manual
  notification.dataset.timeoutId = timeoutId;
}

/**
 * Đóng notification với animation
 */
function closeNotification(notification) {
  // Clear timeout nếu có
  if (notification.dataset.timeoutId) {
    clearTimeout(parseInt(notification.dataset.timeoutId));
  }

  // Thêm class closing để chạy animation
  notification.classList.add('closing');

  // Xóa element sau khi animation xong
  setTimeout(() => {
    notification.remove();

    // Xóa container nếu không còn notification nào
    const container = document.querySelector('.notification-container');
    if (container && container.children.length === 0) {
      container.remove();
    }
  }, 300);
}

window.setCart = function (newCart) {
  cart = newCart;
  localStorage.setItem("cart", JSON.stringify(cart));
};

// Gắn sự kiện click động cho các nút "Thêm vào giỏ" (cả danh sách và phần hot)
document.addEventListener("click", function (e) {
  const cartBtn = e.target.closest(
    ".products__list__item--img__cart, .product-hottest-item--img__cart"
  );
  if (!cartBtn) return;
  e.preventDefault();
  e.stopPropagation();

  // Tìm phần tử sản phẩm gần nhất và lấy dữ liệu hiển thị
  const item = cartBtn.closest(".products__list__item, .product-hottest-item");
  if (!item) return;
  const nameEl = item.querySelector(
    ".products__list__item--name, .product-hottest-item--name"
  );
  const priceEl = item.querySelector(
    ".products__list__item--price, .product-hottest-item--price"
  );
  const imgEl = item.querySelector("img");
  if (!nameEl || !priceEl || !imgEl) return;
  const name = nameEl.textContent.trim();
  const price = parseInt(priceEl.textContent.replace(/[^\d]/g, "")) || 0;
  const image = imgEl.src;
  addToCart(name, price, image, 1);
});

// Để bạn có thể lấy dữ liệu giỏ hàng
window.getCart = function () {
  return cart;
};
// ================= Giỏ hàng & localStorage =================
const shippingFee = 32000; // Phí vận chuyển cố định
let orders = JSON.parse(localStorage.getItem("orders")) || [];

// ================= Chuyển trang SPA =================
function showPage(id) {
  document
    .querySelectorAll(".page-section")
    .forEach((sec) => sec.classList.remove("active-page"));
  document.getElementById(id).classList.add("active-page");
  if (id === "cart-page") renderCart();
  if (id === "thanhtoan-page") renderCheckout();
  if (id === "donmua-page") renderOrderHistory();
}
// ✅ Hiển thị dấu tích khi thêm vào giỏ
function showAddToCartSuccess(name) {
  const popup = document.getElementById("cart-success");
  if (!popup) {
    // Không render popup => im lặng, tránh lỗi nghiêm trọng
    return;
  }
  const span = popup.querySelector("span");
  if (span) span.textContent = `Đã thêm "${name}" vào giỏ hàng!`;
  popup.classList.add("show");
  setTimeout(() => popup.classList.remove("show"), 2000);
}

// ================= Thêm sản phẩm vào giỏ =================
// Thay vì kiểm tra theo name, nên kiểm tra theo ID hoặc làm mềm điều kiện
function addToCart(name, price, image, quantity = 1) {
  // ✅ CẢI TIẾN: Kiểm tra tồn kho với điều kiện linh hoạt hơn
  const products = JSON.parse(localStorage.getItem("products")) || [];
  const productInStock = products.find(
    (p) => p.name.trim().toLowerCase() === name.trim().toLowerCase()
  );

  // === SỬA LỖI 1: MUA QUÁ SỐ LƯỢNG ===
  if (!productInStock) {
    alert(`Lỗi: Không tìm thấy sản phẩm "${name}" trong kho!`);
    return; // THÊM RETURN ĐỂ CHẶN
  } else {
    // Kiểm tra số lượng trong giỏ hiện tại
    const existing = cart.find((p) => p.name === name);
    const currentCartQty = existing ? existing.quantity : 0;
    const requestedQty =
      Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 1;
    const totalQty = currentCartQty + requestedQty;

    if (totalQty > productInStock.quantity) {
      alert(
        `Chỉ còn ${productInStock.quantity} sản phẩm "${name}" trong kho!\n(Giỏ hàng đã có ${currentCartQty})`
      );
      return;
    }
  }
  // === KẾT THÚC SỬA LỖI 1 ===

  // Thêm vào giỏ hàng
  const existing = cart.find((p) => p.name === name);
  const requestedQty =
    Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 1;

  if (existing) {
    existing.quantity += requestedQty;
  } else {
    cart.push({ name, price, image, quantity: requestedQty });
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  renderCart();
  renderCheckout();
  showAddToCartSuccess(name);

  // ✅ CẬP NHẬT LẠI CHI TIẾT SẢN PHẨM NẾU ĐANG MỞ
  if (typeof window.refreshProductDetails === "function") {
    window.refreshProductDetails();
  }
}
// ====== An toàn gán lại event handler (để tránh gán nhiều lần)========
function safeReplaceHandler(el, event, handler) {
  if (!el) return;
  const clone = el.cloneNode(true);
  el.parentNode.replaceChild(clone, el);
  clone.addEventListener(event, handler);
  return clone;
}

// ================= Render giỏ hàng =================
function renderCart() {
  // Reload cart từ localStorage để đảm bảo dữ liệu mới nhất
  cart = JSON.parse(localStorage.getItem("cart")) || [];

  const container = document.querySelector(".cart-items");
  const emptyMsg = document.querySelector(".cart-empty");

  if (!container || !emptyMsg) {
    console.warn("Cart elements not found");
    return;
  }

  container.innerHTML = "";

  if (cart.length === 0) {
    emptyMsg.style.display = "block";
  } else {
    emptyMsg.style.display = "none";

    cart.forEach((item, index) => {
      const div = document.createElement("div");
      div.classList.add("item");
      div.dataset.index = index;
      div.innerHTML = `
              <img src="${item.image}" alt="${item.name}">
              <div>
                  <p>${item.name}</p>
                  <p>${item.price} đ x <span class="qty">${item.quantity}</span></p>
                  <div class="quantity-controls">
                      <button class="decrease">-</button>
                      <button class="increase">+</button>
                  </div>
                  <button class="remove-btn">Xóa</button>
              </div>`;
      const qtySpan = div.querySelector(".qty");

      // Nút xóa
      div.querySelector(".remove-btn").addEventListener("click", () => {
        cart.splice(index, 1);
        localStorage.setItem("cart", JSON.stringify(cart));
        renderCart();
        div.classList.add("fade-out");
        setTimeout(() => {
          div.remove();
          renderCheckout();
          if (cart.length === 0) emptyMsg.style.display = "block";
          
          // ✅ Refresh chi tiết sản phẩm
          if (typeof window.refreshProductDetails === "function") {
            window.refreshProductDetails();
          }
        }, 300);
      });

      // Nút tăng
      div.querySelector(".increase").addEventListener("click", () => {
        item.quantity++;
        localStorage.setItem("cart", JSON.stringify(cart));
        qtySpan.textContent = item.quantity;
        renderCheckout();
        
        // ✅ Refresh chi tiết sản phẩm
        if (typeof window.refreshProductDetails === "function") {
          window.refreshProductDetails();
        }
      });

      // Nút giảm
      div.querySelector(".decrease").addEventListener("click", () => {
        item.quantity--;
        localStorage.setItem("cart", JSON.stringify(cart));

        if (item.quantity <= 0) {
          cart.splice(index, 1);
          div.classList.add("fade-out");
          setTimeout(() => {
            div.remove();
            renderCheckout();
            if (cart.length === 0) emptyMsg.style.display = "block";
            
            // ✅ Refresh chi tiết sản phẩm
            if (typeof window.refreshProductDetails === "function") {
              window.refreshProductDetails();
            }
          }, 300);
        } else {
          qtySpan.textContent = item.quantity;
          renderCheckout();
          
          // ✅ Refresh chi tiết sản phẩm
          if (typeof window.refreshProductDetails === "function") {
            window.refreshProductDetails();
          }
        }
      });
      container.appendChild(div);
    });
  }

  // ✅ Nút quay lại luôn được gắn sự kiện, dù giỏ hàng có trống hay không
  const backBtn = document.getElementById("back-to-shop");
  if (backBtn) {
    safeReplaceHandler(backBtn, "click", () => {
      if (typeof showView === "function") showView("view-products");
      if (window.router && typeof window.router.closeModal === "function") {
        window.router.closeModal();
      }
    });
  }
  // ✅ Gắn sự kiện cho nút XEM LỊCH SỬ MUA HÀNG
  const historyBtn = document.getElementById("view-order-history");
  if (historyBtn) {
    safeReplaceHandler(historyBtn, "click", (e) => {
      e.preventDefault(); // Ngăn link tự nhảy trang

      // Gọi hàm showPage (đã có sẵn trong file của bạn)
      if (typeof showPage === "function") {
        showPage("donmua-page");
        renderOrderHistory(); // Tải lại lịch sử đơn hàng
      }

      // Đóng modal giỏ hàng
      if (window.router && typeof window.router.closeModal === "function") {
        window.router.closeModal();
      }
    });
  }
}
// ================= Render checkout =================
function renderCheckout() {
  const summary = document.querySelector(".cart-items-summary");
  const subtotalEl = document.querySelector(".subtotal");
  const shippingEl = document.querySelector(".shipping");
  const totalEl = document.querySelector(".total");

  if (!summary || !subtotalEl || !shippingEl || !totalEl) {
    console.warn("Checkout elements not found - page may not be visible yet");
    return;
  }

  summary.innerHTML = "";
  let subtotal = 0;

  cart.forEach((item, index) => {
    subtotal += item.price * item.quantity;
    const div = document.createElement("div");
    div.classList.add("product-item");
    div.innerHTML = `
      <img src="${item.image}" alt="${item.name}">
      <div>
        <p><strong>${item.name}</strong></p>
        <p>${item.price} đ x ${item.quantity}</p>
        <button class="remove-btn">Xóa</button>
      </div>`;
    summary.appendChild(div);

    div.querySelector(".remove-btn").addEventListener("click", () => {
      cart.splice(index, 1);
      localStorage.setItem("cart", JSON.stringify(cart));
      renderCart();
      renderCheckout();
      
      // ✅ Refresh chi tiết sản phẩm
      if (typeof window.refreshProductDetails === "function") {
        window.refreshProductDetails();
      }
    });
  });

  subtotalEl.innerText = subtotal + " đ";
  shippingEl.innerText = shippingFee + " đ";
  totalEl.innerHTML = `<strong>Tổng cộng:</strong> ${subtotal + shippingFee} đ`;

  // ✅ THÊM: Gắn sự kiện cho nút quay lại trong trang thanh toán
  const backBtnCheckout = document.querySelector(
    "#thanhtoan-page #back-to-shop"
  );
  if (backBtnCheckout) {
    safeReplaceHandler(backBtnCheckout, "click", () => {
      showPage("cart-page"); // Quay về trang giỏ hàng
    });
  }
}
// ================= Hiển thị form chuyển khoản =================
document.querySelectorAll('input[name="pay"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    document.getElementById("bank-info").style.display =
      radio.value === "bank" ? "block" : "none";
  });
});
// ================= Thanh toán =================
// === SỬA LỖI 2: THAY THẾ TOÀN BỘ HÀM NÀY ===
function checkoutOrder() {
  // Kiểm tra đăng nhập
  const user = JSON.parse(localStorage.getItem("loggedInUser"));
  if (!user) {
    showNotification("Vui lòng đăng nhập để tiếp tục thanh toán!", "warning");
    if (window.router && typeof window.router.openModal === "function") {
      router.openModal("login-modal");
    }
    return;
  }

  if (cart.length === 0) {
    showNotification("Giỏ hàng của bạn đang trống!", "warning");
    return;
  }

  // Lấy thông tin giao hàng
  const form = document.querySelector(".checkout-form");
  const name = form
    .querySelector('input[placeholder="Họ và tên"]')
    .value.trim();
  const email = form.querySelector('input[type="email"]').value.trim();
  const phone = form.querySelector('input[type="tel"]').value.trim();
  const address = form
    .querySelector('input[placeholder="Địa chỉ"]')
    .value.trim();
  const ward = form
    .querySelector('input[placeholder="Phường/Xã"]')
    .value.trim();
  const district = form
    .querySelector('input[placeholder="Quận/Huyện"]')
    .value.trim();
  const city = form
    .querySelector('input[placeholder="Tỉnh/Thành phố"]')
    .value.trim();
  const payMethod = form.querySelector('input[name="pay"]:checked')?.value;

  // ===== THÊM VALIDATION CHI TIẾT =====

  // 1. Kiểm tra rỗng (chỉ bắt buộc: tên, email, phone, địa chỉ)
  if (
    !name ||
    !email ||
    !phone ||
    !address ||
    !payMethod ||
    !ward ||
    !district ||
    !city
  ) {
    showNotification("Vui lòng điền đầy đủ thông tin giao hàng!", "error");
    return;
  }

  // 2. Validate tên (ít nhất 2 ký tự, không chứa số hoặc ký tự đặc biệt)
  const nameRegex = /^[a-zA-ZÀ-ỹ\s]{2,50}$/;
  if (!nameRegex.test(name)) {
    showNotification("Tên không hợp lệ! Vui lòng nhập từ 2-50 ký tự, không chứa số hoặc ký tự đặc biệt.", "error");
    return;
  }

  // 3. Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showNotification("Email không hợp lệ! Vui lòng nhập đúng định dạng (ví dụ: example@gmail.com)", "error");
    return;
  }

  // 4. Validate số điện thoại Việt Nam (10 số, bắt đầu bằng 0)
  const phoneRegex = /^0[0-9]{9}$/;
  if (!phoneRegex.test(phone)) {
    showNotification("Số điện thoại không hợp lệ! Vui lòng nhập đúng 10 số (ví dụ: 0912345678)", "error");
    return;
  }

  // ✅ 5. VALIDATE THÔNG TIN NGÂN HÀNG NẾU CHỌN THANH TOÁN QUA NGÂN HÀNG
  if (payMethod === "bank") {
    const bankName = document.getElementById("bank-name")?.value.trim();
    const bankAccount = document.getElementById("bank-account")?.value.trim();
    const bankOwner = document.getElementById("bank-owner")?.value.trim();

    // Kiểm tra các trường bắt buộc
    if (!bankName || !bankAccount || !bankOwner) {
      showNotification("Vui lòng điền đầy đủ thông tin chuyển khoản ngân hàng!", "error");
      return;
    }

    // Validate tên ngân hàng (tối thiểu 3 ký tự)
    if (bankName.length < 3) {
      showNotification("Tên ngân hàng không hợp lệ! Vui lòng nhập tối thiểu 3 ký tự.", "error");
      return;
    }

    // Validate số tài khoản (chỉ chứa số, độ dài từ 8-20 ký tự)
    const accountRegex = /^[0-9]{8,20}$/;
    if (!accountRegex.test(bankAccount)) {
      showNotification("Số tài khoản không hợp lệ! Vui lòng nhập từ 8-20 chữ số.", "error");
      return;
    }

    // Validate tên chủ tài khoản (ít nhất 2 ký tự, không chứa số)
    const ownerRegex = /^[a-zA-ZÀ-ỹ\s]{2,50}$/;
    if (!ownerRegex.test(bankOwner)) {
      showNotification("Tên chủ tài khoản không hợp lệ! Vui lòng nhập từ 2-50 ký tự, không chứa số.", "error");
      return;
    }
  }

  // ===== TIẾP TỤC LOGIC CŨ =====

  let total =
    cart.reduce((sum, p) => sum + p.price * p.quantity, 0) + shippingFee;

  // Kiểm tra tồn kho
  let products = JSON.parse(localStorage.getItem("products")) || [];
  let stockWarnings = [];

  cart.forEach((cartItem) => {
    const productIndex = products.findIndex((p) => p.name === cartItem.name);

    if (productIndex !== -1) {
      const product = products[productIndex];
      if (product.quantity < cartItem.quantity) {
        stockWarnings.push(
          `${product.name} chỉ còn ${product.quantity} sản phẩm!`
        );
      }
    } else {
      stockWarnings.push(
        `Không tìm thấy sản phẩm "${cartItem.name}" trong kho!`
      );
    }
  });

  if (stockWarnings.length > 0) {
    showNotification("Không thể thanh toán:\n" + stockWarnings.join("\n"), "error", 6000);
    return;
  }

  // Tạo đơn hàng
  const productsForOrder = cart.map((cartItem) => {
    const productInStock = products.find((p) => p.name === cartItem.name);
    return {
      ...cartItem,
      productId: productInStock ? productInStock.id : null,
    };
  });

  // ✅ Lấy thông tin ngân hàng nếu thanh toán qua ngân hàng
  let bankInfo = null;
  if (payMethod === "bank") {
    bankInfo = {
      bankName: document.getElementById("bank-name")?.value.trim(),
      bankAccount: document.getElementById("bank-account")?.value.trim(),
      bankOwner: document.getElementById("bank-owner")?.value.trim(),
    };
  }

  const order = {
    id: Date.now(),
    date: new Date().toISOString(),
    products: productsForOrder,
    total,
    userEmail: user.email,
    status: "Mới đặt",
    payMethod,
    address: { name, email, phone, address, ward, district, city },
    bankInfo: bankInfo, // ✅ Thêm thông tin ngân hàng vào đơn hàng
  };

  orders.push(order);
  localStorage.setItem("orders", JSON.stringify(orders));

  // ✅ CẬP NHẬT TỒN KHO SAU KHI ĐẶT HÀNG THÀNH CÔNG
  cart.forEach((cartItem) => {
    const productIndex = products.findIndex((p) => p.name === cartItem.name);
    if (productIndex !== -1) {
      products[productIndex].quantity -= cartItem.quantity;
      // Đảm bảo không bị số âm
      if (products[productIndex].quantity < 0) {
        products[productIndex].quantity = 0;
      }
    }
  });
  // Lưu lại products đã giảm số lượng
  localStorage.setItem("products", JSON.stringify(products));

  showNotification("Đặt hàng thành công! Cảm ơn bạn đã mua hàng.", "success", 5000);

  if (typeof loadOrderHistory === "function") {
    loadOrderHistory();
  }

  // ✅ CẬP NHẬT LẠI TRANG CHI TIẾT SẢN PHẨM NẾU ĐANG MỞ
  if (typeof window.refreshProductDetails === "function") {
    window.refreshProductDetails();
  }

  // Hiển thị hóa đơn
  const billProducts = document.querySelector(".bill-products");
  const billTotal = document.querySelector(".bill-total");
  const billPay = document.querySelector(".bill-pay");
  const dateEl = document.getElementById("date");
  const billAddress = document.querySelector(".bill-address");

  billProducts.innerHTML = "";
  order.products.forEach((item) => {
    const p = document.createElement("p");
    p.innerHTML = `<strong>${item.name}</strong> x ${item.quantity} - ${
      item.price * item.quantity
    } đ`;
    billProducts.appendChild(p);
  });

  billTotal.innerText = total + " đ";
  billPay.innerText = payMethod.toUpperCase();
  dateEl.innerText = new Date(order.date).toLocaleString("vi-VN");
  billAddress.innerHTML = `
    <p><strong>Người đặt:</strong> ${name}</p>
    <p><strong>Địa chỉ:</strong> ${address}, ${ward}, ${district}, ${city}</p>
    <p><strong>SĐT:</strong> ${phone}</p>
  `;

  // ✅ Hiển thị thông tin ngân hàng nếu có
  if (order.bankInfo) {
    billAddress.innerHTML += `
      <hr style="margin: 10px 0; border: none; border-top: 1px solid #ddd;">
      <p style="color: #2563eb;"><strong>📱 Thông tin chuyển khoản:</strong></p>
      <p><strong>Ngân hàng:</strong> ${order.bankInfo.bankName}</p>
      <p><strong>Số TK:</strong> ${order.bankInfo.bankAccount}</p>
      <p><strong>Chủ TK:</strong> ${order.bankInfo.bankOwner}</p>
    `;
  }

  // Xóa giỏ hàng
  cart = [];
  localStorage.removeItem("cart");
  renderCart();
  renderCheckout();
  
  // ✅ Reset form ngân hàng (ẩn và xóa dữ liệu)
  const bankInfoDiv = document.getElementById("bank-info");
  if (bankInfoDiv) {
    bankInfoDiv.style.display = "none";
    const bankNameInput = document.getElementById("bank-name");
    const bankAccountInput = document.getElementById("bank-account");
    const bankOwnerInput = document.getElementById("bank-owner");
    if (bankNameInput) bankNameInput.value = "";
    if (bankAccountInput) bankAccountInput.value = "";
    if (bankOwnerInput) bankOwnerInput.value = "";
  }
  
  // Reset radio button về COD
  const codRadio = document.querySelector('input[name="pay"][value="cod"]');
  if (codRadio) codRadio.checked = true;
  
  showPage("donmua-page");
}

// === KẾT THÚC SỬA LỖI 2 ===

// ================= Hiển thị lịch sử đơn hàng =================
function renderOrderHistory() {
  const tbody = document.getElementById("order-history");
  tbody.innerHTML = "";
  orders.forEach((order) => {
    order.products.forEach((item) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${item.name}</td><td>${
        item.price * item.quantity
      } đ</td><td>Đã mua</td>`;
      tbody.appendChild(tr);
    });
  });
}

// Chuyển tới trang thanh toán
// === SỬA LỖI 3: NÚT THANH TOÁN ===
function goToCheckout() {
  if (window.getCart().length === 0) {
    alert("Giỏ hàng trống. Không thể tiếp tục thanh toán!");
    return; // Không chuyển trang
  }
  // (Đã xóa dòng lỗi "stockWarnings.push" ở đây)
  showPage("thanhtoan-page");
}
// === KẾT THÚC SỬA LỖI 3 ===

//  LOGIN & REGISTER

// Chuyển qua lại giữa login/signup modal
function setupAuthFormToggle() {
  const loginModal = document.getElementById("login-modal");
  const signupModal = document.getElementById("signup-modal");

  // Login → Signup
  document
    .querySelectorAll('[data-action="switch-to-signup"]')
    .forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        loginModal.classList.remove("active");
        setTimeout(() => signupModal.classList.add("active"), 150);
      });
    });

  // Signup → Login
  document
    .querySelectorAll('[data-action="switch-to-login"]')
    .forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        signupModal.classList.remove("active");
        setTimeout(() => loginModal.classList.add("active"), 150);
      });
    });
}

// Xử lý đăng ký tài khoản
function setupRegisterForm() {
  const form = document.getElementById("signup-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = form.querySelector("#signup-name").value.trim();
    const email = form.querySelector("#signup-email").value.trim();
    const password = form.querySelector("#signup-password").value.trim();
    const confirm = form.querySelector("#signup-confirm").value.trim();
    const pattern = /^[a-zA-Z0-9]+@(gmail\.com|yahoo\.com|outlook\.com)$/;

    if (!name || !email || !password)
      return alert("Vui lòng nhập đầy đủ thông tin!");
    if (password !== confirm) return alert("Mật khẩu nhập lại không khớp!");

    let users = JSON.parse(localStorage.getItem("users")) || [];
    if (users.some((u) => u.email === email))
      return alert("Email này đã được đăng ký!");

    if (!pattern.test(email)) {
      e.preventDefault(); // Ngăn form gửi
      return alert("Email định dạng sai");
    }
    const newUser = {
      id: Date.now(),
      name: name,
      email: email,
      password: password,
      role: "Khách hàng",
      state: "On",
    };
    users.push(newUser);
    localStorage.setItem("users", JSON.stringify(users));
    alert("Đăng ký thành công! Vui lòng đăng nhập.");

    form.reset();
    // Chuyển về login form
    document.getElementById("signup-modal").classList.remove("active");
    setTimeout(
      () => document.getElementById("login-modal").classList.add("active"),
      150
    );
  });
}

// Đặt vào bên trong 'DOMContentLoaded' trong file user.js

// TÙY CHỈNH LẠI THÔNG BÁO LỖI CHO FORM ĐĂNG NHẬP
const loginEmailInput = document.getElementById("login-email");

if (loginEmailInput) {
  // 1. Ghi đè thông báo khi trường bị "invalid" (không hợp lệ)
  loginEmailInput.addEventListener("invalid", function (event) {
    if (loginEmailInput.validity.valueMissing) {
      // Lỗi: Bị bỏ trống
      loginEmailInput.setCustomValidity("Bạn ơi, email không được để trống!");
    } else if (loginEmailInput.validity.typeMismatch) {
      // Lỗi: Sai định dạng (như trong hình của bạn)
      loginEmailInput.setCustomValidity(
        "Email phải có chữ '@' nhé. (ví dụ: user@xtray.com)"
      );
    } else {
      // Lỗi khác
      loginEmailInput.setCustomValidity("Dữ liệu không hợp lệ.");
    }
  });

  // 2. Xóa thông báo tùy chỉnh khi người dùng bắt đầu gõ
  loginEmailInput.addEventListener("input", function (event) {
    // Khi người dùng bắt đầu sửa lỗi, hãy xóa thông báo
    loginEmailInput.setCustomValidity("");
  });
}

// ... (phần code khác của bạn như setupLoginForm()...)
// Xử lý đăng nhập
function setupLoginForm() {
  const form = document.getElementById("login-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const email = form.querySelector("#login-email").value.trim();
    const password = form.querySelector("#login-password").value.trim();
    const users = JSON.parse(localStorage.getItem("users")) || [];
    // Đặt vào bên trong 'DOMContentLoaded' trong file user.js

    // TÙY CHỈNH LẠI THÔNG BÁO LỖI CHO FORM ĐĂNG NHẬP
    const loginEmailInput = document.getElementById("login-email");

    if (loginEmailInput) {
      // 1. Ghi đè thông báo khi trường bị "invalid" (không hợp lệ)
      loginEmailInput.addEventListener("invalid", function (event) {
        if (loginEmailInput.validity.valueMissing) {
          // Lỗi: Bị bỏ trống
          loginEmailInput.setCustomValidity(
            "Bạn ơi, email không được để trống!"
          );
        } else if (loginEmailInput.validity.typeMismatch) {
          // Lỗi: Sai định dạng (như trong hình của bạn)
          loginEmailInput.setCustomValidity(
            "Email phải có chữ '@' nhé. (ví dụ: user@xtray.com)"
          );
        } else {
          // Lỗi khác
          loginEmailInput.setCustomValidity("Dữ liệu không hợp lệ.");
        }
      });

      // 2. Xóa thông báo tùy chỉnh khi người dùng bắt đầu gõ
      loginEmailInput.addEventListener("input", function (event) {
        // Khi người dùng bắt đầu sửa lỗi, hãy xóa thông báo
        loginEmailInput.setCustomValidity("");
      });
    }
    // Hỗ trợ tài khoản demo
    if (email === "user@xtray.com" && password === "user123") {
      localStorage.setItem(
        "loggedInUser",
        JSON.stringify({ name: "Demo User", email })
      );
      alert("Đăng nhập demo thành công!");
      closeAllModals();
      updateUserUI();

      // Kiểm tra xem có sản phẩm đang chờ thêm vào giỏ không
      checkPendingCartItem();
      return;
    }

    const user = users.find(
      (u) => u.email === email && u.password === password
    );
    if (!user) return alert("Sai email hoặc mật khẩu!");
    if (user.state === "Off") {
      return alert(
        "Tài khoản của bạn đã bị khóa! Vui lòng liên hệ quản trị viên."
      );
    }
    localStorage.setItem("loggedInUser", JSON.stringify(user));
    alert("Đăng nhập thành công!");
    closeAllModals();
    updateUserUI();

    // Kiểm tra xem có sản phẩm đang chờ thêm vào giỏ không
    checkPendingCartItem();

    const pendingItem = JSON.parse(localStorage.getItem("pendingBuyNow"));

    if (pendingItem && pendingItem.action === "buyNow") {
      // Có 1 món đang chờ mua

      // 1. Ghi đè giỏ hàng với món này
      cart = [pendingItem];
      localStorage.setItem("cart", JSON.stringify(cart));

      // 2. Xóa pending item
      localStorage.removeItem("pendingBuyNow");

      // 3. Mở giỏ hàng và chuyển đến trang thanh toán
      if (window.router && typeof window.router.openModal === "function") {
        window.router.openModal("cart-modal");
        renderCart();
        renderCheckout();
        setTimeout(() => {
          showPage("thanhtoan-page");
        }, 100);
      }
    }
  });
}

// Cập nhật giao diện người dùng
function updateUserUI() {
  const user = JSON.parse(localStorage.getItem("loggedInUser"));
  const loginLink = document.getElementById("login-link");
  const signupLink = document.getElementById("signup-link");
  const logoutLink = document.getElementById("logout-link");
  const userInfo = document.getElementById("user-info");
  const usernameDisplay = document.getElementById("username-display");
  const cartLink = document.getElementById("cart-link");
  const accountLink = document.getElementById("account-link");

  if (!window.router) {
    console.warn("Router chưa sẵn, bỏ qua updateUserUI()");
    return;
  }

  if (user) {
    // Đã đăng nhập
    usernameDisplay.textContent = user.name || user.email.split("@")[0];
    userInfo.style.display = "inline-block";
    loginLink.style.display = "none";
    signupLink.style.display = "none";
    logoutLink.style.display = "inline-block";
    cartLink.style.display = "inline-block";
    if (accountLink) accountLink.style.display = "inline-block";

    // Cập nhật avatar nếu có
    const userAvatar = document.getElementById("user-avatar");
    if (userAvatar) {
      if (user.avatar) {
        userAvatar.src = user.avatar;
        userAvatar.style.display = "inline-block";
      } else {
        userAvatar.style.display = "none";
      }
    }
  } else {
    // Chưa đăng nhập
    userInfo.style.display = "none";
    loginLink.style.display = "inline-block";
    signupLink.style.display = "inline-block";
    logoutLink.style.display = "none";
    if (accountLink) accountLink.style.display = "none";
  }
}

// Hàm global để refresh toàn bộ dữ liệu user ở mọi nơi
window.refreshUserData = function () {
  const user = JSON.parse(localStorage.getItem("loggedInUser"));
  if (!user) return;

  // 1. Cập nhật header navigation
  updateUserUI();

  // 2. Cập nhật account detail page (nếu đang mở)
  const accountDetailView = document.getElementById("view-account-detail");
  if (accountDetailView && accountDetailView.classList.contains("active")) {
    // Cập nhật avatar trong account detail
    const avatarImg = document.querySelector(
      ".account-detail-top-avatar-img img"
    );
    if (avatarImg && user.avatar) {
      avatarImg.src = user.avatar;
    }

    // Cập nhật tên trong header
    const headerName = document.querySelector(".account-detail-top-info h1");
    if (headerName) {
      headerName.textContent = user.name || user.email.split("@")[0];
    }

    // Cập nhật mô tả
    const headerDesc = document.querySelector(".account-detail-top-info p");
    if (headerDesc && user.bio) {
      headerDesc.textContent = user.bio;
    }

    // Cập nhật các input fields (không cần vì đã được xử lý trong saveChanges)
  }

  console.log("✅ User data refreshed globally");
};

// Cho phép mở giỏ hàng nếu đã login
function allowCartAccess(e) {
  e.preventDefault();
  // Bỏ kiểm tra đăng nhập
  const modalContainer = document.getElementById("modal-container");
  const cartModal = document.getElementById("cart-modal");

  if (modalContainer && cartModal) {
    modalContainer.classList.add("active");
    cartModal.classList.add("active");
    document.body.style.overflow = "hidden";
  }
}

// Xử lý đăng xuất
function setupLogout() {
  const logoutLink = document.getElementById("logout-link");
  if (!logoutLink) return;
  logoutLink.addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.removeItem("loggedInUser");
    alert("Đã đăng xuất!");
    updateUserUI();

    // Chuyển về trang home sau khi đăng xuất
    if (window.router && typeof window.router.navigateToView === "function") {
      window.router.navigateToView("home");
    }
  });
}

// Đóng toàn bộ modal
function closeAllModals() {
  const modalContainer = document.getElementById("modal-container");
  document
    .querySelectorAll(".modal-content")
    .forEach((m) => m.classList.remove("active"));
  modalContainer.classList.remove("active");
  document.body.style.overflow = "";
}

// ========================== END LOGIN & REGISTER ==========================

// ===== Kiểm tra và thêm sản phẩm đang chờ vào giỏ hàng sau khi đăng nhập=====
function checkPendingCartItem() {
  const pendingProduct = JSON.parse(localStorage.getItem("pendingCartItem"));

  if (pendingProduct) {
    const { name, price, image, quantity } = pendingProduct;

    // Thêm sản phẩm vào giỏ hàng
    const qty =
      Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 1;
    const existing = cart.find((p) => p.name === name);
    if (existing) existing.quantity += qty;
    else cart.push({ name, price, image, quantity: qty });

    localStorage.setItem("cart", JSON.stringify(cart));
    renderCart();
    renderCheckout();

    // Xóa sản phẩm đang chờ
    localStorage.removeItem("pendingCartItem");

    // Hiển thị thông báo thành công
    showAddToCartSuccess(name);
  }
  // Kiểm tra xem có sản phẩm "Mua ngay" đang chờ không
  checkPendingBuyNow();
}

// Hàm kiểm tra và xử lý "Mua ngay" sau khi đăng nhập
function checkPendingBuyNow() {
  const pendingBuyNow = JSON.parse(localStorage.getItem("pendingBuyNow"));

  if (pendingBuyNow && pendingBuyNow.action === "buyNow") {
    const { name, price, image, quantity } = pendingBuyNow;

    // Xóa giỏ hàng hiện tại và thêm sản phẩm mua ngay
    cart = [{ name, price, image, quantity }];
    localStorage.setItem("cart", JSON.stringify(cart));

    // Xóa pending buy now
    localStorage.removeItem("pendingBuyNow");

    // Mở modal giỏ hàng và chuyển đến trang thanh toán
    if (window.router && typeof window.router.openModal === "function") {
      window.router.openModal("cart-modal");
      renderCart();
      renderCheckout();

      // Chuyển đến trang thanh toán
      setTimeout(() => {
        showPage("thanhtoan-page");
      }, 200);
    }
  }
}
//Hàm
// === 1 DOMCONTENTLOADED DUY NHẤT — chèn ở cuối file, xóa 3 listener cũ ===
document.addEventListener("DOMContentLoaded", () => {
  // 1.1) Xử lý hash trong URL TRƯỚC KHI khởi tạo - để tránh flash
  const hash = window.location.hash.replace("#", "") || "home";

  if (hash !== "home") {
    // Ẩn view home và hiển thị view được chọn NGAY LẬP TỨC
    const homeView = document.getElementById("view-home");
    const targetView = document.getElementById("view-" + hash);
    if (homeView && targetView) {
      homeView.classList.remove("active");
      targetView.classList.add("active");
    }
  } else {
    // Đảm bảo view-home có class active khi refresh homepage
    const homeView = document.getElementById("view-home");
    if (homeView && !homeView.classList.contains("active")) {
      homeView.classList.add("active");
    }
  }

  // 1.2) Khởi tạo router SPA sau
  window.router = new SPARouter();
  window.spaRouter = window.router;

  // 2) Khởi tạo các module liên quan tới giỏ hàng / đơn hàng
  renderCart();
  renderCheckout();

  const backBtn = document.getElementById("back-to-shop");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      if (typeof showView === "function") showView("view-products");
      if (window.router && typeof window.router.closeModal === "function") {
        window.router.closeModal();
      }
    });
  }

  // 3) Khởi tạo auth (login/register/logout)
  setupAuthFormToggle();
  setupRegisterForm();
  setupLoginForm();
  setupLogout();

  // 4) Cập nhật UI người dùng (dựa trên trạng thái loggedInUser)
  //    và gắn các event handler quan trọng một cách "idempotent" (an toàn gán 1 lần).
  function attachUserUIHandlers() {
    const loginLink = document.getElementById("login-link");
    const signupLink = document.getElementById("signup-link");
    const logoutLink = document.getElementById("logout-link");
    const userInfo = document.getElementById("user-info");
    const cartLink = document.getElementById("cart-link");
    const usernameDisplay = document.getElementById("username-display");

    // updateUserUI sẽ set trạng thái hiển thị; nhưng không gán onclick trực tiếp nhiều lần

    // Gắn handler cho cartLink an toàn (1 lần)
    if (cartLink) {
      safeReplaceHandler(cartLink, "click", (e) => {
        e.preventDefault();
        // Bỏ phần kiểm tra user đăng nhập
        if (window.router && typeof window.router.openModal === "function") {
          window.router.openModal("cart-modal");

          if (typeof showPage === "function") {
            showPage("cart-page");
          }
        } else {
          // fallback: show modal directly
          const modalContainer = document.getElementById("modal-container");
          const cartModal = document.getElementById("cart-modal");
          if (modalContainer && cartModal) {
            modalContainer.classList.add("active");
            cartModal.classList.add("active");
            document.body.style.overflow = "hidden";

            if (typeof showPage === "function") {
              showPage("cart-page");
            }
          }
        }
      });
    }
    if (typeof updateUserUI === "function") {
      updateUserUI();
    }
  }
  // Gọi attach once
  attachUserUIHandlers();
  // 5) Khởi tạo modal-related (nếu chưa khởi)
  //    setupModalNavigation() đã được gọi trong constructor SPARouter,
  //    nhưng gọi lại an toàn nếu cần (idempotent) — đảm bảo listener đã sẳn sàng.
  if (
    window.router &&
    typeof window.router.setupModalNavigation === "function"
  ) {
    try {
      window.router.setupModalNavigation();
    } catch (e) {}
  }

  // 6) Cuộn lên đầu an toàn 1 lần
  requestAnimationFrame(() => window.scrollTo(0, 0));

  // 7) Lắng nghe sự thay đổi localStorage từ tab/page khác
  window.addEventListener("storage", (e) => {
    if (e.key === "loggedInUser") {
      updateUserUI();
    }
  });

  // 8) Cập nhật active state ban đầu cho navigation (trang home)
  if (window.router && typeof window.router.updateNavActive === "function") {
    window.router.updateNavActive('home');
  }

  console.log("✅ App initialized (single DOMContentLoaded).");
});

window.addToCart = addToCart;
window.showPage = showPage;
window.goToCheckout = goToCheckout;
window.checkoutOrder = checkoutOrder;

