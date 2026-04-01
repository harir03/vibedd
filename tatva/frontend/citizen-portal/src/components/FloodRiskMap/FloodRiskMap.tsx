import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '../../store/hooks';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon issue with bundlers
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const RISK_COLORS: Record<string, string> = {
  safe: '#22c55e',
  moderate: '#eab308',
  danger: '#f97316',
  severe: '#ef4444',
};

/** Creates a circle icon for hotspot markers */
function hotspotIcon(riskScore: number): L.DivIcon {
  const color =
    riskScore >= 0.8
      ? RISK_COLORS.severe
      : riskScore >= 0.6
        ? RISK_COLORS.danger
        : riskScore >= 0.4
          ? RISK_COLORS.moderate
          : RISK_COLORS.safe;
  return L.divIcon({
    className: 'hotspot-marker',
    html: `<div style="width:12px;height:12px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4);"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
}

/** Placeholder hotspot data — replaced by real API data in Tier 1 */
const PLACEHOLDER_HOTSPOTS = [
  { id: 1, lat: 13.0604, lng: 80.2496, riskScore: 0.92, label: 'T. Nagar Underpass' },
  { id: 2, lat: 13.0418, lng: 80.2341, riskScore: 0.85, label: 'Saidapet Railway Bridge' },
  { id: 3, lat: 13.0827, lng: 80.2707, riskScore: 0.78, label: 'Nungambakkam Tank' },
  { id: 4, lat: 13.0067, lng: 80.2206, riskScore: 0.71, label: 'Adyar River Junction' },
  { id: 5, lat: 13.1143, lng: 80.2849, riskScore: 0.65, label: 'Perambur Subway' },
  { id: 6, lat: 13.0475, lng: 80.2090, riskScore: 0.55, label: 'Ashok Nagar Low Area' },
  { id: 7, lat: 13.0674, lng: 80.2376, riskScore: 0.45, label: 'Kodambakkam Canal' },
  { id: 8, lat: 13.0356, lng: 80.2580, riskScore: 0.38, label: 'Mylapore Temple Area' },
];

/** Fly to user's location when available */
function FlyToUser() {
  const map = useMap();
  const { latitude, longitude } = useAppSelector((s) => s.floodRisk);
  const flown = useRef(false);

  useEffect(() => {
    if (latitude && longitude && !flown.current) {
      map.flyTo([latitude, longitude], 14, { duration: 1.5 });
      flown.current = true;
    }
  }, [latitude, longitude, map]);

  return null;
}

export default function FloodRiskMap() {
  const { t } = useTranslation();
  const { latitude, longitude } = useAppSelector((s) => s.floodRisk);

  // Default center: Chennai
  const center: [number, number] = [
    latitude ?? 13.0827,
    longitude ?? 80.2707,
  ];

  return (
    <div className="flex flex-col h-full">
      <h2 className="sr-only">{t('map.title')}</h2>

      <MapContainer
        center={center}
        zoom={12}
        className="flex-1 min-h-[300px] w-full rounded-xl z-0"
        attributionControl={true}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FlyToUser />

        {/* User location */}
        {latitude && longitude && (
          <Marker position={[latitude, longitude]}>
            <Popup>{t('simple_mode.your_area')}</Popup>
          </Marker>
        )}

        {/* Hotspot markers */}
        {PLACEHOLDER_HOTSPOTS.map((h) => (
          <Marker
            key={h.id}
            position={[h.lat, h.lng]}
            icon={hotspotIcon(h.riskScore)}
          >
            <Popup>
              <div className="text-sm">
                <strong>{h.label}</strong>
                <br />
                {t('map.hotspots')}: {(h.riskScore * 100).toFixed(0)}%
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Legend */}
      <div
        className="bg-white border border-gray-200 rounded-xl p-3 mt-2 mx-2 shadow-sm"
        role="region"
        aria-label={t('map.legend')}
      >
        <h3 className="text-xs font-semibold text-gray-500 mb-2">{t('map.legend')}</h3>
        <div className="flex flex-wrap gap-3 text-xs">
          {Object.entries(RISK_COLORS).map(([level, color]) => (
            <div key={level} className="flex items-center gap-1">
              <span
                className="inline-block w-3 h-3 rounded-full border border-gray-300"
                style={{ backgroundColor: color }}
                aria-hidden="true"
              />
              {t(`risk.${level}`)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
