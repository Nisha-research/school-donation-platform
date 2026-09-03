import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { School } from '@/lib/types';
import { MapPin } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';

const schoolIcon = L.divIcon({
  className: '',
  html: renderToStaticMarkup(
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div
        style={{
          background: '#1F3864',
          width: '32px',
          height: '32px',
          borderRadius: '50% 50% 50% 0',
          transform: 'rotate(-45deg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px solid #fff',
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
        }}
      >
        <MapPin
          style={{
            color: '#F59E0B',
            width: '18px',
            height: '18px',
            transform: 'rotate(45deg)',
          }}
        />
      </div>
    </div>
  ),
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

interface SchoolMapProps {
  school: School;
  height?: string;
}

export function SchoolMap({ school, height = '300px' }: SchoolMapProps) {
  if (school.latitude == null || school.longitude == null) {
    return (
      <div
        className="flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-sm text-slate-500"
        style={{ height }}
      >
        Location coordinates not available for this school.
      </div>
    );
  }

  return (
    <div
      className="relative z-0 overflow-hidden rounded-2xl border border-slate-200 shadow-sm"
      style={{ height }}
    >
      <MapContainer
        center={[school.latitude, school.longitude]}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Marker position={[school.latitude, school.longitude]} icon={schoolIcon}>
          <Popup>
            <div>
              <p style={{ fontWeight: 700, margin: '0 0 4px 0' }}>{school.name}</p>
              {school.address && (
                <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>{school.address}</p>
              )}
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
