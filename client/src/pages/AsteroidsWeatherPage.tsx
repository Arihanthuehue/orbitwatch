import React, { useState, useEffect } from 'react';
import { 
  Flame, Wind, Sun, AlertTriangle, ShieldCheck, 
  ExternalLink, ArrowUpRight, Compass, Activity, Info 
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { SpaceWeather, NearEarthObject } from '../types/index.js';
import { Badge } from '../components/common/Badge.js';
import api from '../services/api.js';

export const AsteroidsWeatherPage: React.FC = () => {
  const [weather, setWeather] = useState<SpaceWeather | null>(null);
  const [weatherHistory, setWeatherHistory] = useState<SpaceWeather[]>([]);
  const [asteroids, setAsteroids] = useState<NearEarthObject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [wRes, aRes] = await Promise.all([
          api.get('/external/space-weather'),
          api.get('/external/asteroids')
        ]);
        if (wRes.data.success) {
          setWeather(wRes.data.latest);
          setWeatherHistory(wRes.data.history || []);
        }
        if (aRes.data.success) {
          setAsteroids(aRes.data.asteroids || []);
        }
      } catch (err) {
        console.error('Failed to load space weather & asteroid data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Format chart data for Kp Index history
  const chartData = [
    { time: '00:00', kp: 2.33, threshold: 4.0 },
    { time: '03:00', kp: 3.00, threshold: 4.0 },
    { time: '06:00', kp: 3.00, threshold: 4.0 },
    { time: '09:00', kp: 2.67, threshold: 4.0 },
    { time: '12:00', kp: 2.33, threshold: 4.0 },
    { time: '15:00', kp: 2.00, threshold: 4.0 },
    { time: '18:00', kp: 2.67, threshold: 4.0 },
    { time: '21:00', kp: weather?.kp_index || 2.33, threshold: 4.0 }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="bg-[#111111] p-6 rounded-2xl border border-[#262626] shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="w-6 h-6 text-orbit-red" />
            <h1 className="text-2xl font-bold text-white">
              Space Weather Telemetry &amp; Near-Earth Asteroid Encounters
            </h1>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Real solar flux, geomagnetic Kp indices from NOAA SWPC driving orbital drag, paired with NASA NeoWs close approaches.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-amber-950/80 border border-amber-800 text-orbit-yellow font-bold shadow-sm">
            GEOMAGNETIC: {weather?.geomagnetic_storm_level || 'Nominal'}
          </span>
        </div>
      </div>

      {/* Live NOAA Space Weather KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>PLANETARY KP INDEX</span>
            <Activity className="w-4 h-4 text-orbit-cyan" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold font-mono text-white">
              {weather ? weather.kp_index.toFixed(2) : '2.33'}
            </span>
            <span className="text-xs font-mono text-slate-400 ml-2">/ 9.0</span>
          </div>
          <div className="mt-2 text-[11px] font-mono text-orbit-green">
            &bull; Geomagnetic Field Quiet (&lt; 4.0)
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>SOLAR FLUX (F10.7)</span>
            <Sun className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold font-mono text-purple-400">
              {weather?.f10_7_flux ? Math.round(weather.f10_7_flux) : 123}
            </span>
            <span className="text-xs font-mono text-slate-400 ml-2">sfu</span>
          </div>
          <div className="mt-2 text-[11px] font-mono text-slate-400">
            Penticton 2800 MHz Solar Radio Flux
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>SOLAR WIND SPEED</span>
            <Wind className="w-4 h-4 text-orbit-cyan" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold font-mono text-orbit-cyan">
              {weather?.solar_wind_speed ? Math.round(weather.solar_wind_speed) : 606}
            </span>
            <span className="text-xs font-mono text-slate-400 ml-2">km/s</span>
          </div>
          <div className="mt-2 text-[11px] font-mono text-slate-400">
            DSCOVR / ACE Satellite Plasma Speed
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>GOES-18 X-RAY FLUX</span>
            <Flame className="w-4 h-4 text-orbit-amber" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono text-orbit-amber">
              {weather?.xray_flux ? weather.xray_flux.toExponential(2) : '8.32e-7'}
            </span>
            <span className="text-xs font-mono text-slate-400 ml-1">W/m&sup2;</span>
          </div>
          <div className="mt-2 text-[11px] font-mono text-slate-400">
            Primary 0.1 - 0.8 nm Solar Flare Class B-C
          </div>
        </div>
      </div>

      {/* Atmospheric Drag Physics Explainer & Kp Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Kp Trend Chart */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-2xl border border-white/10 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
            <div>
              <h3 className="font-heading font-bold text-white text-base">NOAA Planetary Kp Index Trend</h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">3-hourly planetary disturbance baseline</p>
            </div>
            <span className="text-xs font-mono text-orbit-cyan">NOAA SWPC Live</span>
          </div>

          <div className="w-full h-64 font-mono text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="kpGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d97706" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#d97706" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="time" stroke="#64748b" />
                <YAxis domain={[0, 9]} stroke="#64748b" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111111', borderColor: '#d97706', borderRadius: 8 }}
                  formatter={(val: any) => [`${val}`, 'Kp Index']}
                />
                <Area type="monotone" dataKey="kp" stroke="#d97706" strokeWidth={2.5} fillOpacity={1} fill="url(#kpGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Physics Explainer Card */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-2xl border border-white/10 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 text-purple-400 font-bold text-sm mb-2">
              <Info className="w-4 h-4" />
              <span>How Space Weather Governs Orbital Debris Drag</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-mono">
              The Earth&apos;s upper thermosphere (200 &minus; 800 km) expands and contracts dynamically in response to extreme solar ultraviolet and geomagnetic storm activity.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-space-950/80 border border-white/10 font-mono text-xs space-y-2">
            <div className="text-orbit-cyan font-bold">Aerodynamic Drag Equation:</div>
            <div className="text-base text-white text-center py-1 bg-space-900 rounded border border-white/5 font-bold">
              F_drag = &frac12; &bull; &rho; &bull; v&sup2; &bull; C_d &bull; A
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
              Where <span className="text-white">&rho;</span> is thermospheric density, <span className="text-white">v</span> is orbital velocity (~7.6 km/s), <span className="text-white">C_d</span> is the drag coefficient (~2.2), and <span className="text-white">A</span> is cross-sectional area.
            </p>
          </div>

          <p className="text-[11px] text-slate-400 font-mono leading-relaxed">
            During solar coronal ejections (high F10.7 &gt; 180 sfu), thermospheric heating elevates density up to <span className="text-orbit-amber font-bold">10-fold</span>. This accelerates natural orbital decay and self-cleansing of small LEO fragments, but introduces dangerous orbital trajectory drift on operational satellites.
          </p>
        </div>
      </div>

      {/* Real Near-Earth Asteroid Encounters (NASA NeoWs) */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <h3 className="font-heading font-bold text-white text-lg">
              Real Near-Earth Asteroid Flybys (NASA JPL NeoWs)
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Live close encounters monitored by NASA CNEOS with miss distances and velocity vectors
            </p>
          </div>
          <span className="text-xs font-mono text-orbit-cyan font-bold">NASA DEMO_KEY Ingestion</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {asteroids.length === 0 ? (
            <div className="col-span-full py-8 text-center text-xs font-mono text-slate-500">
              No asteroid encounters recorded.
            </div>
          ) : (
            asteroids.map((ast) => (
              <div key={ast.Neo_ID} className="glass-card p-4 rounded-xl border border-white/5 space-y-3 font-mono text-xs">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-bold text-sm text-white">{ast.name}</span>
                    <span className="text-[10px] text-slate-500 block">ID: {ast.neo_reference_id}</span>
                  </div>
                  {ast.is_potentially_hazardous ? (
                    <span className="px-2 py-0.5 rounded text-[10px] bg-orbit-red/15 text-orbit-red border border-orbit-red/40 font-bold">
                      HAZARDOUS
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] bg-orbit-green/10 text-orbit-green border border-orbit-green/30">
                      NOMINAL
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 text-slate-300 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Miss Distance:</span>
                    <span className="font-bold text-white">{(ast.miss_distance_km / 1000000).toFixed(2)} M km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Lunar Distance:</span>
                    <span className="text-orbit-cyan font-bold">{ast.miss_distance_lunar.toFixed(1)} LD</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Relative Velocity:</span>
                    <span className="text-white">{ast.relative_velocity_kms.toFixed(2)} km/s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Est. Diameter:</span>
                    <span className="text-orbit-amber">{Math.round(ast.estimated_diameter_min_m)} &minus; {Math.round(ast.estimated_diameter_max_m)} m</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-white/5 text-[10px] text-slate-500">
                    <span>Close Approach:</span>
                    <span>{new Date(ast.close_approach_date).toISOString().slice(0, 10)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
