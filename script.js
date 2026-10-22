const WHATSAPP_NUMBER = "5493844546841";

const cart = [];
const selectedPlans = new Map();

const money = amount =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0
  }).format(amount);

const cartItems = document.getElementById("cart-items");
const cartCount = document.getElementById("cart-count");
const cartTotal = document.getElementById("cart-total");
const summaryQuantity = document.getElementById("summary-quantity");
const checkoutButton = document.getElementById("checkout-button");
const toast = document.getElementById("toast");

document.getElementById("current-year").textContent =
  new Date().getFullYear();

let toastTimeout;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}

document.querySelectorAll(".provider-card").forEach(card => {
  const options = card.querySelectorAll(".plan-option");
  const addButton = card.querySelector(".btn-add-selected");
  const help = card.querySelector(".selection-help");

  if (!options.length || !addButton) return;

  options.forEach(option => {
    option.addEventListener("click", () => {
      options.forEach(item => item.classList.remove("selected"));
      option.classList.add("selected");

      addButton.disabled = false;

      selectedPlans.set(card, {
        provider: option.dataset.provider,
        days: Number(option.dataset.days),
        price: Number(option.dataset.price)
      });

      help.textContent =
        `${option.dataset.days} días seleccionados · ${money(Number(option.dataset.price))}`;
    });
  });

  addButton.addEventListener("click", () => {
    const plan = selectedPlans.get(card);

    if (!plan) {
      showToast("Primero seleccioná un plan.");
      return;
    }

    cart.push({
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      ...plan
    });

    renderCart();
    showToast("Plan agregado al carrito.");
  });
});

function renderCart() {
  const total = cart.reduce((sum, item) => sum + item.price, 0);

  cartCount.textContent = cart.length;
  summaryQuantity.textContent = cart.length;
  cartTotal.textContent = money(total);
  checkoutButton.disabled = cart.length === 0;

  cartItems.innerHTML = "";

  if (cart.length === 0) {
    cartItems.innerHTML = `
      <div class="empty-cart">
        <div class="empty-cart-icon">🛒</div>
        <h3>Tu carrito está vacío</h3>
        <p>Elegí un plan de Personal o Claro para comenzar.</p>
        <a class="text-link" href="#planes">Ver planes disponibles →</a>
      </div>
    `;
    return;
  }

  cart.forEach(item => {
    const element = document.createElement("div");
    element.className = "cart-item";

    const info = document.createElement("div");
    info.className = "cart-item-info";

    const title = document.createElement("strong");
    title.textContent = `${item.provider} · ${item.days} días`;

    const description = document.createElement("small");
    description.textContent = "Plan de internet";

    info.append(title, description);

    const price = document.createElement("span");
    price.className = "cart-item-price";
    price.textContent = money(item.price);

    const remove = document.createElement("button");
    remove.className = "remove-item";
    remove.type = "button";
    remove.textContent = "×";
    remove.setAttribute("aria-label", `Quitar plan de ${item.provider} de ${item.days} días`);

    remove.addEventListener("click", () => {
      const index = cart.findIndex(product => product.id === item.id);
      if (index !== -1) cart.splice(index, 1);

      renderCart();
      showToast("Producto eliminado.");
    });

    element.append(info, price, remove);
    cartItems.appendChild(element);
  });
}

checkoutButton.addEventListener("click", () => {
  if (cart.length === 0) return;

  const lines = cart.map(item =>
    `- ${item.provider}: ${item.days} días — ${money(item.price)}`
  );

  const total = cart.reduce((sum, item) => sum + item.price, 0);

  const message = [
    "Hola, quiero realizar un pedido en PiruNet.",
    "",
    ...lines,
    "",
    `Total: ${money(total)}`,
    "",
    "Quiero coordinar el pago y la activación."
  ].join("\n");

  const url =
    `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

  window.open(url, "_blank", "noopener,noreferrer");
});

renderCart();
