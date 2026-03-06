import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import UIcon from './UIcon';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon issue with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Ramadan-themed custom SVG markers
function createSvgIcon(color, glowColor, symbolPath) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="48" viewBox="0 0 36 48">
      <defs>
        <filter id="glow-${color.replace('#','')}" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur"/>
          <feFlood flood-color="${glowColor}" flood-opacity="0.5" result="color"/>
          <feComposite in="color" in2="blur" operator="in" result="shadow"/>
          <feMerge><feMergeNode in="shadow"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <path d="M18 0C9 0 2 7 2 15.5C2 28 18 48 18 48S34 28 34 15.5C34 7 27 0 18 0Z" 
            fill="${color}" filter="url(#glow-${color.replace('#','')})" stroke="rgba(255,255,255,0.4)" stroke-width="1"/>
      <circle cx="18" cy="15" r="9" fill="rgba(255,255,255,0.2)"/>
      ${symbolPath}
    </svg>`;
  return new L.DivIcon({
    html: svg,
    className: 'ramadan-marker',
    iconSize: [36, 48],
    iconAnchor: [18, 48],
    popupAnchor: [0, -44],
  });
}

// SVG symbol paths for map markers (renders identically on all platforms)
const starSymbol = '<path d="M18 8l2 4.5 5 .7-3.6 3.5.9 5-4.3-2.3L13.7 21.7l.9-5L11 13.2l5-.7z" fill="white" opacity="0.9"/>';
const moonSymbol = '<path d="M20 9a6 6 0 1 0 0 12 4.5 4.5 0 0 1 0-12z" fill="white" opacity="0.9"/>';
const checkSymbol = '<path d="M12.5 15l3.5 3.5 7-7" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>';

const needIcon = createSvgIcon('#064E3B', '#10B981', starSymbol);
const fundedIcon = createSvgIcon('#B45309', '#FBBF24', moonSymbol);
const confirmedIcon = createSvgIcon('#059669', '#34D399', checkSymbol);

function getIcon(status) {
  switch (status) {
    case 'FUNDED': return fundedIcon;
    case 'CONFIRMED': return confirmedIcon;
    default: return needIcon;
  }
}

// Ramadan-themed popup styles
const popupStyle = {
  wrapper: {
    minWidth: '180px',
    maxWidth: '280px',
    padding: '0.25rem',
    fontFamily: "'Inter', sans-serif",
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '0.625rem',
    paddingBottom: '0.5rem',
    borderBottom: '1px solid #E5E7EB',
  },
  type: {
    fontSize: '0.7rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: '#064E3B',
    background: '#ECFDF5',
    padding: '0.2rem 0.625rem',
    borderRadius: '999px',
  },
  badge: (status) => ({
    fontSize: '0.65rem',
    fontWeight: 700,
    padding: '0.15rem 0.5rem',
    borderRadius: '999px',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    background: status === 'OPEN' ? '#E0F2FE' : status === 'FUNDED' ? '#FEF3C7' : '#D1FAE5',
    color: status === 'OPEN' ? '#0284C7' : status === 'FUNDED' ? '#B45309' : '#059669',
  }),
  desc: {
    fontSize: '0.825rem',
    fontWeight: 500,
    color: '#1F2937',
    lineHeight: 1.5,
    marginBottom: '0.5rem',
  },
  meta: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.5rem',
  },
  location: {
    fontSize: '0.75rem',
    color: '#6B7280',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  amount: {
    fontSize: '0.95rem',
    fontWeight: 800,
    color: '#064E3B',
    letterSpacing: '-0.02em',
  },
};

export default function NeedsMap({ needs = [], onNeedClick, height = '400px' }) {
  // Default center: Nouakchott, Mauritania
  const center = [18.0866, -15.9785];

  if (needs.length === 0) {
    return (
      <div className="map-empty-state" style={{ height }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.75rem', opacity: 0.4 }}><UIcon name="moon" variant="sr" size={48} color="#f59e0b" /></div>
        <p style={{ color: 'var(--text-muted)', fontWeight: 500 }}>No needs to display on map</p>
      </div>
    );
  }

  return (
    <div className="map-ramadan-wrapper">
      {/* Decorative crescent */}
      <div className="map-crescent-decoration" aria-hidden="true"><UIcon name="moon-stars" variant="sr" color="#f59e0b" /></div>

      {/* Map legend */}
      <div className="map-legend">
        <div className="map-legend-item">
          <span className="map-legend-dot" style={{ background: '#064E3B' }}></span>
          <span>Open</span>
        </div>
        <div className="map-legend-item">
          <span className="map-legend-dot" style={{ background: '#B45309' }}></span>
          <span>Funded</span>
        </div>
        <div className="map-legend-item">
          <span className="map-legend-dot" style={{ background: '#059669' }}></span>
          <span>Confirmed</span>
        </div>
      </div>

      <MapContainer
        center={center}
        zoom={14}
        style={{ height, width: '100%', borderRadius: 'var(--radius-2xl)' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        {needs.map((need) => (
          <Marker
            key={need.id}
            position={[need.lat, need.lng]}
            icon={getIcon(need.status)}
            eventHandlers={{
              click: () => onNeedClick && onNeedClick(need),
            }}
          >
            <Popup>
              <div style={popupStyle.wrapper}>
                <div style={popupStyle.header}>
                  <span style={popupStyle.type}>{need.type}</span>
                  <span style={popupStyle.badge(need.status)}>{need.status}</span>
                </div>
                <p style={popupStyle.desc}>{need.description}</p>
                <div style={popupStyle.meta}>
                  <span style={popupStyle.location}>◆ {need.neighborhood}</span>
                  <span style={popupStyle.amount}>{need.estimatedAmount?.toLocaleString()} MRU</span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
