import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Globe2, ShieldAlert, Cpu, ArrowRight, Activity, 
  Database, Orbit, Zap, Radio, AlertTriangle 
} from 'lucide-react';
import { OrbitGlobeCanvas } from '../components/globe/OrbitGlobeCanvas.js';
import { OrbitObject, DashboardKPIs, SpaceWeather } from '../types/index.js';
import api from '../services/api.js';

interface LandingPageProps {
  onNavigate: (tab: string) => void;
  globeObjects: OrbitObject[];
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, globeObjects }) => {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [weather, setWeather] = useState<SpaceWeather | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [kpiRes, weatherRes] = await Promise.all([
          api.get('/analytics/kpis'),
          api.get('/external/space-weather')
        ]);
        if (kpiRes.data.success) setKpis(kpiRes.data.kpis);
        if (weatherRes.data.success) setWeather(weatherRes.data.latest);
      } catch (err) {
        console.error('Failed to load landing metrics:', err);
      }
    }
    loadData();
  }, []);

  return (
    <div className="relative w-full min-h-screen bg-[#050505] overflow-hidden text-neutral-200">
      {/* 3D Earth Globe Canvas Background */}
      <div className="absolute inset-0 z-0 opacity-80">
        <OrbitGlobeCanvas
          objects={globeObjects}
          selectedObject={null}
          onSelectObject={() => {}}
          showSatellites={true}
          showDebris={true}
          showStations={true}
          showConjunctions={true}
          timeScale={1.5}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505]/70 pointer-events-none" />
      </div>

      {/* Hero Foreground Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-24 flex flex-col justify-between min-h-[calc(100vh-60px)]">
        {/* Top Hero Headline */}
        <div className="max-w-3xl pt-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#141414] border border-[#2a2a2a] text-orbit-yellow text-xs font-bold mb-6 shadow-md"
          >
            <span className="w-2 h-2 rounded-full bg-orbit-red" />
            <span>ORBITWATCH &bull; VIT CHENNAI DBMS LAB EVALUATION</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl font-bold tracking-tight text-white leading-tight"
          >
            Real-Time Space Debris Tracking &amp; <span className="text-orbit-red">Conjunction Avoidance</span>.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-base sm:text-lg text-neutral-300 max-w-2xl leading-relaxed"
          >
            A high-performance Space Situational Awareness (SSA) platform powered by 
            <span className="text-orbit-yellow font-bold"> MySQL 8.x InnoDB</span>, 
            tracking over <span className="text-white font-bold">4,000+ real space objects</span>, 
            real SOCRATES close approach assessments, SGP4 orbital mechanics, and BCNF relational integrity.
          </motion.p>

          {/* Action CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 flex flex-wrap items-center gap-4"
          >
            <button
              onClick={() => onNavigate('explore')}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-orbit-red text-white font-bold text-sm hover:bg-red-700 shadow-xl shadow-red-950/60 transition-all transform hover:-translate-y-0.5 border border-red-500/40"
            >
              <Globe2 className="w-4 h-4" />
              <span>Launch Live Orbit Explorer</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            <button
              onClick={() => onNavigate('monitor')}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#141414] border border-orbit-yellow/50 text-orbit-yellow hover:bg-[#1c1c1c] font-bold text-sm transition-all shadow-lg"
            >
              <ShieldAlert className="w-4 h-4 text-orbit-red" />
              <span>Conjunction Monitor</span>
            </button>

            <button
              onClick={() => onNavigate('dbms-lab')}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#141414] border border-[#2a2a2a] text-neutral-200 hover:border-white/30 text-sm font-bold transition-all shadow-md"
            >
              <Cpu className="w-4 h-4 text-orbit-yellow" />
              <span>DBMS Viva Lab</span>
            </button>
          </motion.div>
        </div>

        {/* Live Counters Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3"
        >
          <div className="bg-[#111111] p-4 rounded-xl border border-[#242424] shadow-xl flex flex-col">
            <span className="text-[11px] text-neutral-400 font-bold">TRACKED OBJECTS</span>
            <span className="text-2xl font-bold text-white mt-1">
              {kpis ? kpis.totalTrackedObjects.toLocaleString() : '4,333'}
            </span>
            <span className="text-[10px] text-orbit-yellow mt-0.5 font-bold">Real CelesTrak Ingestion</span>
          </div>

          <div className="bg-[#111111] p-4 rounded-xl border border-[#242424] shadow-xl flex flex-col">
            <span className="text-[11px] text-neutral-400 font-bold">ACTIVE SATELLITES</span>
            <span className="text-2xl font-bold text-orbit-yellow mt-1">
              {kpis ? kpis.activeSatellites.toLocaleString() : '1,576'}
            </span>
            <span className="text-[10px] text-neutral-400 mt-0.5">ISRO, SpaceX, ESA, NASA</span>
          </div>

          <div className="bg-[#111111] p-4 rounded-xl border border-[#242424] shadow-xl flex flex-col">
            <span className="text-[11px] text-neutral-400 font-bold">DEBRIS FRAGMENTS</span>
            <span className="text-2xl font-bold text-orbit-red mt-1">
              {kpis ? kpis.debrisFragments.toLocaleString() : '2,757'}
            </span>
            <span className="text-[10px] text-neutral-400 mt-0.5">Fengyun, Cosmos, Iridium</span>
          </div>

          <div className="bg-[#111111] p-4 rounded-xl border border-red-900/60 shadow-xl flex flex-col">
            <span className="text-[11px] text-neutral-400 font-bold">CRITICAL ENCOUNTERS</span>
            <span className="text-2xl font-bold text-red-500 mt-1">
              {kpis ? kpis.criticalConjunctions : '45'}
            </span>
            <span className="text-[10px] text-red-400 mt-0.5 font-bold">Miss &le; 1.0 km / Prob &gt; 1e-4</span>
          </div>

          <div className="bg-[#111111] p-4 rounded-xl border border-[#242424] shadow-xl flex flex-col">
            <span className="text-[11px] text-neutral-400 font-bold">GROUND STATIONS</span>
            <span className="text-2xl font-bold text-white mt-1">
              {kpis ? kpis.trackingStations : '12'}
            </span>
            <span className="text-[10px] text-neutral-400 mt-0.5">ISRO NETRA, Space Fence</span>
          </div>

          <div className="bg-[#111111] p-4 rounded-xl border border-[#242424] shadow-xl flex flex-col">
            <span className="text-[11px] text-neutral-400 font-bold">SOLAR FLUX (F10.7)</span>
            <span className="text-2xl font-bold text-amber-500 mt-1">
              {weather ? `${weather.f10_7_flux || 123} sfu` : '123 sfu'}
            </span>
            <span className="text-[10px] text-amber-400 mt-0.5 font-bold">NOAA SWPC Drag Driver</span>
          </div>
        </motion.div>

        {/* Scroll Cue */}
        <div className="flex justify-center pt-8">
          <button
            onClick={() => onNavigate('explore')}
            className="flex items-center gap-2 text-xs font-bold text-neutral-400 hover:text-orbit-yellow transition-colors py-2 px-4 rounded-full bg-[#121212] border border-[#262626] shadow-lg"
          >
            <span>Scroll down to Live 3D Orbit Explorer</span>
            <span className="text-orbit-yellow">&darr;</span>
          </button>
        </div>
      </div>

      {/* Feature Showcase Grid Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-16 border-t border-[#1f1f1f]">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Engineered for Precision Astrodynamics &amp; Rigorous DBMS Evaluation
          </h2>
          <p className="text-sm text-neutral-400 mt-2">
            Every query, calculation, and constraint is demonstrable live against MySQL 8.x
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div 
            onClick={() => onNavigate('explore')}
            className="bg-[#121212] p-6 rounded-2xl cursor-pointer border border-[#242424] hover:border-orbit-yellow shadow-2xl transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-[#1e1709] border border-amber-700/50 flex items-center justify-center text-orbit-yellow mb-4 group-hover:scale-105 transition-transform">
              <Globe2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-white mb-2">Live Orbit Explorer</h3>
            <p className="text-xs text-neutral-400 leading-relaxed mb-4">
              Real-time SGP4 Keplerian orbital propagation rendered on a 3D Earth globe with instanced GPU particles, orbit path lines, and full 3D rotation &amp; pan controls.
            </p>
            <div className="flex items-center text-xs text-orbit-yellow font-bold group-hover:underline">
              <span>Launch 3D Explorer</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>

          <div 
            onClick={() => onNavigate('monitor')}
            className="bg-[#121212] p-6 rounded-2xl cursor-pointer border border-[#242424] hover:border-orbit-red shadow-2xl transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-[#220a0a] border border-red-800/60 flex items-center justify-center text-orbit-red mb-4 group-hover:scale-105 transition-transform">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-white mb-2">Conjunction Assessment</h3>
            <p className="text-xs text-neutral-400 leading-relaxed mb-4">
              Real predicted close encounters from CelesTrak SOCRATES with miss distance, relative velocity, collision risk probability, and automated evasive maneuver triggers.
            </p>
            <div className="flex items-center text-xs text-orbit-red font-bold group-hover:underline">
              <span>View Collision Alerts</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>

          <div 
            onClick={() => onNavigate('dbms-lab')}
            className="bg-[#121212] p-6 rounded-2xl cursor-pointer border border-[#242424] hover:border-white/40 shadow-2xl transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-[#1c1c1c] border border-neutral-700 flex items-center justify-center text-white mb-4 group-hover:scale-105 transition-transform">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-white mb-2">DBMS Lab &amp; SQL Console</h3>
            <p className="text-xs text-neutral-400 leading-relaxed mb-4">
              Live SQL console, Recursive CTE lineage, explicit MySQL CURSOR escalation, ACID Savepoint transactions, and EXPLAIN partition pruning timings.
            </p>
            <div className="flex items-center text-xs text-white font-bold group-hover:underline">
              <span>Explore DBMS Lab</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
