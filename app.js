// Variables de estado
let experiencias = [];
let reservas = [];
let textoBusqueda = "";
let categoriaActual = "todas";
let ordenAscendente = true;
let precioMaximo = Infinity;

// Referencias del DOM
const catalogo = document.querySelector("#catalogo");
const contador = document.querySelector("#contador");
const botonesCategoria = document.querySelectorAll(".filtros button");
const buscador = document.querySelector("#buscador");
const filtroPrecioMax = document.querySelector("#filtroPrecioMax");
const btnPrecio = document.querySelector("#btnPrecio");
const listaReservas = document.querySelector("#listaReservas");
const totalElemento = document.querySelector("#total");
const totalPersonasElemento = document.querySelector("#totalPersonas");
const btnVaciar = document.querySelector("#btnVaciar");

// 1. Cargar datos desde el JSON
async function cargarExperiencias() {
    try {
        const respuesta = await fetch("./data/experiencias.json");
        if (!respuesta.ok) throw new Error("Error al cargar JSON");
        experiencias = await respuesta.json();
        actualizarCatalogo();
    } catch (error) {
        console.error(error);
        catalogo.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: red;">Error al cargar las experiencias. Asegúrate de usar Live Server.</p>`;
    }
}

// 2. Lógica de filtrado combinado
function obtenerResultados() {
    let resultados = [...experiencias];
    
    if (categoriaActual !== "todas") {
        resultados = resultados.filter(e => e.categoria === categoriaActual);
    }
    
    if (textoBusqueda !== "") {
        resultados = resultados.filter(e => e.nombre.toLowerCase().includes(textoBusqueda));
    }
    
    if (precioMaximo > 0 && precioMaximo !== Infinity) {
        resultados = resultados.filter(e => e.precio <= precioMaximo);
    }

    resultados.sort((a, b) => ordenAscendente ? a.precio - b.precio : b.precio - a.precio);
    return resultados;
}

// 3. Dibujar tarjetas en pantalla
function actualizarCatalogo() {
    const resultados = obtenerResultados();
    contador.textContent = `${resultados.length} experiencias encontradas`;

    if (resultados.length === 0) {
        catalogo.innerHTML = `<p style="grid-column: 1/-1; text-align: center; padding: 20px; color: var(--gris);">No se encontraron experiencias.</p>`;
        return;
    }

    catalogo.innerHTML = resultados.map(e => `
        <article class="tarjeta">
            <div class="imagen">${e.icono}</div>
            <div class="informacion">
                <span class="etiqueta">${e.categoria}</span>
                <h3>${e.nombre}</h3>
                <p style="color: var(--gris); font-size: 0.9rem; margin: 5px 0;">Cupo disponible: ${e.cupo}</p>
                <p class="precio">$${e.precio} MXN</p>
                <div style="display: flex; gap: 10px; align-items: center; margin-top: 10px;">
                    <label>Personas:
                        <input type="number" id="cantidad-${e.id}" min="1" max="${e.cupo}" value="1" style="width: 60px; padding: 5px; border: 1px solid #ccc; border-radius: 5px;">
                    </label>
                </div>
                <button class="btn-reservar" data-id="${e.id}" style="width: 100%; margin-top: 15px;">Agregar a reserva</button>
                <div id="msg-${e.id}" style="color: #b3261e; font-size: 0.85rem; font-weight: bold; margin-top: 8px; text-align: center; min-height: 16px;"></div>
            </div>
        </article>
    `).join("");

    document.querySelectorAll(".btn-reservar").forEach(btn => {
        btn.addEventListener("click", () => agregarReserva(Number(btn.dataset.id)));
    });
}

// 4. Mostrar mensajes sin alert()
function mostrarMensaje(id, texto, color = "#b3261e") {
    const msgDiv = document.querySelector(`#msg-${id}`);
    if(msgDiv) {
        msgDiv.textContent = texto;
        msgDiv.style.color = color;
        setTimeout(() => msgDiv.textContent = "", 3000);
    }
}

// 5. Agregar al carrito
function agregarReserva(id) {
    const experiencia = experiencias.find(e => e.id === id);
    const inputCantidad = document.querySelector(`#cantidad-${id}`);
    const cantidadPedida = Number(inputCantidad.value);

    if (cantidadPedida < 1 || cantidadPedida > experiencia.cupo) {
        mostrarMensaje(id, "Ingresa una cantidad válida.");
        return;
    }

    const reservaExistente = reservas.find(r => r.experienciaId === id);
    const nuevaCantidad = reservaExistente ? reservaExistente.cantidad + cantidadPedida : cantidadPedida;

    if (nuevaCantidad > experiencia.cupo) {
        const disponibles = experiencia.cupo - (reservaExistente ? reservaExistente.cantidad : 0);
        mostrarMensaje(id, `Solo quedan ${disponibles} lugares.`);
        return;
    }

    if (reservaExistente) {
        reservaExistente.cantidad = nuevaCantidad;
        reservaExistente.subtotal = nuevaCantidad * experiencia.precio;
    } else {
        reservas.push({
            experienciaId: id,
            nombre: experiencia.nombre,
            precio: experiencia.precio,
            cantidad: cantidadPedida,
            subtotal: cantidadPedida * experiencia.precio,
            cupoMax: experiencia.cupo
        });
    }
    
    mostrarMensaje(id, "¡Agregado con éxito!", "#00695c");
    mostrarReservas();
}

// 6. Mostrar el carrito y calcular totales
function mostrarReservas() {
    if (reservas.length === 0) {
        listaReservas.innerHTML = `<p class="mensaje-vacio">No hay experiencias seleccionadas.</p>`;
        totalElemento.textContent = "$0 MXN";
        totalPersonasElemento.textContent = "0";
        btnVaciar.style.display = "none";
        return;
    }

    listaReservas.innerHTML = reservas.map(r => `
        <article style="display: flex; justify-content: space-between; align-items: center; padding: 15px 0; border-bottom: 1px solid #ddd; flex-wrap: wrap; gap: 10px;">
            <div style="flex: 1; min-width: 150px;">
                <strong style="display: block; margin-bottom: 5px;">${r.nombre}</strong>
                <p style="margin: 0; color: var(--gris); font-size: 0.9rem;">$${r.precio} MXN c/u</p>
            </div>
            
            <div style="display: flex; align-items: center; gap: 10px;">
                <button class="btn-restar" data-id="${r.experienciaId}" style="padding: 2px 10px; border-radius: 5px; font-weight: bold;">-</button>
                <span style="font-weight: bold; width: 20px; text-align: center;">${r.cantidad}</span>
                <button class="btn-sumar" data-id="${r.experienciaId}" style="padding: 2px 10px; border-radius: 5px; font-weight: bold;">+</button>
            </div>

            <div style="text-align: right; min-width: 100px;">
                <strong style="display: block; color: var(--primario); margin-bottom: 5px;">$${r.subtotal} MXN</strong>
                <button class="btn-eliminar" data-id="${r.experienciaId}" style="background: none; border: none; color: #b3261e; font-size: 0.85rem; padding: 0; text-decoration: underline; cursor: pointer;">Eliminar</button>
            </div>
            <div id="msg-carrito-${r.experienciaId}" style="width: 100%; color: #b3261e; font-size: 0.8rem; text-align: right; min-height: 14px;"></div>
        </article>
    `).join("");

    const totalPagar = reservas.reduce((suma, r) => suma + r.subtotal, 0);
    const totalGente = reservas.reduce((suma, r) => suma + r.cantidad, 0);

    totalElemento.textContent = `$${totalPagar} MXN`;
    totalPersonasElemento.textContent = totalGente;
    btnVaciar.style.display = "inline-block";

    document.querySelectorAll(".btn-sumar").forEach(btn => {
        btn.addEventListener("click", () => modificarCantidad(Number(btn.dataset.id), 1));
    });
    document.querySelectorAll(".btn-restar").forEach(btn => {
        btn.addEventListener("click", () => modificarCantidad(Number(btn.dataset.id), -1));
    });
    document.querySelectorAll(".btn-eliminar").forEach(btn => {
        btn.addEventListener("click", () => eliminarReserva(Number(btn.dataset.id)));
    });
}

// 7. Modificar cantidad desde el carrito
function modificarCantidad(id, cambio) {
    const reserva = reservas.find(r => r.experienciaId === id);
    if (!reserva) return;

    const nuevaCantidad = reserva.cantidad + cambio;

    if (nuevaCantidad > reserva.cupoMax) {
        const msgDiv = document.querySelector(`#msg-carrito-${id}`);
        if (msgDiv) {
            msgDiv.textContent = "Cupo máximo alcanzado";
            setTimeout(() => msgDiv.textContent = "", 3000);
        }
        return;
    }

    if (nuevaCantidad <= 0) {
        eliminarReserva(id);
    } else {
        reserva.cantidad = nuevaCantidad;
        reserva.subtotal = nuevaCantidad * reserva.precio;
        mostrarReservas();
    }
}

function eliminarReserva(id) {
    reservas = reservas.filter(r => r.experienciaId !== id);
    mostrarReservas();
}

// --- EVENTOS DE LOS CONTROLES SUPERIORES ---

buscador.addEventListener("input", () => {
    textoBusqueda = buscador.value.toLowerCase().trim();
    actualizarCatalogo();
});

filtroPrecioMax.addEventListener("input", () => {
    const valor = parseFloat(filtroPrecioMax.value);
    precioMaximo = isNaN(valor) ? Infinity : valor;
    actualizarCatalogo();
});

btnPrecio.addEventListener("click", () => {
    ordenAscendente = !ordenAscendente;
    btnPrecio.textContent = ordenAscendente ? "Ordenar: Menor a Mayor" : "Ordenar: Mayor a Menor";
    actualizarCatalogo();
});

botonesCategoria.forEach(boton => {
    boton.addEventListener("click", (e) => {
        botonesCategoria.forEach(b => b.classList.remove("activo"));
        e.target.classList.add("activo");
        categoriaActual = e.target.dataset.categoria;
        actualizarCatalogo();
    });
});

btnVaciar.addEventListener("click", () => {
    if(confirm("¿Estás seguro de que deseas vaciar toda tu reservación?")) {
        reservas = []; 
        mostrarReservas(); 
    }
});

// Iniciar aplicación
cargarExperiencias();