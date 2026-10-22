// PiruNet Internet ilimitado — carrito y pedido.
const WHATSAPP_NUMBER = "5493844546841";
const MERCADO_PAGO_URL = "https://link.mercadopago.com.ar/pirunet";

const money = value => "$" + Number(value).toLocaleString("es-AR");
let selectedProvider = "Personal";
let cart = [];
let toastTimeout;

const drawer = document.getElementById("cart-drawer");
const overlay = document.getElementById("cart-overlay");
const itemsContainer = document.getElementById("cart-items");
const checkout = document.getElementById("checkout");
const toast = document.getElementById("toast");

document.getElementById("year").textContent = new Date().getFullYear();

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("show"), 2600);
}

function openCart() {
  drawer.classList.add("open");
  overlay.classList.add("open");
  drawer.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeCart() {
  drawer.classList.remove("open");
  overlay.classList.remove("open");
  drawer.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

const TRIAL_MESSAGE = "¡Hola! 👋 Quiero solicitar una prueba gratis de PiruNet antes de contratar un plan. ¿Me podrías pasar un usuario y contraseña para probar el servicio? 😊";

document.getElementById("trial-button").addEventListener("click", () => {
  const url = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(TRIAL_MESSAGE);
  window.open(url, "_blank", "noopener,noreferrer");
});

document.getElementById("open-cart").addEventListener("click", openCart);
document.getElementById("close-cart").addEventListener("click", closeCart);
overlay.addEventListener("click", closeCart);

document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeCart();
});

document.querySelectorAll(".provider").forEach(button => {
  button.addEventListener("click", () => {
    selectedProvider = button.dataset.provider;

    document.querySelectorAll(".provider").forEach(option => {
      option.classList.toggle("active", option === button);
    });

    showToast("Seleccionaste " + selectedProvider);
  });
});

document.querySelectorAll(".add-plan").forEach(button => {
  button.addEventListener("click", () => {
    const card = button.closest(".plan-card");
    const days = Number(card.dataset.days);
    const price = Number(card.dataset.price);
    const key = selectedProvider + "-" + days;
    const existing = cart.find(item => item.key === key);

    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({
        key,
        provider: selectedProvider,
        days,
        price,
        qty: 1
      });
    }

    renderCart();
    showToast("Plan de " + days + " días agregado al carrito");
  });
});

function itemCount() {
  return cart.reduce((sum, item) => sum + item.qty, 0);
}

function cartTotal() {
  return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function renderCart() {
  const count = itemCount();

  document.getElementById("cart-count").textContent = count;
  document.getElementById("drawer-count").textContent = "(" + count + ")";

  if (!cart.length) {
    itemsContainer.innerHTML = `
      <div class="empty-cart">
        <div class="empty-icon">🛒</div>
        <h3>Tu carrito está vacío</h3>
        <p>Elegí un plan para empezar tu pedido.</p>
        <button class="button button-primary" id="browse-plans" type="button">Ver planes</button>
      </div>`;

    document.getElementById("browse-plans").addEventListener("click", () => {
      closeCart();
      document.getElementById("planes").scrollIntoView({ behavior: "smooth" });
    });

    checkout.hidden = true;
    return;
  }

  checkout.hidden = false;

  itemsContainer.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div>
        <div class="item-title">${item.provider} · ${item.days} días</div>
        <div class="item-meta">Internet ilimitado · ${money(item.price)} por plan</div>
        <div class="quantity-controls">
          <button type="button" data-action="minus" data-key="${item.key}" aria-label="Restar uno">−</button>
          <span>${item.qty}</span>
          <button type="button" data-action="plus" data-key="${item.key}" aria-label="Sumar uno">＋</button>
          <button type="button" class="remove" data-action="remove" data-key="${item.key}">Eliminar</button>
        </div>
      </div>
      <div class="item-price">${money(item.price * item.qty)}</div>
    </div>
  `).join("");

  document.getElementById("cart-total").textContent = money(cartTotal());
}

itemsContainer.addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const item = cart.find(entry => entry.key === button.dataset.key);
  if (!item) return;

  if (button.dataset.action === "plus") {
    item.qty += 1;
  }

  if (button.dataset.action === "minus") {
    item.qty -= 1;
  }

  if (button.dataset.action === "remove" || item.qty <= 0) {
    cart = cart.filter(entry => entry.key !== item.key);
  }

  renderCart();
});

function getCustomer() {
  const name = document.getElementById("customer-name").value.trim();
  const phone = document.getElementById("customer-phone").value.trim();

  if (!cart.length) {
    showToast("Agregá al menos un plan al carrito.");
    return null;
  }

  if (!name) {
    showToast("Ingresá tu nombre para continuar.");
    document.getElementById("customer-name").focus();
    return null;
  }

  if (phone.replace(/\D/g, "").length < 8) {
    showToast("Ingresá un WhatsApp válido.");
    document.getElementById("customer-phone").focus();
    return null;
  }

  return { name, phone };
}

function buildOrderMessage(customer) {
  const lines = cart.map(item =>
    "• " + item.provider + " — " + item.days +
    " días x " + item.qty + ": " + money(item.price * item.qty)
  );

  return "Hola PiruNet, quiero confirmar este pedido:\n\n" +
    lines.join("\n") +
    "\n\nTotal del pedido: " + money(cartTotal()) +
    "\nNombre: " + customer.name +
    "\nMi WhatsApp: " + customer.phone +
    "\n\nQuedo atento/a para coordinar el pago y la activación.";
}

document.getElementById("whatsapp-button").addEventListener("click", () => {
  const customer = getCustomer();
  if (!customer) return;

  const url = "https://wa.me/" + WHATSAPP_NUMBER +
    "?text=" + encodeURIComponent(buildOrderMessage(customer));

  window.open(url, "_blank", "noopener,noreferrer");
});

document.getElementById("pay-button").addEventListener("click", () => {
  const customer = getCustomer();
  if (!customer) return;

  // Mercado Pago abre el enlace general de PiruNet.
  // No genera automáticamente un pago por el total del carrito.
  try {
    sessionStorage.setItem(
      "pirunet_pedido_pendiente",
      buildOrderMessage(customer)
    );
  } catch (error) {
    // El carrito sigue funcionando si el navegador bloquea el almacenamiento.
  }

  window.open(MERCADO_PAGO_URL, "_blank", "noopener,noreferrer");

  showToast("Mercado Pago se abrió. Confirmá el importe y enviá el pedido por WhatsApp.");
});

renderCart();
