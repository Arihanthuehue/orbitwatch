import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, Play, Pause, RotateCcw, 
  Layers, Info, Shield, Radio, ChevronRight, X, AlertTriangle, 
  Activity, Orbit, Zap, Move, MapPin, ExternalLink, Calendar 
} from 'lucide-react';
import { OrbitGlobeCanvas } from '../components/globe/OrbitGlobeCanvas.js';
import { OrbitObject, TrackingStation, ConjunctionEvent } from '../types/index.js';
import { Badge } from '../components/common/Badge.js';
import api from '../services/api.js';

interface OrbitExplorerProps {
  objects: OrbitObject[];
  stations: TrackingStation[];
  conjunctions: ConjunctionEvent[];
}

export const OrbitExplorerPage: React.FC<OrbitExplorerProps> = ({
  objects,
  stations,
  conjunctions
}) => {
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [orbitClass, setOrbitClass] = useState<string>('ALL');
  const [sizeClass, setSizeClass] = useState<string>('ALL');
  const [showSatellites, setShowSatellites] = useState(true);
  const [showDebris, setShowDebris] = useState(true);
  const [showStations, setShowStations] = useState(true);
  const [showConjunctions, setShowConjunctions] = useState(true);
  const [maxAltitude, setMaxAltitude] = useState<number>(36000);

  // Time Controls
  const [isPaused, setIsPaused] = useState(false);
  const [timeScale, setTimeScale] = useState<number>(1);

  // Selection & Details (Space Object)
  const [selectedObject, setSelectedObject] = useState<OrbitObject | null>(null);
  const [hoveredObject, setHoveredObject] = useState<OrbitObject | null>(null);

  // Selection & Details (Ground Tracking Station)
  const [selectedStation, setSelectedStation] = useState<TrackingStation | null>(null);
  const [hoveredStation, setHoveredStation] = useState<TrackingStation | null>(null);
  const [stationObservations, setStationObservations] = useState<any[]>([]);

  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  // Detail panel tabs & lineage data
  const [detailTab, setDetailTab] = useState<'elements' | 'history' | 'lineage' | 'conjunctions'>('elements');
  const [lineageTree, setLineageTree] = useState<any[]>([]);
  const [objectConjunctions, setObjectConjunctions] = useState<any[]>([]);

  // Filtered objects
  const filteredObjects = useMemo(() => {
    return objects.filter((o) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = o.name.toLowerCase().includes(q);
        const matchNorad = o.NORAD_ID.toString().includes(q);
        if (!matchName && !matchNorad) return false;
      }

      if (orbitClass !== 'ALL' && o.orbit_class !== orbitClass) return false;
      if (sizeClass !== 'ALL' && o.rcs_size_class !== sizeClass) return false;
      if (o.altitude > maxAltitude) return false;

      return true;
    });
  }, [objects, searchQuery, orbitClass, sizeClass, maxAltitude]);

  const handleSelectObject = async (obj: OrbitObject | null) => {
    setSelectedObject(obj);
    if (obj) {
      setSelectedStation(null); // Close station panel
    }
    if (!obj) {
      setLineageTree([]);
      setObjectConjunctions([]);
      return;
    }

    if (obj.type === 'DEBRIS') {
      try {
        const res = await api.get(`/objects/debris/lineage/${obj.NORAD_ID}`);
        if (res.data.success) {
          setLineageTree(res.data.lineageTree || []);
        }
      } catch {
        setLineageTree([]);
      }
    }

    const related = conjunctions.filter(
      (c) => c.Sat_NORAD_ID === obj.NORAD_ID || c.Debris_NORAD_ID === obj.NORAD_ID
    );
    setObjectConjunctions(related);
  };

  const handleSelectStation = async (st: TrackingStation | null) => {
    setSelectedStation(st);
    if (st) {
      setSelectedObject(null); // Close satellite panel
      try {
        const res = await api.get(`/stations/${st.Station_ID}`);
        if (res.data.success) {
          setStationObservations(res.data.observations || []);
        }
      } catch {
        setStationObservations([]);
      }
    } else {
      setStationObservations([]);
    }
  };

  const kineticEnergyMj = useMemo(() => {
    if (!selectedObject) return 0;
    const vKms = 7.6;
    const massKg = selectedObject.size_meters ? (selectedObject.size_meters * 15.0) : 2.5;
    return Math.round(0.5 * massKg * Math.pow(vKms * 1000, 2) / 1000000 * 100) / 100;
  }, [selectedObject]);

  return (
    <div className="relative w-full h-[calc(100vh-60px)] bg-[#050505] overflow-hidden select-none">
      {/* Full-bleed 3D Globe with Free 3D Drag & Pan */}
      <div className="absolute inset-0 z-0">
        <OrbitGlobeCanvas
          objects={filteredObjects}
          stations={stations}
          conjunctions={conjunctions}
          selectedObject={selectedObject}
          selectedStation={selectedStation}
          onSelectObject={handleSelectObject}
          onSelectStation={handleSelectStation}
          showSatellites={showSatellites}
          showDebris={showDebris}
          showStations={showStations}
          showConjunctions={showConjunctions}
          timeScale={timeScale}
          isPaused={isPaused}
          onObjectHover={(obj, pos) => {
            setHoveredObject(obj);
            setMousePos(pos);
          }}
          onStationHover={(st, pos) => {
            setHoveredStation(st);
            setMousePos(pos);
          }}
        />
      </div>

      {/* Floating Hover Tooltip for Ground Station */}
      {hoveredStation && mousePos && !selectedStation && !selectedObject && (
        <div
          style={{ left: mousePos.x + 14, top: mousePos.y + 14 }}
          className="fixed z-50 pointer-events-none bg-[#111111] px-4 py-3 rounded-xl border border-amber-600 text-xs shadow-2xl max-w-xs"
        >
          <div className="font-bold text-white flex items-center gap-1.5">
            <Radio className="w-4 h-4 text-orbit-yellow flex-shrink-0" />
            <span className="truncate">{hoveredStation.Station_Name}</span>
          </div>
          <div className="text-[11px] text-neutral-300 mt-1">
            {hoveredStation.Location_Country} &bull; {hoveredStation.Sensor_Type}
          </div>
          <div className="text-[10px] text-orbit-yellow mt-1 font-bold">
            Click to inspect radar surveillance telemetry &bull; {hoveredStation.Latitude}&deg; N, {hoveredStation.Longitude}&deg; E
          </div>
        </div>
      )}

      {/* Floating Hover Tooltip for Space Object */}
      {hoveredObject && mousePos && !selectedObject && !selectedStation && !hoveredStation && (
        <div
          style={{ left: mousePos.x + 12, top: mousePos.y + 12 }}
          className="fixed z-50 pointer-events-none bg-[#111111] px-3.5 py-2.5 rounded-xl border border-[#2e2e2e] text-xs shadow-2xl"
        >
          <div className="font-bold text-white flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${hoveredObject.type === 'SATELLITE' ? 'bg-orbit-yellow' : 'bg-orbit-red'}`} />
            <span>{hoveredObject.name}</span>
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            NORAD #{hoveredObject.NORAD_ID} &bull; Alt: {Math.round(hoveredObject.altitude)} km &bull; {hoveredObject.orbit_class}
          </div>
        </div>
      )}

      {/* Top Floating Search & Quick Filters Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Search Input */}
        <div className="pointer-events-auto flex items-center gap-2.5 bg-[#111111] px-3.5 py-2.5 rounded-xl border border-[#2a2a2a] w-full max-w-md shadow-2xl">
          <Search className="w-4 h-4 text-neutral-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search by satellite name or NORAD ID (e.g. STARLINK, 25544)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-white placeholder-neutral-500 focus:outline-none"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-neutral-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Real-time Object Counter Pill */}
        <div className="pointer-events-auto hidden sm:flex items-center gap-3 bg-[#111111] px-4 py-2 rounded-xl border border-[#2a2a2a] text-xs shadow-2xl">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orbit-yellow" />
            <span className="text-neutral-400">Satellites:</span>
            <span className="text-white font-bold">{showSatellites ? filteredObjects.filter(o => o.type === 'SATELLITE').length : 0}</span>
          </div>
          <span className="text-neutral-700">|</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orbit-red" />
            <span className="text-neutral-400">Debris:</span>
            <span className="text-white font-bold">{showDebris ? filteredObjects.filter(o => o.type === 'DEBRIS').length : 0}</span>
          </div>
          <span className="text-neutral-700">|</span>
          <div className="flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-orbit-yellow" />
            <span className="text-neutral-400">Stations:</span>
            <span className="text-white font-bold">{stations.length}</span>
          </div>
        </div>
      </div>

      {/* Left Floating Filter Controls Panel */}
      <div className="absolute top-20 left-4 z-20 w-64 bg-[#111111] rounded-2xl border border-[#262626] p-4 shadow-2xl hidden md:block">
        <div className="flex items-center justify-between pb-2 border-b border-[#222222] mb-3">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-orbit-yellow">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter Controls</span>
          </div>
          <span className="text-[10px] text-neutral-400 font-bold">{filteredObjects.length} active</span>
        </div>

        {/* Orbit Class Filters */}
        <div className="mb-4">
          <label className="text-[11px] text-neutral-400 uppercase tracking-wide block mb-1.5 font-bold">
            Orbital Regime:
          </label>
          <div className="grid grid-cols-5 gap-1 text-[11px]">
            {['ALL', 'LEO', 'MEO', 'GEO', 'HEO'].map((c) => (
              <button
                key={c}
                onClick={() => setOrbitClass(c)}
                className={`py-1 rounded text-center transition-all ${
                  orbitClass === c
                    ? 'bg-orbit-yellow text-space-950 font-bold shadow-sm'
                    : 'bg-[#181818] text-neutral-400 hover:text-white hover:bg-[#242424]'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Object Type Toggles */}
        <div className="mb-4">
          <label className="text-[11px] text-neutral-400 uppercase tracking-wide block mb-1.5 font-bold">
            Visible Layers:
          </label>
          <div className="space-y-1.5 text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-neutral-300 hover:text-white">
              <input
                type="checkbox"
                checked={showSatellites}
                onChange={(e) => setShowSatellites(e.target.checked)}
                className="rounded border-[#333333] bg-[#0c0c0c] text-orbit-yellow focus:ring-0"
              />
              <span className="w-2.5 h-2.5 rounded-full bg-orbit-yellow" />
              <span>Active Satellites</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-neutral-300 hover:text-white">
              <input
                type="checkbox"
                checked={showDebris}
                onChange={(e) => setShowDebris(e.target.checked)}
                className="rounded border-[#333333] bg-[#0c0c0c] text-orbit-red focus:ring-0"
              />
              <span className="w-2.5 h-2.5 rounded-full bg-orbit-red" />
              <span>Debris Fragments</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-neutral-300 hover:text-white">
              <input
                type="checkbox"
                checked={showStations}
                onChange={(e) => setShowStations(e.target.checked)}
                className="rounded border-[#333333] bg-[#0c0c0c] text-orbit-yellow focus:ring-0"
              />
              <Radio className="w-3.5 h-3.5 text-orbit-yellow" />
              <span>Ground Stations (12)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-neutral-300 hover:text-white">
              <input
                type="checkbox"
                checked={showConjunctions}
                onChange={(e) => setShowConjunctions(e.target.checked)}
                className="rounded border-[#333333] bg-[#0c0c0c] text-orbit-red focus:ring-0"
              />
              <span className="w-2.5 h-2.5 rounded-full bg-orbit-red" />
              <span>Conjunction Links</span>
            </label>
          </div>
        </div>

        {/* Altitude Range Slider */}
        <div className="mb-2">
          <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-1 font-bold">
            <span>MAX ALTITUDE:</span>
            <span className="text-white">{maxAltitude >= 36000 ? 'GEO (36,000 km)' : `${maxAltitude} km`}</span>
          </div>
          <input
            type="range"
            min={500}
            max={36000}
            step={500}
            value={maxAltitude}
            onChange={(e) => setMaxAltitude(Number(e.target.value))}
            className="w-full accent-orbit-yellow bg-[#0d0d0d] cursor-pointer"
          />
        </div>
      </div>

      {/* Bottom Floating Time & Camera Controls Bar */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 bg-[#111111] px-5 py-2.5 rounded-2xl border border-[#282828] flex flex-col sm:flex-row items-center gap-3 shadow-2xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
              isPaused
                ? 'bg-amber-950/80 text-amber-400 border border-amber-700'
                : 'bg-orbit-red text-white shadow-md'
            }`}
          >
            {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5 fill-current" />}
            <span>{isPaused ? 'Resume' : 'Live'}</span>
          </button>

          <div className="flex items-center gap-1 bg-[#181818] p-1 rounded-xl border border-[#2a2a2a] text-xs">
            {[1, 5, 25, 100].map((scale) => (
              <button
                key={scale}
                onClick={() => {
                  setTimeScale(scale);
                  setIsPaused(false);
                }}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  timeScale === scale && !isPaused
                    ? 'bg-orbit-yellow text-space-950 font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {scale}x
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              setTimeScale(1);
              setIsPaused(false);
            }}
            title="Reset Simulation Time"
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-[#202020] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 3D Motion Instruction Cue */}
        <div className="hidden md:flex items-center gap-1.5 pl-3 border-l border-[#2a2a2a] text-[11px] text-neutral-400">
          <Move className="w-3.5 h-3.5 text-orbit-yellow" />
          <span>Left Drag: Rotate &bull; Right Drag / Touch: Move Up-Down &bull; Scroll: Zoom</span>
        </div>
      </div>

      {/* Slide-in Ground Station Detail Panel */}
      <AnimatePresence>
        {selectedStation && (
          <motion.div
            initial={{ x: 420, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 420, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="absolute top-4 right-4 bottom-4 z-30 w-full max-w-md bg-[#121212] rounded-2xl border border-amber-700/60 p-5 shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="flex items-start justify-between pb-3 border-b border-[#242424]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] bg-amber-950/80 text-orbit-yellow border border-amber-700 font-bold">
                    GROUND RADAR FACILITY
                  </span>
                  <span className="text-xs text-neutral-400 font-bold">ID #{selectedStation.Station_ID}</span>
                </div>
                <h2 className="text-xl font-bold text-white mt-1.5">{selectedStation.Station_Name}</h2>
                <div className="text-xs text-neutral-400 mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-orbit-yellow" />
                  <span>{selectedStation.Location_Country}</span>
                </div>
              </div>

              <button
                onClick={() => handleSelectStation(null)}
                className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-[#222222] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pt-3 pr-1">
              <div className="bg-[#181818] p-4 rounded-xl border border-[#2a2a2a] space-y-2 text-xs">
                <span className="text-[10px] text-neutral-400 font-bold uppercase block">SURVEILLANCE RADAR SPECIFICATION</span>
                <div className="text-white font-bold">{selectedStation.Sensor_Type}</div>
                <div className="text-neutral-300">
                  Geographic Coordinates: <span className="text-white font-bold">{selectedStation.Latitude}&deg; N, {selectedStation.Longitude}&deg; E</span>
                </div>
                {selectedStation.source_url && (
                  <a
                    href={selectedStation.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-orbit-yellow hover:underline mt-1 font-bold"
                  >
                    <span>Official Facility Profile</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-[#181818] p-3 rounded-xl border border-[#2a2a2a] text-center">
                  <span className="text-[10px] text-neutral-400 font-bold block">PASSES LOGGED</span>
                  <span className="text-xl font-bold text-orbit-yellow mt-0.5 block">
                    {selectedStation.Total_Observations_Logged || stationObservations.length}
                  </span>
                </div>
                <div className="bg-[#181818] p-3 rounded-xl border border-[#2a2a2a] text-center">
                  <span className="text-[10px] text-neutral-400 font-bold block">SENSORS MONITORED</span>
                  <span className="text-xl font-bold text-white mt-0.5 block">
                    {selectedStation.Distinct_Satellites_Tracked || 25}+
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-neutral-400 font-bold text-[11px]">
                  <span>RECENT TELEMETRY PASSES ({stationObservations.length}):</span>
                </div>

                {stationObservations.length === 0 ? (
                  <div className="text-center py-6 text-xs text-neutral-500">
                    No active pass logs found for this station.
                  </div>
                ) : (
                  stationObservations.slice(0, 8).map((obs: any, idx: number) => (
                    <div key={idx} className="bg-[#181818] p-3 rounded-xl border border-[#2a2a2a] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">
                          {obs.Satellite_Name || obs.Debris_Name || (obs.Satellite_ID ? `Sat #${obs.Satellite_ID}` : `Debris #${obs.Debris_ID}`)}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                          {obs.quality_flag || 'GOOD'}
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-400 flex items-center justify-between">
                        <span>Range: <strong className="text-white">{Math.round(obs.range_km || 500)} km</strong></span>
                        <span>Az/El: {Math.round(obs.azimuth_deg || 0)}&deg; / {Math.round(obs.elevation_deg || 0)}&deg;</span>
                      </div>
                      <div className="text-[10px] text-neutral-500">
                        {new Date(obs.observed_at).toISOString().slice(0, 16).replace('T', ' ')}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slide-in Satellite / Debris Detail Panel */}
      <AnimatePresence>
        {selectedObject && (
          <motion.div
            initial={{ x: 420, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 420, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="absolute top-4 right-4 bottom-4 z-30 w-full max-w-md bg-[#121212] rounded-2xl border border-[#2c2c2c] p-5 shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-[#242424]">
              <div className="pr-4 min-w-0">
                <div className="flex items-center gap-2">
                  <Badge type="orbit" value={selectedObject.orbit_class} />
                  <Badge type="status" value={selectedObject.type} />
                </div>
                <h2 className="text-xl font-bold text-white mt-1.5 truncate">
                  {selectedObject.name}
                </h2>
                <div className="text-xs text-neutral-400 mt-0.5">
                  NORAD ID: <span className="text-white font-bold">{selectedObject.NORAD_ID}</span> &bull; {selectedObject.owner}
                </div>
              </div>

              <button
                onClick={() => handleSelectObject(null)}
                className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-[#222222] transition-colors flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs in Panel */}
            <div className="flex items-center gap-1 border-b border-[#242424] my-3 text-xs">
              <button
                onClick={() => setDetailTab('elements')}
                className={`px-3 py-1.5 border-b-2 font-bold transition-colors ${
                  detailTab === 'elements'
                    ? 'border-orbit-yellow text-orbit-yellow'
                    : 'border-transparent text-neutral-400 hover:text-white'
                }`}
              >
                Elements
              </button>

              <button
                onClick={() => setDetailTab('conjunctions')}
                className={`px-3 py-1.5 border-b-2 font-bold transition-colors ${
                  detailTab === 'conjunctions'
                    ? 'border-orbit-red text-orbit-red'
                    : 'border-transparent text-neutral-400 hover:text-white'
                }`}
              >
                Conjunctions ({objectConjunctions.length})
              </button>

              {selectedObject.type === 'DEBRIS' && (
                <button
                  onClick={() => setDetailTab('lineage')}
                  className={`px-3 py-1.5 border-b-2 font-bold transition-colors ${
                    detailTab === 'lineage'
                      ? 'border-orbit-yellow text-orbit-yellow'
                      : 'border-transparent text-neutral-400 hover:text-white'
                  }`}
                >
                  Lineage Tree
                </button>
              )}
            </div>

            {/* Panel Tab Content */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-4">
              {detailTab === 'elements' && (
                <>
                  {/* Primary State Cards */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-[#181818] p-3 rounded-xl border border-[#2a2a2a]">
                      <span className="text-[10px] text-neutral-400 font-bold block">MEAN ALTITUDE</span>
                      <span className="text-base font-bold text-white mt-0.5 block">
                        {Math.round(selectedObject.altitude)} km
                      </span>
                    </div>

                    <div className="bg-[#181818] p-3 rounded-xl border border-[#2a2a2a]">
                      <span className="text-[10px] text-neutral-400 font-bold block">INCLINATION</span>
                      <span className="text-base font-bold text-orbit-yellow mt-0.5 block">
                        {selectedObject.inclination.toFixed(2)}&deg;
                      </span>
                    </div>

                    <div className="bg-[#181818] p-3 rounded-xl border border-[#2a2a2a]">
                      <span className="text-[10px] text-neutral-400 font-bold block">ECCENTRICITY</span>
                      <span className="text-base font-bold text-neutral-200 mt-0.5 block">
                        {selectedObject.eccentricity.toFixed(5)}
                      </span>
                    </div>

                    <div className="bg-[#181818] p-3 rounded-xl border border-[#2a2a2a]">
                      <span className="text-[10px] text-neutral-400 font-bold block">MEAN MOTION</span>
                      <span className="text-base font-bold text-neutral-200 mt-0.5 block">
                        {selectedObject.mean_motion.toFixed(3)} rev/d
                      </span>
                    </div>
                  </div>

                  {/* SGP4 Keplerian Parameters */}
                  <div className="bg-[#181818] p-3.5 rounded-xl border border-[#2a2a2a] text-xs">
                    <div className="text-[11px] font-bold text-orbit-yellow uppercase tracking-wider mb-2">
                      Keplerian SGP4 Vectors
                    </div>
                    <div className="grid grid-cols-2 gap-y-1.5 text-neutral-300">
                      <div>RAAN (&Omega;): <span className="text-white font-bold">{selectedObject.raan?.toFixed(2) || '0.00'}&deg;</span></div>
                      <div>Arg Pericenter (&omega;): <span className="text-white font-bold">{selectedObject.arg_pericenter?.toFixed(2) || '0.00'}&deg;</span></div>
                      <div>Mean Anomaly (M): <span className="text-white font-bold">{selectedObject.mean_anomaly?.toFixed(2) || '0.00'}&deg;</span></div>
                      <div>BSTAR Drag: <span className="text-white font-bold">{selectedObject.bstar?.toExponential(2) || '0.00'}</span></div>
                    </div>
                  </div>

                  {/* Kinetic Energy Explainer Callout */}
                  <div className="bg-[#1c1409] p-3.5 rounded-xl border border-amber-800/60 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-orbit-yellow mb-1">
                      <Zap className="w-4 h-4" />
                      <span>Kinetic Energy at 7.6 km/s: {kineticEnergyMj} MJ</span>
                    </div>
                    <p className="text-[11px] text-neutral-300 leading-relaxed">
                      Calculated via E_k = &frac12;mv&sup2;. In hypervelocity LEO orbital impacts, this energy is equivalent to ~{(kineticEnergyMj / 4.184).toFixed(2)} kg of TNT, creating catastrophic fragmentation.
                    </p>
                  </div>
                </>
              )}

              {detailTab === 'conjunctions' && (
                <div className="space-y-2">
                  {objectConjunctions.length === 0 ? (
                    <div className="text-center py-8 text-xs text-neutral-500">
                      No critical close encounters recorded for this object.
                    </div>
                  ) : (
                    objectConjunctions.map((c) => (
                      <div key={c.Event_ID} className="bg-[#181818] p-3 rounded-xl border border-[#2a2a2a] text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-white">Event #{c.Event_ID}</span>
                          <Badge type="risk" value={c.risk_level} />
                        </div>
                        <div className="text-neutral-300 text-[11px]">
                          <div>Encounter: <span className="text-orbit-yellow font-bold">{c.Satellite_Name}</span> vs <span className="text-orbit-red font-bold">{c.Debris_Name}</span></div>
                          <div className="mt-1">Miss Distance: <span className="text-white font-bold">{c.Miss_Distance_KM.toFixed(3)} km</span></div>
                          <div>Relative Speed: <span className="text-white">{c.Relative_Velocity.toFixed(2)} km/s</span></div>
                          <div>Collision Prob: <span className="text-orbit-red font-bold">{c.Collision_Risk_Prob.toExponential(4)}</span></div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {detailTab === 'lineage' && (
                <div className="space-y-2">
                  <div className="text-[11px] text-neutral-400 font-bold mb-2">
                    RECURSIVE CTE BREAKUP HIERARCHY:
                  </div>
                  {lineageTree.length === 0 ? (
                    <div className="text-center py-6 text-xs text-neutral-500">
                      Lineage not indexed for this catalog ID.
                    </div>
                  ) : (
                    lineageTree.map((node) => (
                      <div key={node.Lineage_ID} className="bg-[#181818] p-2.5 rounded-xl border border-[#2a2a2a] text-xs">
                        <div className="flex items-center justify-between text-orbit-yellow font-bold">
                          <span>{node.Fragment_Name}</span>
                          <span className="text-[10px] text-neutral-400">Gen {node.Generation_Level}</span>
                        </div>
                        <div className="text-[11px] text-neutral-400 mt-1">
                          Parent: <span className="text-white">{node.parent_name} (#{node.parent_catalog_id})</span>
                        </div>
                        <div className="text-[10px] text-neutral-500">
                          {node.breakup_event_name} &bull; {node.breakup_date?.slice(0, 10)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
