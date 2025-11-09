// Account Detail JavaScript - Quản lý thông tin tài khoản

// Load thông tin user lên trang
function loadUserInfo() {
  const user = JSON.parse(localStorage.getItem("loggedInUser"));
  if (!user) return;
  
  // Cập nhật header nav
  const userInfo = document.getElementById('user-info');
  const usernameDisplay = document.getElementById('username-display');
  const loginLink = document.getElementById('login-link');
  const signupLink = document.getElementById('signup-link');
  const logoutLink = document.getElementById('logout-link');
  const cartLink = document.getElementById('cart-link');
  
  if (userInfo && usernameDisplay) {
    usernameDisplay.textContent = user.name || user.email.split('@')[0];
    userInfo.style.display = 'inline-block';
  }
  if (loginLink) loginLink.style.display = 'none';
  if (signupLink) signupLink.style.display = 'none';
  if (logoutLink) logoutLink.style.display = 'inline-block';
  if (cartLink) cartLink.style.display = 'inline-block';
}

// Load thông tin user vào account detail page
function loadAccountDetailInfo() {
  const user = JSON.parse(localStorage.getItem("loggedInUser"));
  if (!user) return;
  
  // Cập nhật avatar
  const avatarImg = document.querySelector('.account-detail-top-avatar-img img');
  if (avatarImg && user.avatar) {
    avatarImg.src = user.avatar;
  }
  
  // Cập nhật tên và mô tả
  const headerName = document.querySelector('.account-detail-top-info h1');
  const headerDesc = document.querySelector('.account-detail-top-info p');
  
  if (headerName) {
    headerName.textContent = user.name || user.email.split('@')[0];
  }
  
  if (headerDesc && user.bio) {
    headerDesc.textContent = user.bio;
  }
  
  // Cập nhật các input fields
  const nameInput = document.querySelector('.account-detail-bottom-info-item:nth-child(1) .info-value');
  const emailInput = document.querySelector('.account-detail-bottom-info-item:nth-child(2) .info-value');
  const phoneInput = document.querySelector('.account-detail-bottom-info-item:nth-child(3) .info-value');
  const addressInput = document.querySelector('.account-detail-bottom-info-item:nth-child(4) .info-value');
  const bioTextarea = document.querySelector('.account-detail-bottom-info-about .info-value');
  
  if (nameInput) nameInput.value = user.name || '';
  if (emailInput) emailInput.value = user.email || '';
  if (phoneInput) phoneInput.value = user.phone || '';
  if (addressInput) addressInput.value = user.address || '';
  if (bioTextarea) bioTextarea.value = user.bio || 'Chưa có thông tin giới thiệu';
}

// Tab Navigation (Phiên bản cập nhật)
function initTabNavigation() {
  document.querySelectorAll('.nav-tab').forEach(tab => {
    // Clone node để tránh gán listener nhiều lần nếu initAccountDetail được gọi lại
    const newTab = tab.cloneNode(true);
    tab.parentNode.replaceChild(newTab, tab);

    newTab.addEventListener('click', function() {
      const targetTab = this.dataset.tab;
      
      // Remove active từ tất cả tabs và contents
      document.querySelectorAll('.nav-tab, .tab-content').forEach(el => el.classList.remove('active'));
      
      // Add active cho tab được chọn
      this.classList.add('active');
      document.getElementById(targetTab + '-tab')?.classList.add('active');

      // === THÊM MỚI: Tải lịch sử đơn hàng khi click tab ===
      if (targetTab === 'order') {
        loadOrderHistory();
      }
      // ===================================================
    });
  });
}

// Personal Info Management (Giữ nguyên từ file của bạn)
class PersonalInfoManager {
  constructor() {
    this.editBtn = document.querySelector('.account-detail-bottom-info .account-detail-bottom-info-title button');
    this.inputs = document.querySelectorAll('.account-detail-bottom-info .info-value');
    this.avatarImg = document.querySelector('.account-detail-top-avatar-img img');
    this.avatarContainer = document.querySelector('.account-detail-top-avatar-img');
    this.headerName = document.querySelector('.account-detail-top-info h1');
    this.isEditMode = false;
    
    this.init();
  }
  
  init() {
    this.editBtn?.addEventListener('click', () => this.toggleEditMode());
    this.setupAvatarChange();
  }
  
  setupAvatarChange() {
    if (!this.avatarContainer) return;
    
    // Tạo overlay và input file (Nếu chưa có)
    if (!this.avatarContainer.querySelector('.avatar-overlay')) {
      const overlay = document.createElement('div');
      overlay.className = 'avatar-overlay';
      overlay.innerHTML = '<i class="ri-camera-line"></i><span>Đổi ảnh</span>';
      
      const fileInput = document.createElement('input');
      Object.assign(fileInput, { type: 'file', accept: 'image/*', id: 'avatar-input' });
      fileInput.style.display = 'none';
      
      this.avatarContainer.append(overlay, fileInput);

      // Xử lý click và change
      this.avatarContainer.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', (e) => this.handleAvatarChange(e));
    }
  }
  
  handleAvatarChange(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      return this.showNotification('❌ Vui lòng chọn file ảnh!', 'error');
    }
    if (file.size > 5 * 1024 * 1024) {
      return this.showNotification('❌ Kích thước ảnh không được vượt quá 5MB!', 'error');
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const avatarDataUrl = e.target.result;
      if (this.avatarImg) {
        this.avatarImg.src = avatarDataUrl;
      }
      
      const user = JSON.parse(localStorage.getItem("loggedInUser"));
      if (user) {
        user.avatar = avatarDataUrl;
        localStorage.setItem("loggedInUser", JSON.stringify(user));
        
        const users = JSON.parse(localStorage.getItem("users")) || [];
        const userIndex = users.findIndex(u => u.email === user.email);
        if (userIndex !== -1) {
          users[userIndex].avatar = avatarDataUrl;
          localStorage.setItem("users", JSON.stringify(users));
        }
      }
      this.showNotification('✅ Avatar đã được cập nhật!', 'success');
    };
    reader.readAsDataURL(file);
  }
  
  toggleEditMode() {
    this.isEditMode = !this.isEditMode;
    this.isEditMode ? this.enableEdit() : this.saveChanges();
  }
  
  enableEdit() {
    this.inputs.forEach(input => {
      input.disabled = false;
      Object.assign(input.style, { 
        borderColor: '#FFD700', 
        backgroundColor: 'rgba(24, 24, 27, 0.8)' 
      });
    });
    
    this.editBtn.innerHTML = '<i class="ri-save-line"></i>Lưu thay đổi';
    Object.assign(this.editBtn.style, { backgroundColor: '#FFD700', color: '#000' });
    this.showNotification('ℹ️ Bạn có thể chỉnh sửa thông tin của mình', 'info');
  }
  
  saveChanges() {
    const user = JSON.parse(localStorage.getItem("loggedInUser"));
    if (!user) return;
    
    const nameInput = Array.from(this.inputs).find(input => 
      input.closest('.account-detail-bottom-info-item')?.querySelector('.info-label')?.textContent.includes('Họ và tên')
    );
    const emailInput = Array.from(this.inputs).find(input => 
      input.closest('.account-detail-bottom-info-item')?.querySelector('.info-label')?.textContent.includes('Email')
    );
    const phoneInput = Array.from(this.inputs).find(input => 
      input.closest('.account-detail-bottom-info-item')?.querySelector('.info-label')?.textContent.includes('Số điện thoại')
    );
    const addressInput = Array.from(this.inputs).find(input => 
      input.closest('.account-detail-bottom-info-item')?.querySelector('.info-label')?.textContent.includes('Địa chỉ')
    );
    const bioTextarea = document.querySelector('.account-detail-bottom-info-about .info-value');
    
    const oldEmail = user.email;
    
    if (nameInput?.value.trim()) {
      user.name = nameInput.value.trim();
      if (this.headerName) this.headerName.textContent = user.name;
    }
    if (emailInput?.value.trim()) {
      user.email = emailInput.value.trim();
    }
    if (phoneInput?.value.trim()) user.phone = phoneInput.value.trim();
    if (addressInput?.value.trim()) user.address = addressInput.value.trim();
    if (bioTextarea?.value.trim()) user.bio = bioTextarea.value.trim();
    
    localStorage.setItem("loggedInUser", JSON.stringify(user));
    
    const users = JSON.parse(localStorage.getItem("users")) || [];
    const userIndex = users.findIndex(u => u.email === oldEmail);
    if (userIndex !== -1) {
      users[userIndex] = user;
      localStorage.setItem("users", JSON.stringify(users));
    }
    
    loadUserInfo();
    
    this.inputs.forEach(input => {
      input.disabled = true;
      Object.assign(input.style, { 
        borderColor: '#3F3F46', 
        backgroundColor: 'rgba(24, 24, 27, 0.5)' 
      });
    });
    
    this.editBtn.innerHTML = '<i class="ri-pencil-line"></i>Chỉnh sửa';
    Object.assign(this.editBtn.style, { backgroundColor: 'transparent', color: '#FFD700' });
    this.showNotification('✅ Thông tin của bạn đã được cập nhật thành công!', 'success');
  }
  
  showNotification(message, type = 'success') {
    const icons = { 
      success: 'checkbox-circle-line', 
      error: 'error-warning-line', 
      info: 'information-line' 
    };
    const colors = {
      success: '#10b981',
      error: '#ef4444', 
      info: '#3b82f6'
    };
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${colors[type]};
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 15px;
      font-weight: 500;
      z-index: 10000;
      transform: translateX(400px);
      transition: transform 0.3s ease;
    `;
    notification.innerHTML = `
      <i class="ri-${icons[type]}" style="font-size: 24px;"></i>
      <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
      notification.style.transform = 'translateX(400px)';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}

// Password Management (Giữ nguyên từ file của bạn)
class PasswordManager {
  constructor() {
    const accountDetailSection = document.getElementById('view-account-detail');
    this.toggleIcons = accountDetailSection?.querySelectorAll('.toggle-password') || [];
    this.changePasswordBtn = document.getElementById('change-password-btn');
    this.currentPasswordInput = document.getElementById('current-password');
    this.newPasswordInput = document.getElementById('new-password');
    this.confirmPasswordInput = document.getElementById('confirm-password');
    this.isProcessing = false;
    
    this.init();
  }
  
  init() {
    this.toggleIcons.forEach(icon => {
      const newIcon = icon.cloneNode(true);
      icon.parentNode.replaceChild(newIcon, icon);
      newIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        this.togglePasswordVisibility(newIcon);
      }, { once: false });
    });
    
    const accountDetailSection = document.getElementById('view-account-detail');
    this.toggleIcons = accountDetailSection?.querySelectorAll('.toggle-password') || [];
    
    if (this.changePasswordBtn) {
      const newBtn = this.changePasswordBtn.cloneNode(true);
      this.changePasswordBtn.parentNode.replaceChild(newBtn, this.changePasswordBtn);
      this.changePasswordBtn = newBtn;
      this.changePasswordBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleChangePassword();
      });
    }
    
    [this.currentPasswordInput, this.newPasswordInput, this.confirmPasswordInput].forEach(input => {
      input?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.handleChangePassword();
        }
      });
    });
  }
  
  togglePasswordVisibility(icon) {
    const targetId = icon.dataset.target;
    const input = document.getElementById(targetId);
    if (!input) return;
    
    if (input.type === 'password') {
      input.type = 'text';
      icon.classList.remove('ri-eye-off-line');
      icon.classList.add('ri-eye-line');
    } else {
      input.type = 'password';
      icon.classList.remove('ri-eye-line');
      icon.classList.add('ri-eye-off-line');
    }
  }
  
  handleChangePassword() {
    if (this.isProcessing) return;
    this.isProcessing = true;
    
    const user = JSON.parse(localStorage.getItem("loggedInUser"));
    if (!user) {
      this.isProcessing = false;
      return;
    }
    
    const currentPassword = this.currentPasswordInput?.value.trim() || '';
    const newPassword = this.newPasswordInput?.value.trim() || '';
    const confirmPassword = this.confirmPasswordInput?.value.trim() || '';
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      this.isProcessing = false;
      return this.showNotification('❌ Vui lòng điền đầy đủ thông tin!', 'error');
    }
    
    if (user.password !== currentPassword) {
      this.isProcessing = false;
      return this.showNotification('❌ Mật khẩu hiện tại không đúng!', 'error');
    }
    
    if (newPassword.length < 6) {
      this.isProcessing = false;
      return this.showNotification('❌ Mật khẩu mới phải có ít nhất 6 ký tự!', 'error');
    }
    
    if (newPassword !== confirmPassword) {
      this.isProcessing = false;
      return this.showNotification('❌ Mật khẩu xác nhận không khớp!', 'error');
    }
    
    if (currentPassword === newPassword) {
      this.isProcessing = false;
      return this.showNotification('⚠️ Mật khẩu mới phải khác mật khẩu hiện tại!', 'error');
    }
    
    user.password = newPassword;
    localStorage.setItem("loggedInUser", JSON.stringify(user));
    
    const users = JSON.parse(localStorage.getItem("users")) || [];
    const userIndex = users.findIndex(u => u.email === user.email);
    if (userIndex !== -1) {
      users[userIndex].password = newPassword;
      localStorage.setItem("users", JSON.stringify(users));
    }
    
    if (this.currentPasswordInput) this.currentPasswordInput.value = '';
    if (this.newPasswordInput) this.newPasswordInput.value = '';
    if (this.confirmPasswordInput) this.confirmPasswordInput.value = '';
    
    this.toggleIcons.forEach(icon => {
      const targetId = icon.dataset.target;
      const input = document.getElementById(targetId);
      if (input && input.type === 'text') {
        input.type = 'password';
        icon.classList.remove('ri-eye-line');
        icon.classList.add('ri-eye-off-line');
      }
    });
    
    this.isProcessing = false;
    this.showNotification('✅ Mật khẩu đã được cập nhật thành công!', 'success');
  }
  
  showNotification(message, type = 'success') {
    // (Giữ nguyên hàm showNotification của bạn)
    const icons = { 
      success: 'checkbox-circle-line', 
      error: 'error-warning-line', 
      info: 'information-line' 
    };
    const colors = { 
      success: '#10b981', 
      error: '#ef4444', 
      info: '#3b82f6' 
    };
    
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${colors[type]};
      color: white;
      padding: 16px 24px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 15px;
      font-weight: 500;
      z-index: 10000;
      transform: translateX(400px);
      transition: transform 0.3s ease;
    `;
    notification.innerHTML = `
      <i class="ri-${icons[type]}" style="font-size: 24px;"></i>
      <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
      notification.style.transform = 'translateX(400px)';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}


// === HÀM MỚI: TẢI LỊCH SỬ ĐƠN HÀNG ===
/**
 * Tải và hiển thị lịch sử đơn hàng từ localStorage
 */
function loadOrderHistory() {
  const orderListContainer = document.getElementById("account-order-list");
  if (!orderListContainer) return;

  const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
  const allOrders = JSON.parse(localStorage.getItem("orders")) || [];

  if (!loggedInUser) {
    orderListContainer.innerHTML = `<p class="order-empty-message">Vui lòng đăng nhập để xem lịch sử đơn hàng.</p>`;
    return;
  }

  // Lọc các đơn hàng của người dùng hiện tại (dựa trên email)
  const userOrders = allOrders.filter(order => 
    order.userEmail === loggedInUser.email
  );

  if (userOrders.length === 0) {
    orderListContainer.innerHTML = `<p class="order-empty-message">Bạn chưa có đơn hàng nào.</p>`;
    return;
  }

  // Sắp xếp đơn hàng mới nhất lên đầu
  userOrders.sort((a, b) => b.id - a.id); 

  // Render các đơn hàng
  orderListContainer.innerHTML = userOrders.map(order => {
    // Tạo danh sách sản phẩm cho đơn hàng
    const productsHTML = order.products.map(product => `
      <div class="order-product-item">
        <img src="${product.image}" alt="${product.name}">
        <span>${product.name} (x${product.quantity})</span>
      </div>
    `).join("");

    // Định dạng trạng thái (bạn có thể mở rộng)
    let statusClass = "status-new";
    if (order.status === "Đã hủy") statusClass = "status-cancelled";
    if (order.status === "Hoàn thành") statusClass = "status-completed";

    return `
      <div class="order-card">
        <div class="order-card-header">
          <div><strong>Ngày đặt:</strong> ${new Date(order.date).toLocaleString('vi-VN')}</div>
          <div><strong>Tổng tiền:</strong> <span class="order-total">${order.total.toLocaleString('vi-VN')} đ</span></div>
          <div><strong>Trạng thái:</strong> <span class="order-status ${statusClass}">${order.status}</span></div>
        </div>
        <div class="order-card-body">
          <p><strong>Các sản phẩm:</strong></p>
          ${productsHTML}
        </div>
      </div>
    `;
  }).join("");
}
// ======================================


// Initialize Account Detail when user is logged in
function initAccountDetail() {
  const user = JSON.parse(localStorage.getItem("loggedInUser"));
  
  if (!user) {
    alert("Vui lòng đăng nhập để truy cập trang này!");
    return false;
  }
  
  // Có user -> load thông tin và khởi tạo
  loadUserInfo(); // Load header info
  loadAccountDetailInfo(); // Load account detail page info + avatar
  initTabNavigation(); // Cài đặt chuyển tab
  new PersonalInfoManager();
  new PasswordManager();

  // Tải lịch sử đơn hàng cho tab 'order' (ngay cả khi nó đang ẩn)
  // để khi người dùng click, nó đã sẵn sàng.
  // Hoặc, bạn có thể chờ click trong initTabNavigation()
  // loadOrderHistory(); // <-- Đã chuyển vào initTabNavigation()
  
  return true;
}

// Initialize when DOM is loaded (for standalone page or first load)
document.addEventListener('DOMContentLoaded', () => {
  // Chỉ init nếu đang ở trang account-detail.html riêng biệt
  if (window.location.pathname.includes('account-detail.html')) {
    const user = JSON.parse(localStorage.getItem("loggedInUser"));
    if (!user) {
      setTimeout(() => {
        alert("Vui lòng đăng nhập để truy cập trang này!");
        window.location.href = "index.html";
      }, 100);
      return;
    }
    initAccountDetail();
  }
});
