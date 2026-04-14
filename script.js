const STORAGE_KEYS = {
  products: "voltforgegarage-products",
  cart: "voltforgegarage-cart"
};

const STARTER_PRODUCTS = [
  {
    id: "starter-motor-1",
    name: "ForgeDrive Trail Motor",
    category: "motors",
    price: 689,
    image: "",
    description: "Mid-drive motor setup for strong, smooth power delivery on daily and weekend builds."
  },
  {
    id: "starter-battery-1",
    name: "VoltCore 48 Battery Pack",
    category: "batteries",
    price: 429,
    image: "",
    description: "Reliable battery pack designed for steady output, practical range, and clean fitment."
  },
  {
    id: "starter-brake-1",
    name: "ApexStop Brake Kit",
    category: "brakes",
    price: 214,
    image: "",
    description: "Hydraulic brake kit that improves control, stopping confidence, and everyday ride feel."
  }
];

const page = document.body.dataset.page;
const navToggle = document.querySelector(".nav-toggle");
const navMenu = document.querySelector(".nav-menu");
const navLinks = document.querySelectorAll('.nav-links a, .cart-link[href]');
const revealItems = document.querySelectorAll(".reveal");

const readStorage = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const writeStorage = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const ensureProducts = () => {
  const saved = readStorage(STORAGE_KEYS.products, null);
  if (Array.isArray(saved)) {
    return saved;
  }
  writeStorage(STORAGE_KEYS.products, STARTER_PRODUCTS);
  return [...STARTER_PRODUCTS];
};

const getProducts = () => ensureProducts();
const saveProducts = (products) => writeStorage(STORAGE_KEYS.products, products);
const getCart = () => readStorage(STORAGE_KEYS.cart, []);
const saveCart = (cart) => writeStorage(STORAGE_KEYS.cart, cart);

const formatPrice = (price) => `$${Number(price).toFixed(2)}`;

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const createImageStyle = (image) => {
  if (!image) {
    return "";
  }
  return `background-image: url('${String(image).replace(/'/g, "\\'")}');`;
};

const cartCountTargets = document.querySelectorAll("[data-cart-count]");

const updateCartCount = () => {
  const count = getCart().reduce((sum, item) => sum + item.quantity, 0);
  cartCountTargets.forEach((target) => {
    target.textContent = String(count);
  });
};

const setMenuState = (open) => {
  if (!navToggle || !navMenu) {
    return;
  }
  navToggle.classList.toggle("is-active", open);
  navMenu.classList.toggle("is-open", open);
  navToggle.setAttribute("aria-expanded", String(open));
  document.body.classList.toggle("menu-open", open);
};

if (navToggle) {
  navToggle.addEventListener("click", () => {
    setMenuState(!navMenu.classList.contains("is-open"));
  });
}

navLinks.forEach((link) => {
  link.addEventListener("click", () => setMenuState(false));
});

document.addEventListener("click", (event) => {
  if (!navMenu || !navToggle) {
    return;
  }
  const clickedInside = navMenu.contains(event.target) || navToggle.contains(event.target);
  if (!clickedInside && navMenu.classList.contains("is-open")) {
    setMenuState(false);
  }
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.12,
    rootMargin: "0px 0px -24px 0px"
  }
);

revealItems.forEach((item) => revealObserver.observe(item));

const addToCart = (productId) => {
  const cart = getCart();
  const existing = cart.find((item) => item.id === productId);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ id: productId, quantity: 1 });
  }
  saveCart(cart);
  updateCartCount();
};

const getProductById = (id) => getProducts().find((product) => product.id === id);

const renderStorePage = () => {
  const productGrid = document.querySelector("[data-product-grid]");
  const emptyProducts = document.querySelector("[data-empty-products]");
  const filterButtons = document.querySelectorAll(".filter-chip");
  let activeFilter = "all";

  const renderProducts = () => {
    const products = getProducts();
    const filtered = activeFilter === "all" ? products : products.filter((product) => product.category === activeFilter);

    productGrid.innerHTML = filtered
      .map((product) => {
        const name = escapeHtml(product.name);
        const description = escapeHtml(product.description);
        return `
          <article class="product-card reveal is-visible" data-view-product="${product.id}">
            <div class="product-image ${product.image ? "has-image" : ""}" style="${createImageStyle(product.image)}"></div>
            <div class="product-body">
              <h3>${name}</h3>
              <p>${description}</p>
              <div class="product-meta">
                <strong>${formatPrice(product.price)}</strong>
                <button class="button button-small" type="button" data-view-button="${product.id}">View Product</button>
              </div>
            </div>
          </article>
        `;
      })
      .join("");

    emptyProducts.classList.toggle("is-hidden", filtered.length > 0);

    productGrid.querySelectorAll("[data-view-button]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        window.location.href = `product.html?id=${encodeURIComponent(button.dataset.viewButton)}`;
      });
    });

    productGrid.querySelectorAll("[data-view-product]").forEach((card) => {
      card.addEventListener("click", () => {
        window.location.href = `product.html?id=${encodeURIComponent(card.dataset.viewProduct)}`;
      });
    });
  };

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      filterButtons.forEach((item) => item.classList.remove("is-active"));
      button.classList.add("is-active");
      activeFilter = button.dataset.filter || "all";
      renderProducts();
    });
  });

  renderProducts();
};

const renderProductPage = () => {
  const params = new URLSearchParams(window.location.search);
  const productId = params.get("id");
  const product = productId ? getProductById(productId) : null;
  const category = document.querySelector("[data-detail-category]");
  const name = document.querySelector("[data-detail-name]");
  const description = document.querySelector("[data-detail-description]");
  const price = document.querySelector("[data-detail-price]");
  const image = document.querySelector("[data-detail-image]");
  const addButton = document.querySelector("[data-detail-add]");

  if (!product) {
    category.textContent = "Product";
    return;
  }

  document.title = `VoltForgeGarage | ${product.name}`;
  category.textContent = product.category;
  name.textContent = product.name;
  description.textContent = product.description;
  price.textContent = formatPrice(product.price);
  image.style.cssText = createImageStyle(product.image);
  image.classList.toggle("has-image", Boolean(product.image));
  addButton.disabled = false;
  addButton.addEventListener("click", () => addToCart(product.id));
};

const renderCheckoutPage = () => {
  const itemsContainer = document.querySelector("[data-checkout-items]");
  const emptyCart = document.querySelector("[data-empty-cart]");
  const summaryItems = document.querySelector("[data-summary-items]");
  const summarySubtotal = document.querySelector("[data-summary-subtotal]");
  const summaryShipping = document.querySelector("[data-summary-shipping]");
  const summaryTotal = document.querySelector("[data-summary-total]");
  const checkoutForm = document.querySelector("[data-checkout-form]");
  const checkoutMessage = document.querySelector("[data-checkout-message]");
  const shipping = 18;

  const renderCheckout = () => {
    const cart = getCart();
    const products = getProducts();
    const detailedItems = cart
      .map((item) => {
        const product = products.find((entry) => entry.id === item.id);
        return product ? { ...item, product } : null;
      })
      .filter(Boolean);

    if (!detailedItems.length) {
      itemsContainer.innerHTML = "";
      emptyCart.classList.remove("is-hidden");
      summaryItems.textContent = "0";
      summarySubtotal.textContent = formatPrice(0);
      summaryShipping.textContent = formatPrice(0);
      summaryTotal.textContent = formatPrice(0);
      return;
    }

    emptyCart.classList.add("is-hidden");

    itemsContainer.innerHTML = detailedItems
      .map(({ quantity, product }) => {
        const name = escapeHtml(product.name);
        const description = escapeHtml(product.description);
        return `
          <article class="checkout-item">
            <div class="checkout-item-thumb" style="${createImageStyle(product.image)}"></div>
            <div class="checkout-item-copy">
              <h4>${name}</h4>
              <p>${description}</p>
              <div class="checkout-qty">
                <button class="qty-button" type="button" data-qty-change="${product.id}" data-direction="-1">-</button>
                <span class="qty-value">${quantity}</span>
                <button class="qty-button" type="button" data-qty-change="${product.id}" data-direction="1">+</button>
              </div>
            </div>
            <div class="checkout-item-side">
              <strong class="checkout-item-price">${formatPrice(product.price * quantity)}</strong>
              <div class="checkout-item-actions">
                <button class="button button-small button-danger" type="button" data-remove-cart="${product.id}">Remove</button>
              </div>
            </div>
          </article>
        `;
      })
      .join("");

    itemsContainer.querySelectorAll("[data-qty-change]").forEach((button) => {
      button.addEventListener("click", () => {
        const direction = Number(button.dataset.direction);
        const updatedCart = getCart()
          .map((item) =>
            item.id === button.dataset.qtyChange
              ? { ...item, quantity: Math.max(0, item.quantity + direction) }
              : item
          )
          .filter((item) => item.quantity > 0);
        saveCart(updatedCart);
        updateCartCount();
        renderCheckout();
      });
    });

    itemsContainer.querySelectorAll("[data-remove-cart]").forEach((button) => {
      button.addEventListener("click", () => {
        const updatedCart = getCart().filter((item) => item.id !== button.dataset.removeCart);
        saveCart(updatedCart);
        updateCartCount();
        renderCheckout();
      });
    });

    const itemCount = detailedItems.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = detailedItems.reduce((sum, item) => sum + item.quantity * item.product.price, 0);

    summaryItems.textContent = String(itemCount);
    summarySubtotal.textContent = formatPrice(subtotal);
    summaryShipping.textContent = formatPrice(shipping);
    summaryTotal.textContent = formatPrice(subtotal + shipping);
  };

  checkoutForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const cart = getCart();
    if (!cart.length) {
      checkoutMessage.textContent = "Add products to the cart before placing an order.";
      checkoutMessage.classList.remove("is-success");
      return;
    }

    saveCart([]);
    updateCartCount();
    renderCheckout();
    checkoutForm.reset();
    checkoutMessage.textContent = "Order placed successfully.";
    checkoutMessage.classList.add("is-success");
  });

  renderCheckout();
};

ensureProducts();
updateCartCount();

if (page === "store") {
  renderStorePage();
}

if (page === "checkout") {
  renderCheckoutPage();
}

if (page === "product") {
  renderProductPage();
}
