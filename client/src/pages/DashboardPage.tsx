import React, { useState, useEffect } from 'react';
import { 
  BarChart3, PieChart as PieIcon, Download, RefreshCw, 
  ShieldAlert, Globe, Activity, Database, Layers, ArrowUpRight 
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, Tooltip, Legend, CartesianGrid 
} from 'recharts';
import { DashboardKPIs } from '../types/index.js';
import { useToast } from '../context/ToastContext.js';
import api from '../services/api.js';

export const DashboardPage: React.FC = () => {
  const { addToast } = useToast();

  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [orbitDist, setOrbitDist] = useState<any[]>([]);
  const [sizeDist, setSizeDist] = useState<any[]>([]);
  const [altitudeHist, setAltitudeHist] = useState<any[]>([]);
  const [breakupEvents, setBreakupEvents] = useState<any[]>([]);
  const [countries, setCountries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [kRes, oRes, sRes, aRes, bRes, cRes] = await Promise.all([
        api.get('/analytics/kpis'),
        api.get('/analytics/orbit-distribution'),
        api.get('/analytics/size-distribution'),
        api.get('/analytics/altitude-histogram'),
        api.get('/analytics/breakup-events'),
        api.get('/analytics/country-distribution')
      ]);

      if (kRes.data.success) setKpis(kRes.data.kpis);
      if (oRes.data.success) setOrbitDist(oRes.data.distribution || []);
      if (sRes.data.success) setSizeDist(sRes.data.distribution || []);
      if (aRes.data.success) setAltitudeHist(aRes.data.histogram || []);
      if (bRes.data.success) setBreakupEvents(bRes.data.breakupEvents || []);
      if (cRes.data.success) setCountries(cRes.data.countries || []);
    } catch (err: any) {
      addToast({ type: 'error', title: 'Analytics Error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const handleGenerateReport = () => {
    const reportData = {
      title: 'ORBITWATCH Space Debris & Conjunction Assessment Report',
      date: new Date().toISOString(),
      institution: 'VIT Chennai DBMS Lab Project',
      kpis,
      orbitDistribution: orbitDist,
      breakupEvents
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orbitwatch_executive_report_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    addToast({
      type: 'success',
      title: 'Executive Report Generated',
      message: 'Downloaded complete SSA JSON summary dataset.'
    });
  };

  // Red, Deep Yellow, Amber palette
  const COLORS = ['#d97706', '#dc2626', '#b45309', '#991b1b', '#ca8a04'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="bg-[#111111] p-6 rounded-2xl border border-[#262626] shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-orbit-yellow" />
            <h1 className="text-2xl font-bold text-white">
              Space Situational Awareness Analytics (UC10)
            </h1>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Relational aggregations across orbits, debris fragmentation events, radar stations, and constellation operators.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadAnalytics}
            className="p-2 rounded-xl bg-[#161616] border border-[#2a2a2a] text-neutral-400 hover:text-white"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleGenerateReport}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-orbit-red text-white font-bold text-xs hover:bg-red-700 transition-all shadow-md"
          >
            <Download className="w-4 h-4" />
            <span>Generate Executive Report</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="glass-panel p-4 rounded-xl border border-white/10">
          <span className="text-[10px] font-mono text-slate-400 block">TOTAL OBJECTS</span>
          <span className="text-2xl font-bold font-mono text-white mt-1 block">
            {kpis ? kpis.totalTrackedObjects.toLocaleString() : '4,333'}
          </span>
          <span className="text-[10px] text-orbit-cyan font-mono mt-0.5 block">100% Real SGP4</span>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-white/10">
          <span className="text-[10px] font-mono text-slate-400 block">ACTIVE SATELLITES</span>
          <span className="text-2xl font-bold font-mono text-orbit-cyan mt-1 block">
            {kpis ? kpis.activeSatellites.toLocaleString() : '1,576'}
          </span>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">Payloads Tracked</span>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-white/10">
          <span className="text-[10px] font-mono text-slate-400 block">DEBRIS FRAGMENTS</span>
          <span className="text-2xl font-bold font-mono text-orbit-amber mt-1 block">
            {kpis ? kpis.debrisFragments.toLocaleString() : '2,757'}
          </span>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">RCS Cataloged</span>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-white/10">
          <span className="text-[10px] font-mono text-slate-400 block">CRITICAL CONJUNCTIONS</span>
          <span className="text-2xl font-bold font-mono text-orbit-red mt-1 block animate-pulse">
            {kpis ? kpis.criticalConjunctions : '45'}
          </span>
          <span className="text-[10px] text-orbit-red font-mono mt-0.5 block">&le; 1.0 km Miss</span>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-white/10">
          <span className="text-[10px] font-mono text-slate-400 block">TRACKING STATIONS</span>
          <span className="text-2xl font-bold font-mono text-orbit-green mt-1 block">
            {kpis ? kpis.trackingStations : '12'}
          </span>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">Global Radars</span>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-white/10">
          <span className="text-[10px] font-mono text-slate-400 block">RADAR PASSES LOGGED</span>
          <span className="text-2xl font-bold font-mono text-purple-400 mt-1 block">
            {kpis ? kpis.radarObservationsLogged : '80'}
          </span>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">Partitioned Table</span>
        </div>
      </div>

      {/* Primary Analytics Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Orbit Class Distribution (LEO vs MEO vs GEO vs HEO) */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-2xl border border-white/10 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
            <div>
              <h3 className="font-heading font-bold text-white text-base">
                Distribution Across Orbital Regimes
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">Satellites vs Debris counts per orbital shell</p>
            </div>
            <span className="text-xs font-bold text-orbit-yellow">LEO/MEO/GEO/HEO</span>
          </div>

          <div className="w-full h-64 text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={orbitDist} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="orbitClass" stroke="#737373" />
                <YAxis stroke="#737373" />
                <Tooltip contentStyle={{ backgroundColor: '#111111', borderColor: '#d97706', borderRadius: 8 }} />
                <Legend />
                <Bar dataKey="satellites" name="Active Satellites" fill="#d97706" radius={[4, 4, 0, 0]} />
                <Bar dataKey="debris" name="Debris Fragments" fill="#dc2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Debris by RCS Size Class Donut */}
        <div className="lg:col-span-5 bg-[#111111] p-6 rounded-2xl border border-[#262626] shadow-2xl flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-[#222222] mb-4">
            <div>
              <h3 className="font-bold text-white text-base">
                Debris Radar Cross Section (RCS)
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">Physical size category breakdown</p>
            </div>
            <span className="text-xs text-orbit-red font-bold">RCS Size</span>
          </div>

          <div className="w-full h-64 text-xs flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sizeDist}
                  dataKey="count"
                  nameKey="rcs_size_class"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  label={(entry) => `${entry.rcs_size_class}`}
                >
                  {sizeDist.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#111111', borderColor: '#dc2626', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Altitude Histogram & Major Breakup Events */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Altitude Histogram */}
        <div className="lg:col-span-7 bg-[#111111] p-6 rounded-2xl border border-[#262626] shadow-2xl flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-[#222222] mb-4">
            <div>
              <h3 className="font-bold text-white text-base">
                Altitude Congestion Histogram (200 KM Bins)
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">Identifies critical congestion altitude bands</p>
            </div>
            <span className="text-xs text-orbit-yellow font-bold">Congestion Shells</span>
          </div>

          <div className="w-full h-64 text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={altitudeHist} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="altitude_bin" stroke="#737373" angle={-25} textAnchor="end" height={40} />
                <YAxis stroke="#737373" />
                <Tooltip contentStyle={{ backgroundColor: '#111111', borderColor: '#b45309', borderRadius: 8 }} />
                <Bar dataKey="sat_count" name="Satellite Density" fill="#b45309" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Historical Breakup Event Origins */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-2xl border border-white/10 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
            <div>
              <h3 className="font-heading font-bold text-white text-base">
                Debris by Historical Breakup Event
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">Lineage associations from major fragmentation events</p>
            </div>
            <span className="text-xs font-mono text-orbit-cyan">Lineage</span>
          </div>

          <div className="space-y-3 font-mono text-xs flex-1 overflow-y-auto">
            {breakupEvents.map((ev, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-space-950/70 border border-white/5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">{ev.breakup_event_name}</span>
                  <span className="font-bold text-orbit-amber">{ev.fragment_count} fragments</span>
                </div>
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>Parent: {ev.parent_name}</span>
                  <span>{new Date(ev.breakup_date).toISOString().slice(0, 10)}</span>
                </div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wide">
                  Event Type: {ev.event_type}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
