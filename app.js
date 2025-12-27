let map = L.map('map', { zoomControl: false }).setView([18.4861, -69.9312], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

let marker, userMarker, watchId;
let targetCoords = null;

const placeInput = document.getElementById('placeInput');
const suggestionsList = document.getElementById('suggestions');

// A. SUGERENCIAS EN TIEMPO REAL
placeInput.addEventListener('input', async (e) => {
    const val = e.target.value;
    if (val.length < 3) {
        suggestionsList.classList.add('d-none');
        return;
    }

    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${val}&limit=5`);
        const data = await res.json();
        
        suggestionsList.innerHTML = '';
        if (data.length > 0) {
            suggestionsList.classList.remove('d-none');
            data.forEach(place => {
                const li = document.createElement('li');
                li.className = 'list-group-item list-group-item-dark';
                li.innerText = place.display_name;
                li.onclick = () => seleccionarLugar(place);
                suggestionsList.appendChild(li);
            });
        }
    } catch (err) { console.error("Error buscando sugerencias"); }
});

function seleccionarLugar(place) {
    targetCoords = { lat: parseFloat(place.lat), lng: parseFloat(place.lon) };
    placeInput.value = place.display_name;
    suggestionsList.classList.add('d-none');
    
    document.getElementById('targetName').innerText = place.display_name.split(',')[0];
    
    if (marker) map.removeLayer(marker);
    marker = L.marker([targetCoords.lat, targetCoords.lng]).addTo(map);
    map.setView([targetCoords.lat, targetCoords.lng], 16);
}

// B. ACTIVAR RADAR
document.getElementById('activateBtn').addEventListener('click', function() {
    if (!targetCoords) return alert("Selecciona un destino primero");
    
    Notification.requestPermission();
    this.innerText = "RADAR ACTIVO";
    this.classList.replace('btn-outline-light', 'btn-danger');

    watchId = navigator.geolocation.watchPosition(pos => {
        const { latitude, longitude } = pos.coords;
        
        if (userMarker) map.removeLayer(userMarker);
        userMarker = L.circleMarker([latitude, longitude], { color: 'white', radius: 10 }).addTo(map);

        const dist = calcularDistancia(latitude, longitude, targetCoords.lat, targetCoords.lng);
        document.getElementById('distance').innerText = `${dist.toFixed(0)} m`;

        if (dist < 200) { // Alerta a 200 metros
            notificarLlegada();
        }
    }, null, { enableHighAccuracy: true });
});

function notificarLlegada() {
    for(let i=0; i<3; i++) {
        setTimeout(() => {
            new Notification("LLEGANDO A DESTINO", { 
                body: "Estás muy cerca de tu objetivo.",
                icon: "icon.png"
            });
        }, i * 4000);
    }
}

function calcularDistancia(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI/180, φ2 = lat2 * Math.PI/180, Δλ = (lon2-lon1) * Math.PI/180;
    return Math.acos( Math.sin(φ1)*Math.sin(φ2) + Math.cos(φ1)*Math.cos(φ2) * Math.cos(Δλ) ) * R;
}
