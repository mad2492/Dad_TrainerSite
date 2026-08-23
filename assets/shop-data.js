/* Fonseca Fitness — live Supabase storefront binding.
   Loaded after portal-auth.js. In demo mode this script is a silent no-op,
   leaving the hardcoded catalog and fonseca-cart-demo behavior untouched. */
(function () {
  "use strict";

  const auth = window.FonsecaAuth;
  if (!auth || !auth.enabled) return;

  const CART_KEY = "fonseca-cart-v2";
  const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const pageName = document.body.dataset.storefrontPage || "";
  let client = null;
  let profile = null;
  let catalog = [];
  let currentProduct = null;
  let currentQuantity = 1;
  let selectedSize = null;
  let startAttempted = false;

  const hook = (name) => document.querySelector('[data-hook="' + name + '"]');
  const money = (cents) => new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format((Number(cents) || 0) / 100);
  const categoryLabel = (value) => ({
    recovery: "Recovery",
    growth: "Growth & performance",
    metabolic: "Metabolic",
    merch: "Merch",
    supplies: "Supplies"
  })[value] || "Shop";
  const statusLabel = (stock) => {
    const count = Number(stock) || 0;
    if (count <= 0) return { text: "Out of stock", className: "is-out" };
    if (count <= 3) return { text: "Low stock · " + count + " left", className: "is-low" };
    return { text: "In stock", className: "is-stock" };
  };
  const resultRows = (result, description) => {
    if (result && result.error) {
      throw new Error(description + ": " + (result.error.message || "request failed"));
    }
    return result && Array.isArray(result.data) ? result.data : [];
  };
  const show = (name, message) => {
    const element = hook(name);
    if (element) element.textContent = message;
  };

  const readCart = () => {
    let parsed;
    try {
      parsed = JSON.parse(localStorage.getItem(CART_KEY) || "{}");
    } catch (_) {
      return {};
    }
    if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") return {};
    return Object.keys(parsed).reduce((safe, productId) => {
      const entry = parsed[productId];
      const quantity = Number(entry && entry.qty);
      if (
        UUID_PATTERN.test(productId) &&
        entry &&
        typeof entry === "object" &&
        Number.isInteger(quantity) &&
        quantity > 0
      ) {
        safe[productId] = {
          qty: quantity,
          size: typeof entry.size === "string" && entry.size.trim() ? entry.size.trim() : null
        };
      }
      return safe;
    }, {});
  };

  let cart = readCart();

  const writeCart = () => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
      return true;
    } catch (_) {
      return false;
    }
  };

  const cartUnits = () => Object.keys(cart)
    .reduce((total, productId) => total + (Number(cart[productId].qty) || 0), 0);

  const paintCartCount = () => {
    const element = hook("storefront-cart-count");
    if (!element) return;
    const count = cartUnits();
    element.textContent = String(count);
    element.hidden = count === 0;
  };

  const addToCart = (product, quantity, size) => {
    const requested = Math.max(1, Number(quantity) || 1);
    const existing = cart[product.id] || { qty: 0, size: null };
    const nextQuantity = existing.qty + requested;
    if ((Number(product.stock_qty) || 0) < nextQuantity) {
      throw new Error("Only " + (Number(product.stock_qty) || 0) + " are currently available.");
    }
    cart[product.id] = {
      qty: nextQuantity,
      size: size || null
    };
    if (!writeCart()) {
      throw new Error("This browser could not save your cart. Check storage settings and try again.");
    }
    paintCartCount();
  };

  const fetchCatalog = () => client
    .from("products")
    .select("id, name, category, description, price_cents, stock_qty, sizes, active, created_at")
    .eq("active", true)
    .order("created_at", { ascending: true })
    .then((result) => {
      catalog = resultRows(result, "Could not load the catalog");
      return catalog;
    });

  const shopGrid = hook("shop-product-grid");
  const shopCards = shopGrid
    ? Array.from(shopGrid.querySelectorAll(".card"))
    : [];
  const shopTemplates = {
    vial: shopCards.find((card) => card.dataset.category !== "merch") || null,
    merch: shopCards.find((card) => card.dataset.category === "merch") || null
  };

  const productCard = (product) => {
    const isApparel = Array.isArray(product.sizes) && product.sizes.length > 0;
    const source = (isApparel ? shopTemplates.merch : shopTemplates.vial) || shopTemplates.vial || shopTemplates.merch;
    if (!source) return null;
    const card = source.cloneNode(true);
    const stock = statusLabel(product.stock_qty);
    const badge = card.querySelector(".badge");
    const mediaImage = card.querySelector(".card-media svg");
    const name = card.querySelector(".card-name");
    const add = card.querySelector(".add-btn");

    card.dataset.category = product.category;
    card.dataset.productId = product.id;
    if (badge) {
      badge.className = "badge " + stock.className;
      badge.textContent = stock.text;
    }
    if (mediaImage) {
      if ((Number(product.stock_qty) || 0) <= 0) mediaImage.setAttribute("opacity", "0.45");
      else mediaImage.removeAttribute("opacity");
    }
    const category = card.querySelector(".card-cat");
    if (category) category.textContent = categoryLabel(product.category);
    if (name) {
      name.textContent = product.name;
      name.href = "product.html?id=" + encodeURIComponent(product.id);
    }
    const sizes = card.querySelector(".card-sizes");
    if (sizes) sizes.textContent = product.sizes.join(" · ");
    const price = card.querySelector(".price");
    if (price) price.textContent = money(product.price_cents);
    if (add) {
      add.removeAttribute("data-add");
      add.dataset.liveProductId = product.id;
      add.className = "add-btn";
      add.disabled = (Number(product.stock_qty) || 0) <= 0;
      add.textContent = add.disabled ? "Out of stock" : "Add";
    }
    return card;
  };

  const bindShopFilters = () => {
    const chips = Array.from(document.querySelectorAll(".chip[data-filter]"));
    chips.forEach((chip) => {
      chip.addEventListener("click", () => {
        const filter = chip.dataset.filter;
        chips.forEach((other) => other.setAttribute("aria-pressed", String(other === chip)));
        Array.from(shopGrid.querySelectorAll(".card")).forEach((card) => {
          card.hidden = filter !== "all" && card.dataset.category !== filter;
        });
      });
    });
  };

  const renderShop = (products) => {
    if (!shopGrid) return;
    shopGrid.replaceChildren();
    if (!products.length) {
      const message = document.createElement("p");
      message.textContent = "No products are available right now. Please check back soon.";
      shopGrid.appendChild(message);
      return;
    }
    products.forEach((product) => {
      const card = productCard(product);
      if (card) shopGrid.appendChild(card);
    });
    bindShopFilters();
    shopGrid.addEventListener("click", (event) => {
      const button = event.target.closest("[data-live-product-id]");
      if (!button) return;
      const product = catalog.find((item) => item.id === button.dataset.liveProductId);
      if (!product) return;
      try {
        addToCart(product, 1, Array.isArray(product.sizes) ? product.sizes[0] : null);
        button.textContent = "Added";
        window.setTimeout(() => {
          if (button.isConnected) button.textContent = "Add";
        }, 1200);
      } catch (error) {
        button.textContent = error.message || "Try again";
      }
    });
  };

  const productByLocation = (products) => {
    const requestedId = new URLSearchParams(window.location.search).get("id");
    return products.find((product) => product.id === requestedId) || (!requestedId ? products[0] : null);
  };

  const renderProductQuantity = () => {
    show("product-qty", String(currentQuantity));
  };

  const renderProduct = (products) => {
    currentProduct = productByLocation(products);
    if (!currentProduct) {
      show("product-name", "Product unavailable");
      show("product-message", "We could not find that product. Return to the shop and choose an available item.");
      const add = hook("product-add");
      if (add) add.disabled = true;
      return;
    }

    const category = categoryLabel(currentProduct.category);
    const stock = statusLabel(currentProduct.stock_qty);
    show("product-category", category);
    show("product-crumb-category", category);
    show("product-name", currentProduct.name);
    show("product-crumb-name", currentProduct.name);
    show("product-price", money(currentProduct.price_cents));
    show("product-stock", stock.text);
    show("product-description", currentProduct.description || "Ask Pete or Lisa how this product fits your training plan.");

    const sizes = Array.isArray(currentProduct.sizes) ? currentProduct.sizes : [];
    const section = hook("product-size-section");
    const sizeHost = hook("product-sizes");
    selectedSize = sizes[0] || null;
    if (section) section.hidden = sizes.length === 0;
    if (sizeHost && sizes.length) {
      sizeHost.replaceChildren();
      sizes.forEach((size, index) => {
        const button = document.createElement("button");
        button.className = "size-pill";
        button.type = "button";
        button.dataset.size = size;
        button.setAttribute("aria-pressed", String(index === 0));
        button.textContent = size;
        button.addEventListener("click", () => {
          selectedSize = size;
          Array.from(sizeHost.querySelectorAll(".size-pill")).forEach((other) => {
            other.setAttribute("aria-pressed", String(other === button));
          });
        });
        sizeHost.appendChild(button);
      });
    }

    currentQuantity = 1;
    renderProductQuantity();
    const add = hook("product-add");
    if (add) {
      add.disabled = (Number(currentProduct.stock_qty) || 0) <= 0;
      if (add.disabled) add.lastChild.textContent = " Out of stock";
    }

    document.getElementById("qty-minus").addEventListener("click", () => {
      currentQuantity = Math.max(1, currentQuantity - 1);
      renderProductQuantity();
    });
    document.getElementById("qty-plus").addEventListener("click", () => {
      currentQuantity = Math.min(Number(currentProduct.stock_qty) || 1, currentQuantity + 1);
      renderProductQuantity();
    });
    if (add) {
      add.addEventListener("click", () => {
        try {
          addToCart(currentProduct, currentQuantity, selectedSize);
          show("product-message", "Added " + currentQuantity + (currentQuantity === 1 ? " item" : " items") + " to your cart.");
        } catch (error) {
          show("product-message", error.message || "We could not update your cart. Please try again.");
        }
      });
    }
  };

  const cartHost = hook("cart-items");
  const cartSamples = cartHost
    ? Array.from(cartHost.querySelectorAll(".line-item"))
    : [];
  const cartTemplates = {
    vial: cartSamples[0] || null,
    merch: cartSamples[1] || cartSamples[0] || null
  };
  let cartCatalogReady = false;
  let placingOrder = false;

  const cartLine = (product, entry) => {
    const source = Array.isArray(product.sizes) && product.sizes.length
      ? cartTemplates.merch
      : cartTemplates.vial;
    if (!source) return null;
    const item = source.cloneNode(true);
    item.removeAttribute("data-item");
    item.dataset.liveItem = "true";
    item.dataset.productId = product.id;
    item.dataset.unit = String((Number(product.price_cents) || 0) / 100);
    item.querySelector(".li-name").textContent = product.name;
    item.querySelector(".li-meta").textContent = categoryLabel(product.category) +
      (entry.size ? " · size " + entry.size : " · batch lab report included");
    item.querySelector('[data-role="qty"]').textContent = String(entry.qty);
    item.querySelector('[data-role="line-total"]').textContent = money(entry.qty * product.price_cents);
    const stepButtons = item.querySelectorAll(".li-step");
    stepButtons[0].setAttribute("aria-label", "Decrease quantity of " + product.name);
    stepButtons[1].setAttribute("aria-label", "Increase quantity of " + product.name);
    item.querySelector('[data-role="remove"]').setAttribute("aria-label", "Remove " + product.name + " from cart");
    return item;
  };

  const updateOrderAction = (hasItems, hasStockIssue) => {
    const action = hook("cart-order-action");
    if (!action) return;
    if (!hasItems) {
      action.textContent = "Place order";
      action.disabled = true;
      action.setAttribute("aria-disabled", "true");
      action.style.opacity = "0.55";
      return;
    }
    if (hasStockIssue) {
      action.textContent = "Review cart availability";
      action.disabled = true;
      action.setAttribute("aria-disabled", "true");
      action.style.opacity = "0.55";
      return;
    }
    action.textContent = profile ? "Place order" : "Sign in to order";
    action.disabled = false;
    action.setAttribute("aria-disabled", "false");
    action.style.opacity = "1";
  };

  const renderLiveCart = () => {
    if (!cartHost || !cartCatalogReady) return;
    cartHost.querySelectorAll(".line-item").forEach((item) => item.remove());
    const empty = hook("cart-empty");
    let subtotal = 0;
    let hasStockIssue = false;
    let unavailableRemoved = false;
    const validEntries = [];

    Object.keys(cart).forEach((productId) => {
      const product = catalog.find((item) => item.id === productId);
      if (!product) {
        delete cart[productId];
        unavailableRemoved = true;
        return;
      }
      const entry = cart[productId];
      if ((Number(product.stock_qty) || 0) < entry.qty) hasStockIssue = true;
      const line = cartLine(product, entry);
      if (line) {
        validEntries.push({ product: product, entry: entry });
        subtotal += entry.qty * (Number(product.price_cents) || 0);
        cartHost.insertBefore(line, empty);
      }
    });

    if (unavailableRemoved) {
      writeCart();
      show("cart-message", "An unavailable item was removed from your cart.");
    } else if (hasStockIssue) {
      show("cart-message", "One or more quantities exceed current stock. Adjust the cart before ordering.");
    } else if (!placingOrder) {
      show("cart-message", "");
    }
    if (empty) empty.hidden = validEntries.length > 0;
    show("cart-subtotal", money(subtotal));
    show("cart-total", money(subtotal));
    paintCartCount();
    updateOrderAction(validEntries.length > 0, hasStockIssue);
  };

  const bindCart = () => {
    if (!cartHost) return;
    cartHost.addEventListener("click", (event) => {
      const item = event.target.closest("[data-live-item]");
      if (!item) return;
      const productId = item.dataset.productId;
      const entry = cart[productId];
      if (!entry) return;
      const step = event.target.closest(".li-step");
      if (step) {
        const product = catalog.find((candidate) => candidate.id === productId);
        const next = Math.max(1, entry.qty + Number(step.dataset.step));
        if (product && next > Number(product.stock_qty)) {
          show("cart-message", "Only " + product.stock_qty + " are currently available.");
          return;
        }
        entry.qty = next;
        writeCart();
        renderLiveCart();
        return;
      }
      if (event.target.closest('[data-role="remove"]')) {
        delete cart[productId];
        writeCart();
        renderLiveCart();
      }
    });

    const action = hook("cart-order-action");
    if (action) {
      action.addEventListener("click", () => {
        if (action.disabled || placingOrder) return;
        if (!profile) {
          window.location.href = "portal.html";
          return;
        }
        const items = Object.keys(cart).map((productId) => ({
          product_id: productId,
          qty: cart[productId].qty,
          size: cart[productId].size
        }));
        if (!items.length) {
          show("cart-message", "Your cart is empty.");
          return;
        }
        placingOrder = true;
        action.disabled = true;
        action.textContent = "Placing order…";
        show("cart-message", "Checking current prices and stock…");
        Promise.resolve()
          .then(() => client.rpc("place_order", { items: items, note: null }))
          .then((result) => {
            if (result && result.error) throw new Error(result.error.message || "The order could not be placed.");
            const orderId = result && result.data;
            if (!orderId) throw new Error("The order service did not return an order number.");
            cart = {};
            writeCart();
            placingOrder = false;
            renderLiveCart();
            show("cart-message", "Order placed. Order ID: " + orderId);
          })
          .catch((error) => {
            placingOrder = false;
            renderLiveCart();
            show("cart-message", "We could not place the order: " + (error.message || "please check the cart and try again."));
          });
      });
    }
  };

  const renderCartPage = (products) => {
    catalog = products;
    cartCatalogReady = true;
    bindCart();
    renderLiveCart();
  };

  const showLoadFailure = () => {
    const message = "We could not load the store right now. Please check your connection and try again.";
    if (pageName === "shop" && shopGrid) {
      const note = document.createElement("p");
      note.textContent = message;
      shopGrid.replaceChildren(note);
    } else if (pageName === "product") {
      show("product-message", message);
      const add = hook("product-add");
      if (add) add.disabled = true;
    } else if (pageName === "cart") {
      show("cart-message", message);
      const action = hook("cart-order-action");
      if (action) action.disabled = true;
    }
  };

  const startPage = (supabaseClient) => {
    if (startAttempted) return;
    startAttempted = true;
    client = supabaseClient;
    fetchCatalog()
      .then((products) => {
        if (pageName === "shop") renderShop(products);
        else if (pageName === "product") renderProduct(products);
        else if (pageName === "cart") renderCartPage(products);
      })
      .catch(showLoadFailure);
  };

  const demoStrip = hook("storefront-demo-strip");
  if (demoStrip) demoStrip.hidden = true;
  paintCartCount();

  window.addEventListener("fonseca-auth-client-ready", (event) => {
    const readyClient = event.detail && event.detail.client;
    if (readyClient) startPage(readyClient);
  });

  window.addEventListener("storage", (event) => {
    if (event.key !== CART_KEY) return;
    cart = readCart();
    paintCartCount();
    if (pageName === "cart") renderLiveCart();
  });

  Promise.resolve(auth.init({
    onSignedIn: (signedInProfile) => {
      profile = signedInProfile || null;
      if (pageName === "cart") renderLiveCart();
    },
    onSignedOut: () => {
      profile = null;
      if (pageName === "cart") renderLiveCart();
    }
  })).then(() => {
    if (!client) showLoadFailure();
  }).catch(showLoadFailure);
})();
