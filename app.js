let map = L.map('map').setView([18.4861, -69.9312], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

let marker, userMarker;
let targetCoords = null;
let watchId = null;

// 1. BUSCADOR DE LUGARES
document.getElementById('searchBtn').addEventListener('click', async () => {
    const query = document.getElementById('placeInput').value;
    if(!query) return;
    
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`);
    const data = await response.json();

    if (data.length > 0) {
        const { lat, lon, display_name } = data[0];
        targetCoords = { lat: parseFloat(lat), lng: parseFloat(lon) };
        
        if (marker) map.removeLayer(marker);
        marker = L.marker([lat, lon]).addTo(map).bindPopup("Destino").openPopup();
        map.setView([lat, lon], 16);
        
        document.getElementById('targetName').innerText = display_name.split(',')[0];
    } else {
        alert("Lugar no encontrado");
    }
});

// 2. RADAR Y SEGUIMIENTO GPS
document.getElementById('activateBtn').addEventListener('click', () => {
    if (!targetCoords) return alert("Primero busca un destino en el mapa");
    
    Notification.requestPermission();

    if (watchId) navigator.geolocation.clearWatch(watchId);

    watchId = navigator.geolocation.watchPosition(pos => {
        const { latitude, longitude } = pos.coords;
        
        // Actualizar posición usuario en mapa
        if (userMarker) map.removeLayer(userMarker);
        userMarker = L.circleMarker([latitude, longitude], { color: '#ff0031', radius: 8 }).addTo(map);

        const dist = calcularDistancia(latitude, longitude, targetCoords.lat, targetCoords.lng);
        document.getElementById('distance').innerText = `${dist.toFixed(0)}m`;

        // Si está a menos de 150 metros, disparar ráfaga
        if (dist < 150) {
            dispararRaf