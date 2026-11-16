let catalogoVuelos = [];
let itinerario = JSON.parse(localStorage.getItem("itinerarioVuelos")) || [];

const IMPUESTO_PORCENTAJE = 0.21;

const contenedorVuelos = document.getElementById("contenedor-vuelos");
const selectorRegion = document.getElementById("filtro-region");
const listaReserva = document.getElementById("lista-reserva");
const spanSubtotal = document.getElementById("subtotal");
const spanImpuestos = document.getElementById("impuestos");
const spanTotalFinal = document.getElementById("total-final");
const btnVaciar = document.getElementById("btn-vaciar");
const btnConfirmar = document.getElementById("btn-confirmar");

function guardarEnStorage() {
    localStorage.setItem("itinerarioVuelos", JSON.stringify(itinerario));
}

function renderizarVuelos(listaVuelos) {
    contenedorVuelos.innerHTML = "";

    listaVuelos.forEach((vuelo) => {
        const { id, origen, destino, aerolinea, categoria, precioBase, duracion } = vuelo;

        const tarjeta = document.createElement("article");
        tarjeta.className = "tarjeta-vuelo";
        tarjeta.innerHTML = `
            <div>
                <h3>${destino}</h3>
                <p><strong>Origen:</strong> ${origen}</p>
                <p><strong>Aerolínea:</strong> ${aerolinea}</p>
                <p><strong>Región:</strong> ${categoria} · ${duracion}</p>
            </div>
            <div>
                <p class="precio">$${precioBase.toLocaleString("es-AR")}</p>
                <button class="btn-primario btn-agregar" data-id="${id}">Agregar al itinerario</button>
            </div>
        `;
        contenedorVuelos.appendChild(tarjeta);
    });
}

function filtrarPorRegion() {
    const regionElegida = selectorRegion.value;
    const vuelosFiltrados = regionElegida === "Todas"
        ? catalogoVuelos
        : catalogoVuelos.filter((vuelo) => vuelo.categoria === regionElegida);

    renderizarVuelos(vuelosFiltrados);
}

function agregarAlItinerario(idVuelo) {
    const vueloEncontrado = catalogoVuelos.find((vuelo) => vuelo.id === idVuelo);
    if (!vueloEncontrado) return;

    const itemExistente = itinerario.find((item) => item.id === idVuelo);

    if (itemExistente) {
        itemExistente.pasajeros += 1;
    } else {
        itinerario.push({
            ...vueloEncontrado,
            pasajeros: 1
        });
    }

    guardarEnStorage();
    renderizarItinerario();

    Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: `Vuelo a ${vueloEncontrado.destino} agregado`,
        showConfirmButton: false,
        timer: 1800
    });
}

function modificarPasajeros(idVuelo, cambio) {
    const item = itinerario.find((vuelo) => vuelo.id === idVuelo);
    if (!item) return;

    item.pasajeros += cambio;

    if (item.pasajeros <= 0) {
        eliminarDelItinerario(idVuelo);
    } else {
        guardarEnStorage();
        renderizarItinerario();
    }
}

function eliminarDelItinerario(idVuelo) {
    itinerario = itinerario.filter((vuelo) => vuelo.id !== idVuelo);
    guardarEnStorage();
    renderizarItinerario();
}

function renderizarItinerario() {
    listaReserva.innerHTML = "";

    if (itinerario.length === 0) {
        listaReserva.innerHTML = `<p style="color: #64748b; font-size: 0.9rem; margin: 1rem 0;">Tu itinerario está vacío.</p>`;
    } else {
        itinerario.forEach((item) => {
            const { id, destino, precioBase, pasajeros } = item;
            const subtotalVuelo = precioBase * pasajeros;

            const divItem = document.createElement("div");
            divItem.className = "item-reserva";
            divItem.innerHTML = `
                <div>
                    <strong>${destino}</strong>
                    <p style="font-size: 0.85rem; color: #475569;">$${precioBase.toLocaleString("es-AR")} x ${pasajeros} pasajero(s)</p>
                    <p style="font-weight: 600;">$${subtotalVuelo.toLocaleString("es-AR")}</p>
                </div>
                <div class="controles-pasajeros">
                    <button class="btn-restar" data-id="${id}">-</button>
                    <span>${pasajeros}</span>
                    <button class="btn-sumar" data-id="${id}">+</button>
                    <button class="btn-eliminar" data-id="${id}">X</button>
                </div>
            `;
            listaReserva.appendChild(divItem);
        });
    }

    actualizarTotales();
}

function actualizarTotales() {
    const subtotal = itinerario.reduce((acumulador, item) => acumulador + (item.precioBase * item.pasajeros), 0);
    const impuestos = subtotal * IMPUESTO_PORCENTAJE;
    const totalFinal = subtotal + impuestos;

    spanSubtotal.textContent = subtotal.toLocaleString("es-AR");
    spanImpuestos.textContent = impuestos.toLocaleString("es-AR");
    spanTotalFinal.textContent = totalFinal.toLocaleString("es-AR");
}

function vaciarItinerario() {
    if (itinerario.length === 0) return;

    itinerario = [];
    localStorage.removeItem("itinerarioVuelos");
    renderizarItinerario();

    Swal.fire({
        icon: "info",
        title: "Itinerario vaciado",
        text: "Se eliminaron todos los vuelos seleccionados.",
        timer: 1800,
        showConfirmButton: false
    });
}

function confirmarReserva() {
    if (itinerario.length === 0) {
        Swal.fire({
            icon: "warning",
            title: "Itinerario vacío",
            text: "Seleccioná al menos un vuelo antes de confirmar la reserva."
        });
        return;
    }

    const totalTexto = spanTotalFinal.textContent;
    const cantidadVuelos = itinerario.reduce((acc, item) => acc + item.pasajeros, 0);

    Swal.fire({
        icon: "success",
        title: "¡Reserva Confirmada!",
        html: `Emitimos tu itinerario para <strong>${cantidadVuelos} pasajero(s)</strong>.<br>Total abonado: <strong>$${totalTexto}</strong>`,
        confirmButtonColor: "#0072ce"
    });

    itinerario = [];
    localStorage.removeItem("itinerarioVuelos");
    renderizarItinerario();
}

async function inicializarApp() {
    catalogoVuelos = await obtenerVuelos();
    renderizarVuelos(catalogoVuelos);
    renderizarItinerario();

    selectorRegion.addEventListener("change", filtrarPorRegion);

    contenedorVuelos.addEventListener("click", (e) => {
        if (e.target.classList.contains("btn-agregar")) {
            const id = parseInt(e.target.dataset.id);
            agregarAlItinerario(id);
        }
    });

    listaReserva.addEventListener("click", (e) => {
        const id = parseInt(e.target.dataset.id);
        if (e.target.classList.contains("btn-sumar")) modificarPasajeros(id, 1);
        if (e.target.classList.contains("btn-restar")) modificarPasajeros(id, -1);
        if (e.target.classList.contains("btn-eliminar")) eliminarDelItinerario(id);
    });

    btnVaciar.addEventListener("click", vaciarItinerario);
    btnConfirmar.addEventListener("click", confirmarReserva);
}

inicializarApp();