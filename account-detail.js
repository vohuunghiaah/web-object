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

// Tab Navigation
function initTabNavigation() {
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', function() {
      const targetTab = this.dataset.tab;
      
      // Remove active từ tất cả tabs và contents
      document.querySelectorAll('.nav-tab, .tab-content').forEach(el => el.classList.remove('active'));
      
      // Add active cho tab được chọn
      this.classList.add('active');
      document.getElementById(targetTab + '-tab')?.classList.add('active');
    });
  });
}

// Personal Info Management
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
    
    // Tạo overlay và input file
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
  
  handleAvatarChange(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file
    if (!file.type.startsWith('image/')) {
      return this.showNotification('❌ Vui lòng chọn file ảnh!', 'error');
    }
    if (file.size > 5 * 1024 * 1024) {
      return this.showNotification('❌ Kích thước ảnh không được vượt quá 5MB!', 'error');
    }
    
    // Đọc và hiển thị ảnh
    const reader = new FileReader();
    reader.onload = (e) => {
      const avatarDataUrl = e.target.result;
      
      // Hiển thị ảnh ngay lập tức
      if (this.avatarImg) {
        this.avatarImg.src = avatarDataUrl;
      }
      
      // Lưu vào localStorage
      const user = JSON.parse(localStorage.getItem("loggedInUser"));
      if (user) {
        user.avatar = avatarDataUrl;
        localStorage.setItem("loggedInUser", JSON.stringify(user));
        
        // Cập nhật trong database users
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
    // Enable inputs
    this.inputs.forEach(input => {
      input.disabled = false;
      Object.assign(input.style, { 
        borderColor: '#FFD700', 
        backgroundColor: 'rgba(24, 24, 27, 0.8)' 
      });
    });
    
    // Update button
    this.editBtn.innerHTML = '<i class="ri-save-line"></i>Lưu thay đổi';
    Object.assign(this.editBtn.style, { backgroundColor: '#FFD700', color: '#000' });
    
    this.showNotification('ℹ️ Bạn có thể chỉnh sửa thông tin của mình', 'info');
  }
  
  saveChanges() {
    // Lấy user từ localStorage
    const user = JSON.parse(localStorage.getItem("loggedInUser"));
    if (!user) return;
    
    // Lấy các giá trị từ input
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
    
    // Lưu email cũ để tìm user trong database
    const oldEmail = user.email;
    
    // Cập nhật thông tin user
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
    
    // Lưu lại vào localStorage
    localStorage.setItem("loggedInUser", JSON.stringify(user));
    
    // Cập nhật trong database users (dùng oldEmail để tìm)
    const users = JSON.parse(localStorage.getItem("users")) || [];
    const userIndex = users.findIndex(u => u.email === oldEmail);
    if (userIndex !== -1) {
      users[userIndex] = user;
      localStorage.setItem("users", JSON.stringify(users));
    }
    
    // Cập nhật hiển thị ở header ngay lập tức
    loadUserInfo();
    
    // Disable inputs
    this.inputs.forEach(input => {
      input.disabled = true;
      Object.assign(input.style, { 
        borderColor: '#3F3F46', 
        backgroundColor: 'rgba(24, 24, 27, 0.5)' 
      });
    });
    
    // Reset button
    this.editBtn.innerHTML = '<i class="ri-pencil-line"></i>Chỉnh sửa';
    Object.assign(this.editBtn.style, { backgroundColor: 'transparent', color: '#FFD700' });
    
    // Hiển thị thông báo thành công với icon đẹp
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
    
    // Animation
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
      notification.style.transform = 'translateX(400px)';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}

// Password Management
class PasswordManager {
  constructor() {
    const accountDetailSection = document.getElementById('view-account-detail');
    this.toggleIcons = accountDetailSection?.querySelectorAll('.toggle-password') || [];
    this.changePasswordBtn = document.getElementById('change-password-btn');
    this.currentPasswordInput = document.getElementById('current-password');
    this.newPasswordInput = document.getElementById('new-password');
    this.confirmPasswordInput = document.getElementById('confirm-password');
    this.isProcessing = false; // Thêm flag để tránh xử lý nhiều lần
    
    this.init();
  }
  
  init() {
    // Setup toggle password visibility - Xóa listener cũ trước
    this.toggleIcons.forEach(icon => {
      // Clone để xóa tất cả listener cũ
      const newIcon = icon.cloneNode(true);
      icon.parentNode.replaceChild(newIcon, icon);
      newIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        this.togglePasswordVisibility(newIcon);
      }, { once: false });
    });
    
    // Cập nhật lại danh sách icons sau khi clone
    const accountDetailSection = document.getElementById('view-account-detail');
    this.toggleIcons = accountDetailSection?.querySelectorAll('.toggle-password') || [];
    
    // Setup change password button
    if (this.changePasswordBtn) {
      const newBtn = this.changePasswordBtn.cloneNode(true);
      this.changePasswordBtn.parentNode.replaceChild(newBtn, this.changePasswordBtn);
      this.changePasswordBtn = newBtn;
      this.changePasswordBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleChangePassword();
      });
    }
    
    // Enter key to submit
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
    // Tránh xử lý nhiều lần cùng lúc
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
    
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      this.isProcessing = false;
      return this.showNotification('❌ Vui lòng điền đầy đủ thông tin!', 'error');
    }
    
    // Check current password
    if (user.password !== currentPassword) {
      this.isProcessing = false;
      return this.showNotification('❌ Mật khẩu hiện tại không đúng!', 'error');
    }
    
    // Check new password length
    if (newPassword.length < 6) {
      this.isProcessing = false;
      return this.showNotification('❌ Mật khẩu mới phải có ít nhất 6 ký tự!', 'error');
    }
    
    // Check password confirmation
    if (newPassword !== confirmPassword) {
      this.isProcessing = false;
      return this.showNotification('❌ Mật khẩu xác nhận không khớp!', 'error');
    }
    
    // Check if new password is same as current
    if (currentPassword === newPassword) {
      this.isProcessing = false;
      return this.showNotification('⚠️ Mật khẩu mới phải khác mật khẩu hiện tại!', 'error');
    }
    
    // Update password
    user.password = newPassword;
    
    // Save to localStorage
    localStorage.setItem("loggedInUser", JSON.stringify(user));
    
    // Update in users database
    const users = JSON.parse(localStorage.getItem("users")) || [];
    const userIndex = users.findIndex(u => u.email === user.email);
    if (userIndex !== -1) {
      users[userIndex].password = newPassword;
      localStorage.setItem("users", JSON.stringify(users));
    }
    
    // Clear inputs
    if (this.currentPasswordInput) this.currentPasswordInput.value = '';
    if (this.newPasswordInput) this.newPasswordInput.value = '';
    if (this.confirmPasswordInput) this.confirmPasswordInput.value = '';
    
    // Reset all password fields to hidden
    this.toggleIcons.forEach(icon => {
      const targetId = icon.dataset.target;
      const input = document.getElementById(targetId);
      if (input && input.type === 'text') {
        input.type = 'password';
        icon.classList.remove('ri-eye-line');
        icon.classList.add('ri-eye-off-line');
      }
    });
    
    // Reset flag sau khi xử lý xong
    this.isProcessing = false;
    
    this.showNotification('✅ Mật khẩu đã được cập nhật thành công!', 'success');
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
    
    // Animation
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
      notification.style.transform = 'translateX(400px)';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}

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
  initTabNavigation();
  new PersonalInfoManager();
  new PasswordManager();
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
