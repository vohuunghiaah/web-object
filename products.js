let allProduct = JSON.parse(localStorage.getItem("products")) || [];
// Khởi tạo dữ liệu sản phẩm trong localStorage nếu cần
// --- 8. NAVIGATION SYSTEM (SPA) - Đặt ở đây để có thể truy cập từ mọi nơi ---
// Hàm để ẩn tất cả các view và hiển thị view được chọn
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

  // Cập nhật URL hash để hỗ trợ điều hướng
  window.location.hash = viewId;
};

// Đợi DOM load xong
document.addEventListener("DOMContentLoaded", function () {
  // -2. Cài đặt và trạng thái -
  const productsPerPage = 12;
  let currentPage = 1;
  let currentCategory = "all";
  let currentPriceFilters = [];
  let currentSort = "default";
  let currentSearchQuery = ""; // Thêm biến lưu từ khóa tìm kiếm
  let totalPages = 1;
  // -3. Lấy các phần tử DOM-
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
      // Lọc sản phẩm
      filteredProduct = filteredProduct.filter((product) => {
        // Trả về true NẾU danh mục của sản phẩm
        // CÓ NẰM TRONG mảng các danh mục đã chọn
        return selectedCategories.includes(product.category);
      });
    }
    // LỌC THEO GIÁ
    if (
      currentPriceFilters.length > 0 &&
      !currentPriceFilters.includes("all")
    ) {
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

    // PHÂN TRANG - đảm bảo currentPage nằm trong khoảng hợp lệ theo kết quả lọc
    const computedTotalPages =
      Math.ceil(filteredProduct.length / productsPerPage) || 0;
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

    // HIỂN THỊ
    const existingItems = productsList.querySelectorAll(
      ".products__list__item"
    );
    existingItems.forEach((item) => item.remove());
    productsForThisPage.forEach((product) => {
      const clone = productTemplate.content.cloneNode(true);

      // Lưu product id vào data attribute để dùng khi click
      clone
        .querySelector(".product-link")
        .setAttribute("data-product-id", product.id);
      clone.querySelector(".product-link").href = "#";
      clone.querySelector("img").src = product.imgSrc;
      clone.querySelector("img").alt = product.name;
      clone.querySelector(".products__list__item--name").textContent =
        product.name;
      clone.querySelector(".products__list__item--price").textContent =
        product.currentPrice;

      // Ẩn hiện các phẩn tử tùy chọn
      const installmentSpan = clone.querySelector(
        ".products__list__item--installment"
      );
      installmentSpan.style.display = "inline-block";

      const originalPriceSpan = clone.querySelector(
        ".products__list__item--discount1"
      );
      product.orginalPrice
        ? (originalPriceSpan.textContent = product.orginalPrice)
        : (originalPriceSpan.style.display = "none");

      const discountPercentSpan = clone.querySelector(
        ".products__list__item--discount2"
      );
      product.discountPercent
        ? (discountPercentSpan.textContent = product.discountPercent)
        : (discountPercentSpan.style.display = "none");

      const priceDiscountTextSpan = clone.querySelector(
        ".products__list__item--priceDiscount"
      );
      product.priceDiscountText
        ? (priceDiscountTextSpan.textContent = product.priceDiscountText)
        : (priceDiscountTextSpan.style.display = "none");

      // Gắn sự kiện "Thêm vào giỏ" cho mỗi item render
      const cartBtn = clone.querySelector(".products__list__item--img__cart");
      if (cartBtn) {
        cartBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          try {
            const productName = product.name;
            const priceText = product.currentPrice;
            const price =
              parseInt(String(priceText).replace(/[^\d]/g, "")) || 0;
            const image = product.imgSrc;
            if (typeof addToCart === "function") {
              addToCart(productName, price, image, 1);
            }
          } catch (err) {
            // Xử lý lỗi thầm lặng
          }
        });
      }

      productsList.appendChild(clone);
    });
    // HIỂN THỊ PHÂN TRANG
    displayPagination(filteredProduct.length);
  }

  // Hàm cuộn lên đầu trang
  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // -- HÀM PHỤ --
  function displayPagination(totalFilteredProducts) {
    // Nếu không có container phân trang trong DOM thì không làm gì
    if (!paginationLinksContainer) return;

    // 1. Xóa các nút số trang cũ
    paginationLinksContainer.innerHTML = "";

    // 2. Tính toán tổng số trang (và cập nhật biến toàn cục)
    totalPages = Math.ceil(totalFilteredProducts / productsPerPage) || 0;

    // Nếu không có trang nào thì disable prev/next và thoát
    if (totalPages === 0) {
      if (prevButton) prevButton.classList.add("disabled");
      if (nextButton) nextButton.classList.add("disabled");
      return;
    }

    // 3. Tạo các nút số trang mới với Ellipsis
    const maxPagesToShow = 5; // Số trang hiển thị tối đa
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
      if (currentPage <= 3) {
        endPage = Math.min(4, totalPages - 1);
      } else if (currentPage >= totalPages - 2) {
        startPage = Math.max(totalPages - 3, 2);
      }

      // Thêm ellipsis đầu nếu cần
      if (startPage > 2) {
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
      pageLinkWrapper.className =
        "products__pagination__cover__links__link__link";

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
          if (typeof filterProductsFromActiveCategories === "function")
            filterProductsFromActiveCategories();
          scrollToTop();
        });
      }

      paginationLinksContainer.appendChild(pageLinkWrapper);
    });

    // 4. Cập nhật trạng thái cho các nút mũi tên (ẩn/hiện hoặc vô hiệu hóa)
    if (prevButton) {
      if (currentPage === 1) prevButton.classList.add("disabled");
      else prevButton.classList.remove("disabled");
    }
    if (nextButton) {
      if (currentPage === totalPages) nextButton.classList.add("disabled");
      else nextButton.classList.remove("disabled");
    }
  }
  // Lọc sản phẩm
  function filterProductsFromActiveCategories() {
    // 1. Tạo một mảng rỗng để chứa các danh mục được chọn
    const activeCategories = [];

    // 2. Tìm tất cả các link danh mục đang có class ".active"
    const activeLinks = document.querySelectorAll(
      ".products__category__items--details.active"
    );

    // 3. Lặp qua các link tìm được
    activeLinks.forEach((link) => {
      // Lấy giá trị từ thuộc tính 'data-category' (ví dụ: "mouse", "keyboard", "all")
      // và thêm nó vào mảng
      activeCategories.push(link.getAttribute("data-category"));
    });
    if (activeCategories.length === 0 && allCategoriesLink) {
      // 1. Tự động bật lại class 'active' cho nút "Tất cả"
      allCategoriesLink.classList.add("active");

      // 2. Thêm "all" vào mảng để lọc
      activeCategories.push("all");
    }

    displayProducts(activeCategories);
  }
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
  // Hàm cập nhật Tiêu đề trang
  function updateTitle(category = "all") {
    // Nếu đang ở chế độ tìm kiếm, không cập nhật lại title (để giữ "Kết quả tìm kiếm")
    if (currentSearchQuery.trim() !== "") {
      return;
    }

    let name = "Tất cả sản phẩm";

    // Cập nhật tên theo category
    const categoryNames = {
      all: "Tất cả sản phẩm",
      mouse: "Chuột",
      keyboard: "Bàn phím",
      headphone: "Tai nghe",
      powerbank: "Sạc dự phòng",
    };

    name = categoryNames[category] || "Tất cả sản phẩm";

    if (titleName) titleName.textContent = name;
    if (titlePath) titlePath.textContent = name;
  }

  // --- 6. GẮN CÁC BỘ LẮNG NGHE SỰ KIỆN ---

  // Sự kiện cho các nút Danh mục

  // 1. Tìm tất cả các link danh mục
  const categoryLink = document.querySelectorAll(
    ".products__category__items--details"
  );
  const allCategoriesLink = document.querySelector('[data-category="all"]');

  // 2. Mặc định kích hoạt "Tất cả" khi tải trang
  if (allCategoriesLink) {
    allCategoriesLink.classList.add("active");
  }

  // 3. Gắn sự kiện click cho từng link DANH MỤC 
  categoryLink.forEach((link) => {
    link.addEventListener("click", (e) => {
      // Ngăn thẻ <a> tải lại trang
      e.preventDefault();

      // Ngăn sự kiện click này chạy đến các hàm khác (như hàm SPA ở dưới)
      e.stopPropagation();

      // Luôn lấy thẻ <a>, ngay cả khi click vào <img> hay <span> bên trong
      const clickedLink = e.currentTarget;
      const isAllCategory = clickedLink === allCategoriesLink;

      if (isAllCategory) {
        // KỊCH BẢN 1: Click vào "Tất cả"
        clickedLink.classList.add("active");

        // Xóa .active khỏi TẤT CẢ các mục khác
        categoryLink.forEach((otherLink) => {
          if (otherLink !== allCategoriesLink) {
            otherLink.classList.remove("active");
          }
        });
      } else {
        // KỊCH BẢN 2: Click vào mục khác (Chuột, Bàn phím...)

        // Tắt "Tất cả" đi
        if (allCategoriesLink) {
          allCategoriesLink.classList.remove("active");
        }

        // Đây là điểm khác biệt: .toggle() sẽ bật nếu đang tắt, và tắt nếu đang bật
        clickedLink.classList.toggle("active");
      }

      // Xóa trạng thái focus để tránh CSS :focus giữ hiệu ứng hiển thị tick
      if (document.activeElement === clickedLink) {
        clickedLink.blur();
      }

      // Reset tìm kiếm khi click vào category
      currentSearchQuery = "";
      if (searchInput) searchInput.value = "";

      // 4. Gọi hàm lọc sản phẩm
      filterProductsFromActiveCategories();
    });
  });
  
  // XỬ LÝ URL PARAMETER - Kiểm tra category từ URL
  const urlParams = new URLSearchParams(window.location.search);
  const categoryFromURL = urlParams.get('category');
  
  if (categoryFromURL) {
    // Nếu có category trong URL, tự động chọn category đó
    categoryLinks.forEach(link => {
      const linkCategory = link.getAttribute('data-category');
      if (linkCategory === categoryFromURL) {
        // Bỏ active khỏi "all"
        categoryLinks.forEach(l => l.classList.remove('active'));
        // Thêm active vào category được chọn
        link.classList.add('active');
      }
    });
  }
  
  filterProductsFromActiveCategories();
  // Sự kiện cho các checkbox Mức giá
  priceCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      currentPriceFilters = []; // Xây dựng lại mảng filter
      priceCheckboxes.forEach((box) => {
        if (box.checked) {
          currentPriceFilters.push(box.value);
        }
      });

      // Logic cho checkbox "Tất cả"
      if (currentPriceFilters.includes("all")) {
        currentPriceFilters = ["all"]; // Chỉ giữ lại 'all'
        priceCheckboxes.forEach((box) => {
          if (box.value !== "all") box.checked = false;
        });
      } else {
        // Nếu chọn mục khác, bỏ check 'Tất cả'
        document.getElementById("all").checked = false;
      }

      currentPage = 1; // Reset về trang 1
      filterProductsFromActiveCategories(); // Lọc và hiển thị lại
    });
  });

  // Sự kiện cho dropdown Sắp xếp
  sortSelect.addEventListener("change", (e) => {
    currentSort = e.target.value;
    currentPage = 1; // Reset về trang 1
    filterProductsFromActiveCategories(); // Vẽ lại
    scrollToTop(); // Cuộn lên đầu trang
  });

  // Sự kiện cho nút "Đặt lại"
  resetButton.addEventListener("click", (e) => {
    e.preventDefault();

    // Reset state
    currentPage = 1;
    currentCategory = "all";
    currentPriceFilters = ["all"];
    currentSort = "default";
    currentSearchQuery = ""; // Reset từ khóa tìm kiếm

    // Reset UI
    categoryLinks.forEach((l) => l.classList.remove("active"));
    document.querySelector('[data-category="all"]').classList.add("active");

    priceCheckboxes.forEach((box) => (box.checked = false));
    document.getElementById("all").checked = true;

    sortSelect.value = "default";

    // Xóa nội dung trong ô search
    if (searchInput) searchInput.value = "";

    updateTitle("all");
    filterProductsFromActiveCategories();
    scrollToTop(); // Cuộn lên đầu trang
  });

  // Sự kiện cho nút Previous
  prevButton.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      filterProductsFromActiveCategories();
      scrollToTop(); // Cuộn lên đầu trang
    }
  });

  // Sự kiện cho nút Next
  nextButton.addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage++;
      filterProductsFromActiveCategories();
      scrollToTop(); // Cuộn lên đầu trang
    }
  });

  // Cho phép click cả vào vùng bao quanh mũi tên để chuyển trang
  const prevContainer = prevButton
    ? prevButton.closest(".products__pagination__cover__arr-cover")
    : null;
  if (prevContainer) {
    prevContainer.addEventListener("click", () => {
      if (currentPage > 1) {
        prevButton.click();
      }
    });
  }

  const nextContainer = nextButton
    ? nextButton.closest(".products__pagination__cover__arr-cover")
    : null;
  if (nextContainer) {
    nextContainer.addEventListener("click", () => {
      if (currentPage < totalPages) {
        nextButton.click();
      }
    });
  }

  // Xử lý tìm kiếm
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
    currentCategory = "all"; // Reset về tất cả để tìm trong toàn bộ sản phẩm

    // Reset UI category (không highlight category nào)
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

  document.addEventListener("click", (e) => {
    const tile = e.target.closest(
      '.category-feature-item[data-view="products"]'
    );
    if (!tile) return;

    e.preventDefault();

    // Dùng .dataset thay vì getAttribute
    const category = tile.dataset.category || "all";

    showView("view-products");

    // Reset về trang 1 và category được chọn
    currentCategory = category;
    currentPage = 1;
    currentSearchQuery = ""; // Reset từ khóa tìm kiếm

    // Reset UI
    categoryLinks.forEach((l) => l.classList.remove("active"));
    const sidebarLink = document.querySelector(
      `#category-filters [data-category="${category}"]`
    );
    if (sidebarLink) sidebarLink.classList.add("active");

    // Xóa nội dung trong ô search
    if (searchInput) searchInput.value = "";

    updateTitle(category);
    filterProductsFromActiveCategories();

    // Đơn giản hóa việc cuộn trang
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // 2. Lắng nghe tất cả các cú click trên thanh điều hướng và dropdown
  // Sử dụng event delegation trên document với capture phase để xử lý trước
  document.addEventListener("click", (e) => {
    // Ưu tiên: nếu click vào nút thêm giỏ hàng thì bỏ qua handler điều hướng
    if (
      e.target.closest(
        ".products__list__item--img__cart, .product-hottest-item--img__cart"
      )
    ) {
      return;
    }
    // Bỏ qua khi click bên trong pagination để tránh xung đột điều hướng SPA
    if (e.target.closest("#pagination")) {
      return;
    }
    // Hỗ trợ cả <a> và bất kỳ phần tử nào có data-view (ví dụ: .category-feature-item)
    const link = e.target.closest("a");
    const trigger = e.target.closest("[data-view]");
    if (!link && !trigger) {
      return;
    }
    // XỬ LÝ LINK SẢN PHẨM (trong danh sách sản phẩm)
    if (link.classList.contains("product-link")) {
      e.preventDefault();
      e.stopPropagation(); // Ngăn các handler khác
      e.stopImmediatePropagation();
      const productId = link.getAttribute("data-product-id");
      if (productId && typeof allProduct !== "undefined") {
        displayProductDetails(parseInt(productId));
      }
      return false;
    }
    // Chỉ xử lý các link có thuộc tính data-view
    // Xác định phần tử kích hoạt (ưu tiên link nếu có, fallback trigger)
    const source = link || trigger;
    if (!source.dataset.view) {
      return;
    }

    e.preventDefault(); // Ngăn trình duyệt tải lại trang
    // KHÔNG dùng stopImmediatePropagation() để không chặn các handler khác (như Shop Now button)

    // Lấy thông tin từ các thuộc tính 'data-'
    const viewName = source.dataset.view; // vd: "products"
    const category = source.dataset.category; // vd: "mouse" hoặc undefined

    // 3. Hiển thị view tương ứng
    showView(`view-${viewName}`); // vd: showView("view-products")

    // 4. XỬ LÝ VIEW PRODUCT-DETAILS
    if (viewName === "product-details") {
      const productId = source.getAttribute("data-product-id");
      if (productId && typeof allProduct !== "undefined") {
        displayProductDetails(parseInt(productId));
      }
      return;
    }

    // 5. KIỂM TRA ĐẶC BIỆT: Nếu là link SẢN PHẨM
    if (viewName === "products") {
      // Nếu có một danh mục được chỉ định (vd: "mouse")
      if (category) {
        // CẬP NHẬT TRẠNG THÁI CỦA TRANG SẢN PHẨM
        currentCategory = category;
        currentPage = 1;
        currentSearchQuery = ""; // Reset từ khóa tìm kiếm

        // Đồng bộ hóa bộ lọc (ví dụ: làm cho nút 'Chuột' có class 'active')
        categoryLinks.forEach((l) => l.classList.remove("active"));
        const activeCategoryLink = document.querySelector(
          `#category-filters [data-category="${category}"]`
        );
        if (activeCategoryLink) {
          activeCategoryLink.classList.add("active");
        }

        // Xóa nội dung trong ô search
        if (searchInput) searchInput.value = "";

        // Luôn hiển thị tiêu đề "Tất cả sản phẩm" khi click từ header
        if (titleName) titleName.textContent = "Tất cả sản phẩm";
        if (titlePath) titlePath.textContent = "Tất cả sản phẩm";

        // Sau khi đã cập nhật trạng thái, vẽ lại danh sách sản phẩm
        filterProductsFromActiveCategories();
        scrollToTop(); // Cuộn lên đầu trang
      } else {
        // Nếu chỉ bấm vào "Sản phẩm" (không có danh mục)
        // thì reset về "Tất cả" (nút reset sẽ tự xóa search query)
        resetButton.click(); // Giả lập một cú click vào nút "Đặt lại"
      }
    }
  });

  // 5. Đảm bảo checkbox "Tất cả" luôn được chọn mặc định
  const allPriceCheckbox = document.getElementById("all");
  if (allPriceCheckbox) {
    allPriceCheckbox.checked = true;
    currentPriceFilters = ["all"];
  }

  // 6. Hiển thị trang chủ khi tải lần đầu và đảm bảo ở đầu trang
  showView("view-home");
});
  const channel = new BroadcastChannel('data_update');
  channel.onmessage = (event) => {
    // Kiểm tra xem có đúng là tín hiệu cập nhật sản phẩm không
    if (event.data.type === 'products_updated') {
      
      console.log("Phía User: Phát hiện cập nhật sản phẩm từ Admin! Đang tải lại...");

      // 1. Lấy dữ liệu sản phẩm MỚI NHẤT từ localStorage
      allProduct = JSON.parse(localStorage.getItem("products")) || [];

      // 2. Vẽ lại danh sách sản phẩm (hàm này sẽ tự gọi displayProducts)
      if (typeof filterProductsFromActiveCategories === 'function') {
        filterProductsFromActiveCategories();
      }

      // 3. (Nâng cao) Tải lại trang chi tiết nếu đang xem
      const detailView = document.getElementById('view-product-details');
      if (detailView.classList.contains('active')) {
          // Lấy ID sản phẩm đang xem (cần sửa lại cách lấy ID nếu có)
          const productName = detailView.querySelector("#product-detail-name").textContent;
          const currentProduct = allProduct.find(p => p.name === productName);
          if (currentProduct) {
              displayProductDetails(currentProduct.id);
          }
      }
    }
  };
// Kết thúc DOMContentLoaded
// Hàm hiển thị chi tiết sản phẩm trong SPA
function displayProductDetails(productId) {
  if (typeof allProduct === "undefined") {
    return;
  }

  // ✅ ĐÚNG: Khai báo 'product' TRƯỚC KHI dùng
  const product = allProduct.find((p) => p.id === productId);
  if (!product) {
    console.error("❌ Không tìm thấy sản phẩm với ID:", productId);
    return;
  }

  // Sau đó mới kiểm tra tồn kho
  const products = JSON.parse(localStorage.getItem("products")) || [];
  const productInStock = products.find((p) => p.id === product.id);
  const stock = productInStock ? productInStock.quantity : 0;

  const stockHTML = `
    <p class="stock-info" style="color: ${stock > 10 ? "#4ade80" : "#ef4444"};">
      📦 Còn lại: <strong>${stock}</strong> sản phẩm
      ${stock <= 10 ? " ⚠️ SẮP HẾT HÀNG!" : ""}
    </p>
  `;

  const productInfo = document.querySelector(".products__show-right-info");
  if (productInfo) {
    productInfo.insertAdjacentHTML("beforeend", stockHTML);
  }

  const detailView = document.getElementById("view-product-details");
  if (!detailView) {
    return;
  }
  // Cập nhật thông tin sản phẩm
  const img = detailView.querySelector("#product-detail-img");
  const name = detailView.querySelector("#product-detail-name");
  const currentPrice = detailView.querySelector(
    "#product-detail-current-price"
  );
  const oldPrice = detailView.querySelector("#product-detail-old-price");
  const sale = detailView.querySelector("#product-detail-sale");
  const description = detailView.querySelector("#product-detail-description");
  const featuresList = detailView.querySelector("#product-detail-features");
  const breadcrumbCategory = detailView.querySelector("#breadcrumb-category");
  const breadcrumbProductName = detailView.querySelector(
    "#breadcrumb-product-name"
  );

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

  // Ẩn breadcrumb "Tất cả sản phẩm" - chỉ hiển thị tên sản phẩm
  if (breadcrumbCategory) {
    breadcrumbCategory.innerHTML = ``; // Ẩn phần "Tất cả sản phẩm"
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
    // Fallback: tự implement
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

  // Khởi tạo chức năng tăng/giảm số lượng
  setupQuantityControls();

  // Khởi tạo nút "Thêm vào giỏ" cho trang chi tiết sản phẩm
  setupAddToCartButton(product);
}

// === HÀM THIẾT LẬP ĐIỀU KHIỂN SỐ LƯỢNG ===
function setupQuantityControls() {
  const quantityInput = document.getElementById("product-quantity");
  const decreaseBtn = document.querySelector(".products__show-right-buy-in");
  const increaseBtn = document.querySelector(".products__show-right-buy-de");

  if (!quantityInput || !decreaseBtn || !increaseBtn) {
    return; // Không tìm thấy các phần tử, có thể view chưa được hiển thị
  }

  // Luôn reset số lượng về 1 mỗi khi mở trang chi tiết sản phẩm
  quantityInput.value = "1";

  // Xóa event listeners cũ (nếu có) để tránh duplicate
  const newDecreaseBtn = decreaseBtn.cloneNode(true);
  const newIncreaseBtn = increaseBtn.cloneNode(true);
  decreaseBtn.parentNode.replaceChild(newDecreaseBtn, decreaseBtn);
  increaseBtn.parentNode.replaceChild(newIncreaseBtn, increaseBtn);

  // Lấy lại các phần tử sau khi clone
  const decrease = document.querySelector(".products__show-right-buy-in");
  const increase = document.querySelector(".products__show-right-buy-de");

  // Hàm kiểm tra và cập nhật số lượng
  function updateQuantity(newValue) {
    let quantity = parseInt(newValue) || 1;

    // Đảm bảo số lượng trong khoảng hợp lệ
    if (quantity < 1) {
      quantity = 1;
    }
    // Có thể thêm giới hạn tối đa nếu cần
    // if (quantity > maxQuantity) {
    //   quantity = maxQuantity;
    // }

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

  // Xử lý khi người dùng nhập trực tiếp vào input
  quantityInput.addEventListener("change", function () {
    updateQuantity(this.value);
  });

  // Xử lý khi người dùng nhập (realtime validation)
  quantityInput.addEventListener("input", function () {
    // Chỉ cho phép nhập số
    this.value = this.value.replace(/[^\d]/g, "");
  });

  // Xử lý phím Enter
  quantityInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      updateQuantity(this.value);
      this.blur(); // Bỏ focus sau khi nhập
    }
  });
}

// Hàm thiết lập nút "Thêm vào giỏ" cho trang chi tiết sản phẩm
function setupAddToCartButton(product) {
  const addToCartBtn = document.getElementById("product-add-to-cart");

  if (!addToCartBtn) {
    console.warn("Add to cart button not found");
    return; // Không tìm thấy nút
  }

  // Xóa event listener cũ (nếu có) để tránh duplicate bằng cách clone nút
  const newBtn = addToCartBtn.cloneNode(true);
  addToCartBtn.parentNode.replaceChild(newBtn, addToCartBtn);

  const btn = document.getElementById("product-add-to-cart");

  // Thêm event listener mới
  btn.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();

    // Lấy số lượng từ input
    const quantityInput = document.getElementById("product-quantity");
    const quantity = parseInt(quantityInput?.value) || 1;

    // Lấy thông tin sản phẩm từ product object (đã có sẵn khi gọi hàm)
    const productName = product.name;
    const priceText = product.currentPrice;
    const price = parseInt(priceText.replace(/[^\d]/g, ""));
    const image = product.imgSrc;

    // Gọi hàm addToCart với số lượng
    if (typeof addToCart === "function") {
      addToCart(productName, price, image, quantity);
    } else {
      console.error("addToCart function not found!");
    }
  });

  // Thiết lập nút "Mua ngay" để chuyển thẳng đến trang thanh toán
  setupBuyNowButton(product);
}

// ==== HÀM THIẾT LẬP NÚT MUA NGAY CHO SẢN PHẨM ====
function setupBuyNowButton(product) {
  const buyNowBtn = document.querySelector(".products__show-right-buy-buy");

  // 1. Kiểm tra element DOM đầu tiên
  if (!buyNowBtn) {
    console.warn("Buy now button not found");
    return;
  }

  // 2. Xóa event listener cũ (dùng cloneNode)
  // Chỉ cần làm điều này 1 lần, bất kể đã đăng nhập hay chưa
  const newBtn = buyNowBtn.cloneNode(true);
  buyNowBtn.parentNode.replaceChild(newBtn, buyNowBtn);

  // 3. Thêm event listener mới vào nút MỚI
  newBtn.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();

    // Lấy số lượng (luôn cần)
    const quantityInput = document.getElementById("product-quantity");
    const quantity = parseInt(quantityInput?.value) || 1;

    // Kiểm tra đăng nhập (kiểm tra BÊN TRONG listener)
    const user = JSON.parse(localStorage.getItem("loggedInUser"));

    if (!user) {
      // CHƯA ĐĂNG NHẬP

      // Lưu thông tin sản phẩm để mua sau khi đăng nhập
      const pendingBuyNow = {
        name: product.name,
        price: parseInt(product.currentPrice.replace(/[^\d]/g, "")),
        image: product.imgSrc,
        quantity: quantity,
        action: "buyNow", // Đánh dấu đây là mua ngay
      };

      localStorage.setItem("pendingBuyNow", JSON.stringify(pendingBuyNow));

      // Hiển thị thông báo và mở modal đăng nhập
      alert("Vui lòng đăng nhập để mua sản phẩm!");

      // SỬA TYPO: Giả sử window.router là tên đúng
      if (window.router && typeof window.router.openModal === "function") {
        window.router.openModal("login-modal");
      }
    } else {
      // ĐÃ ĐĂNG NHẬP
      const price = parseInt(product.currentPrice.replace(/[^\d]/g, ""));

      // Tạo sản phẩm mới cho giỏ hàng
      const newCartItem = {
        name: product.name,
        price: price,
        image: product.imgSrc,
        quantity: quantity,
      };

      console.log("Buy Now - Setting cart with:", newCartItem);

      // Set giỏ hàng với sản phẩm mới (thay thế giỏ hàng cũ)
      if (typeof window.setCart === "function") {
        window.setCart([newCartItem]);
        console.log("Cart set via window.setCart");
      } else {
        // Fallback: trực tiếp gán
        window.cart = [newCartItem];
        localStorage.setItem("cart", JSON.stringify(window.cart));
        console.log("Cart set via fallback");
      }

      console.log("Cart in localStorage:", localStorage.getItem("cart"));

      // Mở modal giỏ hàng và hiển thị trang thanh toán
      if (window.router && typeof window.router.openModal === "function") {
        window.router.openModal("cart-modal");
        // Chuyển đến trang thanh toán
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
// --- 2. CÁC HÀM TIỆN ÍCH (Giữ nguyên) ---

// Hàm lấy tham số từ URL query string
function getURLParameter(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

// Hàm chuyển đổi category sang tên tiếng Việt
function getCategoryName(category) {
  const categoryMap = {
    keyboard: "Bàn phím",
    mouse: "Chuột",
    headphone: "Tai nghe",
    powerbank: "Sạc dự phòng",
  };
  return categoryMap[category] || category;
}

// Hàm tạo mô tả mặc định dựa trên category
function getDefaultDescription(product) {
  const { category, name } = product; // Gọn hơn
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

// Hàm tạo danh sách tính năng mặc định
function getDefaultFeatures(product) {
  const { category } = product; // Gọn hơn
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

// Hàm cập nhật breadcrumb
function updateBreadcrumb(product) {
  const categoryName = getCategoryName(product.category);
  DOM.breadcrumb.innerHTML = `
        <a href="#">Trang chủ</a> <span class="breadcrumb-sep">&gt;</span> 
        <a href="#">Sản phẩm</a> <span class="breadcrumb-sep">&gt;</span> 
        <a href="#">${categoryName}</a> <span class="breadcrumb-sep">&gt;</span> 
        <span>${product.name}</span>
    `;
}

// Hàm hiển thị sản phẩm (Tối ưu)
function displayProduct(product) {
  // Cập nhật hình ảnh, tên, giá
  DOM.img.src = product.imgSrc;
  DOM.img.alt = product.name;
  DOM.name.textContent = product.name;
  DOM.currentPrice.textContent = product.currentPrice;

  // Cập nhật giá (Tối ưu logic ẩn/hiện)
  DOM.oldPrice.textContent = product.originalPrice || "";
  DOM.oldPrice.style.display = product.originalPrice ? "inline" : "none";

  DOM.salePercent.textContent = product.discountPercent || "";
  DOM.salePercent.style.display = product.discountPercent ? "inline" : "none";

  // Cập nhật mô tả (Tối ưu logic)
  DOM.description.textContent =
    product.description || getDefaultDescription(product);

  // Cập nhật tính năng (Tối ưu logic)
  const features = product.features || getDefaultFeatures(product);
  DOM.featuresList.innerHTML = features
    .map((feature) => `<li><i class="ri-check-line"></i>${feature}</li>`)
    .join("");

  // Cập nhật breadcrumb và title trang
  updateBreadcrumb(product);
  document.title = product.name + " - Xtray";
}

// Hàm khởi tạo
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

// Chạy hàm init khi HTML đã được tải xong
window.addEventListener("DOMContentLoaded", init);
