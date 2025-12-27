let map = L.map('map', { zoomControl: false }).setView([18.4861, -69.9312], 12);

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap'
}).addTo(map);

let marker, userMarker, watchId, routeLine;
let targetCoords = null;

const placeInput = document.getElementById('placeInput');
const suggestionsList = document.getElementById('suggestions');
const activateBtn = document.getElementById('activateBtn');
const stopBtn = document.getElementById('stopBtn');

// A. BÚSQUEDA RD EN TIEMPO REAL
placeInput.addEventListener('input', async (e) => {
    const val = e.target.value;
    if (val.length < 3) return suggestionsList.classList.add('d-none');

    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${val}&countrycodes=do&limit=5`);
        const data = await res.json();
        
        suggestionsList.innerHTML = '';
        if (data.length > 0) {
            suggestionsList.classList.remove('d-none');
            data.forEach(place => {
                const li = document.createElement('li');
                li.className = 'list-group-item list-group-item-dark';
                li.innerText = place.display_name.split(', República Dominicana')[0];
                li.onclick = () => seleccionarLugar(place);
                suggestionsList.appendChild(li);
            });
        }
    } catch (err) { console.error(err); }
});

function seleccionarLugar(place) {
    targetCoords = { lat: parseFloat(place.lat), lng: parseFloat(place.lon) };
    placeInput.value = place.display_name.split(',')[0];
    suggestionsList.classList.add('d-none');
    document.getElementById('targetName').innerText = placeInput.value;
    
    if (marker) map.removeLayer(marker);
    marker = L.marker([targetCoords.lat, targetCoords.lng]).addTo(map);
    map.setView([targetCoords.lat, targetCoords.lng], 15);
}

// B. LÓGICA DE ACTUALIZACIÓN DE TRAYECTO
function actualizarTrayecto(lat, lon) {
    const userPos = [lat, lon];
    const targetPos = [targetCoords.lat, targetCoords.lng];

    // 1. Dibujar línea estilo Uber (Punteada Roja)
    if (routeLine) map.removeLayer(routeLine);
    routeLine = L.polyline([userPos, targetPos], {
        color: '#ff0031',
        weight: 4,
        dashArray: '10, 15',
        opacity: 0.8
    }).addTo(map);

    // 2. Marcador de usuario (Punto azul)
    if (userMarker) map.removeLayer(userMarker);
    userMarker = L.circleMarker(userPos, { 
        color: '#fff', fillColor: '#007bff', fillOpacity: 1, weight: 2, radius: 9 
    }).addTo(map);

    // 3. Distancia y Ajuste de vista
    const dist = calcularDistancia(lat, lon, targetCoords.lat, targetCoords.lng);
    document.getElementById('distance').innerText = `${dist.toFixed(0)} m`;

    const bounds = L.latLngBounds([userPos, targetPos]);
    map.fitBounds(bounds, { padding: [70, 70] });

    if (dist < 150) notificarLlegada();
}

// C. INICIAR VIAJE
activateBtn.addEventListener('click', function() {
    if (!targetCoords) return alert("Por favor, selecciona un destino.");
    
    Notification.requestPermission();
    
    this.innerHTML = '<i class="bi bi-check-circle-fill me-2"></i> VIAJE INICIADO';
    this.classList.replace('btn-danger', 'btn-success');
    this.disabled = true;
    stopBtn.classList.remove('d-none');

    new Notification("✅ Viaje Iniciado", {
        body: `Rumbo a ${document.getElementById('targetName').innerText}`,
    });

    // CAPTURA INICIAL (Para mostrar la línea al instante)
    navigator.geolocation.getCurrentPosition(pos => {
        actualizarTrayecto(pos.coords.latitude, pos.coords.longitude);
    }, err => console.error("Error GPS inicial"), { enableHighAccuracy: true });

    // SEGUIMIENTO EN VIVO
    watchId = navigator.geolocation.watchPosition(pos => {
        actualizarTrayecto(pos.coords.latitude, pos.coords.longitude);
    }, null, { enableHighAccuracy: true });
});

stopBtn.addEventListener('click', () => location.reload());

function notificarLlegada() {
    for(let i=0; i<3; i++) {
        setTimeout(() => {
            new Notification("🚨 ¡ESTÁS CERCA!", { 
                body: "El destino está a menos de 150 metros.",
                icon: "icon.png"
            });
        }, i * 4000);
    }
}

function calcularDistancia(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const dLat = (lat2-lat1)*Math.PI/180, dLon = (lon2-lon1)*Math.PI/180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
