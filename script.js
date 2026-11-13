/* =================================
   PIRUNET VPS - PERSONAL ARGENTINA
   PRECIOS OFICIALES
================================= */

const PRECIOS = {
  1: {
    7: 3000,
    15: 4500,
    30: 6000,
    60: 10000
  },

  2: {
    7: 5500,
    15: 8000,
    30: 11000,
    60: 18000
  },

  3: {
    7: 7500,
    15: 11000,
    30: 15000,
    60: 25000
  },

  4: {
    7: 9000,
    15: 13500,
    30: 18000,
    60: 30000
  }
};

/* =================================
   CONFIGURACIÓN
================================= */

// Cambiá este número por tu WhatsApp
// Formato internacional, sin + ni espacios.

const WHATSAPP = "5493844546841";

// Enlace de Mercado Pago
const MERCADOPAGO = "https://link.mercadopago.com.ar/pirunet";

// Selección inicial
let dispositivosSeleccionados = 1;


/* =================================
   FORMATO DE PRECIOS
================================= */

function formatoPrecio(precio) {
  return "$" + precio.toLocaleString("es-AR");
}


/* =================================
   MOSTRAR LOS PLANES
================================= */

function mostrarPlanes() {

  const contenedor = document.getElementById("plansGrid");

  const duraciones = [7, 15, 30, 60];

  contenedor.innerHTML = "";

  duraciones.forEach((dias, indice) => {

    const precio = PRECIOS[dispositivosSeleccionados][dias];

    const dispositivoTexto =
      dispositivosSeleccionados === 1
        ? "1 dispositivo"
        : dispositivosSeleccionados + " dispositivos";

    const tarjeta = document.createElement("article");

    tarjeta.className =
      "plan-card" + (dias === 30 ? " popular" : "");

    tarjeta.innerHTML = `

      ${dias === 30
        ? '<div class="popular-label">PLAN DESTACADO</div>'
        : ''
      }

      <div class="plan-days">
        ${dias} DÍAS
      </div>

      <div class="plan-price">
        ${formatoPrecio(precio)}
      </div>

      <div class="plan-period">
        Duración de ${dias} días
      </div>

      <hr class="plan-divider">

      <div class="plan-feature">
        ${dispositivoTexto}
      </div>

      <div class="plan-feature">
        Servicio Personal Argentina
      </div>

      <div class="plan-feature">
        Atención por WhatsApp
      </div>

      <button class="plan-buy">
        Elegir plan →
      </button>

    `;

    tarjeta.querySelector(".plan-buy").addEventListener(
      "click",
      () => abrirCarrito(dias, precio)
    );

    contenedor.appendChild(tarjeta);

  });

}


/* =================================
   SELECCIÓN DE DISPOSITIVOS
================================= */

document.querySelectorAll(".device-btn").forEach(boton => {

  boton.addEventListener("click", () => {

    dispositivosSeleccionados = Number(
      boton.dataset.device
    );

    document.querySelectorAll(".device-btn").forEach(item => {
      item.classList.remove("active");
    });

    boton.classList.add("active");

    mostrarPlanes();

  });

});


/* =================================
   ABRIR CARRITO
================================= */

function abrirCarrito(dias, precio) {

  const cantidad = dispositivosSeleccionados;

  const textoDispositivos =
    cantidad === 1
      ? "1 dispositivo"
      : cantidad + " dispositivos";

  document.getElementById("cartDays").textContent =
    dias + " días";

  document.getElementById("cartDevices").textContent =
    textoDispositivos;

  document.getElementById("cartPrice").textContent =
    formatoPrecio(precio);

  // Mensaje automático de WhatsApp

  const mensaje =
    `Hola PiruNet. Quiero contratar un plan.

Servicio: Personal Argentina
Duración: ${dias} días
Dispositivos: ${textoDispositivos}
Total: ${formatoPrecio(precio)}

Voy a realizar el pago por Mercado Pago y enviar el comprobante para su verificación.`;

  const enlaceWhatsApp =
    "https://wa.me/" +
    WHATSAPP +
    "?text=" +
    encodeURIComponent(mensaje);

  document.getElementById("sendOrder").href =
    enlaceWhatsApp;

  // Mostrar carrito

  document.getElementById("cart").classList.add("open");

  document.getElementById("cartOverlay").classList.add("open");

  document.body.style.overflow = "hidden";

}


/* =================================
   CERRAR CARRITO
================================= */

function cerrarCarrito() {

  document.getElementById("cart").classList.remove("open");

  document.getElementById("cartOverlay").classList.remove("open");

  document.body.style.overflow = "";

}

document.getElementById("closeCart").addEventListener(
  "click",
  cerrarCarrito
);

document.getElementById("cartOverlay").addEventListener(
  "click",
  cerrarCarrito
);

document.addEventListener("keydown", event => {

  if (event.key === "Escape") {
    cerrarCarrito();
  }

});


/* =================================
   MERCADO PAGO
================================= */

document.querySelector(".checkout-btn").href = MERCADOPAGO;


/* =================================
   AÑO AUTOMÁTICO
================================= */

document.getElementById("year").textContent =
  new Date().getFullYear();


/* =================================
   INICIAR PÁGINA
================================= */

mostrarPlanes();
