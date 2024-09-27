let filtroDeptos = document.getElementById("departamentos");

const URL = "https://collectionapi.metmuseum.org/public/collection/v1";
const URLsearch = "https://collectionapi.metmuseum.org/public/collection/v1/search";
let paginaActual = 1;
const objetosPorPagina = 20;

 //obtener departamentos y llenar el select: 
function obtenerDepartamentos(){
    fetch(URL + "/departments")
    .then((response) => response.json())
    .then((data) => {
        console.log(data);
        listarDepartamentos(data);
    });
};
listarDepartamentos= (arr) => {
    //le colocamos al select una opcion para tener a todos los departamentos: 
    const elementos = document.createElement('Option');
    elementos.setAttribute('value', '0');
    elementos.textContent = "Todos";
    filtroDeptos.appendChild(elementos);

    arr.departments.forEach(item => {
    const elemento = document.createElement('Option');
    elemento.setAttribute('value', item.departmentId);
    elemento.textContent = item.displayName;
    filtroDeptos.appendChild(elemento);
    });
}
obtenerDepartamentos(); 

//traduccion: 
async function traducirTexto(texto, idioma) {
    const response = await fetch('/translate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: texto, lenguajeDestino: idioma })
    });
    const data = await response.json();
    return data.translatedText;
}
//verifica los objetos que tengan imagen
//iniciador:
function iniciadorBuscadorObra(){
    fetch(URLsearch + "?q=&hasImages=true")
    .then((response) => response.json())
    .then((data) => {
        console.log(data);
        mostrarObjetos(data.objectIDs.slice(0, 20));
    })
}
 iniciadorBuscadorObra();
async function construirObjetoHTML(data) {
    let titulo = data.title || "No hay información disponible.";
    let cultura = data.culture || "No hay información disponible.";
    let dinastia = data.dynasty || "No hay información disponible.";
    let imagen = data.primaryImageSmall || "/Archivos/noImagen.jpg";
    let fechaCreacion = data.objectDate || "No hay fecha";

    // Traducir el texto
    let tTrad = await traducirTexto(titulo, 'es');
    let cTrad = await traducirTexto(cultura, 'es');
    let dTrad = await traducirTexto(dinastia, 'es');

    return `
        <div class="obra" onclick="mostrarImagenesAdicionales(${data.objectID})">
            <img src="${imagen}" title="Fecha aproximada de creación: ${fechaCreacion}" />
            <h5 class="titulo">${tTrad}</h5>
            <h6 class="cultura">${cTrad}</h6>
            <h6 class="dinastia">${dTrad}</h6>
        </div>
    `;
}

function obtenerDatosObjeto(objectId) {
    return fetch(`${URL}/objects/${objectId}`)
        .then(response => response.json())
        .then(data => {
            if (data && data.objectID) {
                return construirObjetoHTML(data);
            }
            return '';
        })
        .catch(error => {
            console.error(`Error al obtener el objeto con ID ${objectId}:`, error);
            return '';
        });
}

function mostrarObjetos(objectIDs) {
    if (objectIDs && objectIDs.length > 0) {
        const fetchPromises = objectIDs.map(objectId => obtenerDatosObjeto(objectId));
        Promise.all(fetchPromises).then(resultados => {
            const objetoAMostrar = resultados.filter(obj => obj !== '').join('');
            document.getElementById("obra").innerHTML = objetoAMostrar || "<p>No se encontraron objetos válidos.</p>";
        });
    } else {
        document.getElementById("obra").innerHTML = "<p>No se encontraron objetos.</p>";
    }
}



function fetchObtejoParametros(parametroBusqueda, departamentos, localizacion, paginaActual) {
    let url = URLsearch + `?q=${parametroBusqueda}&hasImages=true`;

    if (departamentos && departamentos !== '0') {
        url += `&departmentId=${departamentos}`;
    }

    if (localizacion && localizacion.trim() !== '') {
        url += `&geoLocation=${localizacion}`;
    }

    fetch(url)
        .then((response) => response.json())
        .then((data) => {
            if (data.objectIDs) {
                const inicio = (paginaActual - 1) * objetosPorPagina;
                const fin = inicio + objetosPorPagina;
                const objetosPaginaActual = data.objectIDs.slice(inicio, fin);

                mostrarObjetos(objetosPaginaActual);
                actualizarPaginacion(data.objectIDs.length);
            } else {
                document.getElementById("obra").innerHTML = "<p>No se encontraron objetos.</p>";
            }
        })
        .catch((error) => {
            console.error("Error al realizar la búsqueda:", error);
        });
}

document.getElementById("buscar").addEventListener("click", (event) => {
    event.preventDefault();
    let parametroBusqueda = document.getElementById("buscarPor").value;
    let localizacion = document.getElementById("localizacion").value;
    let departamentos = document.getElementById("departamentos").value;

    fetchObtejoParametros(parametroBusqueda, departamentos, localizacion, paginaActual);
});
//paginacion
function actualizarPaginacion(totalObjetos) {
    const totalPaginas = Math.ceil(totalObjetos / objetosPorPagina);
    const paginasDiv = document.getElementById("paginas");
    paginasDiv.innerHTML = '';

    if (paginaActual > 1) {
        paginasDiv.innerHTML += `<a href="#" onclick="cambiarPagina(${paginaActual - 1})">Anterior</a>`;
    }

    paginasDiv.innerHTML += `<span>Página ${paginaActual} de ${totalPaginas}</span>`;

    if (paginaActual < totalPaginas) {
        paginasDiv.innerHTML += `<a href="#" onclick="cambiarPagina(${paginaActual + 1})">Posterior</a>`;
    }
}
function cambiarPagina(nuevaPagina) {
    paginaActual = nuevaPagina; 
    let parametroBusqueda = document.getElementById("buscarPor").value;
    let localizacion = document.getElementById("localizacion").value;
    let departamentos = document.getElementById("departamentos").value;

    fetchObtejoParametros(parametroBusqueda, departamentos, localizacion, paginaActual); 
}
//modal
async function obtenerImagenesAdicionales(objectId) {
    const response = await fetch(`${URL}/objects/${objectId}`);
    const data = await response.json();
    console.log(data);
    return data.additionalImages || [];
}

function mostrarImagenesAdicionales(objectId) {
    obtenerImagenesAdicionales(objectId).then(imagenes => {
        const contenedorImagenes = document.getElementById("imagenesAdicionales");
        contenedorImagenes.innerHTML = '';

        if (imagenes.length > 0) {
            imagenes.forEach(imagen => {
                const imgElemento = document.createElement("img");
                imgElemento.src = imagen;
                imgElemento.alt = "Imagen adicional";
                imgElemento.style.width = "100%";
                contenedorImagenes.appendChild(imgElemento);
            });
        } else {
            contenedorImagenes.innerHTML = "<p>No hay imágenes adicionales disponibles.</p>";
        }

        const modal = document.getElementById("modal");
        modal.style.display = "block";

        const span = document.getElementsByClassName("close")[0];
        span.onclick = function() {
            modal.style.display = "none";
        }

        window.onclick = function(event) {
            if (event.target === modal) {
                modal.style.display = "none";
            }
        }
    });
}