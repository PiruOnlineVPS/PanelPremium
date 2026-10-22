const WHATSAPP_NUMBER = "5493844546841";
const MERCADO_PAGO_URL = "https://link.mercadopago.com.ar/pirunet";

const cart = [];

const cartCount = document.getElementById("cartCount");
const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");
const payButton = document.getElementById("payButton");
const confirmWhatsapp = document.getElementById("confirmWhatsapp");
const toast = document.getElementById("toast");

let toastTimer;
let pendingOrderMessage = "";

const money = value =>
  "$" + Number(value).toLocaleString("es-AR");

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}

function addPlan(provider, days, price) {
  const existing = cart.find(item =>
    item.provider === provider && item.days === days
  );

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      provider,
      days,
      price,
      qty: 1
    });
  }

  renderCart();
  showToast(`${provider} · ${days} días agregado al carrito`);
}

function changeQty(index, delta) {
  if (!cart[index]) return;

  cart[index].qty += delta;

  if (cart[index].qty <= 0) {
    cart.splice(index, 1);
  }

  renderCart();
}

function removeItem(index) {
  cart.splice(index, 1);
  renderCart();
}

function getTotal() {
  return cart.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );
}

function renderCart() {
  const count = cart.reduce(
    (sum, item) => sum + item.qty,
    0
  );

  cartCount.textContent = count;
  cartTotal.textContent = money(getTotal());
  payButton.disabled = cart.length === 0;

  if (cart.length === 0) {
    cartItems.innerHTML = `
      <div class="empty-cart">
        <span>＋</span>
        <b>Tu carrito está vacío</b>
        <small>Elegí un plan de Personal o Claro para comenzar.</small>
      </div>
    `;

    confirmWhatsapp.hidden = true;
    pendingOrderMessage = "";
    return;
  }

  cartItems.innerHTML = cart.map((item, index) => `
    <div class="cart-row">
      <div>
        <div class="cart-row-title">
          ${item.provider} · ${item.days} días
        </div>
        <div class="cart-row-sub">
          ${money(item.price)} por plan
        </div>
      </div>

      <div class="cart-row-right">
        <div class="cart-row-price">
          ${money(item.price * item.qty)}
        </div>

        <div class="quantity-controls">
          <button type="button"
            aria-label="Restar unidad"
            data-action="minus"
            data-index="${index}">−</button>

          <span>${item.qty}</span>

          <button type="button"
            aria-label="Sumar unidad"
            data-action="plus"
            data-index="${index}">+</button>

          <button type="button"
            class="remove"
            data-action="remove"
            data-index="${index}">Quitar</button>
        </div>
      </div>
    </div>
  `).join("");
}

// Agregar los planes al carrito.
document.querySelectorAll(".plan-option").forEach(button => {
  button.addEventListener("click", () => {
    addPlan(
      button.dataset.provider,
      Number(button.dataset.days),
      Number(button.dataset.price)
    );
  });
});

// Los botones de cada compañía llevan al primer plan disponible.
document.querySelectorAll("[data-provider-select]").forEach(button => {
  button.addEventListener("click", () => {
    const provider = button.dataset.providerSelect;
    const card = document.querySelector(
      `.provider-card[data-provider="${provider}"]`
    );

    card?.querySelector(".plan-option")?.focus();
    showToast(`Elegí la duración de ${provider}`);
  });
});

// Controles de cantidad y eliminación.
cartItems.addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");

  if (!button) return;

  const index = Number(button.dataset.index);

  if (button.dataset.action === "minus") {
    changeQty(index, -1);
  }

  if (button.dataset.action === "plus") {
    changeQty(index, 1);
  }

  if (button.dataset.action === "remove") {
    removeItem(index);
  }
});

// Ir al carrito.
document.getElementById("cartShortcut").addEventListener("click", () => {
  document.getElementById("carrito").scrollIntoView({
    behavior: "smooth"
  });
});

// Preparar el pedido y abrir Mercado Pago.
document.getElementById("buyerForm").addEventListener("submit", event => {
  event.preventDefault();

  if (cart.length === 0) {
    showToast("Primero agregá un plan al carrito.");
    return;
  }

  const name = document.getElementById("buyerName").value.trim();
  const phone = document.getElementById("buyerPhone").value.trim();

  if (!name || !phone) {
    showToast("Completá tu nombre y WhatsApp.");
    return;
  }

  const total = getTotal();

  const orderLines = cart.map(item =>
    `• ${item.provider} — ${item.days} días x${item.qty}: ${money(item.price * item.qty)}`
  ).join("\n");

  pendingOrderMessage =
`Hola, quiero confirmar mi compra en PiruNet.

Nombre: ${name}
Mi WhatsApp: ${phone}

Pedido:
${orderLines}

Total del pedido: ${money(total)}

Voy a realizar el pago por Mercado Pago y enviaré el comprobante para que puedan verificarlo.`;

  const proceed = window.confirm(
    `Total del pedido: ${money(total)}.\n\n` +
    `Se abrirá Mercado Pago. Tu enlace actual es general y no carga automáticamente el importe del carrito.\n\n` +
    `Revisá el monto antes de pagar. Después volvé a esta página y tocá "Ya pagué · Confirmar por WhatsApp".\n\n` +
    `¿Querés continuar?`
  );

  if (!proceed) return;

  confirmWhatsapp.hidden = false;

  // Abrir el enlace general de Mercado Pago.
  window.open(
    MERCADO_PAGO_URL,
    "_blank",
    "noopener,noreferrer"
  );

  showToast(
    "Mercado Pago se abrió. Al volver, confirmá tu pedido por WhatsApp."
  );
});

// Enviar el resumen al WhatsApp del vendedor.
confirmWhatsapp.addEventListener("click", () => {
  if (!pendingOrderMessage) {
    showToast("Volvé a preparar tu pedido antes de confirmar.");
    return;
  }

  const whatsappURL =
    `https://wa.me/${WHATSAPP_NUMBER}?text=` +
    encodeURIComponent(pendingOrderMessage);

  window.open(
    whatsappURL,
    "_blank",
    "noopener,noreferrer"
  );
});

// Año automático en el pie de página.
document.getElementById("year").textContent =
  new Date().getFullYear();

// Animaciones al aparecer los elementos en pantalla.
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll(".reveal").forEach(element => {
    observer.observe(element);
  });
} else {
  document.querySelectorAll(".reveal").forEach(element => {
    element.classList.add("visible");
  });
}

// Mostrar el carrito vacío al cargar la página.
renderCart();
