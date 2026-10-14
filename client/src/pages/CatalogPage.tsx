import React, { useState, useEffect } from 'react';
import { 
  Database, Search, Filter, Plus, Edit2, Trash2, 
  Download, RefreshCw, ChevronLeft, ChevronRight, X, AlertCircle 
} from 'lucide-react';
import { Satellite, Debris } from '../types/index.js';
import { Badge } from '../components/common/Badge.js';
import { DbInspectorStrip } from '../components/common/DbInspectorStrip.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import api from '../services/api.js';

export const CatalogPage: React.FC = () => {
  const { user, hasRole } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<'satellites' | 'debris'>('satellites');
  const [search, setSearch] = useState('');
  const [orbitFilter, setOrbitFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [satellites, setSatellites] = useState<Satellite[]>([]);
  const [debris, setDebris] = useState<Debris[]>([]);
  const [loading, setLoading] = useState(false);

  // Inspector strip
  const [executedSql, setExecutedSql] = useState('');
  const [affectedRows, setAffectedRows] = useState<number | undefined>(undefined);

  // Modal States
  const [showSatModal, setShowSatModal] = useState(false);
  const [editingSat, setEditingSat] = useState<Satellite | null>(null);
  const [satForm, setSatForm] = useState({
    noradId: '',
    intlDesignator: '',
    satelliteName: '',
    ownerAgency: 'ISRO (India)',
    altitudeKm: '550',
    inclinationDeg: '97.5',
    apogeeKm: '560',
    perigeeKm: '540'
  });

  const [showDebrisModal, setShowDebrisModal] = useState(false);
  const [editingDebris, setEditingDebris] = useState<Debris | null>(null);
  const [debrisForm, setDebrisForm] = useState({
    noradId: '',
    objectName: '',
    sizeMeters: '0.25',
    rcsSizeClass: 'MEDIUM',
    massKg: '2.5',
    velocityKms: '7.6',
    apogeeKm: '650',
    perigeeKm: '600',
    inclinationDeg: '65.0'
  });

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'satellites') {
        const res = await api.get(
          `/objects/satellites?page=${page}&limit=20&search=${search}&orbitClass=${orbitFilter}`
        );
        if (res.data.success) {
          setSatellites(res.data.data);
          setTotalPages(res.data.totalPages || 1);
          setTotalCount(res.data.total || 0);
          setExecutedSql(res.data.executedSql || '');
        }
      } else {
        const res = await api.get(
          `/objects/debris?page=${page}&limit=20&search=${search}&orbitClass=${orbitFilter}`
        );
        if (res.data.success) {
          setDebris(res.data.data);
          setTotalPages(res.data.totalPages || 1);
          setTotalCount(res.data.total || 0);
          setExecutedSql(res.data.executedSql || '');
        }
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Query Error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [activeTab, search, orbitFilter]);

  useEffect(() => {
    loadData();
  }, [activeTab, page, search, orbitFilter]);

  // CSV Export
  const handleExportCSV = () => {
    const data = activeTab === 'satellites' ? satellites : debris;
    if (data.length === 0) return;

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map((item) =>
      Object.values(item)
        .map((v) => `"${v !== null ? v : ''}"`)
        .join(',')
    );

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `orbitwatch_${activeTab}_catalog.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast({ type: 'success', title: 'Catalog Exported', message: `Exported ${data.length} rows to CSV.` });
  };

  // Satellite CRUD Handlers
  const handleSaveSatellite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSat) {
        const res = await api.put(`/objects/satellites/${editingSat.Satellite_ID}`, {
          satelliteName: satForm.satelliteName,
          ownerAgency: satForm.ownerAgency,
          altitudeKm: parseFloat(satForm.altitudeKm),
          inclinationDeg: parseFloat(satForm.inclinationDeg),
          apogeeKm: parseFloat(satForm.apogeeKm),
          perigeeKm: parseFloat(satForm.perigeeKm)
        });
        if (res.data.success) {
          addToast({ type: 'success', title: 'Satellite Updated', message: res.data.message });
          setExecutedSql(res.data.executedSql);
          setAffectedRows(res.data.affectedRows);
        }
      } else {
        const res = await api.post('/objects/satellites', {
          noradId: parseInt(satForm.noradId, 10),
          intlDesignator: satForm.intlDesignator,
          satelliteName: satForm.satelliteName,
          ownerAgency: satForm.ownerAgency,
          altitudeKm: parseFloat(satForm.altitudeKm),
          inclinationDeg: parseFloat(satForm.inclinationDeg),
          apogeeKm: parseFloat(satForm.apogeeKm),
          perigeeKm: parseFloat(satForm.perigeeKm)
        });
        if (res.data.success) {
          addToast({ type: 'success', title: 'Satellite Registered', message: res.data.message });
          setExecutedSql(res.data.executedSql);
          setAffectedRows(res.data.affectedRows);
        }
      }
      setShowSatModal(false);
      setEditingSat(null);
      loadData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Operation Failed', message: err.response?.data?.message || err.message });
    }
  };

  const handleDeleteSatellite = async (id: number) => {
    if (!confirm('Are you sure you want to delete this satellite? ON DELETE CASCADE will remove all linked collision encounters.')) return;
    try {
      const res = await api.delete(`/objects/satellites/${id}`);
      if (res.data.success) {
        addToast({ type: 'info', title: 'Satellite Deleted', message: res.data.message });
        setExecutedSql(res.data.executedSql);
        setAffectedRows(res.data.affectedRows);
        loadData();
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Delete Failed', message: err.message });
    }
  };

  // Debris CRUD Handlers
  const handleSaveDebris = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDebris) {
        const res = await api.put(`/objects/debris/${editingDebris.Debris_ID}`, {
          objectName: debrisForm.objectName,
          sizeMeters: parseFloat(debrisForm.sizeMeters),
          rcsSizeClass: debrisForm.rcsSizeClass,
          massKg: parseFloat(debrisForm.massKg),
          velocityKms: parseFloat(debrisForm.velocityKms),
          apogeeKm: parseFloat(debrisForm.apogeeKm),
          perigeeKm: parseFloat(debrisForm.perigeeKm),
          inclinationDeg: parseFloat(debrisForm.inclinationDeg)
        });
        if (res.data.success) {
          addToast({ type: 'success', title: 'Debris Updated', message: res.data.message });
          setExecutedSql(res.data.executedSql);
          setAffectedRows(res.data.affectedRows);
        }
      } else {
        const res = await api.post('/objects/debris', {
          noradId: parseInt(debrisForm.noradId, 10),
          objectName: debrisForm.objectName,
          sizeMeters: parseFloat(debrisForm.sizeMeters),
          rcsSizeClass: debrisForm.rcsSizeClass,
          massKg: parseFloat(debrisForm.massKg),
          velocityKms: parseFloat(debrisForm.velocityKms),
          apogeeKm: parseFloat(debrisForm.apogeeKm),
          perigeeKm: parseFloat(debrisForm.perigeeKm),
          inclinationDeg: parseFloat(debrisForm.inclinationDeg)
        });
        if (res.data.success) {
          addToast({ type: 'success', title: 'Debris Fragment Registered', message: res.data.message });
          setExecutedSql(res.data.executedSql);
          setAffectedRows(res.data.affectedRows);
        }
      }
      setShowDebrisModal(false);
      setEditingDebris(null);
      loadData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Operation Failed', message: err.response?.data?.message || err.message });
    }
  };

  const handleDeleteDebris = async (id: number) => {
    if (!confirm('Are you sure you want to delete this debris fragment?')) return;
    try {
      const res = await api.delete(`/objects/debris/${id}`);
      if (res.data.success) {
        addToast({ type: 'info', title: 'Debris Deleted', message: res.data.message });
        setExecutedSql(res.data.executedSql);
        setAffectedRows(res.data.affectedRows);
        loadData();
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Delete Failed', message: err.message });
    }
  };

  const canWrite = hasRole(['Administrator', 'Space Agency']);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header & Tabs */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-6 h-6 text-orbit-yellow" />
            <h1 className="text-2xl font-bold text-white">Space Catalog &amp; Asset Management</h1>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Full CRUD operations over real space assets, backed by MySQL transactions, triggers, and audit logging.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 bg-[#181818] p-1.5 rounded-xl border border-[#2a2a2a] text-xs">
          <button
            onClick={() => setActiveTab('satellites')}
            className={`px-4 py-2 rounded-lg font-bold transition-all ${
              activeTab === 'satellites'
                ? 'bg-orbit-yellow text-space-950 shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Active Satellites ({activeTab === 'satellites' ? totalCount : '1,500+'})
          </button>

          <button
            onClick={() => setActiveTab('debris')}
            className={`px-4 py-2 rounded-lg font-bold transition-all ${
              activeTab === 'debris'
                ? 'bg-orbit-red text-white shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Debris Catalog ({activeTab === 'debris' ? totalCount : '2,600+'})
          </button>
        </div>
      </div>

      {/* DB Inspector Strip showing actual SQL executed */}
      <DbInspectorStrip
        sql={executedSql}
        affectedRows={affectedRows}
        tableChanged={activeTab === 'satellites' ? 'SATELLITE &bull; AUDIT_LOG' : 'DEBRIS &bull; AUDIT_LOG'}
      />

      {/* Control Actions & Search Bar */}
      <div className="glass-panel p-4 rounded-xl border border-white/10 flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="flex items-center gap-2 bg-space-950/80 px-3 py-2 rounded-lg border border-white/10 w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or NORAD..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none font-mono"
          />
        </div>

        {/* Orbit Filter */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-400">Orbit:</span>
          {['ALL', 'LEO', 'MEO', 'GEO', 'HEO'].map((o) => (
            <button
              key={o}
              onClick={() => setOrbitFilter(o)}
              className={`px-2.5 py-1 rounded-md transition-all ${
                orbitFilter === o
                  ? 'bg-white/20 text-white font-bold'
                  : 'bg-space-950/60 text-slate-400 hover:text-white'
              }`}
            >
              {o}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181818] border border-[#2a2a2a] hover:border-orbit-yellow text-xs text-neutral-300 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-orbit-yellow" />
            <span>Export CSV</span>
          </button>

          {canWrite && (
            <button
              onClick={() => {
                if (activeTab === 'satellites') {
                  setEditingSat(null);
                  setSatForm({
                    noradId: '',
                    intlDesignator: '',
                    satelliteName: '',
                    ownerAgency: 'ISRO (India)',
                    altitudeKm: '550',
                    inclinationDeg: '97.5',
                    apogeeKm: '560',
                    perigeeKm: '540'
                  });
                  setShowSatModal(true);
                } else {
                  setEditingDebris(null);
                  setDebrisForm({
                    noradId: '',
                    objectName: '',
                    sizeMeters: '0.25',
                    rcsSizeClass: 'MEDIUM',
                    massKg: '2.5',
                    velocityKms: '7.6',
                    apogeeKm: '650',
                    perigeeKm: '600',
                    inclinationDeg: '65.0'
                  });
                  setShowDebrisModal(true);
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-orbit-red text-white font-bold text-xs hover:bg-red-700 transition-all shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{activeTab === 'satellites' ? 'Register Satellite' : 'Register Debris'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Data Table */}
      <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          {activeTab === 'satellites' ? (
            <table className="w-full text-left text-xs font-mono">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-space-950/60 border-b border-white/10">
                <tr>
                  <th className="py-3 px-4">NORAD</th>
                  <th className="py-3 px-4">Satellite Name</th>
                  <th className="py-3 px-4">Agency / Owner</th>
                  <th className="py-3 px-4">Orbit</th>
                  <th className="py-3 px-4">Altitude</th>
                  <th className="py-3 px-4">Apogee / Perigee</th>
                  <th className="py-3 px-4">Inclination</th>
                  <th className="py-3 px-4">Status</th>
                  {canWrite && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {satellites.map((s) => (
                  <tr key={s.Satellite_ID} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 font-bold text-orbit-cyan">#{s.NORAD_ID}</td>
                    <td className="py-3 px-4 font-semibold text-white">{s.Satellite_Name}</td>
                    <td className="py-3 px-4 text-slate-300">{s.Owner_Agency}</td>
                    <td className="py-3 px-4"><Badge type="orbit" value={s.orbit_class} /></td>
                    <td className="py-3 px-4">{Math.round(s.Orbital_Altitude_KM)} km</td>
                    <td className="py-3 px-4 text-slate-400">{Math.round(s.Apogee_KM)} / {Math.round(s.Perigee_KM)} km</td>
                    <td className="py-3 px-4">{s.Inclination_Deg.toFixed(2)}&deg;</td>
                    <td className="py-3 px-4"><Badge type="status" value={s.Operational_Status} /></td>
                    {canWrite && (
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingSat(s);
                              setSatForm({
                                noradId: s.NORAD_ID.toString(),
                                intlDesignator: s.intl_designator,
                                satelliteName: s.Satellite_Name,
                                ownerAgency: s.Owner_Agency,
                                altitudeKm: s.Orbital_Altitude_KM.toString(),
                                inclinationDeg: s.Inclination_Deg.toString(),
                                apogeeKm: s.Apogee_KM.toString(),
                                perigeeKm: s.Perigee_KM.toString()
                              });
                              setShowSatModal(true);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-orbit-cyan"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSatellite(s.Satellite_ID)}
                            className="p-1 rounded text-slate-400 hover:text-orbit-red"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-xs font-mono">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-space-950/60 border-b border-white/10">
                <tr>
                  <th className="py-3 px-4">NORAD</th>
                  <th className="py-3 px-4">Debris Name</th>
                  <th className="py-3 px-4">RCS Size</th>
                  <th className="py-3 px-4">Velocity</th>
                  <th className="py-3 px-4">Orbit</th>
                  <th className="py-3 px-4">Apogee / Perigee</th>
                  <th className="py-3 px-4">Tracking Station</th>
                  <th className="py-3 px-4">Breakup Event</th>
                  {canWrite && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {debris.map((d) => (
                  <tr key={d.Debris_ID} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 font-bold text-orbit-amber">#{d.NORAD_ID}</td>
                    <td className="py-3 px-4 font-semibold text-white">{d.Object_Name}</td>
                    <td className="py-3 px-4"><Badge type="size" value={d.rcs_size_class} /></td>
                    <td className="py-3 px-4 text-slate-300">{d.Velocity_KMS.toFixed(2)} km/s</td>
                    <td className="py-3 px-4"><Badge type="orbit" value={d.orbit_class} /></td>
                    <td className="py-3 px-4 text-slate-400">{Math.round(d.Apogee_KM)} / {Math.round(d.Perigee_KM)} km</td>
                    <td className="py-3 px-4 text-slate-300">{d.Station_Name || 'Space Fence'}</td>
                    <td className="py-3 px-4 text-slate-400 text-[11px] truncate max-w-[150px]">
                      {d.breakup_event_name || 'Historical Breakup'}
                    </td>
                    {canWrite && (
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingDebris(d);
                              setDebrisForm({
                                noradId: d.NORAD_ID.toString(),
                                objectName: d.Object_Name,
                                sizeMeters: (d.Size_Meters || 0.25).toString(),
                                rcsSizeClass: d.rcs_size_class,
                                massKg: (d.Mass_KG || 2.5).toString(),
                                velocityKms: d.Velocity_KMS.toString(),
                                apogeeKm: d.Apogee_KM.toString(),
                                perigeeKm: d.Perigee_KM.toString(),
                                inclinationDeg: d.Inclination_Deg.toString()
                              });
                              setShowDebrisModal(true);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-orbit-cyan"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteDebris(d.Debris_ID)}
                            className="p-1 rounded text-slate-400 hover:text-orbit-red"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Controls */}
        <div className="px-6 py-4 bg-space-950/40 border-t border-white/5 flex items-center justify-between font-mono text-xs text-slate-400">
          <div>
            Page <span className="text-white font-bold">{page}</span> of <span className="text-white font-bold">{totalPages}</span> ({totalCount} total rows)
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg glass-card border border-white/10 hover:border-orbit-cyan/40 disabled:opacity-30 disabled:hover:border-white/10"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg glass-card border border-white/10 hover:border-orbit-cyan/40 disabled:opacity-30 disabled:hover:border-white/10"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Satellite Registration / Edit Modal */}
      {showSatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-lg glass-panel p-6 rounded-2xl border border-white/15 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-heading font-bold text-lg text-white">
                {editingSat ? 'Edit Satellite Record' : 'Register New Satellite (UC02)'}
              </h3>
              <button onClick={() => setShowSatModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSatellite} className="space-y-3 font-mono text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">NORAD ID *</label>
                  <input
                    type="number"
                    required
                    disabled={!!editingSat}
                    value={satForm.noradId}
                    onChange={(e) => setSatForm({ ...satForm, noradId: e.target.value })}
                    className="w-full glass-input px-3 py-2 text-xs"
                    placeholder="e.g. 58921"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">International Desig *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingSat}
                    value={satForm.intlDesignator}
                    onChange={(e) => setSatForm({ ...satForm, intlDesignator: e.target.value })}
                    className="w-full glass-input px-3 py-2 text-xs"
                    placeholder="e.g. 2026-045A"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Satellite Name *</label>
                <input
                  type="text"
                  required
                  value={satForm.satelliteName}
                  onChange={(e) => setSatForm({ ...satForm, satelliteName: e.target.value })}
                  className="w-full glass-input px-3 py-2 text-xs"
                  placeholder="e.g. EOS-08 / CARTOSAT-3B"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Owner Agency *</label>
                <input
                  type="text"
                  required
                  value={satForm.ownerAgency}
                  onChange={(e) => setSatForm({ ...satForm, ownerAgency: e.target.value })}
                  className="w-full glass-input px-3 py-2 text-xs"
                  placeholder="e.g. ISRO (India)"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Mean Altitude (KM) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={satForm.altitudeKm}
                    onChange={(e) => setSatForm({ ...satForm, altitudeKm: e.target.value })}
                    className="w-full glass-input px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Inclination (&deg;) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={satForm.inclinationDeg}
                    onChange={(e) => setSatForm({ ...satForm, inclinationDeg: e.target.value })}
                    className="w-full glass-input px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Apogee (KM) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={satForm.apogeeKm}
                    onChange={(e) => setSatForm({ ...satForm, apogeeKm: e.target.value })}
                    className="w-full glass-input px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Perigee (KM) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={satForm.perigeeKm}
                    onChange={(e) => setSatForm({ ...satForm, perigeeKm: e.target.value })}
                    className="w-full glass-input px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowSatModal(false)}
                  className="px-4 py-2 rounded-lg glass-card text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-orbit-cyan text-space-950 font-bold hover:bg-orbit-cyan/90 transition-all shadow-md shadow-orbit-cyan/20"
                >
                  {editingSat ? 'Save Updates' : 'Commit Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Debris Registration / Edit Modal */}
      {showDebrisModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-lg glass-panel p-6 rounded-2xl border border-white/15 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-heading font-bold text-lg text-white">
                {editingDebris ? 'Edit Debris Record' : 'Register Debris Fragment (UC05)'}
              </h3>
              <button onClick={() => setShowDebrisModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDebris} className="space-y-3 font-mono text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">NORAD ID *</label>
                  <input
                    type="number"
                    required
                    disabled={!!editingDebris}
                    value={debrisForm.noradId}
                    onChange={(e) => setDebrisForm({ ...debrisForm, noradId: e.target.value })}
                    className="w-full glass-input px-3 py-2 text-xs"
                    placeholder="e.g. 99120"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">RCS Size Class *</label>
                  <select
                    value={debrisForm.rcsSizeClass}
                    onChange={(e) => setDebrisForm({ ...debrisForm, rcsSizeClass: e.target.value })}
                    className="w-full glass-input px-3 py-2 text-xs"
                  >
                    <option value="SMALL">SMALL (&lt; 0.1 m&sup2;)</option>
                    <option value="MEDIUM">MEDIUM (0.1 - 1.0 m&sup2;)</option>
                    <option value="LARGE">LARGE (&gt; 1.0 m&sup2;)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Object Name *</label>
                <input
                  type="text"
                  required
                  value={debrisForm.objectName}
                  onChange={(e) => setDebrisForm({ ...debrisForm, objectName: e.target.value })}
                  className="w-full glass-input px-3 py-2 text-xs"
                  placeholder="e.g. FENGYUN 1C DEB"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Velocity (KM/S) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={debrisForm.velocityKms}
                    onChange={(e) => setDebrisForm({ ...debrisForm, velocityKms: e.target.value })}
                    className="w-full glass-input px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Mass (KG)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={debrisForm.massKg}
                    onChange={(e) => setDebrisForm({ ...debrisForm, massKg: e.target.value })}
                    className="w-full glass-input px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Apogee (KM) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={debrisForm.apogeeKm}
                    onChange={(e) => setDebrisForm({ ...debrisForm, apogeeKm: e.target.value })}
                    className="w-full glass-input px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Perigee (KM) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={debrisForm.perigeeKm}
                    onChange={(e) => setDebrisForm({ ...debrisForm, perigeeKm: e.target.value })}
                    className="w-full glass-input px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowDebrisModal(false)}
                  className="px-4 py-2 rounded-lg glass-card text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-orbit-amber text-space-950 font-bold hover:bg-orbit-amber/90 transition-all shadow-md shadow-orbit-amber/20"
                >
                  {editingDebris ? 'Save Updates' : 'Commit Debris'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
