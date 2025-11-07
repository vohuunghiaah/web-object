import { allProduct as initialProducts } from "./mockData.js";

const getData = (key) => JSON.parse(localStorage.getItem(key));
const setData = (key, val) => localStorage.setItem(key, JSON.stringify(val));

function initializeProducts() {
  let products = getData("products");

  // Chỉ khởi tạo nếu localStorage trống
  if (!products || products.length === 0) {
    console.warn("⚠️ LocalStorage trống! Đang khởi tạo 200 sản phẩm (từ mockData)...");

    const normalizedProducts = initialProducts.map(p => {
      // Giả định lợi nhuận 30% (0.3) nếu file mockData không có
      const profitMargin = p.profitMargin || 0.3; 
      
      // Tự động tính Giá Vốn (costPrice) từ Giá Bán (price)
      const costPrice = p.costPrice || (p.price / (1 + profitMargin)); 
      
      // SỬA LỖI ĐƯỜNG DẪN:
      // Đổi "./assets/..." thành "admin/assets/..."
      // (Bỏ dấu / ở đầu để nó hoạt động nhất quán)
      const correctPath = p.imgSrc.replace("./assets/", "../assets/");
      
      return {
        ...p, // Lấy tất cả dữ liệu gốc
        imgSrc: correctPath,   // Sửa đường dẫn cho trang User
        img: correctPath,      // Sửa đường dẫn cho trang Admin
        costPrice: costPrice,  // Thêm Giá Vốn
        profitMargin: profitMargin // Thêm % Lợi Nhuận
      };
    });

    setData("products", normalizedProducts);
    console.log(
      "✅ Đã khởi tạo",
      normalizedProducts.length,
      "sản phẩm vào localStorage!"
    );
  } else {
    console.log("✅ LocalStorage đã có", products.length, "sản phẩm. Bỏ qua khởi tạo.");
  }
}

// Hàm này không còn được dùng vì mockData đã có 'brand'
function extractBrand(productName) {
  const brands = [
    "SteelSeries", "Leopold", "Corsair", "Razer", "AULA",
    "HyperX", "ASUS", "Cooler Master", "Ducky", "Varmilo", "Logitech", "Sony",
  ];
  for (const brand of brands) {
    if (productName.includes(brand)) return brand;
  }
  return "Generic";
}

// Chạy ngay
initializeProducts();
