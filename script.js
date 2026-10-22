const WHATSAPP_NUMBER = "5493844546841";
const MERCADO_PAGO_URL = "https://link.mercadopago.com.ar/pirunet";

const cart = [];

const selectedPlans = {
  Personal: null,
  Claro: null
};

const cartItemsElement = document.getElementById("cart-items");
const cartCountElement = document.getElementById("cart-count");
const cartSubtotalElement = document.getElementById("cart-subtotal");
const cartTotalElement = document.getElementById("cart-total");
const checkoutButton = document.getElementById("checkout-button");
const toastElement = document.getElementById("toast");

let toastTimeout;
let orderPrepared = false;

document.getElementById("current-year").textContent =
  new Date().getFullYear();

function formatPrice(amount) {
  return "$" + amount.toLocaleString("es-AR");
}

function showToast(message) {
  toastElement.textContent = message;
  toastElement.classList.add("show");

  clearTimeout(toastTimeout);

  toastTimeout = setTimeout(() => {
    toastElement.classList.remove("show");
  }, 2600);
}

function getCartQuantity() {
  return cart.reduce((total, item) => total + item.quantity, 0);
}

function getCartTotal() {
  return cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
}

// SELECCIONAR UN PLAN SIN AGREGARLO AUTOMÁTICAMENTE

document.querySelectorAll("[data-plan-option]").forEach((option) => {
  option.addEventListener("click", () => {
    const provider = option.dataset.provider;
    const days = Number(option.dataset.days);
    const price = Number(option.dataset.price);

    selectedPlans[provider] = { provider, days, price };

    document
      .querySelectorAll(
        `[data-plan-option][data-provider="${provider}"]`
      )
      .forEach((plan) => {
        const isSelected = plan === option;

        plan.classList.toggle("selected", isSelected);
        plan.setAttribute("aria-pressed", String(isSelected));
      });

    const addButton = document.querySelector(
      `[data-add-provider="${provider}"]`
    );

    const helpText = document.querySelector(
      `[data-selection-help="${provider}"]`
    );

    addButton.disabled = false;
    addButton.textContent =
      `Agregar ${days} días · ${formatPrice(price)}`;

    helpText.textContent =
      `Seleccionaste ${days} días por ${formatPrice(price)}.`;

    showToast(`Plan de ${provider} seleccionado.`);
  });
});

// AGREGAR AL CARRITO SOLO AL TOCAR EL BOTÓN

document.querySelectorAll("[data-add-provider]").forEach((button) => {
  button.addEventListener("click", () => {
    const provider = button.dataset.addProvider;
    const selected = selectedPlans[provider];

    if (!selected) {
      showToast("Primero seleccioná un plan.");
      return;
    }

    addPlan(selected);

    selectedPlans[provider] = null;

    document
      .querySelectorAll(
        `[data-plan-option][data-provider="${provider}"]`
      )
      .forEach((option) => {
        option.classList.remove("selected");
        option.setAttribute("aria-pressed", "false");
      });

    button.disabled = true;
    button.textContent = "Seleccioná un plan";

    document.querySelector(
      `[data-selection-help="${provider}"]`
    ).textContent = "Plan agregado. Podés elegir otro.";

    renderCart();
    showToast("¡Plan agregado al carrito!");
  });
});

function addPlan(plan) {
  const existingItem = cart.find(
    (item) =>
      item.provider === plan.provider &&
      item.days === plan.days &&
      item.price === plan.price
  );

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      provider: plan.provider,
      days: plan.days,
      price: plan.price,
      quantity: 1
    });
  }

  orderPrepared = false;
  resetCheckoutButton();
}

function removePlan(index) {
  cart.splice(index, 1);
  orderPrepared = false;

  resetCheckoutButton();
  renderCart();

  showToast("Producto eliminado del carrito.");
}

function resetCheckoutButton() {
  checkoutButton.textContent = "Continuar con el pedido →";
  checkoutButton.disabled = cart.length === 0;
}

function renderCart() {
  const quantity = getCartQuantity();
  const total = getCartTotal();

  cartCountElement.textContent = quantity;
  cartSubtotalElement.textContent = quantity;
  cartTotalElement.textContent = formatPrice(total);

  if (cart.length === 0) {
    cartItemsElement.innerHTML = `
      <div class="empty-cart">
        <span class="empty-cart-icon">🛒</span>
        <h3>Tu carrito está vacío</h3>
        <p>Elegí un plan y tocá “Agregar al carrito”.</p>
        <a href="#planes" class="text-link">Ver planes disponibles →</a>
      </div>
    `;

    resetCheckoutButton();
    return;
  }

  cartItemsElement.innerHTML = cart
    .map(
      (item, index) => `
        <div class="cart-item">
          <div class="cart-item-info">
            <strong>${item.provider === "Claro" ? "Claro Ar" : "Personal"} · ${item.days} días</strong>
            <small>
              ${formatPrice(item.price)} por plan
              ${item.quantity > 1 ? ` · Cantidad: ${item.quantity}` : ""}
            </small>
          </div>

          <span class="cart-item-price">
            ${formatPrice(item.price * item.quantity)}
          </span>

          <button
            class="remove-item"
            type="button"
            data-remove-item="${index}"
            aria-label="Eliminar producto"
            title="Eliminar producto"
          >×</button>
        </div>
      `
    )
    .join("");

  cartItemsElement.querySelectorAll("[data-remove-item]").forEach((button) => {
    button.addEventListener("click", () => {
      removePlan(Number(button.dataset.removeItem));
    });
  });

  checkoutButton.disabled = false;
}

function buildOrderMessage() {
  const lines = cart.map((item) => {
    const providerName =
      item.provider === "Claro" ? "Claro Ar" : "Personal";

    return (
      `• ${providerName} - ${item.days} días` +
      ` x${item.quantity}: ${formatPrice(item.price * item.quantity)}`
    );
  });

  return [
    "¡Hola, PiruNet! Quiero confirmar mi pedido.",
    "",
    ...lines,
    "",
    `Total del pedido: ${formatPrice(getCartTotal())}`,
    "",
    "Voy a enviar el comprobante de pago para su verificación.",
    "Por favor, confirmen la acreditación antes de activar el servicio."
  ].join("\n");
}

// PRIMER TOQUE: MERCADO PAGO
// SEGUNDO TOQUE: WHATSAPP PARA CONFIRMAR

checkoutButton.addEventListener("click", () => {
  if (cart.length === 0) {
    showToast("Agregá al menos un plan al carrito.");
    return;
  }

  if (!orderPrepared) {
    const paymentWindow = window.open(
      MERCADO_PAGO_URL,
      "_blank",
      "noopener,noreferrer"
    );

    if (!paymentWindow) {
      window.location.href = MERCADO_PAGO_URL;
      return;
    }

    orderPrepared = true;

    checkoutButton.textContent =
      "Ya pagué: confirmar por WhatsApp →";

    showToast(
      "Abrimos Mercado Pago. Pagá el importe correspondiente al pedido."
    );

    return;
  }

  const message = buildOrderMessage();
  const whatsappURL =
    `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

  window.open(whatsappURL, "_blank", "noopener,noreferrer");

  showToast("Enviá el mensaje y adjuntá tu comprobante de pago.");
});

// ANIMACIONES DE ENTRADA

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  document.querySelectorAll(".reveal").forEach((element) => {
    observer.observe(element);
  });
}

renderCart();                                
