import { allProduct as initialProducts } from "./mockData.js";
import { mockOrders } from "./mockData.js";
import { mockCustomers } from "./mockData.js";

/**
 * Parse JSON an toàn với fallback
 * @param {string} jsonString - Chuỗi JSON cần parse
 * @param {any} fallbackValue - Giá trị trả về nếu parse thất bại
 * @returns {any} - Object đã parse hoặc giá trị fallback
 */
const safeJsonParse = (jsonString, fallbackValue = null) => {
  // Kiểm tra input có hợp lệ không
  if (jsonString === null || jsonString === undefined || jsonString === "") {
    return fallbackValue;
  }

  try {
    // Thử parse JSON
    const parsed = JSON.parse(jsonString);
    return parsed;
  } catch (error) {
    // Nếu parse thất bại, log lỗi và trả về giá trị fallback
    console.error("❌ Lỗi khi parse JSON:", error.message);
    console.debug("Chuỗi JSON gây lỗi:", jsonString.substring(0, 100) + "...");
    return fallbackValue;
  }
};

/**
 * Stringify JSON an toàn với fallback
 * @param {any} value - Giá trị cần chuyển thành JSON
 * @param {string} fallbackValue - Giá trị trả về nếu stringify thất bại
 * @returns {string} - Chuỗi JSON hoặc giá trị fallback
 */
const safeJsonStringify = (value, fallbackValue = "{}") => {
  try {
    // Thử stringify
    const stringified = JSON.stringify(value);
    return stringified;
  } catch (error) {
    // Nếu stringify thất bại, log lỗi và trả về giá trị fallback
    console.error("❌ Lỗi khi stringify JSON:", error.message);
    console.debug("Giá trị gây lỗi:", value);
    return fallbackValue;
  }
};

/**
 * Hàm lấy dữ liệu từ localStorage với xử lý lỗi an toàn
 * @param {string} key - Tên key trong localStorage
 * @param {any} defaultValue - Giá trị mặc định nếu không tìm thấy hoặc lỗi
 * @returns {any} - Dữ liệu đã parse hoặc giá trị mặc định
 */
const getData = (key, defaultValue = null) => {
  try {
    // Lấy dữ liệu từ localStorage
    const item = localStorage.getItem(key);

    // Kiểm tra null hoặc undefined trước khi parse
    if (item === null || item === undefined) {
      console.log(`ℹ️ Không tìm thấy key "${key}" trong localStorage`);
      return defaultValue;
    }

    // Parse JSON với fallback an toàn
    const parsed = safeJsonParse(item, defaultValue);
    return parsed;
  } catch (error) {
    // Xử lý lỗi khi localStorage không khả dụng
    console.error(`❌ Lỗi khi đọc từ localStorage (key: ${key}):`, error);
    return defaultValue;
  }
};

/**
 * Hàm lưu dữ liệu vào localStorage với xử lý lỗi an toàn
 * @param {string} key - Tên key trong localStorage
 * @param {any} val - Giá trị cần lưu
 * @returns {boolean} - true nếu lưu thành công, false nếu có lỗi
 */
const setData = (key, val) => {
  try {
    // Stringify với fallback an toàn
    const stringified = safeJsonStringify(val, null);

    // Nếu stringify thất bại, không lưu
    if (stringified === null) {
      console.error(`❌ Không thể stringify dữ liệu cho key "${key}"`);
      return false;
    }

    // Lưu vào localStorage
    localStorage.setItem(key, stringified);
    return true;
  } catch (error) {
    // Xử lý các lỗi localStorage
    console.error(`❌ Lỗi khi lưu vào localStorage (key: ${key}):`, error);

    // Kiểm tra nếu localStorage đầy (QuotaExceededError)
    if (error.name === "QuotaExceededError" || error.code === 22) {
      console.warn("⚠️ LocalStorage đã đầy! Cần xóa bớt dữ liệu.");
      console.log("💡 Gợi ý: Gọi hàm cleanupOldData() hoặc resetAllData()");
    }

    return false;
  }
};

/**
 * Kiểm tra localStorage có khả dụng không
 * @returns {boolean} - true nếu localStorage hoạt động bình thường
 */
const isLocalStorageAvailable = () => {
  try {
    const testKey = "__localStorage_test__";
    const testValue = "test";
    localStorage.setItem(testKey, testValue);
    const retrieved = localStorage.getItem(testKey);
    localStorage.removeItem(testKey);
    return retrieved === testValue;
  } catch (error) {
    console.error("❌ LocalStorage không khả dụng:", error);
    return false;
  }
};

/**
 * Lưu mockCustomers vào localStorage một cách an toàn
 * Hàm chuyên dụng với nhiều lớp bảo vệ
 * @returns {boolean} - true nếu lưu thành công
 */
function saveMockCustomersToStorage() {
  console.log("💾 Đang lưu mockCustomers vào localStorage...");

  // Kiểm tra localStorage có khả dụng không
  if (!isLocalStorageAvailable()) {
    console.error("❌ Không thể lưu: localStorage không khả dụng");
    return false;
  }

  // Kiểm tra mockCustomers có tồn tại và là array không
  if (!mockCustomers || !Array.isArray(mockCustomers)) {
    console.error("❌ mockCustomers không hợp lệ hoặc không phải là array");
    return false;
  }

  // Kiểm tra mockCustomers có rỗng không
  if (mockCustomers.length === 0) {
    console.warn("⚠️ mockCustomers rỗng, không có gì để lưu");
    return false;
  }

  try {
    // Validate dữ liệu trước khi lưu
    const validCustomers = mockCustomers.filter((customer) => {
      // Kiểm tra các trường bắt buộc
      if (!customer || !customer.id || !customer.name) {
        console.warn("⚠️ Bỏ qua khách hàng không hợp lệ:", customer);
        return false;
      }
      return true;
    });

    // Nếu không có khách hàng hợp lệ nào
    if (validCustomers.length === 0) {
      console.error("❌ Không có khách hàng hợp lệ để lưu");
      return false;
    }

    // Lưu với setData (đã có xử lý lỗi bên trong)
    const success = setData("customers", validCustomers);

    if (success) {
      console.log(
        `✅ Đã lưu ${validCustomers.length} khách hàng vào localStorage`
      );

      // Verify bằng cách đọc lại
      const verified = getData("customers", []);
      if (verified && verified.length === validCustomers.length) {
        console.log("✅ Xác minh thành công: Dữ liệu đã được lưu chính xác");
        return true;
      } else {
        console.error("❌ Xác minh thất bại: Dữ liệu không khớp sau khi lưu");
        return false;
      }
    } else {
      console.error("❌ setData trả về false, lưu thất bại");
      return false;
    }
  } catch (error) {
    console.error("❌ Lỗi không mong đợi khi lưu mockCustomers:", error);
    return false;
  }
}

/**
 * Khởi tạo danh sách sản phẩm trong localStorage
 */
function initializeProducts() {
  if (!isLocalStorageAvailable()) {
    console.error(
      "❌ Không thể khởi tạo sản phẩm: localStorage không khả dụng"
    );
    return false;
  }

  let products = getData("products", []);

  if (!products || products.length === 0) {
    console.warn(
      "⚠️ LocalStorage trống! Đang khởi tạo 200 sản phẩm (từ mockData)..."
    );

    const normalizedProducts = initialProducts.map((p) => {
      const profitMargin = p.profitMargin || 0.3;
      const costPrice = p.costPrice || p.price / (1 + profitMargin);
      const correctPath = p.imgSrc.replace("./assets/", "../assets/");

      return {
        ...p,
        imgSrc: correctPath,
        img: correctPath,
        costPrice: costPrice,
        profitMargin: profitMargin,
      };
    });

    const success = setData("products", normalizedProducts);

    if (success) {
      console.log(
        "✅ Đã khởi tạo",
        normalizedProducts.length,
        "sản phẩm vào localStorage!"
      );
      return true;
    } else {
      console.error("❌ Không thể lưu sản phẩm vào localStorage");
      return false;
    }
  } else {
    console.log(
      "✅ LocalStorage đã có",
      products.length,
      "sản phẩm. Bỏ qua khởi tạo."
    );
    return true;
  }
}

/**
 * Khởi tạo danh sách đơn hàng trong localStorage
 */
function initializeOrders() {
  if (!isLocalStorageAvailable()) {
    console.error(
      "❌ Không thể khởi tạo đơn hàng: localStorage không khả dụng"
    );
    return false;
  }

  let orders = getData("orders", []);

  if (!orders || orders.length === 0) {
    console.warn(
      "⚠️ LocalStorage không có đơn hàng! Đang khởi tạo dữ liệu đơn hàng..."
    );

    const success = setData("orders", mockOrders);

    if (success) {
      console.log(
        "✅ Đã khởi tạo",
        mockOrders.length,
        "đơn hàng vào localStorage!"
      );
      return true;
    } else {
      console.error("❌ Không thể lưu đơn hàng vào localStorage");
      return false;
    }
  } else {
    console.log(
      "✅ LocalStorage đã có",
      orders.length,
      "đơn hàng. Bỏ qua khởi tạo."
    );
    return true;
  }
}

/**
 * Khởi tạo danh sách khách hàng
 * Sử dụng hàm saveMockCustomersToStorage chuyên dụng
 */
function initializeCustomers() {
  if (!isLocalStorageAvailable()) {
    console.error(
      "❌ Không thể khởi tạo khách hàng: localStorage không khả dụng"
    );
    return false;
  }

  let existingCustomers = getData("customers", []);

  if (!existingCustomers || existingCustomers.length === 0) {
    console.warn(
      "⚠️ LocalStorage không có khách hàng! Đang khởi tạo từ mockCustomers..."
    );

    // Sử dụng hàm chuyên dụng với xử lý lỗi đầy đủ
    return saveMockCustomersToStorage();
  } else {
    console.log(
      "✅ LocalStorage đã có",
      existingCustomers.length,
      "khách hàng. Đang kiểm tra cập nhật..."
    );

    // Merge dữ liệu mới từ mockCustomers nếu có thay đổi
    const customerMap = new Map(existingCustomers.map((c) => [c.id, c]));

    let hasUpdates = false;

    mockCustomers.forEach((mockCustomer) => {
      if (!mockCustomer || !mockCustomer.id) return;

      const existing = customerMap.get(mockCustomer.id);

      // Nếu khách hàng chưa có hoặc dữ liệu mới hơn, cập nhật
      if (
        !existing ||
        (mockCustomer.lastPurchase &&
          existing.lastPurchase &&
          mockCustomer.lastPurchase > existing.lastPurchase) ||
        mockCustomer.totalSpent !== existing.totalSpent
      ) {
        customerMap.set(mockCustomer.id, mockCustomer);
        hasUpdates = true;
      }
    });

    // Lưu lại nếu có cập nhật
    if (hasUpdates) {
      const updatedCustomers = Array.from(customerMap.values());
      const success = setData("customers", updatedCustomers);
      if (success) {
        console.log("🔄 Đã cập nhật dữ liệu khách hàng mới!");
        return true;
      } else {
        console.error("❌ Không thể cập nhật khách hàng");
        return false;
      }
    } else {
      console.log("✨ Dữ liệu khách hàng đã là mới nhất!");
      return true;
    }
  }
}

/**
 * Khởi tạo thống kê đơn hàng
 */
function initializeOrderStats() {
  if (!isLocalStorageAvailable()) {
    console.error(
      "❌ Không thể khởi tạo thống kê: localStorage không khả dụng"
    );
    return false;
  }

  let stats = getData("orderStats", null);

  if (!stats) {
    console.warn("⚠️ Đang tính toán thống kê đơn hàng...");

    const orders = getData("orders", []) || mockOrders;

    if (!orders || orders.length === 0) {
      console.warn("⚠️ Không có đơn hàng để tính thống kê");
      return false;
    }

    const statistics = {
      totalOrders: orders.length,
      totalRevenue: orders.reduce(
        (sum, order) => sum + (order.totalAmount || 0),
        0
      ),
      completedOrders: orders.filter((o) => o.status === "Đã giao").length,
      processingOrders: orders.filter((o) => o.status === "Đang xử lý").length,
      shippingOrders: orders.filter((o) => o.status === "Đang giao").length,
      avgOrderValue: 0,
      lastUpdated: new Date().toISOString(),
    };

    statistics.avgOrderValue =
      statistics.totalOrders > 0
        ? statistics.totalRevenue / statistics.totalOrders
        : 0;

    const success = setData("orderStats", statistics);

    if (success) {
      console.log("✅ Đã khởi tạo thống kê đơn hàng vào localStorage!");
      return true;
    } else {
      console.error("❌ Không thể lưu thống kê vào localStorage");
      return false;
    }
  } else {
    console.log("✅ LocalStorage đã có thống kê đơn hàng. Bỏ qua khởi tạo.");
    return true;
  }
}

/**
 * Xóa toàn bộ dữ liệu và khởi tạo lại từ đầu
 */
function resetAllData() {
  console.warn("🔄 Đang xóa toàn bộ dữ liệu và khởi tạo lại...");

  try {
    localStorage.removeItem("products");
    localStorage.removeItem("orders");
    localStorage.removeItem("customers");
    localStorage.removeItem("orderStats");

    console.log("✅ Đã xóa dữ liệu cũ thành công");

    return initializeAll();
  } catch (error) {
    console.error("❌ Lỗi khi reset dữ liệu:", error);
    return false;
  }
}

/**
 * Hàm chính để khởi tạo toàn bộ dữ liệu ứng dụng
 */
function initializeAll() {
  console.log("🚀 Bắt đầu khởi tạo dữ liệu ứng dụng...");

  if (!isLocalStorageAvailable()) {
    console.error(
      "❌ LocalStorage không khả dụng. Không thể khởi tạo dữ liệu."
    );
    return false;
  }

  const results = {
    products: initializeProducts(),
    orders: initializeOrders(),
    customers: initializeCustomers(),
    stats: initializeOrderStats(),
  };

  const allSuccess = Object.values(results).every((result) => result === true);

  if (allSuccess) {
    console.log("✨ Hoàn tất khởi tạo dữ liệu!");
    return true;
  } else {
    console.warn("⚠️ Một số dữ liệu không khởi tạo thành công:", results);
    return false;
  }
}

// Export các hàm
export {
  initializeProducts,
  initializeOrders,
  initializeCustomers,
  initializeOrderStats,
  initializeAll,
  resetAllData,
  getData,
  setData,
  isLocalStorageAvailable,
  saveMockCustomersToStorage, // Hàm mới: Lưu mockCustomers an toàn
  safeJsonParse, // Hàm helper: Parse JSON an toàn
  safeJsonStringify, // Hàm helper: Stringify JSON an toàn
};

// Tự động chạy khởi tạo
initializeAll();
