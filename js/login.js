import { admin as initialAccount } from "./data/account.js";

const getData = (key) => JSON.parse(localStorage.getItem(key));
const setData = (key, val) => localStorage.setItem(key, JSON.stringify(val));

let adminList = getData("admin") || [];

// Kiểm tra xem admin đã tồn tại trong mảng chưa
const adminExists = adminList.some((user) => user.role === "admin");

// Nếu admin CHƯA tồn tại
if (!adminExists) {
  // Lưu lại vào localStorage
  setData("admin", initialAccount);
  console.log("Đã tự động thêm tài khoản admin vào localStorage (key: admin).");
}

// Hàm xử lý đăng nhập
function handleLogin(event) {
  event.preventDefault();

  const usernameInput = document.getElementById("username").value;
  const passwordInput = document.getElementById("password").value;
  const errorMessage = document.getElementById("error-message");

  // Lấy admin từ localStorage (key: 'admin')
  const admin = getData("admin") || [];

  // Tìm user
  const foundAdmin = admin.find(
    (admin) => admin.name === usernameInput && admin.password === passwordInput
  );

  if (foundAdmin) {
    // Đăng nhập thành công
    errorMessage.style.display = "none"; // Ẩn thông báo lỗi

    // Lưu 'currentAdmin'
    setData("currentAdmin", foundAdmin);

    //Kiểm tra vai trò VÀ chuyển hướng
    if (foundAdmin.role === "admin") {
      window.location.href = "./index.html"; // Chuyển đến trang admin
    }
  } else {
    // Đăng nhập thất bại
    errorMessage.style.display = "block";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }
});
