"use strict";

// Configuración de PiruNet
const CONFIG = {
  whatsapp: "5493844546841",
  mercadoPago: "https://link.mercadopago.com.ar/pirunet"
};

// Elementos de la página
const networkSelect = document.getElementById("network");
const cartCount = document.getElementById("cart-count");
const cartPanel = document.getElementById("cart-panel");
const cartItems = document.getElementById("cart-items");
const cartTotal = document.getElementById("cart-total");
const checkoutTotal = document.getElementById("checkout-total");
const overlay = document.getElementById("overlay");
const checkoutModal = document.getElementById("checkout-modal");
const checkoutButton = document.getElementById("go-checkout");
const toast = document.getElementById("toast");

let cart = [];
let toastTimer;

// Formato de precios en pesos argentinos
function formatPrice(amount) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0
  }).format(amount);
}

// Total del carrito
function getTotal() {
  return cart.reduce((sum, item) => {
    return sum + item.price * item.quantity;
  }, 0);
}

// Cantidad total de unidades
function getItemCount() {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

// Mensaje emergente
function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2400);
}

// Abrir y cerrar carrito
function openCart() {
  cartPanel.classList.add("open");
  cartPanel.setAttribute("aria-hidden", "false");
  updateOverlay();
}

function closeCart() {
  cartPanel.classList.remove("open");
  cartPanel.setAttribute("aria-hidden", "true");
  updateOverlay();
}

// Abrir y cerrar formulario de compra
function openCheckout() {
  if (cart.length === 0) {
    showToast("Primero agregá un plan al carrito.");
    return;
  }

  closeCart();
  checkoutModal.classList.add("open");
  checkoutModal.setAttribute("aria-hidden", "false");
  updateOverlay();

  document.getElementById("customer-name").focus();
}

function closeCheckout() {
  checkoutModal.classList.remove("open");
  checkoutModal.setAttribute("aria-hidden", "true");
  updateOverlay();
}

function updateOverlay() {
  const isOpen =
    cartPanel.classList.contains("open") ||
    checkoutModal.classList.contains("open");

  overlay.classList.toggle("active", isOpen);
  document.body.classList.toggle("no-scroll", isOpen);
}

// Agregar un plan
function addToCart(days, price) {
  const network = networkSelect.value;
  const existing = cart.find(item =>
    item.days === days && item.network === network
  );

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      id: `${network}-${days}`,
      network,
      days,
      price,
      quantity: 1
    });
  }

  renderCart();
  showToast(`Plan de ${days} días agregado al carrito.`);
}

// Modificar la cantidad de un plan
function changeQuantity(id, change) {
  const item = cart.find(product => product.id === id);

  if (!item) return;

  item.quantity += change;

  if (item.quantity <= 0) {
    cart = cart.filter(product => product.id !== id);
  }

  renderCart();
}

// Eliminar un plan
function removeItem(id) {
  cart = cart.filter(item => item.id !== id);
  renderCart();
  showToast("Producto eliminado del carrito.");
}

// Renderizar carrito y totales
function renderCart() {
  cartCount.textContent = getItemCount();
  cartTotal.textContent = formatPrice(getTotal());
  checkoutTotal.textContent = formatPrice(getTotal());
  checkoutButton.disabled = cart.length === 0;

  if (cart.length === 0) {
    cartItems.innerHTML = `
      <div class="empty-cart">
        <span>🛒</span>
        <h3>Tu carrito está vacío</h3>
        <p>Agregá un plan para empezar tu pedido.</p>
      </div>
    `;
    return;
  }

  cartItems.innerHTML = cart.map(item => `
    <article class="cart-item">
      <div>
        <h3>Internet ${escapeHTML(item.network)}</h3>
        <p>Plan de ${item.days} días</p>

        <div class="item-actions">
          <button
            class="quantity-button"
            data-action="decrease"
            data-id="${escapeHTML(item.id)}"
            aria-label="Restar una unidad"
          >−</button>

          <span class="quantity">${item.quantity}</span>

          <button
            class="quantity-button"
            data-action="increase"
            data-id="${escapeHTML(item.id)}"
            aria-label="Agregar una unidad"
          >+</button>

          <button
            class="remove-button"
            data-action="remove"
            data-id="${escapeHTML(item.id)}"
          >Eliminar</button>
        </div>
      </div>

      <div class="item-price">
        ${formatPrice(item.price * item.quantity)}
      </div>
    </article>
  `).join("");
}

// Escapar texto antes de insertarlo en HTML
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };

    return entities[character];
  });
}

// Eventos de los botones para agregar planes
document.querySelectorAll(".add-button").forEach(button => {
  button.addEventListener("click", () => {
    const days = Number(button.dataset.days);
    const price = Number(button.dataset.price);

    if (![7, 15, 30].includes(days) || !Number.isFinite(price)) {
      showToast("No se pudo agregar ese plan.");
      return;
    }

    addToCart(days, price);
  });
});

// Eventos del carrito
cartItems.addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");

  if (!button) return;

  const id = button.dataset.id;
  const action = button.dataset.action;

  if (action === "increase") changeQuantity(id, 1);
  if (action === "decrease") changeQuantity(id, -1);
  if (action === "remove") removeItem(id);
});

// Botones para abrir y cerrar ventanas
document.getElementById("open-cart").addEventListener("click", openCart);
document.getElementById("close-cart").addEventListener("click", closeCart);
document.getElementById("continue-shopping").addEventListener("click", closeCart);

checkoutButton.addEventListener("click", openCheckout);

document.getElementById("close-checkout").addEventListener("click", closeCheckout);

overlay.addEventListener("click", () => {
  closeCart();
  closeCheckout();
});

// Cerrar ventanas con Escape
document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeCart();
    closeCheckout();
  }
});

// Preparar y enviar pedido por WhatsApp
document.getElementById("checkout-form").addEventListener("submit", event => {
  event.preventDefault();

  if (cart.length === 0) {
    showToast("Tu carrito está vacío.");
    closeCheckout();
    return;
  }

  const name = document.getElementById("customer-name").value.trim();
  const phone = document.getElementById("customer-phone").value.trim();
  const notes = document.getElementById("customer-notes").value.trim();

  if (!name || !phone) {
    showToast("Completá tu nombre y WhatsApp.");
    return;
  }

  const orderLines = cart.map(item => {
    return `• Internet ${item.network} - ${item.days} días x${item.quantity}: ${formatPrice(item.price * item.quantity)}`;
  });

  const total = getTotal();

  const message = [
    "¡Hola, PiruNet! Quiero realizar este pedido:",
    "",
    ...orderLines,
    "",
    `*Total: ${formatPrice(total)}*`,
    "",
    `Nombre: ${name}`,
    `Mi WhatsApp: ${phone}`,
    notes ? `Detalles: ${notes}` : "",
    "",
    "Quisiera coordinar el pago y la activación del servicio.",
    `Enlace de Mercado Pago: ${CONFIG.mercadoPago}`
  ].filter(Boolean).join("\n");

  const whatsappURL =
    `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(message)}`;

  // Abrir WhatsApp con el pedido preparado
  window.open(whatsappURL, "_blank", "noopener,noreferrer");
});

// Año automático en el pie de página
document.getElementById("year").textContent = new Date().getFullYear();

// Estado inicial
renderCart();
