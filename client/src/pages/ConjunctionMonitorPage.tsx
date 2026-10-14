import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, ShieldAlert, Zap, Filter, RefreshCw, 
  ChevronRight, Compass, ShieldCheck, Flame, ArrowUpRight 
} from 'lucide-react';
import { ConjunctionEvent } from '../types/index.js';
import { Badge } from '../components/common/Badge.js';
import { DbInspectorStrip } from '../components/common/DbInspectorStrip.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import api from '../services/api.js';

export const ConjunctionMonitorPage: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [events, setEvents] = useState<ConjunctionEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<ConjunctionEvent | null>(null);
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [executedSql, setExecutedSql] = useState('');
  const [affectedRows, setAffectedRows] = useState<number | undefined>(undefined);
  const [isEscalating, setIsEscalating] = useState(false);
  const [isScreening, setIsScreening] = useState(false);

  const loadConjunctions = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/conjunctions?riskLevel=${riskFilter}&limit=100`);
      if (res.data.success) {
        setEvents(res.data.data);
        if (res.data.data.length > 0 && !selectedEvent) {
          setSelectedEvent(res.data.data[0]);
        }
        setExecutedSql(res.data.executedSql || '');
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Failed to load conjunctions', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConjunctions();
  }, [riskFilter]);

  const handleEscalateCursor = async () => {
    setIsEscalating(true);
    try {
      const res = await api.post('/conjunctions/escalate');
      if (res.data.success) {
        addToast({
          type: 'success',
          title: 'Cursor Escalation Succeeded',
          message: `${res.data.escalatedCount} critical conjunction events escalated to ACTIVE emergency alerts.`
        });
        setExecutedSql(res.data.executedSql || 'CALL Escalate_High_Risk_Events();');
        setAffectedRows(res.data.escalatedCount);
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Escalation failed', message: err.message });
    } finally {
      setIsEscalating(false);
    }
  };

  const handleScreenComputed = async () => {
    setIsScreening(true);
    try {
      const res = await api.post('/conjunctions/screen-computed');
      if (res.data.success) {
        addToast({
          type: 'info',
          title: 'Conjunction Screening Job Completed',
          message: res.data.message
        });
        loadConjunctions();
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Screening failed', message: err.message });
    } finally {
      setIsScreening(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Banner & Emergency Evasive Maneuver Alert */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[#111111] p-6 rounded-2xl border border-[#262626] shadow-2xl">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-orbit-red" />
            <h1 className="text-2xl font-bold text-white">Conjunction &amp; Collision Monitor</h1>
          </div>
          <p className="text-xs text-neutral-400 mt-1 max-w-2xl">
            Predicted close encounters ingested directly from CelesTrak SOCRATES (RFC 4180) and screened via Keplerian orbital geometry.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleScreenComputed}
            disabled={isScreening}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#1a1a1a] border border-amber-700/60 text-orbit-yellow hover:bg-[#222222] text-xs font-bold transition-all shadow-md disabled:opacity-50"
          >
            <Compass className={`w-4 h-4 ${isScreening ? 'animate-spin' : ''}`} />
            <span>Screen Computed Encounters</span>
          </button>

          <button
            onClick={handleEscalateCursor}
            disabled={isEscalating}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-orbit-red text-white hover:bg-red-700 text-xs font-bold transition-all shadow-xl shadow-red-950/50 disabled:opacity-50"
          >
            <Zap className="w-4 h-4" />
            <span>Escalate Alerts (Cursor Demo)</span>
          </button>
        </div>
      </div>

      {/* Transaction DB Inspector */}
      <DbInspectorStrip
        sql={executedSql}
        affectedRows={affectedRows}
        tableChanged="COLLISION_EVENT &bull; ALERT"
      />

      {/* Split Layout: Event Table & Threat Detail Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Conjunction Events List */}
        <div className="lg:col-span-7 bg-[#111111] rounded-2xl border border-[#262626] p-5 flex flex-col shadow-2xl">
          {/* Filter Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-[#222222] mb-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-neutral-400" />
              <span className="text-xs text-neutral-400 uppercase font-bold">Risk Level:</span>
              <div className="flex items-center gap-1 text-xs">
                {['ALL', 'CRITICAL', 'WARNING', 'MONITOR'].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setRiskFilter(lvl)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      riskFilter === lvl
                        ? 'bg-orbit-yellow text-space-950 shadow-sm'
                        : 'bg-[#181818] text-neutral-400 hover:text-white'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={loadConjunctions}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-[#202020]"
              title="Refresh Conjunctions"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase tracking-wider text-neutral-400 border-b border-[#242424] bg-[#0c0c0c]">
                <tr>
                  <th className="py-2.5 px-3">Target Asset</th>
                  <th className="py-2.5 px-3">Threat Object</th>
                  <th className="py-2.5 px-3">Miss (KM)</th>
                  <th className="py-2.5 px-3">Relative V</th>
                  <th className="py-2.5 px-3">Risk Level</th>
                  <th className="py-2.5 px-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#202020]">
                {events.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-neutral-500">
                      No conjunction encounters matching filter.
                    </td>
                  </tr>
                ) : (
                  events.map((ev) => {
                    const isSelected = selectedEvent?.Event_ID === ev.Event_ID;
                    return (
                      <tr
                        key={ev.Event_ID}
                        onClick={() => setSelectedEvent(ev)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-[#220a0a] text-white border-l-2 border-orbit-red'
                            : 'hover:bg-[#181818] text-neutral-300'
                        }`}
                      >
                        <td className="py-3 px-3 font-bold truncate max-w-[150px]">
                          <span className="text-orbit-yellow">{ev.Satellite_Name}</span>
                          <span className="text-[10px] text-neutral-500 block font-normal">#{ev.Sat_NORAD_ID}</span>
                        </td>
                        <td className="py-3 px-3 truncate max-w-[150px]">
                          <span className="text-red-400 font-bold">{ev.Debris_Name}</span>
                          <span className="text-[10px] text-neutral-500 block font-normal">#{ev.Debris_NORAD_ID}</span>
                        </td>
                        <td className="py-3 px-3 font-bold">
                          <span className={ev.Miss_Distance_KM <= 1.0 ? 'text-red-400' : 'text-neutral-200'}>
                            {ev.Miss_Distance_KM.toFixed(3)}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          {ev.Relative_Velocity.toFixed(2)} km/s
                        </td>
                        <td className="py-3 px-3">
                          <Badge type="risk" value={ev.risk_level} />
                        </td>
                        <td className="py-3 px-2 text-right">
                          <ChevronRight className="w-4 h-4 text-neutral-500" />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: Threat Assessment & Evasive Action Card */}
        <div className="lg:col-span-5 space-y-4">
          {selectedEvent ? (
            <div className="bg-[#111111] p-6 rounded-2xl border border-[#262626] space-y-5 shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
                <div>
                  <span className="text-xs text-neutral-400 font-bold">ENCOUNTER ID #{selectedEvent.Event_ID}</span>
                  <div className="text-lg font-bold text-white mt-0.5">
                    Threat Encounter Assessment
                  </div>
                </div>
                <Badge type="risk" value={selectedEvent.risk_level} />
              </div>

              {/* Critical Alert Warning Banner */}
              {selectedEvent.risk_level === 'CRITICAL' && (
                <div className="p-4 rounded-xl bg-[#220a0a] border border-red-800 text-red-400 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    <span>IMMEDIATE EVASIVE MANEUVER RECOMMENDED</span>
                  </div>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    Threshold violation: Miss distance &le; 1.0 km or collision probability &ge; 10&minus;4. Flight dynamics maneuver thruster calculation authorized under NASA/ESA CARA protocols.
                  </p>
                </div>
              )}

              {/* Close Approach Countdown & Geometry */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-[#161616] p-3 rounded-xl border border-[#282828] shadow-md">
                  <span className="text-[10px] text-neutral-400 font-bold block">MISS DISTANCE</span>
                  <span className={`text-xl font-bold mt-1 block ${selectedEvent.Miss_Distance_KM <= 1.0 ? 'text-red-400' : 'text-white'}`}>
                    {selectedEvent.Miss_Distance_KM.toFixed(3)} km
                  </span>
                  <span className="text-[10px] text-neutral-500">{(selectedEvent.Miss_Distance_KM * 1000).toFixed(0)} meters</span>
                </div>

                <div className="bg-[#161616] p-3 rounded-xl border border-[#282828] shadow-md">
                  <span className="text-[10px] text-neutral-400 font-bold block">RELATIVE VELOCITY</span>
                  <span className="text-xl font-bold text-orbit-yellow mt-1 block">
                    {selectedEvent.Relative_Velocity.toFixed(2)} km/s
                  </span>
                  <span className="text-[10px] text-neutral-500">{(selectedEvent.Relative_Velocity * 3600).toFixed(0)} km/h</span>
                </div>

                <div className="bg-[#161616] p-3 rounded-xl border border-[#282828] shadow-md">
                  <span className="text-[10px] text-neutral-400 font-bold block">COLLISION PROBABILITY</span>
                  <span className="text-base font-bold text-red-400 mt-1 block">
                    {selectedEvent.Collision_Risk_Prob.toExponential(4)}
                  </span>
                  <span className="text-[10px] text-neutral-500">Maximum Dilution</span>
                </div>

                <div className="bg-[#161616] p-3 rounded-xl border border-[#282828] shadow-md">
                  <span className="text-[10px] text-neutral-400 font-bold block">TIME TO TCA</span>
                  <span className="text-base font-bold text-white mt-1 block">
                    {selectedEvent.seconds_to_tca > 0
                      ? `${Math.floor(selectedEvent.seconds_to_tca / 3600)}h ${Math.floor((selectedEvent.seconds_to_tca % 3600) / 60)}m`
                      : 'PAST TCA'}
                  </span>
                  <span className="text-[10px] text-neutral-500">{new Date(selectedEvent.TCA).toUTCString().slice(5, 22)}</span>
                </div>
              </div>

              {/* Objects Involved in Collision Box */}
              <div className="space-y-2 text-xs">
                <div className="p-3.5 rounded-xl bg-[#161616] border border-[#2a2a2a] shadow-inner">
                  <div className="text-[11px] text-orbit-yellow font-bold uppercase mb-1">
                    TARGET SATELLITE ASSET
                  </div>
                  <div className="text-white font-bold text-sm">{selectedEvent.Satellite_Name}</div>
                  <div className="text-neutral-400 text-[11px] mt-1">
                    Owner: {selectedEvent.Owner_Agency} &bull; NORAD #{selectedEvent.Sat_NORAD_ID}
                  </div>
                  <div className="text-neutral-400 text-[11px]">
                    Altitude: {Math.round(selectedEvent.Orbital_Altitude_KM || 550)} km &bull; Orbit: {selectedEvent.Sat_Orbit_Class}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#161616] border border-[#2a2a2a] shadow-inner">
                  <div className="text-[11px] text-red-400 font-bold uppercase mb-1">
                    THREATENING DEBRIS OBJECT
                  </div>
                  <div className="text-white font-bold text-sm">{selectedEvent.Debris_Name}</div>
                  <div className="text-neutral-400 text-[11px] mt-1">
                    NORAD #{selectedEvent.Debris_NORAD_ID} &bull; RCS Size Class: {selectedEvent.rcs_size_class}
                  </div>
                  <div className="text-neutral-400 text-[11px]">
                    Velocity: {selectedEvent.Debris_Velocity?.toFixed(2) || '7.50'} km/s &bull; Apogee: {Math.round(selectedEvent.Debris_Apogee || 600)} km
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#111111] p-12 rounded-2xl border border-[#242424] text-center text-neutral-500 text-xs">
              Select an encounter row from the table to inspect risk telemetry.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
