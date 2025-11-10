// ================================================================================
// PRODUCTS.JS - QUẢN LÝ HIỂN THỊ VÀ LỌC SẢN PHẨM
// ================================================================================
// File này quản lý toàn bộ logic hiển thị sản phẩm, lọc, phân trang, 
// tìm kiếm và chi tiết sản phẩm trong ứng dụng Single Page Application (SPA)
// ================================================================================

// ================================================================================
// 1. KHỞI TẠO VÀ BIẾN TOÀN CỤC
// ================================================================================
let allProduct = JSON.parse(localStorage.getItem("products")) || [];

// ================================================================================
// 2. NAVIGATION SYSTEM (SPA)
// ================================================================================
/**
 * Hàm điều hướng giữa các view trong SPA
 * @param {string} viewId - ID của view cần hiển thị
 */
window.showView = function (viewId) {
  // Các view yêu cầu đăng nhập
  const protectedViews = ["admin", "profile", "orders"];

  // Kiểm tra nếu view cần đăng nhập
  if (protectedViews.includes(viewId)) {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Bạn cần đăng nhập để truy cập trang này!");
      viewId = "login"; // Chuyển hướng về login
    }
  }

  // Ẩn tất cả view
  document.querySelectorAll(".spa-view").forEach((view) => {
    view.classList.remove("active");
  });

  // Hiển thị view được yêu cầu
  const viewToShow = document.getElementById(viewId);
  if (viewToShow) {
    viewToShow.classList.add("active");
  }

  // Cập nhật navigation active state
  // Chuyển đổi viewId từ "view-products" thành "products"
  const viewName = viewId.replace('view-', '');
  if (window.router && typeof window.router.updateNavActive === "function") {
    window.router.updateNavActive(viewName);
  }

  // Cập nhật URL hash để hỗ trợ điều hướng
  window.location.hash = viewId;
};

// ================================================================================
// 3. HÀM TIỆN ÍCH (UTILITY FUNCTIONS)
// ================================================================================

/**
 * Cuộn mượt lên đầu trang
 */
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/**
 * Lấy tham số từ URL query string
 * @param {string} name - Tên tham số cần lấy
 * @returns {string|null} Giá trị của tham số
 */
function getURLParameter(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

/**
 * Chuyển đổi category code sang tên tiếng Việt
 * @param {string} category - Mã category (vd: "mouse", "keyboard")
 * @returns {string} Tên tiếng Việt của category
 */
function getCategoryName(category) {
  const categoryMap = {
    keyboard: "Bàn phím",
    mouse: "Chuột",
    headphone: "Tai nghe",
    powerbank: "Sạc dự phòng",
  };
  return categoryMap[category] || category;
}

/**
 * Parse khoảng giá từ giá trị checkbox
 * @param {string} rangeValue - Giá trị range (vd: "under500k", "1m-2m")
 * @returns {object} Object chứa min và max price
 */
function parsePriceRange(rangeValue) {
  switch (rangeValue) {
    case "under500k":
      return { min: 0, max: 500000 };
    case "500k-1m":
      return { min: 500000, max: 1000000 };
    case "1m-2m":
      return { min: 1000000, max: 2000000 };
    case "2m-3m":
      return { min: 2000000, max: 3000000 };
    case "over3m":
      return { min: 3000000, max: Infinity };
    default:
      return { min: 0, max: Infinity };
  }
}

// ================================================================================
// 4. HÀM TẠO MÔ TẢ VÀ TÍNH NĂNG MẶC ĐỊNH
// ================================================================================

/**
 * Tạo mô tả mặc định cho sản phẩm dựa trên category
 * @param {object} product - Object sản phẩm
 * @returns {string} Mô tả sản phẩm
 */
function getDefaultDescription(product) {
  const { category, name } = product;
  const descriptions = {
    keyboard: `${name} là bàn phím cơ chất lượng cao với thiết kế hiện đại, mang đến trải nghiệm gõ phím mượt mà và chính xác. Với các phím cơ có độ bền cao và phản hồi nhanh, sản phẩm này phù hợp cho cả công việc và giải trí. Bàn phím được trang bị đèn LED RGB đẹp mắt và nhiều tính năng tiện ích khác.`,
    mouse: `${name} là chuột gaming chuyên nghiệp với độ chính xác cao và thiết kế ergonomic thoải mái. Với cảm biến quang học tiên tiến, chuột mang đến độ nhạy cao và phản hồi nhanh, phù hợp cho cả gaming và công việc hàng ngày. Sản phẩm được làm từ chất liệu cao cấp, bền bỉ theo thời gian.`,
    headphone: `${name} là tai nghe gaming chất lượng cao với âm thanh sống động và rõ ràng. Với công nghệ âm thanh tiên tiến, tai nghe mang đến trải nghiệm âm thanh chân thực, bass mạnh mẽ và khả năng chống ồn tốt. Thiết kế thoải mái, phù hợp cho sử dụng lâu dài.`,
    powerbank: `${name} là sạc dự phòng công suất cao với dung lượng pin lớn, đáp ứng nhu cầu sạc cho nhiều thiết bị. Với công nghệ sạc nhanh và an toàn, sản phẩm giúp bạn luôn có nguồn năng lượng dự phòng khi cần thiết. Thiết kế gọn nhẹ, dễ dàng mang theo mọi nơi.`,
  };
  return (
    descriptions[category] ||
    `${name} là sản phẩm chất lượng cao với thiết kế hiện đại và nhiều tính năng tiện ích.`
  );
}

/**
 * Tạo danh sách tính năng mặc định cho sản phẩm
 * @param {object} product - Object sản phẩm
 * @returns {array} Mảng các tính năng
 */
function getDefaultFeatures(product) {
  const { category } = product;
  const featuresMap = {
    keyboard: [
      "Thiết kế chắc chắn và bền bỉ",
      "Phím cơ có độ bền cao",
      "Phản hồi nhanh và chính xác",
      "Đèn LED RGB đẹp mắt",
      "Tương thích đa nền tảng",
    ],
    mouse: [
      "Cảm biến quang học độ chính xác cao",
      "Thiết kế ergonomic thoải mái",
      "Độ nhạy cao, phản hồi nhanh",
      "Bề mặt chống trượt",
      "Tuổi thọ pin/switch lâu dài",
    ],
    headphone: [
      "Âm thanh sống động và chân thực",
      "Bass mạnh mẽ, treble rõ ràng",
      "Khả năng chống ồn tốt",
      "Thiết kế thoải mái, nhẹ nhàng",
      "Micro tích hợp chất lượng cao",
    ],
    powerbank: [
      "Dung lượng pin lớn, sạc được nhiều lần",
      "Công nghệ sạc nhanh",
      "Bảo vệ an toàn đa lớp",
      "Thiết kế gọn nhẹ, dễ mang theo",
      "Tương thích với nhiều thiết bị",
    ],
  };
  return (
    featuresMap[category] || [
      "Chất lượng cao",
      "Thiết kế hiện đại",
      "Bền bỉ theo thời gian",
      "Giá trị tốt",
      "Hỗ trợ bảo hành đầy đủ",
    ]
  );
}

// ================================================================================
// 5. HÀM CẬP NHẬT BREADCRUMB (Legacy support)
// ================================================================================

/**
 * Cập nhật breadcrumb navigation
 * @param {object} product - Object sản phẩm
 */
function updateBreadcrumb(product) {
  const categoryName = getCategoryName(product.category);
  const breadcrumb = document.querySelector(".breadcrumb");
  if (breadcrumb) {
    breadcrumb.innerHTML = `
      <a href="#">Trang chủ</a> <span class="breadcrumb-sep">&gt;</span> 
      <a href="#">Sản phẩm</a> <span class="breadcrumb-sep">&gt;</span> 
      <a href="#">${categoryName}</a> <span class="breadcrumb-sep">&gt;</span> 
      <span>${product.name}</span>
    `;
  }
}

// ================================================================================
// 6. BROADCAST CHANNEL - ĐỒNG BỘ DỮ LIỆU REALTIME
// ================================================================================

/**
 * Lắng nghe cập nhật sản phẩm từ Admin panel qua BroadcastChannel
 */
const channel = new BroadcastChannel("data_update");
channel.onmessage = (event) => {
  if (event.data.type === "products_updated") {
    console.log("Phía User: Phát hiện cập nhật sản phẩm từ Admin! Đang tải lại...");

    // Lấy dữ liệu sản phẩm mới nhất từ localStorage
    allProduct = JSON.parse(localStorage.getItem("products")) || [];

    // Vẽ lại danh sách sản phẩm
    if (typeof filterProductsFromActiveCategories === "function") {
      filterProductsFromActiveCategories();
    }

    // Tải lại trang chi tiết nếu đang xem
    const detailView = document.getElementById("view-product-details");
    if (detailView && detailView.classList.contains("active")) {
      const productNameEl = detailView.querySelector("#product-detail-name");
      if (productNameEl) {
        const productName = productNameEl.textContent;
        const currentProduct = allProduct.find((p) => p.name === productName);
        if (currentProduct) {
          displayProductDetails(currentProduct.id);
        }
      }
    }
  }
};

// ================================================================================
// 7. LOGIC CHÍNH - DOMCONTENTLOADED
// ================================================================================

document.addEventListener("DOMContentLoaded", function () {
  // ============================================================================
  // 7.1. KHỞI TẠO BIẾN STATE
  // ============================================================================
  const productsPerPage = 12;
  let currentPage = 1;
  let currentCategory = "all";
  let currentPriceFilters = [];
  let currentSort = "default";
  let currentSearchQuery = "";
  let totalPages = 1;

  // ============================================================================
  // 7.2. LẤY CÁC PHẦN TỬ DOM
  // ============================================================================
  const productsList = document.getElementById("product-list-container");
  const paginationContainer = document.getElementById("pagination");
  const productTemplate = document.getElementById("product-template");
  const categoryLinks = document.querySelectorAll(
    "#category-filters .products__category__items--details, #category-filters .products-category__items--details"
  );
  const priceCheckboxes = document.querySelectorAll(
    ".form__budget__checkbox input[type='checkbox']"
  );
  const sortSelect = document.getElementById("sort-select");
  const resetButton = document.getElementById("reset-filters");
  const titleName = document.querySelector(".title__left__name");
  const titlePath = document.querySelector(".title__left__path--highlight");
  const paginationLinksContainer = document.getElementById("pagination-links");
  const prevButton = document.getElementById("pagination-prev");
  const nextButton = document.getElementById("pagination-next");
  const searchInput = document.getElementById("search-input");
  const searchBtn = document.getElementById("search-btn");

  // ============================================================================
  // 7.3. HÀM CẬP NHẬT TIÊU ĐỀ TRANG
  // ============================================================================
  
  /**
   * Cập nhật tiêu đề trang theo category
   * @param {string} category - Mã category
   */
  function updateTitle(category = "all") {
    // Nếu đang ở chế độ tìm kiếm, không cập nhật lại title
    if (currentSearchQuery.trim() !== "") {
      return;
    }

    const categoryNames = {
      all: "Tất cả sản phẩm",
      mouse: "Chuột",
      keyboard: "Bàn phím",
      headphone: "Tai nghe",
      powerbank: "Sạc dự phòng",
    };

    const name = categoryNames[category] || "Tất cả sản phẩm";

    if (titleName) titleName.textContent = name;
    if (titlePath) titlePath.textContent = name;
  }

  // ============================================================================
  // 7.4. HÀM HIỂN THỊ DANH SÁCH SẢN PHẨM
  // ============================================================================
  
  /**
   * Hiển thị danh sách sản phẩm với các filter đã chọn
   * @param {array} selectedCategories - Mảng các category được chọn
   */
  function displayProducts(selectedCategories) {
    let filteredProduct = [...allProduct];

    // LỌC THEO TÌM KIẾM (ưu tiên cao nhất)
    if (currentSearchQuery.trim() !== "") {
      const query = currentSearchQuery.toLowerCase().trim();
      filteredProduct = filteredProduct.filter((product) => {
        return product.name.toLowerCase().includes(query);
      });
    }

    // LỌC THEO DANH MỤC
    if (!selectedCategories.includes("all")) {
      filteredProduct = filteredProduct.filter((product) => {
        return selectedCategories.includes(product.category);
      });
    }

    // LỌC THEO GIÁ
    if (currentPriceFilters.length > 0 && !currentPriceFilters.includes("all")) {
      filteredProduct = filteredProduct.filter((p) => {
        return currentPriceFilters.some((rangeValue) => {
          const range = parsePriceRange(rangeValue);
          return p.price >= range.min && p.price <= range.max;
        });
      });
    }

    // SẮP XẾP
    switch (currentSort) {
      case "price-asc":
        filteredProduct.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        filteredProduct.sort((a, b) => b.price - a.price);
        break;
      case "default":
        filteredProduct.sort((a, b) => a.id - b.id);
        break;
    }

    // PHÂN TRANG - đảm bảo currentPage nằm trong khoảng hợp lệ
    const computedTotalPages = Math.ceil(filteredProduct.length / productsPerPage) || 0;
    if (computedTotalPages === 0) {
      currentPage = 1;
    } else if (currentPage > computedTotalPages) {
      currentPage = computedTotalPages;
    } else if (currentPage < 1) {
      currentPage = 1;
    }

    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const productsForThisPage = filteredProduct.slice(startIndex, endIndex);

    // CẬP NHẬT HEADER HIỂN THỊ SỐ LƯỢNG
    const resultsHeader = document.querySelector(".products__list__header h3");
    if (resultsHeader) {
      const displayStart = filteredProduct.length > 0 ? startIndex + 1 : 0;
      const displayEnd = Math.min(endIndex, filteredProduct.length);
      resultsHeader.textContent = `Kết quả tìm thấy: ${displayStart}-${displayEnd} trong ${filteredProduct.length} sản phẩm`;
    }

    // HIỂN THỊ DANH SÁCH SẢN PHẨM
    const existingItems = productsList.querySelectorAll(".products__list__item");
    // Xóa các item cũ
    existingItems.forEach((item) => item.remove());

    productsForThisPage.forEach((product) => {
      const clone = productTemplate.content.cloneNode(true);

      // Lưu product id vào data attribute
      clone.querySelector(".product-link").setAttribute("data-product-id", product.id);
      clone.querySelector(".product-link").href = "#";
      clone.querySelector("img").src = product.imgSrc;
      clone.querySelector("img").alt = product.name;
      clone.querySelector(".products__list__item--name").textContent = product.name;
      clone.querySelector(".products__list__item--price").textContent = product.currentPrice;

      // Ẩn hiện các phần tử tùy chọn
      const installmentSpan = clone.querySelector(".products__list__item--installment");
      installmentSpan.style.display = "inline-block";

      const originalPriceSpan = clone.querySelector(".products__list__item--discount1");
      product.orginalPrice
        ? (originalPriceSpan.textContent = product.orginalPrice)
        : (originalPriceSpan.style.display = "none");

      const discountPercentSpan = clone.querySelector(".products__list__item--discount2");
      product.discountPercent
        ? (discountPercentSpan.textContent = product.discountPercent)
        : (discountPercentSpan.style.display = "none");

      const priceDiscountTextSpan = clone.querySelector(".products__list__item--priceDiscount");
      product.priceDiscountText
        ? (priceDiscountTextSpan.textContent = product.priceDiscountText)
        : (priceDiscountTextSpan.style.display = "none");

      // Gắn sự kiện "Thêm vào giỏ" cho mỗi item
      const cartBtn = clone.querySelector(".products__list__item--img__cart");
      if (cartBtn) {
        cartBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          try {
            // product ở đây là sản phẩm hiện tại trong vòng lặp
            const productName = product.name;
            const priceText = product.currentPrice; // lấy trung gian, cần được xử lý chuyển đổi ở dưới
            const price = parseInt(String(priceText).replace(/[^\d]/g, "")) || 0; // Chuyển đổi priceText thành String nếu không phải String, và .replace(/[^\d]/g, "")) tìm và thay thế kí tự không thuộc chữ số = chuỗi rỗng, vd: 1000đ = 1000
            const image = product.imgSrc;
            if (typeof addToCart === "function") {
              addToCart(productName, price, image, 1);
            }
          } catch (err) {
            console.error("Error adding to cart:", err);
          }
        });
      }
      // Thêm product đó vào cuối productsList
      productsList.appendChild(clone);
    });

    // HIỂN THỊ PHÂN TRANG
    displayPagination(filteredProduct.length);
  }

  // ============================================================================
  // 7.5. HÀM LỌC SẢN PHẨM THEO CATEGORY ĐANG ACTIVE
  // ============================================================================
  
  /**
   * Lọc và hiển thị sản phẩm dựa trên các category đang được chọn
   */
  // Hàm này sẽ được gọi khi cần thiết, nó là 1 hàm độc lập
  function filterProductsFromActiveCategories() {
    const activeCategories = [];
    const activeLinks = document.querySelectorAll(".products__category__items--details.active");

    activeLinks.forEach((link) => {
      activeCategories.push(link.getAttribute("data-category"));
    });

    const allCategoriesLink = document.querySelector('[data-category="all"]');
    if (activeCategories.length === 0 && allCategoriesLink) {
      allCategoriesLink.classList.add("active");
      activeCategories.push("all");
    }

    displayProducts(activeCategories);
  }

  // ============================================================================
  // 7.6. HÀM HIỂN THỊ PHÂN TRANG
  // ============================================================================
  
  /**
   * Hiển thị pagination với ellipsis cho nhiều trang
   * @param {number} totalFilteredProducts - Tổng số sản phẩm sau khi filter
   */
  function displayPagination(totalFilteredProducts) {
    if (!paginationLinksContainer) return;

    // Xóa các nút số trang cũ
    paginationLinksContainer.innerHTML = "";

    // Tính toán tổng số trang
    totalPages = Math.ceil(totalFilteredProducts / productsPerPage) || 0;

    // Nếu không có trang nào thì disable prev/next và thoát
    if (totalPages === 0) {
      if (prevButton) prevButton.classList.add("disabled");
      if (nextButton) nextButton.classList.add("disabled");
      return;
    }

    // Tạo các nút số trang mới với Ellipsis
    const maxPagesToShow = 5;
    const pages = [];

    if (totalPages <= maxPagesToShow + 2) {
      // Nếu tổng số trang ít, hiển thị tất cả
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Luôn hiển thị trang đầu
      pages.push(1);

      // Tính toán các trang ở giữa
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);

      // Điều chỉnh nếu currentPage ở gần đầu hoặc cuối
      // nếu gần đầu thì cho nhiều nút ở đầu chút, nếu gần cuối cũng vậy
      if (currentPage <= 3) {
        endPage = Math.min(4, totalPages - 1);
      } else if (currentPage >= totalPages - 2) {
        startPage = Math.max(totalPages - 3, 2);
      }

      // Thêm ellipsis đầu nếu cần
      if  (startPage > 2) {
        pages.push("...");
      }

      // Thêm các trang ở giữa
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      // Thêm ellipsis cuối nếu cần
      if (endPage < totalPages - 1) {
        pages.push("...");
      }

      // Luôn hiển thị trang cuối
      pages.push(totalPages);
    }

    // Render các nút trang
    pages.forEach((page) => {
      const pageLinkWrapper = document.createElement("div");
      pageLinkWrapper.className = "products__pagination__cover__links__link__link";

      if (page === "...") {
        // Tạo ellipsis (không click được)
        pageLinkWrapper.innerHTML = `<span>...</span>`;
        pageLinkWrapper.style.cursor = "default";
        pageLinkWrapper.classList.add("ellipsis");
      } else {
        // Tạo nút số trang bình thường
        pageLinkWrapper.style.cursor = "pointer";
        if (page === currentPage) pageLinkWrapper.classList.add("active");

        pageLinkWrapper.innerHTML = `<span>${page}</span>`;
        pageLinkWrapper.addEventListener("click", () => {
          currentPage = page;
          filterProductsFromActiveCategories();
          scrollToTop();
        });
      }

      paginationLinksContainer.appendChild(pageLinkWrapper);
    });
    // thoát khỏi vòng lặp từng page rồi
    // Cập nhật trạng thái cho các nút mũi tên
    if (prevButton) {
      if (currentPage === 1) prevButton.classList.add("disabled");
      else prevButton.classList.remove("disabled");
    }
    if (nextButton) {
      if (currentPage === totalPages) nextButton.classList.add("disabled");
      else nextButton.classList.remove("disabled");
    }
  }

  // ============================================================================
  // 7.7. XỬ LÝ SỰ KIỆN CHO DANH MỤC
  // ============================================================================
  
  const categoryLink = document.querySelectorAll(".products__category__items--details");
  const allCategoriesLink = document.querySelector('[data-category="all"]');

  // Mặc định kích hoạt "Tất cả" khi tải trang
  // Độc lập luôn, nó chỉ trong function DOM gì kia thôi
  if (allCategoriesLink) {
    allCategoriesLink.classList.add("active");
  }

  // Gắn sự kiện click cho từng link DANH MỤC
  categoryLink.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      const clickedLink = e.currentTarget;
      const isAllCategory = clickedLink === allCategoriesLink;

      if (isAllCategory) {
        // Nếu click vào "Tất cả"
        clickedLink.classList.add("active");
        // Bỏ chọn tất cả các danh mục khác
        categoryLink.forEach((otherLink) => {
          if (otherLink !== allCategoriesLink) {
            otherLink.classList.remove("active");
          }
        });
      } else {
        // Click vào mục khác (Chuột, Bàn phím...)
        if (allCategoriesLink) {
          allCategoriesLink.classList.remove("active");
        }
        clickedLink.classList.toggle("active");
      }

      // Xóa trạng thái focus, nếu đang focus thì nhấn vào nó sẽ biến mất luôn, bây giờ nó đang duyệt qua từng danh mục 
      if(document.activeElement === clickedLink) {
        clickedLink.blur();
      }

      // Reset tìm kiếm khi click vào category
      currentSearchQuery = "";
      if (searchInput) searchInput.value = "";

      // Gọi hàm lọc sản phẩm
      filterProductsFromActiveCategories();
    });
  });

  // XỬ LÝ URL PARAMETER - Kiểm tra category từ URL
  const urlParams = new URLSearchParams(window.location.search);
  const categoryFromURL = urlParams.get("category");

  if (categoryFromURL) {
    categoryLinks.forEach((link) => {
      const linkCategory = link.getAttribute("data-category");
      if (linkCategory === categoryFromURL) {
        categoryLinks.forEach((l) => l.classList.remove("active"));
        link.classList.add("active");
      }
    });
  }

  // Hiển thị sản phẩm lần đầu
  filterProductsFromActiveCategories();

  // ============================================================================
  // 7.8. XỬ LÝ SỰ KIỆN CHO CÁC CHECKBOX MỨC GIÁ
  // ============================================================================
  
  priceCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      currentPriceFilters = [];
      priceCheckboxes.forEach((box) => {
        if (box.checked) {
          currentPriceFilters.push(box.value);
        }
      });

      // Logic cho checkbox "Tất cả"
      if (currentPriceFilters.includes("all")) {
        currentPriceFilters = ["all"];
        priceCheckboxes.forEach((box) => {
          if (box.value !== "all") box.checked = false;
        });
      } else {
        document.getElementById("all").checked = false;
      }

      currentPage = 1;
      filterProductsFromActiveCategories();
    });
  });

  // ============================================================================
  // 7.9. XỬ LÝ SỰ KIỆN CHO DROPDOWN SẮP XẾP
  // ============================================================================
  
  sortSelect.addEventListener("change", (e) => {
    currentSort = e.target.value;
    currentPage = 1;
    filterProductsFromActiveCategories();
    scrollToTop();
  });

  // ============================================================================
  // 7.10. XỬ LÝ SỰ KIỆN CHO NÚT ĐẶT LẠI
  // ============================================================================
  
  resetButton.addEventListener("click", (e) => {
    e.preventDefault();

    // Reset state
    currentPage = 1;
    currentCategory = "all";
    currentPriceFilters = ["all"];
    currentSort = "default";
    currentSearchQuery = "";

    // Reset UI
    categoryLinks.forEach((l) => l.classList.remove("active"));
    document.querySelector('[data-category="all"]').classList.add("active");

    priceCheckboxes.forEach((box) => (box.checked = false));
    document.getElementById("all").checked = true;

    sortSelect.value = "default";

    if (searchInput) searchInput.value = "";

    updateTitle("all");
    filterProductsFromActiveCategories();
    scrollToTop();
  });

  // ============================================================================
  // 7.11. XỬ LÝ SỰ KIỆN CHO NÚT PHÂN TRANG
  // ============================================================================
  
  // Sự kiện cho nút Previous
  prevButton.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      filterProductsFromActiveCategories();
      scrollToTop();
    }
  });

  // Sự kiện cho nút Next
  nextButton.addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage++;
      filterProductsFromActiveCategories();
      scrollToTop();
    }
  });

  // Cho phép click cả vào vùng bao quanh mũi tên
  const prevContainer = prevButton ? prevButton.closest(".products__pagination__cover__arr-cover") : null;
  if (prevContainer) {
    prevContainer.addEventListener("click", () => {
      if (currentPage > 1) {
        prevButton.click();
      }
    });
  }

  const nextContainer = nextButton ? nextButton.closest(".products__pagination__cover__arr-cover") : null;
  if (nextContainer) {
    nextContainer.addEventListener("click", () => {
      if (currentPage < totalPages) {
        nextButton.click();
      }
    });
  }

  // ============================================================================
  // 7.12. XỬ LÝ TÌM KIẾM
  // ============================================================================
  
  /**
   * Xử lý tìm kiếm sản phẩm
   */
  function handleSearch() {
    const query = searchInput ? searchInput.value.trim() : "";

    if (query === "") {
      alert("Vui lòng nhập từ khóa tìm kiếm!");
      return;
    }

    // Chuyển đến trang sản phẩm
    showView("view-products");

    // Cập nhật state
    currentSearchQuery = query;
    currentPage = 1;
    currentCategory = "all";

    // Reset UI category
    categoryLinks.forEach((l) => l.classList.remove("active"));
    const allCategoryLink = document.querySelector('[data-category="all"]');
    if (allCategoryLink) allCategoryLink.classList.add("active");

    // Cập nhật tiêu đề
    if (titleName) titleName.textContent = "Kết quả tìm kiếm";
    if (titlePath) titlePath.textContent = `"${query}"`;

    // Hiển thị kết quả
    filterProductsFromActiveCategories();
    scrollToTop();
  }

  // Event listener cho nút search
  if (searchBtn) {
    searchBtn.addEventListener("click", (e) => {
      e.preventDefault();
      handleSearch();
    });
  }

  // Event listener cho phím Enter trong ô search
  if (searchInput) {
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSearch();
      }
    });
  }

  // ============================================================================
  // 7.13. XỬ LÝ CLICK VÀO CATEGORY TILES TRÊN TRANG CHỦ
  // ============================================================================
  
  document.addEventListener("click", (e) => {
    const tile = e.target.closest('.category-feature-item[data-view="products"]');
    if (!tile) return;

    e.preventDefault();

    const category = tile.dataset.category || "all";

    showView("view-products");

    currentCategory = category;
    currentPage = 1;
    currentSearchQuery = "";

    categoryLinks.forEach((l) => l.classList.remove("active"));
    const sidebarLink = document.querySelector(`#category-filters [data-category="${category}"]`);
    if (sidebarLink) sidebarLink.classList.add("active");

    if (searchInput) searchInput.value = "";

    updateTitle(category);
    filterProductsFromActiveCategories();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // ============================================================================
  // 7.14. XỬ LÝ ĐIỀU HƯỚNG SPA (SINGLE PAGE APPLICATION)
  // ============================================================================
  
  document.addEventListener("click", (e) => {
    // Bỏ qua nếu click vào nút thêm giỏ hàng
    if (e.target.closest(".products__list__item--img__cart, .product-hottest-item--img__cart")) {
      return;
    }

    // Bỏ qua khi click pagination
    if (e.target.closest("#pagination")) {
      return;
    }

    const link = e.target.closest("a");
    const trigger = e.target.closest("[data-view]");
    if (!link && !trigger) {
      return;
    }

    // XỬ LÝ LINK SẢN PHẨM
    if (link && link.classList.contains("product-link")) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      const productId = link.getAttribute("data-product-id");
      if (productId && typeof allProduct !== "undefined") {
        displayProductDetails(parseInt(productId));
      }
      return false;
    }

    const source = link || trigger;
    if (!source.dataset.view) {
      return;
    }

    e.preventDefault();

    const viewName = source.dataset.view;
    const category = source.dataset.category;

    showView(`view-${viewName}`);

    // XỬ LÝ VIEW PRODUCT-DETAILS
    if (viewName === "product-details") {
      const productId = source.getAttribute("data-product-id");
      if (productId && typeof allProduct !== "undefined") {
        displayProductDetails(parseInt(productId));
      }
      return;
    }

    // XỬ LÝ VIEW PRODUCTS
    if (viewName === "products") {
      if (category) {
        currentCategory = category;
        currentPage = 1;
        currentSearchQuery = "";

        categoryLinks.forEach((l) => l.classList.remove("active"));
        const activeCategoryLink = document.querySelector(`#category-filters [data-category="${category}"]`);
        if (activeCategoryLink) {
          activeCategoryLink.classList.add("active");
        }

        if (searchInput) searchInput.value = "";

        if (titleName) titleName.textContent = "Tất cả sản phẩm";
        if (titlePath) titlePath.textContent = "Tất cả sản phẩm";

        filterProductsFromActiveCategories();
        scrollToTop();
      } else {
        resetButton.click();
      }
    }
  });

  // ============================================================================
  // 7.15. KHỞI TẠO MẶC ĐỊNH
  // ============================================================================
  
  // Đảm bảo checkbox "Tất cả" luôn được chọn mặc định
  const allPriceCheckbox = document.getElementById("all");
  if (allPriceCheckbox) {
    allPriceCheckbox.checked = true;
    currentPriceFilters = ["all"];
  }

  // Hiển thị trang chủ khi tải lần đầu
  showView("view-home");
});

// ================================================================================
// 8. CHI TIẾT SẢN PHẨM
// ================================================================================

/**
 * Hiển thị chi tiết sản phẩm trong SPA
 * @param {number} productId - ID của sản phẩm cần hiển thị
 */
function displayProductDetails(productId) {
  if (typeof allProduct === "undefined") {
    return;
  }

  const product = allProduct.find((p) => p.id === productId);
  if (!product) {
    console.error("❌ Không tìm thấy sản phẩm với ID:", productId);
    return;
  }

  // Kiểm tra tồn kho
  const products = JSON.parse(localStorage.getItem("products")) || [];
  const productInStock = products.find((p) => p.id === product.id);
  const stock = productInStock ? productInStock.quantity : 0;

  const detailView = document.getElementById("view-product-details");
  if (!detailView) {
    return;
  }

  // Cập nhật thông tin sản phẩm
  const img = detailView.querySelector("#product-detail-img");
  const name = detailView.querySelector("#product-detail-name");
  const currentPrice = detailView.querySelector("#product-detail-current-price");
  const oldPrice = detailView.querySelector("#product-detail-old-price");
  const sale = detailView.querySelector("#product-detail-sale");
  const description = detailView.querySelector("#product-detail-description");
  const featuresList = detailView.querySelector("#product-detail-features");
  const breadcrumbCategory = detailView.querySelector("#breadcrumb-category");
  const breadcrumbProductName = detailView.querySelector("#breadcrumb-product-name");

  if (img) {
    img.src = product.imgSrc;
    img.alt = product.name;
  }
  if (name) name.textContent = product.name;
  if (currentPrice) currentPrice.textContent = product.currentPrice;

  if (oldPrice) {
    if (product.orginalPrice) {
      oldPrice.textContent = product.orginalPrice;
      oldPrice.style.display = "inline";
    } else {
      oldPrice.style.display = "none";
    }
  }

  if (sale) {
    if (product.discountPercent) {
      sale.textContent = product.discountPercent;
      sale.style.display = "inline";
    } else {
      sale.style.display = "none";
    }
  }

  // Cập nhật mô tả
  if (description) {
    description.textContent = getDefaultDescription(product);
  }

  // Cập nhật tính năng
  if (featuresList) {
    const features = getDefaultFeatures(product);
    featuresList.innerHTML = features
      .map((feature) => `<li><i class="ri-check-line"></i>${feature}</li>`)
      .join("");
  }

  // Thêm thông tin tồn kho
  const stockHTML = `
    <p class="stock-info" style="color: ${stock > 10 ? "#4ade80" : "#ef4444"};">
      📦 Còn lại: <strong>${stock}</strong> sản phẩm
      ${stock <= 10 ? " ⚠️ SẮP HẾT HÀNG!" : ""}
    </p>
  `;

  const productInfo = detailView.querySelector(".products__show-right-info");
  if (productInfo) {
    // Xóa thông tin tồn kho cũ
    const oldStockInfo = productInfo.querySelector(".stock-info");
    if (oldStockInfo) {
      oldStockInfo.remove();
    }
    productInfo.insertAdjacentHTML("beforeend", stockHTML);
  }

  // Ẩn breadcrumb "Tất cả sản phẩm"
  if (breadcrumbCategory) {
    breadcrumbCategory.innerHTML = ``;
  }
  if (breadcrumbProductName) {
    breadcrumbProductName.textContent = product.name;
  }

  // Cập nhật title
  document.title = product.name + " - Xtray";

  // Hiển thị view
  if (typeof showView === "function") {
    showView("view-product-details");
  } else if (typeof window.showView === "function") {
    window.showView("view-product-details");
  } else {
    // Fallback
    document.querySelectorAll(".spa-view").forEach((view) => {
      view.classList.remove("active");
    });
    const viewToShow = document.getElementById("view-product-details");
    if (viewToShow) {
      viewToShow.classList.add("active");
    }
  }

  // Cuộn lên đầu trang
  window.scrollTo({ top: 0, behavior: "smooth" });

  // Khởi tạo các controls
  setupQuantityControls();
  setupAddToCartButton(product);
}

// ================================================================================
// 9. ĐIỀU KHIỂN SỐ LƯỢNG SẢN PHẨM
// ================================================================================

/**
 * Thiết lập các nút tăng/giảm số lượng sản phẩm
 */
function setupQuantityControls() {
  const quantityInput = document.getElementById("product-quantity");
  const decreaseBtn = document.querySelector(".products__show-right-buy-in");
  const increaseBtn = document.querySelector(".products__show-right-buy-de");

  if (!quantityInput || !decreaseBtn || !increaseBtn) {
    return;
  }

  // Reset số lượng về 1
  quantityInput.value = "1";

  // Xóa event listeners cũ
  const newDecreaseBtn = decreaseBtn.cloneNode(true);
  const newIncreaseBtn = increaseBtn.cloneNode(true);
  decreaseBtn.parentNode.replaceChild(newDecreaseBtn, decreaseBtn);
  increaseBtn.parentNode.replaceChild(newIncreaseBtn, increaseBtn);

  const decrease = document.querySelector(".products__show-right-buy-in");
  const increase = document.querySelector(".products__show-right-buy-de");

  /**
   * Cập nhật số lượng sản phẩm
   * @param {number} newValue - Giá trị số lượng mới
   * @returns {number} Số lượng sau khi validate
   */
  function updateQuantity(newValue) {
    let quantity = parseInt(newValue) || 1;
    if (quantity < 1) {
      quantity = 1;
    }
    quantityInput.value = quantity;
    return quantity;
  }

  // Xử lý khi nhấn nút giảm (-)
  decrease.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    const currentValue = parseInt(quantityInput.value) || 1;
    updateQuantity(currentValue - 1);
  });

  // Xử lý khi nhấn nút tăng (+)
  increase.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    const currentValue = parseInt(quantityInput.value) || 1;
    updateQuantity(currentValue + 1);
  });

  // Xử lý khi người dùng nhập trực tiếp
  quantityInput.addEventListener("change", function () {
    updateQuantity(this.value);
  });

  // Xử lý realtime validation
  quantityInput.addEventListener("input", function () {
    this.value = this.value.replace(/[^\d]/g, "");
  });

  // Xử lý phím Enter
  quantityInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      updateQuantity(this.value);
      this.blur();
    }
  });
}

// ================================================================================
// 10. NÚT THÊM VÀO GIỎ HÀNG
// ================================================================================

/**
 * Thiết lập nút "Thêm vào giỏ" cho trang chi tiết sản phẩm
 * @param {object} product - Object sản phẩm
 */
function setupAddToCartButton(product) {
  const addToCartBtn = document.getElementById("product-add-to-cart");

  if (!addToCartBtn) {
    console.warn("Add to cart button not found");
    return;
  }

  // Xóa event listener cũ
  const newBtn = addToCartBtn.cloneNode(true);
  addToCartBtn.parentNode.replaceChild(newBtn, addToCartBtn);

  const btn = document.getElementById("product-add-to-cart");

  // Thêm event listener mới
  btn.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();

    const quantityInput = document.getElementById("product-quantity");
    const quantity = parseInt(quantityInput?.value) || 1;

    const productName = product.name;
    const priceText = product.currentPrice;
    const price = parseInt(priceText.replace(/[^\d]/g, ""));
    const image = product.imgSrc;

    if (typeof addToCart === "function") {
      addToCart(productName, price, image, quantity);
    } else {
      console.error("addToCart function not found!");
    }
  });

  // Thiết lập nút "Mua ngay"
  setupBuyNowButton(product);
}

// ================================================================================
// 11. NÚT MUA NGAY
// ================================================================================

/**
 * Thiết lập nút "Mua ngay" để chuyển thẳng đến trang thanh toán
 * @param {object} product - Object sản phẩm
 */
function setupBuyNowButton(product) {
  const buyNowBtn = document.querySelector(".products__show-right-buy-buy");

  if (!buyNowBtn) {
    console.warn("Buy now button not found");
    return;
  }

  // Xóa event listener cũ
  const newBtn = buyNowBtn.cloneNode(true);
  buyNowBtn.parentNode.replaceChild(newBtn, buyNowBtn);

  // Thêm event listener mới
  newBtn.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();

    const quantityInput = document.getElementById("product-quantity");
    const quantity = parseInt(quantityInput?.value) || 1;

    // Kiểm tra đăng nhập
    const user = JSON.parse(localStorage.getItem("loggedInUser"));

    if (!user) {
      // CHƯA ĐĂNG NHẬP
      const pendingBuyNow = {
        name: product.name,
        price: parseInt(product.currentPrice.replace(/[^\d]/g, "")),
        image: product.imgSrc,
        quantity: quantity,
        action: "buyNow",
      };

      localStorage.setItem("pendingBuyNow", JSON.stringify(pendingBuyNow));

      alert("Vui lòng đăng nhập để mua sản phẩm!");

      if (window.router && typeof window.router.openModal === "function") {
        window.router.openModal("login-modal");
      }
    } else {
      // ĐÃ ĐĂNG NHẬP
      const price = parseInt(product.currentPrice.replace(/[^\d]/g, ""));

      const newCartItem = {
        name: product.name,
        price: price,
        image: product.imgSrc,
        quantity: quantity,
      };

      console.log("Buy Now - Adding to cart:", newCartItem);

      let currentCart = JSON.parse(localStorage.getItem("cart")) || [];

      const existingItemIndex = currentCart.findIndex((item) => item.name === newCartItem.name);

      if (existingItemIndex !== -1) {
        currentCart[existingItemIndex].quantity += newCartItem.quantity;
        console.log("Product already in cart, increased quantity");
      } else {
        currentCart.push(newCartItem);
        console.log("New product added to cart");
      }

      // Cập nhật giỏ hàng
      if (typeof window.setCart === "function") {
        window.setCart(currentCart);
        console.log("Cart updated via window.setCart");
      } else {
        window.cart = currentCart;
        localStorage.setItem("cart", JSON.stringify(window.cart));
        console.log("Cart updated via fallback");
      }

      console.log("Cart in localStorage:", localStorage.getItem("cart"));

      // Mở modal giỏ hàng
      if (window.router && typeof window.router.openModal === "function") {
        window.router.openModal("cart-modal");
        setTimeout(() => {
          if (typeof renderCart === "function") {
            renderCart();
          }
          if (typeof renderCheckout === "function") {
            renderCheckout();
          }
          if (typeof showPage === "function") {
            showPage("thanhtoan-page");
          }
        }, 100);
      }
    }
  });
}

// ================================================================================
// 12. LEGACY FUNCTIONS (Hỗ trợ tương thích ngược)
// ================================================================================

/**
 * Hàm hiển thị sản phẩm (Legacy - cho trang riêng biệt)
 * @param {object} product - Object sản phẩm
 */
function displayProduct(product) {
  const img = document.querySelector("#product-detail-img");
  const name = document.querySelector("#product-detail-name");
  const currentPrice = document.querySelector("#product-detail-current-price");
  const oldPrice = document.querySelector("#product-detail-old-price");
  const salePercent = document.querySelector("#product-detail-sale");
  const description = document.querySelector("#product-detail-description");
  const featuresList = document.querySelector("#product-detail-features");

  if (img) {
    img.src = product.imgSrc;
    img.alt = product.name;
  }
  if (name) name.textContent = product.name;
  if (currentPrice) currentPrice.textContent = product.currentPrice;

  if (oldPrice) {
    oldPrice.textContent = product.originalPrice || "";
    oldPrice.style.display = product.originalPrice ? "inline" : "none";
  }

  if (salePercent) {
    salePercent.textContent = product.discountPercent || "";
    salePercent.style.display = product.discountPercent ? "inline" : "none";
  }

  if (description) {
    description.textContent = product.description || getDefaultDescription(product);
  }

  if (featuresList) {
    const features = product.features || getDefaultFeatures(product);
    featuresList.innerHTML = features
      .map((feature) => `<li><i class="ri-check-line"></i>${feature}</li>`)
      .join("");
  }

  updateBreadcrumb(product);
  document.title = product.name + " - Xtray";
}

/**
 * Hàm khởi tạo (Legacy - cho trang riêng biệt)
 */
function init() {
  const productId = getURLParameter("id");
  if (!productId) {
    return;
  }

  if (typeof allProduct === "undefined") {
    return;
  }

  const product = allProduct.find((p) => p.id === parseInt(productId));

  if (!product) {
    alert("Không tìm thấy sản phẩm!");
    return;
  }

  displayProduct(product);
}

// Chạy hàm init khi HTML đã được tải xong (cho trang riêng biệt)
window.addEventListener("DOMContentLoaded", init);

// ================================================================================
// KẾT THÚC FILE PRODUCTS.JS
// ================================================================================
