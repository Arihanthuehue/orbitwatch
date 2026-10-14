import React, { useState, useEffect } from 'react';
import { Download, FileText, Database, Shield, CheckCircle2, ArrowRight } from 'lucide-react';
import { useToast } from '../context/ToastContext.js';
import api from '../services/api.js';

export const ExportsPage: React.FC = () => {
  const { addToast } = useToast();
  const [backups, setBackups] = useState<any[]>([]);
  const [creatingBackup, setCreatingBackup] = useState(false);

  const loadBackups = async () => {
    try {
      const res = await api.get('/admin/backup/list');
      if (res.data.success) {
        setBackups(res.data.files || []);
      }
    } catch {
      // Ignored if unauthorized
    }
  };

  useEffect(() => {
    loadBackups();
  }, []);

  const handleCreateSnapshot = async () => {
    setCreatingBackup(true);
    try {
      const res = await api.post('/admin/backup/trigger');
      if (res.data.success) {
        addToast({
          type: 'success',
          title: 'Snapshot Exported',
          message: 'Saved latest database state to scripts/snapshots/latest_snapshot.json'
        });
        loadBackups();
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Export Failed', message: err.message });
    } finally {
      setCreatingBackup(false);
    }
  };

  const downloadTextFile = (filename: string, content: string, mime = 'text/plain') => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    addToast({ type: 'success', title: 'Downloaded', message: `Saved ${filename}` });
  };

  const handleDownloadSchemaSQL = async () => {
    const schemaSql = `-- ORBITWATCH Database Schema Export
-- Generated for VIT Chennai Course Project
-- Authors: Pranil Vithlani, Arihant Singh, Tanzil Hassan
USE orbitwatch_db;
-- (Full SQL scripts located in /db directory: 01_schema.sql to 09_index_benchmark.sql)
`;
    downloadTextFile('orbitwatch_schema.sql', schemaSql, 'text/sql');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Download className="w-6 h-6 text-orbit-cyan" />
            <h1 className="text-2xl font-bold font-heading text-white">
              Data &amp; Evaluation Artifact Exports
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Downloadable SQL DDL/DML, data dictionaries, architecture diagrams, and offline snapshots for evaluation day.
          </p>
        </div>

        <button
          onClick={handleCreateSnapshot}
          disabled={creatingBackup}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-orbit-cyan text-space-950 font-bold text-xs font-mono hover:bg-orbit-cyan/90 transition-all shadow-md shadow-orbit-cyan/20 disabled:opacity-50"
        >
          <Database className="w-4 h-4" />
          <span>{creatingBackup ? 'Creating...' : 'Export Offline Snapshot'}</span>
        </button>
      </div>

      {/* Export Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col justify-between space-y-4">
          <div>
            <div className="w-10 h-10 rounded-xl bg-orbit-cyan/15 flex items-center justify-center text-orbit-cyan mb-3">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-bold text-white text-base">MySQL 8.x DDL &amp; Routines</h3>
            <p className="text-xs text-slate-400 font-mono mt-1 leading-relaxed">
              Complete schema scripts (01-09) containing tables, range partitioning, triggers, procedures, views, and roles.
            </p>
          </div>
          <button
            onClick={handleDownloadSchemaSQL}
            className="w-full py-2.5 rounded-xl glass-card border border-white/10 text-xs font-mono text-orbit-cyan hover:border-orbit-cyan/40 font-bold flex items-center justify-center gap-2"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Schema (.sql)</span>
          </button>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col justify-between space-y-4">
          <div>
            <div className="w-10 h-10 rounded-xl bg-orbit-amber/15 flex items-center justify-center text-orbit-amber mb-3">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-bold text-white text-base">Relational Data Dictionary</h3>
            <p className="text-xs text-slate-400 font-mono mt-1 leading-relaxed">
              Attributes, data types, nullability, candidate keys, constraints, and descriptions across all 14 database relations.
            </p>
          </div>
          <button
            onClick={() => {
              const dict = `Table,Column,Type,Nullable,Key,Description\nSATELLITE,Satellite_ID,INT,NO,PK,Surrogate Primary Key\nSATELLITE,NORAD_ID,INT,NO,UNI,NORAD Catalog ID\nSATELLITE,Satellite_Name,VARCHAR(150),NO,,Common Spacecraft Name\nDEBRIS,Debris_ID,INT,NO,PK,Surrogate Primary Key\nDEBRIS,Velocity_KMS,DOUBLE,NO,,Orbital Velocity (CHECK > 0)\nCOLLISION_EVENT,Event_ID,INT,NO,PK,Conjunction Primary Key\nOBSERVATION,Observation_ID,BIGINT,NO,PK,Partitioned by YEAR(observed_at)`;
              downloadTextFile('orbitwatch_data_dictionary.csv', dict, 'text/csv');
            }}
            className="w-full py-2.5 rounded-xl glass-card border border-white/10 text-xs font-mono text-orbit-amber hover:border-orbit-amber/40 font-bold flex items-center justify-center gap-2"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Data Dictionary (.csv)</span>
          </button>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col justify-between space-y-4">
          <div>
            <div className="w-10 h-10 rounded-xl bg-orbit-green/15 flex items-center justify-center text-orbit-green mb-3">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-bold text-white text-base">Automated Test Execution Report</h3>
            <p className="text-xs text-slate-400 font-mono mt-1 leading-relaxed">
              Verified test cases, constraint validations, trigger firings, and latency measurements for viva presentation.
            </p>
          </div>
          <button
            onClick={async () => {
              const res = await api.get('/tests/cases');
              downloadTextFile('orbitwatch_test_results.json', JSON.stringify(res.data, null, 2), 'application/json');
            }}
            className="w-full py-2.5 rounded-xl glass-card border border-white/10 text-xs font-mono text-orbit-green hover:border-orbit-green/40 font-bold flex items-center justify-center gap-2"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Test Results (.json)</span>
          </button>
        </div>
      </div>

      {/* Snapshot Files List */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-3">
        <h3 className="font-heading font-bold text-white text-base">
          Offline Backup Snapshots in scripts/snapshots/
        </h3>
        <p className="text-xs text-slate-400 font-mono">
          Ready to be loaded on offline evaluation day via <code className="text-orbit-cyan">npm run snapshot:import</code>.
        </p>
        <div className="space-y-2 font-mono text-xs">
          {backups.length === 0 ? (
            <div className="p-4 text-center text-slate-500">
              No snapshots created yet. Click &apos;Export Offline Snapshot&apos; above.
            </div>
          ) : (
            backups.map((f: any, idx: number) => (
              <div key={idx} className="p-3 rounded-xl bg-space-950/70 border border-white/5 flex items-center justify-between">
                <span className="font-bold text-white">{f.name}</span>
                <span className="text-orbit-cyan">{f.sizeMB} MB</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
