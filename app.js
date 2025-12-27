let map = L.map('map', { zoomControl: false }).setView([18.4861, -69.9312], 12);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

let marker, userMarker, watchId;
let targetCoords = null;

const placeInput = document.getElementById('placeInput');
const suggestionsList = document.getElementById('suggestions');
const activateBtn = document.getElementById('activateBtn');
const stopBtn = document.getElementById('stopBtn');

// A. SUGERENCIAS FILTRADAS PARA RD
placeInput.addEventListener('input', async (e) => {
    const val = e.target.value;
    if (val.length < 3) {
        suggestionsList.classList.add('d-none');
        return;
    }

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
    } catch (err) { console.error("Error en búsqueda"); }
});

function seleccionarLugar(place) {
    targetCoords = { lat: parseFloat(place.lat), lng: parseFloat(place.lon) };
    placeInput.value = place.display_name.split(',')[0];
    suggestionsList.classList.add('d-none');
    document.getElementById('targetName').innerText = placeInput.value;
    
    if (marker) map.removeLayer(marker);
    marker = L.marker([targetCoords.lat, targetCoords.lng]).addTo(map);
    map.setView([targetCoords.lat, targetCoords.lng], 16);
}

// B. RADAR Y VISTA COMPARTIDA (Tú y la Meta)
activateBtn.addEventListener('click', function() {
    if (!targetCoords) return alert("Selecciona un destino primero");
    
    Notification.requestPermission();
    this.innerText = "EN TRAYECTO...";
    this.disabled = true;
    stopBtn.classList.remove('d-none');

    watchId = navigator.geolocation.watchPosition(pos => {
        const { latitude, longitude } = pos.coords;
        const userPos = [latitude, longitude];
        const targetPos = [targetCoords.lat, targetCoords.lng];
        
        if (userMarker) map.removeLayer(userMarker);
        userMarker = L.circleMarker(userPos, { 
            color: '#007bff', fillColor: '#007bff', fillOpacity: 1, radius: 9 
        }).addTo(map);

        const dist = calcularDistancia(latitude, longitude, targetCoords.lat, targetCoords.lng);
        document.getElementById('distance').innerText = `${dist.toFixed(0)} m`;

        // AJUSTE DE VISTA EN TIEMPO REAL
        const bounds = L.latLngBounds([userPos, targetPos]);
        map.fitBounds(bounds, { padding: [50, 50] });

        if (dist < 200) notificarLlegada();
    }, null, { enableHighAccuracy: true });
});

stopBtn.addEventListener('click', () => {
    navigator.geolocation.clearWatch(watchId);
    location.reload(); // Reinicia la app
});

function notificarLlegada() {
    for(let i=0; i<3; i++) {
        setTimeout(() => {
            new Notification("🚨 ¡LLEGANDO!", { 
                body: "Estás cerca del destino seleccionado.",
                silent: false 
            });
        }, i * 4000);
    }
}

function calcularDistancia(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
