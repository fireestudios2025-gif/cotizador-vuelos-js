async function obtenerVuelos() {
    try {
        const respuesta = await fetch("./data/vuelos.json");
        if (!respuesta.ok) {
            throw new Error("No se pudieron cargar los vuelos");
        }
        const datos = await respuesta.json();
        return datos;
    } catch (error) {
        Swal.fire({
            icon: "error",
            title: "Error de carga",
            text: "No pudimos obtener el catálogo de vuelos. Verificá tu conexión o servidor local."
        });
        return [];
    } finally {
        document.body.dataset.cargado = "true";
    }
}