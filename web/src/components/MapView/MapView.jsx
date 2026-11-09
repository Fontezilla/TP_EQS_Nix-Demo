// Mapa OpenStreetMap (Leaflet) com o local do produtor.
// Com onPick, um clique no mapa muda o local (usado ao editar a página).
import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapView.scss';

// Marcador desenhado em CSS: evita as imagens do marcador por defeito, que o Vite não encontra
const marker = L.divIcon({ className: 'map-marker', html: '<span></span>', iconSize: [32, 40], iconAnchor: [16, 38] });

const ALTO_MINHO_CENTER = { lat: 41.85, lng: -8.5 };

function Picker({ onPick }) {
  useMapEvents({ click: (e) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }) });
  return null;
}

// Volta a centrar quando o local muda
function Recenter({ position }) {
  const map = useMap();
  useEffect(() => { map.setView(position, map.getZoom()); }, [map, position.lat, position.lng]);
  return null;
}

export default function MapView({ position, caption, onPick, zoom = 12, label }) {
  const center = position?.lat != null ? position : ALTO_MINHO_CENTER;

  return (
    <div className={`map-view ${onPick ? 'map-view--pick' : ''}`} role="region" aria-label={label}>
      <MapContainer center={center} zoom={position?.lat != null ? zoom : 9} scrollWheelZoom={false}>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {position?.lat != null && <Marker position={position} icon={marker} />}
        {position?.lat != null && <Recenter position={position} />}
        {onPick && <Picker onPick={onPick} />}
      </MapContainer>
      {caption && <span className="caption"><i className="bi bi-geo-alt-fill me-1" aria-hidden="true" />{caption}</span>}
    </div>
  );
}
