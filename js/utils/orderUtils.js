// ============================================================================
// ORDER UTILITIES - Xử lý logic chung cho đơn hàng
// ============================================================================

const getData = (key) => JSON.parse(localStorage.getItem(key) || "null");
const setData = (key, val) => localStorage.setItem(key, JSON.stringify(val));

/**
 * Tính tổng tiền đơn hàng từ products hoặc dùng total/totalAmount có sẵn
 * @param {Object} order - Đơn hàng cần tính
 * @returns {number} - Tổng tiền (VNĐ)
 */
export function calculateOrderTotal(order) {
  if (!order) return 0;

  // Ưu tiên dùng total có sẵn
  if (order.total > 0) return order.total;
  if (order.totalAmount > 0) return order.totalAmount;

  // Tính từ products nếu không có total
  const products = Array.isArray(order.products) ? order.products : [];
  return products.reduce(
    (sum, p) => sum + (p.price || 0) * (p.quantity || 0),
    0
  );
}

/**
 * Normalize cấu trúc đơn hàng - Fix products array và total
 * @returns {boolean} - True nếu có thay đổi
 */
export function normalizeOrderStructure() {
  let orders = getData("orders") || [];
  if (orders.length === 0) return false;

  let hasChanges = false;

  orders.forEach((order) => {
    // Fix 1: Ensure products is array
    if (!Array.isArray(order.products)) {
      order.products = [];
      hasChanges = true;
    }

    // Fix 2: Calculate total if missing
    const calculatedTotal = calculateOrderTotal(order);
    if (!order.total && !order.totalAmount) {
      order.total = calculatedTotal;
      hasChanges = true;
    }

    // Fix 3: Sync total and totalAmount
    order.total = order.total || order.totalAmount || calculatedTotal;
    order.totalAmount = order.total;
  });

  if (hasChanges) {
    setData("orders", orders);
    console.log("✅ Normalized orders data");
  }
  return hasChanges;
}

/**
 * Lấy total an toàn - Luôn trả về số hợp lệ
 */
export const getSafeOrderTotal = (order) => calculateOrderTotal(order) || 0;

/**
 * Kiểm tra order có hợp lệ không
 */
export function isValidOrder(order) {
  return (
    order &&
    Array.isArray(order.products) &&
    order.products.length > 0 &&
    calculateOrderTotal(order) > 0
  );
}
