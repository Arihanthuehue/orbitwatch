import React, { useState, useEffect } from 'react';
import { Radio, MapPin, Compass, Activity, Plus, RefreshCw, X, ExternalLink, Calendar } from 'lucide-react';
import { TrackingStation } from '../types/index.js';
import { DbInspectorStrip } from '../components/common/DbInspectorStrip.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import api from '../services/api.js';

export const GroundStationsPage: React.FC = () => {
  const { user, hasRole } = useAuth();
  const { addToast } = useToast();

  const [stations, setStations] = useState<TrackingStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStation, setSelectedStation] = useState<TrackingStation | null>(null);
  const [observations, setObservations] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'map' | 'cards'>('map');

  // Observation Form Modal
  const [showObsModal, setShowObsModal] = useState(false);
  const [obsForm, setObsForm] = useState({
    stationId: 1,
    targetType: 'satellite',
    targetId: 1,
    azimuth: '142.5',
    elevation: '48.2',
    rangeKm: '550.4',
    doppler: '7.45'
  });

  const [executedSql, setExecutedSql] = useState('');
  const [affectedRows, setAffectedRows] = useState<number | undefined>(undefined);

  const loadStations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/stations');
      if (res.data.success) {
        setStations(res.data.stations);
        if (res.data.stations.length > 0 && !selectedStation) {
          setSelectedStation(res.data.stations[0]);
          loadStationObservations(res.data.stations[0].Station_ID);
        }
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Load Error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const loadStationObservations = async (id: number) => {
    try {
      const res = await api.get(`/stations/${id}`);
      if (res.data.success) {
        setObservations(res.data.observations || []);
      }
    } catch {
      setObservations([]);
    }
  };

  useEffect(() => {
    loadStations();
  }, []);

  const handleSelectStation = (st: TrackingStation) => {
    setSelectedStation(st);
    loadStationObservations(st.Station_ID);
  };

  const handleRecordObservation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        stationId: parseInt(obsForm.stationId.toString(), 10),
        azimuthDeg: parseFloat(obsForm.azimuth),
        elevationDeg: parseFloat(obsForm.elevation),
        rangeKm: parseFloat(obsForm.rangeKm),
        dopplerKms: parseFloat(obsForm.doppler),
        observedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        qualityFlag: 'VERIFIED'
      };

      if (obsForm.targetType === 'satellite') {
        payload.satelliteId = parseInt(obsForm.targetId.toString(), 10);
      } else {
        payload.debrisId = parseInt(obsForm.targetId.toString(), 10);
      }

      const res = await api.post('/stations/observations', payload);
      if (res.data.success) {
        addToast({
          type: 'success',
          title: 'Radar Pass Logged',
          message: 'Observation written to partitioned OBSERVATION table (partition p2026).'
        });
        setExecutedSql(res.data.executedSql);
        setAffectedRows(1);
        setShowObsModal(false);
        if (selectedStation) loadStationObservations(selectedStation.Station_ID);
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Failed to log observation', message: err.response?.data?.message || err.message });
    }
  };

  // Convert lat/long to 2D Map SVG coordinates
  // Lat: -90 to +90 -> Y: 100% to 0%
  // Lon: -180 to +180 -> X: 0% to 100%
  const toMapCoords = (rawLat: any, rawLon: any) => {
    const lat = parseFloat(String(rawLat)) || 0;
    const lon = parseFloat(String(rawLon)) || 0;
    const x = ((lon + 180.0) / 360.0) * 100.0;
    const y = ((90.0 - lat) / 180.0) * 100.0;
    return { 
      x: `${Math.max(2, Math.min(97, x))}%`, 
      y: `${Math.max(5, Math.min(94, y))}%` 
    };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="bg-[#111111] p-6 rounded-2xl border border-[#262626] shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-6 h-6 text-orbit-yellow" />
            <h1 className="text-2xl font-bold text-white">
              Ground Tracking Stations &amp; Radar Surveillance Network
            </h1>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Global Space Surveillance Network (SSN), ISRO NETRA, and ESA OGS stations monitoring Earth orbit passes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-[#181818] p-1.5 rounded-xl border border-[#2a2a2a] text-xs">
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                viewMode === 'map' ? 'bg-orbit-yellow text-space-950 shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              2D World Map
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                viewMode === 'cards' ? 'bg-orbit-yellow text-space-950 shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Station Grid
            </button>
          </div>

          {hasRole(['Administrator', 'Space Agency']) && (
            <button
              onClick={() => setShowObsModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orbit-red text-white font-bold text-xs hover:bg-red-700 transition-all shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Record Radar Pass</span>
            </button>
          )}
        </div>
      </div>

      <DbInspectorStrip sql={executedSql} affectedRows={affectedRows} tableChanged="OBSERVATION (Partitioned)" />

      {/* 2D Map View */}
      {viewMode === 'map' && (
        <div className="bg-[#111111] p-6 rounded-2xl border border-[#262626] shadow-2xl relative overflow-hidden">
          <div className="text-xs uppercase tracking-wider mb-4 flex items-center justify-between">
            <span className="font-bold text-neutral-300">Global Space Surveillance Sensor Network (SSN) &bull; Equirectangular 2D Map</span>
            <span className="text-orbit-yellow font-bold">12 Verified Tracking Facilities Active</span>
          </div>

          <div className="relative w-full aspect-[2/1] bg-[#080808] rounded-xl border border-[#222222] overflow-hidden shadow-inner">
            {/* SVG Continents Silhouettes & Grid */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1000 500" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="gridPattern" width="50" height="50" patternUnits="userSpaceOnUse">
                  <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="1000" height="500" fill="url(#gridPattern)" />

              {/* Equirectangular Simplified Continental Silhouettes */}
              <g fill="#18181b" stroke="#2a2a2e" strokeWidth="0.8">
                {/* North America */}
                <path d="M 120 70 L 280 60 L 320 120 L 270 180 L 250 240 L 210 260 L 180 200 L 110 180 L 80 120 Z" />
                {/* South America */}
                <path d="M 270 250 L 350 270 L 380 340 L 330 460 L 290 440 L 260 330 Z" />
                {/* Europe */}
                <path d="M 460 70 L 580 60 L 590 140 L 520 170 L 450 160 L 440 100 Z" />
                {/* Africa */}
                <path d="M 460 170 L 580 170 L 620 270 L 570 410 L 490 390 L 440 250 Z" />
                {/* Asia */}
                <path d="M 590 60 L 900 60 L 920 180 L 820 280 L 730 250 L 660 160 L 590 140 Z" />
                {/* Indian Subcontinent */}
                <path d="M 680 180 L 740 180 L 730 260 L 700 290 L 670 240 Z" fill="#201c14" stroke="#78350f" />
                {/* Australia */}
                <path d="M 780 320 L 890 310 L 910 400 L 810 410 Z" />
                {/* United Kingdom */}
                <circle cx="485" cy="115" r="8" fill="#262626" />
                {/* Japan */}
                <path d="M 880 140 L 905 180 L 895 210 Z" />
              </g>

              {/* Equator */}
              <line x1="0" y1="250" x2="1000" y2="250" stroke="rgba(220, 38, 38, 0.4)" strokeWidth="1" strokeDasharray="6 4" />
              <text x="15" y="244" fill="#7f1d1d" fontSize="9" fontFamily="Arial">EQUATOR 0°</text>

              {/* Prime Meridian (Greenwich) */}
              <line x1="500" y1="0" x2="500" y2="500" stroke="rgba(217, 119, 6, 0.4)" strokeWidth="1" strokeDasharray="6 4" />
              <text x="506" y="20" fill="#92400e" fontSize="9" fontFamily="Arial">PRIME MERIDIAN 0°</text>
            </svg>

            {/* Station Map Pins */}
            {stations.map((st) => {
              const coords = toMapCoords(st.Latitude, st.Longitude);
              const isSelected = selectedStation?.Station_ID === st.Station_ID;
              return (
                <div
                  key={st.Station_ID}
                  style={{ left: coords.x, top: coords.y }}
                  onClick={() => handleSelectStation(st)}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-20"
                >
                  {/* Outer Radar Coverage Ring */}
                  <div className={`absolute rounded-full border border-dashed transition-all pointer-events-none -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 ${
                    isSelected
                      ? 'w-16 h-16 border-orbit-red bg-red-950/20'
                      : 'w-10 h-10 border-amber-600/40 group-hover:w-14 group-hover:h-14 group-hover:border-orbit-yellow'
                  }`} />

                  {/* Pin Dot */}
                  <div className={`relative flex items-center justify-center ${isSelected ? 'scale-125' : 'hover:scale-125'} transition-transform`}>
                    <span className={`w-3.5 h-3.5 rounded-full border-2 border-[#050505] shadow-lg ${isSelected ? 'bg-white ring-2 ring-orbit-red' : 'bg-orbit-yellow'}`} />
                  </div>

                  {/* Tooltip Hover Pill */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-xl bg-[#111111] text-[11px] text-white whitespace-nowrap pointer-events-none z-30 shadow-2xl border border-amber-700/60 flex flex-col items-center">
                    <span className="font-bold text-orbit-yellow">{st.Station_Name}</span>
                    <span className="text-[10px] text-neutral-400">{st.Location_Country} &bull; {Number(st.Latitude).toFixed(1)}°N, {Number(st.Longitude).toFixed(1)}°E</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Split Details: Station Card & Observation History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Stations List or Selected Station Profile */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <span className="text-xs font-mono text-slate-400 uppercase">Selected Facility</span>
            <span className="text-xs font-mono text-orbit-green font-bold">
              ID #{selectedStation?.Station_ID || 1}
            </span>
          </div>

          {selectedStation && (
            <div className="space-y-4 font-mono text-xs">
              <div>
                <h3 className="text-lg font-bold font-heading text-white">{selectedStation.Station_Name}</h3>
                <div className="flex items-center gap-1.5 text-slate-400 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-orbit-cyan" />
                  <span>{selectedStation.Location_Country}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-space-950/70 border border-white/5 space-y-2">
                <div className="text-[11px] text-slate-400 uppercase">Sensor Specifications</div>
                <div className="text-white font-semibold">{selectedStation.Sensor_Type}</div>
                <div className="text-slate-400 text-[11px]">
                  Coordinates: <span className="text-slate-200">{selectedStation.Latitude}&deg; N, {selectedStation.Longitude}&deg; E</span>
                </div>
                {selectedStation.source_url && (
                  <a
                    href={selectedStation.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-orbit-cyan hover:underline mt-1"
                  >
                    <span>Official Agency Profile</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="glass-card p-3 rounded-xl border border-white/5">
                  <span className="text-[10px] text-slate-400 block">TOTAL PASSES LOGGED</span>
                  <span className="text-xl font-bold text-orbit-green mt-0.5 block">
                    {selectedStation.Total_Observations_Logged || observations.length}
                  </span>
                </div>
                <div className="glass-card p-3 rounded-xl border border-white/5">
                  <span className="text-[10px] text-slate-400 block">SENSORS MONITORED</span>
                  <span className="text-xl font-bold text-white mt-0.5 block">
                    {selectedStation.Distinct_Satellites_Tracked || 25}+
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Quick Station Switcher */}
          <div className="pt-3 border-t border-white/5">
            <span className="text-[11px] font-mono text-slate-400 uppercase block mb-2">Switch Station:</span>
            <div className="flex flex-wrap gap-1">
              {stations.map((st) => (
                <button
                  key={st.Station_ID}
                  onClick={() => handleSelectStation(st)}
                  className={`px-2 py-1 rounded text-[11px] font-mono transition-colors ${
                    selectedStation?.Station_ID === st.Station_ID
                      ? 'bg-orbit-green text-space-950 font-bold'
                      : 'bg-space-950/60 text-slate-400 hover:text-white'
                  }`}
                >
                  {st.Station_Name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Observation Passes Table */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-2xl border border-white/10 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-orbit-cyan" />
              <span className="text-xs font-mono font-semibold text-white uppercase">
                Telemetry Passes Logged (Partitioned by Year)
              </span>
            </div>
            <span className="text-xs font-mono text-slate-400">{observations.length} passes recorded</span>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs font-mono">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-space-950/60 border-b border-white/5">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Target Tracked</th>
                  <th className="py-2.5 px-3">Range (KM)</th>
                  <th className="py-2.5 px-3">Az / El</th>
                  <th className="py-2.5 px-3">Doppler (KM/S)</th>
                  <th className="py-2.5 px-3">Quality</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {observations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No radar tracking passes logged for this facility yet.
                    </td>
                  </tr>
                ) : (
                  observations.map((obs) => (
                    <tr key={obs.Observation_ID} className="hover:bg-white/5 transition-colors">
                      <td className="py-2.5 px-3 text-slate-300">
                        {new Date(obs.observed_at).toISOString().slice(0, 16).replace('T', ' ')}
                      </td>
                      <td className="py-2.5 px-3 font-semibold">
                        <span className={obs.Satellite_ID ? 'text-orbit-cyan' : 'text-orbit-amber'}>
                          {obs.Satellite_Name || obs.Debris_Name || (obs.Satellite_ID ? `Sat #${obs.Satellite_ID}` : `Debris #${obs.Debris_ID}`)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-white">
                        {obs.range_km ? `${Math.round(obs.range_km)} km` : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">
                        {obs.azimuth_deg ? `${Math.round(obs.azimuth_deg)}°` : '-'} / {obs.elevation_deg ? `${Math.round(obs.elevation_deg)}°` : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">
                        {obs.doppler_kms ? `${obs.doppler_kms.toFixed(2)} km/s` : '-'}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-orbit-green/10 text-orbit-green border border-orbit-green/30">
                          {obs.quality_flag || 'GOOD'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Record Observation Modal */}
      {showObsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md glass-panel p-6 rounded-2xl border border-white/15 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-heading font-bold text-lg text-white">Record Sensor Observation Pass</h3>
              <button onClick={() => setShowObsModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordObservation} className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Tracking Station *</label>
                <select
                  value={obsForm.stationId}
                  onChange={(e) => setObsForm({ ...obsForm, stationId: Number(e.target.value) })}
                  className="w-full glass-input px-3 py-2 text-xs"
                >
                  {stations.map((st) => (
                    <option key={st.Station_ID} value={st.Station_ID} className="bg-space-950 text-white">
                      {st.Station_Name} ({st.Location_Country})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Target Type *</label>
                  <select
                    value={obsForm.targetType}
                    onChange={(e) => setObsForm({ ...obsForm, targetType: e.target.value })}
                    className="w-full glass-input px-3 py-2 text-xs"
                  >
                    <option value="satellite" className="bg-space-950 text-white">Satellite</option>
                    <option value="debris" className="bg-space-950 text-white">Debris Fragment</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Target ID *</label>
                  <input
                    type="number"
                    required
                    value={obsForm.targetId}
                    onChange={(e) => setObsForm({ ...obsForm, targetId: Number(e.target.value) })}
                    className="w-full glass-input px-3 py-2 text-xs"
                    placeholder="e.g. 1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Azimuth (&deg;) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={obsForm.azimuth}
                    onChange={(e) => setObsForm({ ...obsForm, azimuth: e.target.value })}
                    className="w-full glass-input px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Elevation (&deg;) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={obsForm.elevation}
                    onChange={(e) => setObsForm({ ...obsForm, elevation: e.target.value })}
                    className="w-full glass-input px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Range (KM) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={obsForm.rangeKm}
                    onChange={(e) => setObsForm({ ...obsForm, rangeKm: e.target.value })}
                    className="w-full glass-input px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Doppler Velocity (KM/S) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={obsForm.doppler}
                    onChange={(e) => setObsForm({ ...obsForm, doppler: e.target.value })}
                    className="w-full glass-input px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowObsModal(false)}
                  className="px-4 py-2 rounded-lg glass-card text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-orbit-green text-space-950 font-bold hover:bg-orbit-green/90 transition-all shadow-md shadow-orbit-green/20"
                >
                  Commit Radar Observation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
