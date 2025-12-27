const AGORA_COORDS = { lat: 18.4839, lng: -69.9395 }; // Coordenadas aprox. Agora Mall
const RADIO_AVISO = 200; // Metros para activar la vibración

function iniciarRastreo() {
    if (!("geolocation" in navigator)) return alert("GPS no disponible");
    
    // Solicitar permiso de notificaciones
    Notification.requestPermission();

    navigator.geolocation.watchPosition(pos => {
        const dist = calcularDistancia(pos.coords.latitude, pos.coords.longitude, AGORA_COORDS.lat, AGORA_COORDS.lng);
        document.getElementById("status").innerText = `Distancia: ${dist.toFixed(0)}m`;

        if (dist < RADIO_AVISO) {
            enviarNotificacion();
        }
    }, err => console.error(err), { enableHighAccuracy: true });
}

function calcularDistancia(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Radio de la Tierra en metros
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function enviarNotificacion() {
    new Notification("¡Llegaste a Agora!", {
        body: "Estás cerca de la entrada.",
        icon: "icon.png" // Opcional
    });
}