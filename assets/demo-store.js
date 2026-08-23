/* Fonseca Fitness — connected storefront behavior for the public preview.
   Live Supabase pages keep using shop-data.js; this file only runs in demo mode. */
(function () {
  "use strict";

  if (window.FonsecaAuth && window.FonsecaAuth.enabled) return;

  var CART_KEY = "fonseca-cart-demo-v2";
  var PRODUCTS = {
    "bpc-157-5": {
      family: "bpc-157",
      name: "BPC-157",
      displayName: "BPC-157 · 5mg",
      category: "Recovery",
      price: 54,
      size: "5mg",
      kind: "vial",
      accent: "#bd8a3d"
    },
    "bpc-157-10": {
      family: "bpc-157",
      name: "BPC-157",
      displayName: "BPC-157 · 10mg",
      category: "Recovery",
      price: 89,
      size: "10mg",
      kind: "vial",
      accent: "#bd8a3d"
    },
    "tb-500-5": {
      family: "tb-500",
      name: "TB-500",
      displayName: "TB-500 · 5mg",
      category: "Recovery",
      price: 62,
      size: "5mg",
      kind: "vial",
      accent: "#b3262d"
    },
    "cjc-ipamorelin-10": {
      family: "cjc-ipamorelin",
      name: "CJC-1295 / Ipamorelin",
      displayName: "CJC-1295 / Ipamorelin · 10mg",
      category: "Growth & performance",
      price: 89,
      size: "10mg",
      kind: "vial",
      accent: "#2f6e4f"
    },
    "mots-c-10": {
      family: "mots-c",
      name: "MOTS-c",
      displayName: "MOTS-c · 10mg",
      category: "Metabolic",
      price: 74,
      size: "10mg",
      kind: "vial",
      accent: "#0f2740",
      unavailable: true
    },
    "tee-navy": {
      family: "tee-navy",
      name: "Fonseca Fitness Tee · Navy",
      displayName: "Fonseca Fitness Tee · Navy",
      category: "Merch",
      price: 28,
      size: "L",
      kind: "tee",
      color: "#0f2740"
    },
    "tee-bone": {
      family: "tee-bone",
      name: "Fonseca Fitness Tee · Bone",
      displayName: "Fonseca Fitness Tee · Bone",
      category: "Merch",
      price: 28,
      size: "L",
      kind: "tee",
      color: "#f5f3ee"
    }
  };

  var PRODUCT_FAMILIES = {
    "bpc-157": ["bpc-157-5", "bpc-157-10"],
    "tb-500": ["tb-500-5"],
    "cjc-ipamorelin": ["cjc-ipamorelin-10"],
    "mots-c": ["mots-c-10"],
    "tee-navy": ["tee-navy"],
    "tee-bone": ["tee-bone"]
  };

  function money(value) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(value);
  }

  function readCart() {
    var parsed;
    try {
      parsed = JSON.parse(localStorage.getItem(CART_KEY) || "{}");
    } catch (error) {
      return {};
    }
    if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") return {};
    return Object.keys(parsed).reduce(function (safe, key) {
      var entry = parsed[key];
      var qty = Number(entry && entry.qty);
      if (PRODUCTS[entry && entry.productId] && Number.isInteger(qty) && qty > 0) {
        safe[key] = {
          productId: entry.productId,
          qty: qty,
          size: typeof entry.size === "string" ? entry.size : ""
        };
      }
      return safe;
    }, {});
  }

  var cart = readCart();

  function writeCart() {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch (error) {
      /* The preview remains usable when storage is unavailable. */
    }
  }

  function itemKey(productId, size) {
    return productId + "::" + (size || PRODUCTS[productId].size || "one-size");
  }

  function units() {
    return Object.keys(cart).reduce(function (total, key) {
      return total + cart[key].qty;
    }, 0);
  }

  function paintCartCount() {
    var count = units();
    document.querySelectorAll('[data-hook="storefront-cart-count"], #cart-count').forEach(function (badge) {
      badge.textContent = String(count);
      badge.hidden = count === 0;
    });
    document.querySelectorAll("#cart-button").forEach(function (button) {
      button.setAttribute("aria-label", count ? "Cart, " + count + (count === 1 ? " item" : " items") : "Cart, empty");
    });
  }

  function addItem(productId, qty, size) {
    var product = PRODUCTS[productId];
    if (!product || product.unavailable) return false;
    var key = itemKey(productId, size);
    if (!cart[key]) {
      cart[key] = { productId: productId, qty: 0, size: size || product.size || "" };
    }
    cart[key].qty += Math.max(1, Number(qty) || 1);
    writeCart();
    paintCartCount();
    return true;
  }

  function confirmAdd(button, product, qty) {
    var original = button.textContent;
    button.textContent = qty === 1 ? "Added ✓" : "Added " + qty + " ✓";
    window.setTimeout(function () {
      button.textContent = original;
    }, 1300);
    var pageMessage = document.querySelector('[data-hook="product-message"]');
    if (pageMessage) {
      pageMessage.textContent = "Added " + qty + (qty === 1 ? " item" : " items") + " to your preview cart.";
    }
  }

  function bindQuickAdds() {
    document.querySelectorAll("[data-demo-product]").forEach(function (button) {
      button.addEventListener("click", function () {
        var product = PRODUCTS[button.dataset.demoProduct];
        if (!product || !addItem(button.dataset.demoProduct, 1, product.size)) return;
        confirmAdd(button, product, 1);
      });
    });
  }

  function vialSvg(accent, label) {
    return '<svg width="140" height="212" viewBox="0 0 64 96" fill="none" role="img" aria-label="Sample package illustration for ' + label + '">' +
      '<rect x="24" y="4" width="16" height="10" rx="2" fill="#0f2740"></rect>' +
      '<rect x="20" y="14" width="24" height="6" rx="2" fill="' + accent + '"></rect>' +
      '<rect x="14" y="22" width="36" height="66" rx="6" fill="#ffffff" stroke="#0f2740" stroke-width="2"></rect>' +
      '<rect x="18" y="46" width="28" height="30" rx="3" fill="#f5f3ee" stroke="#ded8cc"></rect>' +
      '<rect x="21" y="51" width="22" height="4" rx="1" fill="#0f2740"></rect>' +
      '<rect x="21" y="59" width="16" height="3" rx="1" fill="' + accent + '"></rect></svg>';
  }

  function teeSvg(color, label) {
    return '<svg width="180" height="180" viewBox="0 0 96 96" fill="none" role="img" aria-label="Sample illustration of ' + label + '">' +
      '<path d="M34 18 20 26l6 16 8-4v40h28V38l8 4 6-16-14-8a10 10 0 0 1-28 0Z" fill="' + color + '" stroke="#0f2740" stroke-width="2" stroke-linejoin="round"></path>' +
      '<circle cx="48" cy="52" r="10" fill="none" stroke="#b3262d" stroke-width="2.5"></circle>' +
      '<path d="M44 52h8M48 48v8" stroke="#b3262d" stroke-width="2.5" stroke-linecap="round"></path></svg>';
  }

  function selectedFamily() {
    var requested = new URLSearchParams(window.location.search).get("demo") || "bpc-157";
    return PRODUCT_FAMILIES[requested] ? requested : "bpc-157";
  }

  function renderProductPage() {
    if (document.body.dataset.storefrontPage !== "product") return;
    var family = selectedFamily();
    var ids = PRODUCT_FAMILIES[family];
    var currentId = ids[0];
    var current = PRODUCTS[currentId];
    var quantity = 1;
    var selectedSize = current.size;
    var category = document.querySelector('[data-hook="product-category"]');
    var name = document.querySelector('[data-hook="product-name"]');
    var crumb = document.querySelector('[data-hook="product-crumb-name"]');
    var crumbCategory = document.querySelector('[data-hook="product-crumb-category"]');
    var price = document.querySelector('[data-hook="product-price"]');
    var stock = document.querySelector('[data-hook="product-stock"]');
    var description = document.querySelector('[data-hook="product-description"]');
    var sizes = document.querySelector('[data-hook="product-sizes"]');
    var add = document.querySelector('[data-hook="product-add"]');
    var qty = document.querySelector('[data-hook="product-qty"]');
    var gallery = document.querySelector(".gallery-main");

    category.textContent = current.category;
    name.textContent = current.name;
    crumb.textContent = current.name;
    crumbCategory.textContent = current.category;
    price.textContent = money(current.price);
    stock.textContent = current.unavailable ? "Preview only · unavailable" : "Sample item";
    stock.className = "stock-pill" + (current.unavailable ? " is-out" : "");
    description.textContent = current.kind === "tee"
      ? "A sample merchandise page showing how colors, sizes, quantities, and cart choices could work in a future store."
      : "A sample product-page layout showing where reviewed product details, documentation, and coach guidance could appear before any future sale.";
    gallery.innerHTML = current.kind === "tee"
      ? teeSvg(current.color, current.name)
      : vialSvg(current.accent, current.name);

    var choices = current.kind === "tee"
      ? ["S", "M", "L", "XL", "2XL"].map(function (size) {
          return { id: currentId, size: size, price: current.price };
        })
      : ids.map(function (id) {
          return { id: id, size: PRODUCTS[id].size, price: PRODUCTS[id].price };
        });

    currentId = choices[0].id;
    selectedSize = choices[0].size;

    sizes.replaceChildren();
    choices.forEach(function (choice, index) {
      var pill = document.createElement("button");
      pill.className = "size-pill";
      pill.type = "button";
      pill.dataset.productId = choice.id;
      pill.dataset.size = choice.size;
      pill.dataset.price = choice.price.toFixed(2);
      pill.setAttribute("aria-pressed", String(index === 0));
      pill.textContent = choice.size;
      pill.addEventListener("click", function () {
        sizes.querySelectorAll(".size-pill").forEach(function (other) {
          other.setAttribute("aria-pressed", String(other === pill));
        });
        currentId = choice.id;
        current = PRODUCTS[currentId];
        selectedSize = choice.size;
        price.textContent = money(choice.price);
      });
      sizes.appendChild(pill);
    });

    document.getElementById("qty-minus").addEventListener("click", function () {
      quantity = Math.max(1, quantity - 1);
      qty.textContent = String(quantity);
    });
    document.getElementById("qty-plus").addEventListener("click", function () {
      quantity += 1;
      qty.textContent = String(quantity);
    });

    add.disabled = Boolean(current.unavailable);
    if (current.unavailable) add.textContent = "Unavailable in preview";
    var documentation = document.querySelector(".lab-card");
    if (documentation) documentation.hidden = current.kind === "tee";
    add.addEventListener("click", function () {
      if (addItem(currentId, quantity, selectedSize)) confirmAdd(add, current, quantity);
    });
  }

  function cartThumb(product) {
    if (product.kind === "tee") {
      return teeSvg(product.color, product.name).replace('width="180" height="180"', 'width="42" height="42"');
    }
    return vialSvg(product.accent, product.name).replace('width="140" height="212"', 'width="34" height="52"');
  }

  function buildLineItem(key, entry) {
    var product = PRODUCTS[entry.productId];
    var item = document.createElement("article");
    item.className = "line-item";
    item.dataset.item = key;
    item.innerHTML = '<div class="li-thumb">' + cartThumb(product) + '</div>' +
      '<div class="li-info"><span class="li-name">' + product.displayName + '</span>' +
      '<span class="li-meta">' + product.category + (entry.size ? " · size " + entry.size : "") + '</span></div>' +
      '<div class="li-stepper"><button class="li-step" type="button" data-step="-1" aria-label="Decrease quantity of ' + product.name + '">−</button>' +
      '<span class="li-qty" data-role="qty" aria-live="polite">' + entry.qty + '</span>' +
      '<button class="li-step" type="button" data-step="1" aria-label="Increase quantity of ' + product.name + '">+</button></div>' +
      '<span class="li-price" data-role="line-total">' + money(product.price * entry.qty) + '</span>' +
      '<button class="li-remove" type="button" data-role="remove" aria-label="Remove ' + product.name + ' from cart">' +
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M6.5 7l1 13a2 2 0 0 0 2 1.8h5a2 2 0 0 0 2-1.8l1-13"></path></svg></button>';
    item.querySelectorAll("[data-step]").forEach(function (button) {
      button.addEventListener("click", function () {
        cart[key].qty = Math.max(1, cart[key].qty + Number(button.dataset.step));
        writeCart();
        renderCartPage();
      });
    });
    item.querySelector('[data-role="remove"]').addEventListener("click", function () {
      delete cart[key];
      writeCart();
      renderCartPage();
    });
    return item;
  }

  function renderCartPage() {
    if (document.body.dataset.storefrontPage !== "cart") return;
    var container = document.querySelector('[data-hook="cart-items"]');
    var empty = document.querySelector('[data-hook="cart-empty"]');
    var subtotal = 0;
    container.querySelectorAll(".line-item").forEach(function (item) { item.remove(); });
    Object.keys(cart).forEach(function (key) {
      var entry = cart[key];
      var product = PRODUCTS[entry.productId];
      subtotal += product.price * entry.qty;
      empty.insertAdjacentElement("beforebegin", buildLineItem(key, entry));
    });
    empty.hidden = Object.keys(cart).length > 0;
    document.querySelector('[data-hook="cart-subtotal"]').textContent = money(subtotal);
    document.querySelector('[data-hook="cart-total"]').textContent = money(subtotal);
    var action = document.querySelector('[data-hook="cart-order-action"]');
    action.disabled = units() === 0;
    action.setAttribute("aria-disabled", String(units() === 0));
    paintCartCount();
  }

  function bindCheckoutPreview() {
    if (document.body.dataset.storefrontPage !== "cart") return;
    var action = document.querySelector('[data-hook="cart-order-action"]');
    action.addEventListener("click", function () {
      document.querySelector('[data-hook="cart-message"]').textContent =
        "This is a preview only—no checkout, payment, or order has been set up.";
    });
  }

  function init() {
    paintCartCount();
    bindQuickAdds();
    renderProductPage();
    renderCartPage();
    bindCheckoutPreview();
  }

  window.FonsecaDemoCart = { addItem: addItem, readCart: readCart };
  document.addEventListener("DOMContentLoaded", init, { once: true });
  window.addEventListener("storage", function (event) {
    if (event.key !== CART_KEY) return;
    cart = readCart();
    paintCartCount();
    renderCartPage();
  });
})();
