import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import type { AdminJob } from '../../types';

interface Props {
  jobs: AdminJob[];
  onRemoveJob: (job: AdminJob) => void;
}

const campusCenter: [number, number] = [28.6139, 77.2090]; // Delhi University Campus Center

// Create customized modern SVG marker icon
const createCustomIcon = (type: string, isRemote: boolean) => {
  const color = isRemote ? '#8b5cf6' : type === 'SHORT_TERM' ? '#f59e0b' : '#3b82f6';
  const symbol = type === 'SHORT_TERM' ? '⚡' : '📅';
  
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="
        background: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 10px rgba(0,0,0,0.5);
        border: 2px solid white;
      ">
        <span style="
          transform: rotate(45deg);
          font-size: 14px;
          color: white;
          font-weight: bold;
        ">${symbol}</span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

export function JobsMapView({ jobs, onRemoveJob }: Props) {
  const onSiteJobs = jobs.filter(j => !j.isRemote && j.location && j.location.lat !== 0);

  return (
    <div className="bg-slate-950/60 border border-slate-800 rounded-2xl overflow-hidden shadow-sm relative">
      {/* Map Header Indicator */}
      <div className="absolute top-4 left-4 z-[1000] bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl px-4 py-2.5 shadow-xl flex items-center gap-3">
        <span className="w-2.5 h-2.5 rounded-full bg-violet-500 animate-pulse"></span>
        <div className="text-xs">
          <p className="font-bold text-white leading-tight">5 km Campus Radius Zone</p>
          <p className="text-slate-400 text-[11px] mt-0.5">{onSiteJobs.length} on-site gigs plotted on OpenStreetMap</p>
        </div>
      </div>

      <div className="h-[520px] w-full">
        <MapContainer
          center={campusCenter}
          zoom={14}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%', background: '#090d16' }}
        >
          {/* Free OpenStreetMap Tiles */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* 5 km Campus Radius Circle */}
          <Circle
            center={campusCenter}
            radius={5000} // 5 km
            pathOptions={{
              color: '#7c3aed',
              fillColor: '#7c3aed',
              fillOpacity: 0.08,
              weight: 2,
              dashArray: '6, 6',
            }}
          />

          {/* Campus Center Marker */}
          <Marker
            position={campusCenter}
            icon={L.divIcon({
              className: 'campus-center-marker',
              html: `
                <div style="
                  background: #7c3aed;
                  color: white;
                  padding: 4px 8px;
                  border-radius: 9999px;
                  font-size: 11px;
                  font-weight: bold;
                  box-shadow: 0 4px 12px rgba(124,58,237,0.5);
                  white-space: nowrap;
                  border: 2px solid white;
                ">
                  🏫 Campus Center
                </div>
              `,
              iconAnchor: [50, 16],
            })}
          >
            <Popup>
              <div className="text-slate-900 text-xs font-sans">
                <strong className="block text-sm">University Campus Center</strong>
                <p className="text-slate-600 mt-1">Reference origin for 5 km hyperlocal radius filter.</p>
              </div>
            </Popup>
          </Marker>

          {/* Job Markers */}
          {onSiteJobs.map(job => (
            <Marker
              key={job.id}
              position={[job.location.lat, job.location.lng]}
              icon={createCustomIcon(job.type, job.isRemote)}
            >
              <Popup>
                <div className="text-slate-900 p-1 font-sans min-w-[200px]">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-violet-100 text-violet-800">
                      {job.type}
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-700">
                      ₹{job.pay} ({job.payUnit})
                    </span>
                  </div>

                  <strong className="block text-sm font-bold text-slate-950 mb-1 leading-snug">
                    {job.title}
                  </strong>

                  <p className="text-xs text-slate-600 mb-2 flex items-center gap-1">
                    📍 {job.location.label}
                  </p>

                  <div className="text-[11px] text-slate-600 border-t pt-2 space-y-1">
                    <p><strong>Poster:</strong> {job.postedBy.name}</p>
                    <p><strong>Slots:</strong> {job.filledCount} of {job.openings} claimed</p>
                  </div>

                  <button
                    onClick={() => onRemoveJob(job)}
                    className="w-full mt-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold py-1 px-2.5 rounded text-xs transition text-center"
                  >
                    Moderate / Remove Gig
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
