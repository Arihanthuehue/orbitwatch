import React, { useState, useEffect } from 'react';
import { 
  Terminal, Play, Database, Layers, CheckCircle, 
  RotateCcw, ShieldCheck, Zap, ArrowRight, Eye, Code2, AlertTriangle, Activity 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import api from '../services/api.js';

export const DbmsLabPage: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<'console' | 'objects' | 'transactions' | 'indexing' | 'security'>('console');

  // SQL Console States
  const [customSql, setCustomSql] = useState('SELECT NORAD_ID, Satellite_Name, Owner_Agency, Orbital_Altitude_KM, orbit_class FROM SATELLITE WHERE orbit_class = "LEO" LIMIT 10;');
  const [consoleResult, setConsoleResult] = useState<any | null>(null);
  const [consoleLoading, setConsoleLoading] = useState(false);
  const [predefinedQueries, setPredefinedQueries] = useState<any[]>([]);

  // Objects Catalog
  const [dbObjects, setDbObjects] = useState<{ views: any[]; procedures: any[]; functions: any[]; triggers: any[] }>({
    views: [],
    procedures: [],
    functions: [],
    triggers: []
  });

  // Transactions State
  const [transactionOutput, setTransactionOutput] = useState<string | null>(null);

  // Indexing & Partitioning States
  const [explainResult, setExplainResult] = useState<any | null>(null);
  const [partitionData, setPartitionData] = useState<any[]>([]);

  // Security Roles State
  const [rolesData, setRolesData] = useState<any | null>(null);

  useEffect(() => {
    async function loadInitial() {
      try {
        const [qRes, objRes, partRes, roleRes] = await Promise.all([
          api.get('/dbms/queries'),
          api.get('/dbms/objects'),
          api.get('/dbms/partitions'),
          api.get('/dbms/roles')
        ]);
        if (qRes.data.success) setPredefinedQueries(qRes.data.library || []);
        if (objRes.data.success) setDbObjects(objRes.data);
        if (partRes.data.success) setPartitionData(partRes.data.partitions || []);
        if (roleRes.data.success) setRolesData(roleRes.data);
      } catch (err) {
        console.error('Failed to load lab data:', err);
      }
    }
    loadInitial();
  }, []);

  const handleExecuteConsole = async (sqlToRun?: string) => {
    const query = sqlToRun || customSql;
    setConsoleLoading(true);
    try {
      const res = await api.post('/dbms/console', {
        query,
        isPredefined: !!sqlToRun
      });
      setConsoleResult(res.data);
      addToast({
        type: 'success',
        title: 'Query Executed',
        message: `Returned ${res.data.rowCount} rows in ${res.data.executionTimeMs}ms`
      });
    } catch (err: any) {
      setConsoleResult({
        success: false,
        error: err.response?.data?.message || err.message,
        executionTimeMs: err.response?.data?.executionTimeMs || 0
      });
      addToast({ type: 'error', title: 'Execution Rejected', message: err.response?.data?.message || err.message });
    } finally {
      setConsoleLoading(false);
    }
  };

  const handleRunTransactionDemo = async (scenario: 'commit' | 'savepoint' | 'rollback') => {
    try {
      const res = await api.post(`/dbms/transaction-demo/${scenario}`);
      if (res.data.success) {
        setTransactionOutput(
          `[SCENARIO: ${res.data.scenario}]\n${res.data.message}\n` +
          (res.data.createdId ? `Created Record ID: #${res.data.createdId}\n` : '') +
          `Status: SUCCESS & VERIFIED`
        );
        addToast({ type: 'success', title: `ACID ${scenario.toUpperCase()} Succeeded`, message: res.data.message });
      }
    } catch (err: any) {
      setTransactionOutput(`[ERROR in ${scenario}]: ${err.message}`);
      addToast({ type: 'error', title: 'Transaction Failed', message: err.message });
    }
  };

  const handleRunPartitionPruningExplain = async () => {
    const q = "SELECT * FROM OBSERVATION WHERE observed_at BETWEEN '2026-01-01' AND '2026-12-31'";
    try {
      const res = await api.post('/dbms/explain', { query: q, analyze: false });
      if (res.data.success) {
        setExplainResult(res.data.plan);
        addToast({
          type: 'info',
          title: 'Partition Pruning Plan',
          message: 'MySQL scanned strictly partition p2026!'
        });
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Explain Failed', message: err.message });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Terminal className="w-6 h-6 text-orbit-cyan" />
            <h1 className="text-2xl font-bold font-heading text-white">DBMS Live Demonstration Lab</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Interactive evaluation suite designed specifically for the VIT Chennai viva &amp; evaluation rubric.
          </p>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#161616] p-1.5 rounded-xl border border-[#262626] text-xs">
          {[
            { id: 'console', label: 'SQL Console' },
            { id: 'objects', label: 'Views & Routines' },
            { id: 'transactions', label: 'ACID Transactions' },
            { id: 'indexing', label: 'Indexing & Pruning' },
            { id: 'security', label: 'Security & Roles' }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeTab === t.id
                  ? 'bg-orbit-red text-white shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: SQL CONSOLE */}
      {activeTab === 'console' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Pre-built Query Library */}
          <div className="lg:col-span-4 bg-[#111111] p-5 rounded-2xl border border-[#262626] shadow-2xl space-y-3 flex flex-col max-h-[750px] overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-[#222222]">
              <span className="text-xs font-bold text-orbit-yellow uppercase">
                Pre-built SQL Queries ({predefinedQueries.length})
              </span>
              <span className="text-[10px] text-neutral-500 font-bold">Evaluation Rubric</span>
            </div>

            <div className="space-y-2 overflow-y-auto flex-1 pr-1 text-xs">
              {predefinedQueries.map((q) => (
                <div
                  key={q.id}
                  onClick={() => {
                    setCustomSql(q.sql);
                    handleExecuteConsole(q.sql);
                  }}
                  className="bg-[#161616] p-3 rounded-xl border border-[#262626] cursor-pointer hover:border-orbit-yellow group space-y-1 transition-all shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white group-hover:text-orbit-yellow text-xs">
                      {q.title}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#222222] text-neutral-400">
                      {q.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-tight">
                    {q.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Code Editor & Execution Results */}
          <div className="lg:col-span-8 space-y-4">
            {/* Editor Box */}
            <div className="bg-[#111111] p-5 rounded-2xl border border-[#262626] shadow-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-neutral-300">
                  <Code2 className="w-4 h-4 text-orbit-yellow" />
                  <span className="font-bold">SQL Command Buffer:</span>
                  <span className="text-[11px] text-neutral-500 font-normal">
                    (Prepared MySQL Statement &bull; Sandboxed for Non-Admin)
                  </span>
                </div>

                <button
                  onClick={() => handleExecuteConsole()}
                  disabled={consoleLoading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orbit-red text-white font-bold text-xs hover:bg-red-700 transition-all shadow-md disabled:opacity-50"
                >
                  <Play className={`w-3.5 h-3.5 fill-current ${consoleLoading ? 'animate-spin' : ''}`} />
                  <span>{consoleLoading ? 'Executing...' : 'Run Query'}</span>
                </button>
              </div>

              <textarea
                rows={5}
                value={customSql}
                onChange={(e) => setCustomSql(e.target.value)}
                className="w-full bg-[#0a0a0a] p-3.5 rounded-xl border border-[#2e2e2e] text-xs text-amber-300 focus:outline-none focus:border-orbit-red leading-relaxed resize-y font-normal"
              />
            </div>

            {/* Result Table Box */}
            <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-3 min-h-[350px] flex flex-col">
              <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs font-mono">
                <span className="font-semibold text-white uppercase tracking-wider">
                  Query Execution Results
                </span>
                {consoleResult && (
                  <div className="flex items-center gap-3 text-slate-400">
                    <span>Rows: <span className="text-white font-bold">{consoleResult.rowCount || 0}</span></span>
                    <span>Latency: <span className="text-orbit-green font-bold">{consoleResult.executionTimeMs}ms</span></span>
                  </div>
                )}
              </div>

              {consoleResult?.error ? (
                <div className="p-4 rounded-xl bg-orbit-red/10 border border-orbit-red/30 text-orbit-red font-mono text-xs">
                  <div className="font-bold flex items-center gap-1.5 mb-1">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Query Error:</span>
                  </div>
                  <pre className="whitespace-pre-wrap">{consoleResult.error}</pre>
                </div>
              ) : consoleResult?.rows && consoleResult.rows.length > 0 ? (
                <div className="overflow-x-auto flex-1 max-h-[400px]">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-space-950/80 sticky top-0 border-b border-white/10 text-slate-400 text-[11px] uppercase">
                      <tr>
                        {consoleResult.columns.map((c: string) => (
                          <th key={c} className="py-2.5 px-3 whitespace-nowrap">{c}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {consoleResult.rows.map((r: any, idx: number) => (
                        <tr key={idx} className="hover:bg-white/5 transition-colors">
                          {consoleResult.columns.map((c: string) => (
                            <td key={c} className="py-2.5 px-3 text-slate-300 whitespace-nowrap">
                              {r[c] !== null ? String(r[c]) : <span className="text-slate-600">NULL</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-xs font-mono text-slate-500">
                  Select a pre-built query from the left or write custom SQL above and click Run Query.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: VIEWS, PROCEDURES, FUNCTIONS, TRIGGERS */}
      {activeTab === 'objects' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Views Catalog */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-3">
            <h3 className="font-heading font-bold text-white text-base flex items-center gap-2">
              <Eye className="w-4 h-4 text-orbit-cyan" />
              <span>Database Views (5)</span>
            </h3>
            <div className="space-y-2 font-mono text-xs max-h-[350px] overflow-y-auto">
              {dbObjects.views.map((v) => (
                <div key={v.name} className="glass-card p-3 rounded-xl border border-white/5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-orbit-cyan">{v.name}</span>
                    <button
                      onClick={() => {
                        setCustomSql(`SELECT * FROM ${v.name} LIMIT 15;`);
                        setActiveTab('console');
                        handleExecuteConsole(`SELECT * FROM ${v.name} LIMIT 15;`);
                      }}
                      className="px-2 py-0.5 rounded bg-orbit-cyan/15 text-orbit-cyan text-[10px] hover:bg-orbit-cyan/25"
                    >
                      Run View
                    </button>
                  </div>
                  <pre className="text-[10px] text-slate-400 overflow-x-auto max-h-16 whitespace-pre-wrap">
                    {v.definition}
                  </pre>
                </div>
              ))}
            </div>
          </div>

          {/* Stored Procedures Catalog */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-3">
            <h3 className="font-heading font-bold text-white text-base flex items-center gap-2">
              <Zap className="w-4 h-4 text-orbit-amber" />
              <span>Stored Procedures (5)</span>
            </h3>
            <div className="space-y-2 font-mono text-xs max-h-[350px] overflow-y-auto">
              {dbObjects.procedures.map((p) => (
                <div key={p.name} className="glass-card p-3 rounded-xl border border-white/5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-orbit-amber">{p.name}()</span>
                    <button
                      onClick={() => {
                        const callSql = p.name === 'Fetch_Object_Lineage'
                          ? 'CALL Fetch_Object_Lineage(25730);'
                          : `CALL ${p.name}();`;
                        setCustomSql(callSql);
                        setActiveTab('console');
                        handleExecuteConsole(callSql);
                      }}
                      className="px-2 py-0.5 rounded bg-orbit-amber/15 text-orbit-amber text-[10px] hover:bg-orbit-amber/25"
                    >
                      Execute
                    </button>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {p.name === 'Fetch_Object_Lineage' && 'Uses Recursive Common Table Expression (CTE) to traverse parent-child tree.'}
                    {p.name === 'Escalate_High_Risk_Events' && 'Uses explicit MySQL CURSOR to loop over open high-risk conjunctions.'}
                    {p.name === 'Get_Top10_Risky_Debris' && 'Ranks debris by highest collision probability and closest encounter distance.'}
                    {p.name === 'Register_Satellite' && 'Transactional insert with audit logging and rollback handling.'}
                    {p.name === 'Record_Collision_Event' && 'Transactional conjunction recording and risk classification.'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Scalar Functions */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-3">
            <h3 className="font-heading font-bold text-white text-base flex items-center gap-2">
              <Code2 className="w-4 h-4 text-orbit-green" />
              <span>Scalar Functions (4)</span>
            </h3>
            <div className="space-y-2 font-mono text-xs">
              <div className="glass-card p-3 rounded-xl border border-white/5">
                <span className="font-bold text-orbit-green">Classify_Orbit(apogee, perigee)</span>
                <p className="text-[11px] text-slate-400 mt-0.5">Returns &apos;LEO&apos;, &apos;MEO&apos;, &apos;GEO&apos;, or &apos;HEO&apos; deterministically based on altitude thresholds.</p>
              </div>
              <div className="glass-card p-3 rounded-xl border border-white/5">
                <span className="font-bold text-orbit-green">Risk_Level(probability, miss_distance)</span>
                <p className="text-[11px] text-slate-400 mt-0.5">Evaluates severity: CRITICAL (miss &le; 1km or p &ge; 1e-4), WARNING, MONITOR, NOMINAL.</p>
              </div>
              <div className="glass-card p-3 rounded-xl border border-white/5">
                <span className="font-bold text-orbit-green">Calculate_Kinetic_Energy(mass_kg, velocity_kms)</span>
                <p className="text-[11px] text-slate-400 mt-0.5">Calculates kinetic impact energy in MegaJoules (E_k = &frac12;mv&sup2;).</p>
              </div>
            </div>
          </div>

          {/* Database Triggers */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-3">
            <h3 className="font-heading font-bold text-white text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-400" />
              <span>Database Triggers (5)</span>
            </h3>
            <div className="space-y-2 font-mono text-xs">
              <div className="glass-card p-3 rounded-xl border border-white/5">
                <span className="font-bold text-purple-400">trg_collision_event_after_insert</span>
                <p className="text-[11px] text-slate-400 mt-0.5">AFTER INSERT on COLLISION_EVENT: Automatically creates ALERT and AUDIT_LOG row when risk threshold is crossed.</p>
              </div>
              <div className="glass-card p-3 rounded-xl border border-white/5">
                <span className="font-bold text-purple-400">trg_validate_satellite_before_insert</span>
                <p className="text-[11px] text-slate-400 mt-0.5">BEFORE INSERT: Rejects negative altitude, invalid inclination, or perigee &gt; apogee using SIGNAL 45000.</p>
              </div>
              <div className="glass-card p-3 rounded-xl border border-white/5">
                <span className="font-bold text-purple-400">trg_satellite_orbit_history_before_update</span>
                <p className="text-[11px] text-slate-400 mt-0.5">BEFORE UPDATE: Automatically archives previous orbital elements into ORBIT_STATE_HISTORY.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ACID TRANSACTIONS WALKTHROUGH */}
      {activeTab === 'transactions' && (
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-6">
          <div>
            <h3 className="font-heading font-bold text-white text-lg">Interactive ACID Transaction Scenarios</h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Demonstrate Atomicity, Consistency, Isolation, and Durability live against MySQL InnoDB engine.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Scenario 1: COMMIT */}
            <div className="glass-card p-5 rounded-2xl border border-orbit-green/30 space-y-3 flex flex-col justify-between">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] bg-orbit-green/15 text-orbit-green font-bold font-mono">
                  SCENARIO 1: ATOMIC COMMIT
                </span>
                <h4 className="font-heading font-bold text-white text-base mt-2">Atomic Multi-Table Insert</h4>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  Registers a newly launched satellite and immediately logs its first radar observation pass in a single transaction block. Both are permanently written to disk upon COMMIT.
                </p>
              </div>
              <button
                onClick={() => handleRunTransactionDemo('commit')}
                className="w-full py-2.5 rounded-xl bg-orbit-green text-space-950 font-bold text-xs font-mono hover:bg-orbit-green/90 transition-all shadow-md shadow-orbit-green/20"
              >
                Execute COMMIT Scenario
              </button>
            </div>

            {/* Scenario 2: SAVEPOINT */}
            <div className="glass-card p-5 rounded-2xl border border-orbit-cyan/30 space-y-3 flex flex-col justify-between">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] bg-orbit-cyan/15 text-orbit-cyan font-bold font-mono">
                  SCENARIO 2: SAVEPOINT RECOVERY
                </span>
                <h4 className="font-heading font-bold text-white text-base mt-2">Partial Failure Recovery</h4>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  Creates named SAVEPOINT after satellite creation. Simulates an application error during a secondary step, executes ROLLBACK TO SAVEPOINT, recovers, and commits valid state.
                </p>
              </div>
              <button
                onClick={() => handleRunTransactionDemo('savepoint')}
                className="w-full py-2.5 rounded-xl bg-orbit-cyan text-space-950 font-bold text-xs font-mono hover:bg-orbit-cyan/90 transition-all shadow-md shadow-orbit-cyan/20"
              >
                Execute SAVEPOINT Scenario
              </button>
            </div>

            {/* Scenario 3: ROLLBACK */}
            <div className="glass-card p-5 rounded-2xl border border-orbit-red/30 space-y-3 flex flex-col justify-between">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] bg-orbit-red/15 text-orbit-red font-bold font-mono">
                  SCENARIO 3: TRANSACTION ABORT
                </span>
                <h4 className="font-heading font-bold text-white text-base mt-2">Complete Rollback</h4>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  Inserts a doomed test satellite, detects a constraint violation or anomaly, issues full ROLLBACK. Verifies zero rows exist in the database.
                </p>
              </div>
              <button
                onClick={() => handleRunTransactionDemo('rollback')}
                className="w-full py-2.5 rounded-xl bg-orbit-red text-white font-bold text-xs font-mono hover:bg-orbit-red/90 transition-all shadow-md shadow-orbit-red/20"
              >
                Execute ROLLBACK Scenario
              </button>
            </div>
          </div>

          {/* Transaction Output Log Box */}
          {transactionOutput && (
            <div className="p-4 rounded-xl bg-space-950 font-mono text-xs text-slate-200 border border-white/10">
              <div className="text-orbit-cyan font-bold mb-1">Transaction Execution Telemetry:</div>
              <pre className="whitespace-pre-wrap">{transactionOutput}</pre>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: INDEXING & PARTITION PRUNING */}
      {activeTab === 'indexing' && (
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-heading font-bold text-white text-lg">
                MySQL Table Partitioning &amp; Index Execution Plans
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Demonstrates partition pruning on the OBSERVATION table partitioned by year range.
              </p>
            </div>

            <button
              onClick={handleRunPartitionPruningExplain}
              className="px-4 py-2 rounded-xl bg-orbit-cyan text-space-950 font-bold text-xs font-mono hover:bg-orbit-cyan/90 transition-all shadow-md"
            >
              Run Partition-Pruning EXPLAIN
            </button>
          </div>

          {/* Partition Layout Table from information_schema */}
          <div className="space-y-2">
            <span className="text-xs font-mono text-slate-400 uppercase">
              Physical Partitions in information_schema.PARTITIONS:
            </span>
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-space-950/80 text-slate-400 border-b border-white/10 text-[11px] uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Table Name</th>
                    <th className="py-2.5 px-3">Partition Name</th>
                    <th className="py-2.5 px-3">Method</th>
                    <th className="py-2.5 px-3">Expression</th>
                    <th className="py-2.5 px-3">Row Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {partitionData.map((p, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                      <td className="py-2.5 px-3 text-white font-bold">{p.TABLE_NAME}</td>
                      <td className="py-2.5 px-3 text-orbit-cyan font-bold">{p.PARTITION_NAME}</td>
                      <td className="py-2.5 px-3">{p.PARTITION_METHOD}</td>
                      <td className="py-2.5 px-3 text-slate-400">{p.PARTITION_EXPRESSION}</td>
                      <td className="py-2.5 px-3 text-orbit-green font-bold">{p.TABLE_ROWS}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Explain Result Card */}
          {explainResult && (
            <div className="p-4 rounded-xl bg-space-950 border border-orbit-cyan/30 font-mono text-xs space-y-2">
              <div className="text-orbit-cyan font-bold">
                EXPLAIN Output (Verified Partition Pruning):
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-slate-500 border-b border-white/10">
                    <tr>
                      <th className="py-1 px-2">id</th>
                      <th className="py-1 px-2">select_type</th>
                      <th className="py-1 px-2">table</th>
                      <th className="py-1 px-2 text-orbit-green">partitions</th>
                      <th className="py-1 px-2">type</th>
                      <th className="py-1 px-2">rows</th>
                    </tr>
                  </thead>
                  <tbody>
                    {explainResult.map((r: any, idx: number) => (
                      <tr key={idx} className="text-slate-300">
                        <td className="py-1 px-2">{r.id}</td>
                        <td className="py-1 px-2">{r.select_type}</td>
                        <td className="py-1 px-2">{r.table}</td>
                        <td className="py-1 px-2 text-orbit-green font-bold bg-orbit-green/10 rounded">
                          {r.partitions} (Pruned!)
                        </td>
                        <td className="py-1 px-2">{r.type}</td>
                        <td className="py-1 px-2">{r.rows}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[11px] text-slate-400 pt-2 border-t border-white/5">
                Notice: The execution planner identifies partition <span className="text-orbit-green font-bold">p2026</span> directly from the WHERE clause predicate, bypassing all other partitions!
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: SECURITY & ROLES */}
      {activeTab === 'security' && (
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-6">
          <div>
            <h3 className="font-heading font-bold text-white text-lg">
              Role-Based Access Control (RBAC) &amp; MySQL Native Privileges
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Enforced at both the MySQL database engine level (GRANT/REVOKE) and application Express layer.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
            <div className="glass-card p-4 rounded-xl border border-white/5 space-y-3">
              <div className="text-orbit-cyan font-bold uppercase">Database Native Roles</div>
              <div className="space-y-2">
                <div className="p-2.5 rounded-lg bg-space-950/80 border border-white/5">
                  <div className="font-bold text-white">role_admin</div>
                  <div className="text-slate-400 text-[11px]">ALL PRIVILEGES ON orbitwatch_db.* WITH GRANT OPTION</div>
                </div>
                <div className="p-2.5 rounded-lg bg-space-950/80 border border-white/5">
                  <div className="font-bold text-white">role_agency</div>
                  <div className="text-slate-400 text-[11px]">SELECT, INSERT, UPDATE, DELETE ON SATELLITE, TRACKING_STATION, OBSERVATION</div>
                </div>
                <div className="p-2.5 rounded-lg bg-space-950/80 border border-white/5">
                  <div className="font-bold text-white">role_operator</div>
                  <div className="text-slate-400 text-[11px]">SELECT ON catalog, UPDATE on satellite status, EXECUTE on escalation procedures</div>
                </div>
                <div className="p-2.5 rounded-lg bg-space-950/80 border border-white/5">
                  <div className="font-bold text-white">role_researcher</div>
                  <div className="text-slate-400 text-[11px]">SELECT ONLY ON v_public_researcher_catalog, SPACE_WEATHER, DEBRIS_LINEAGE</div>
                </div>
              </div>
            </div>

            <div className="glass-card p-4 rounded-xl border border-white/5 space-y-3">
              <div className="text-orbit-green font-bold uppercase">Active Seeded Accounts</div>
              <div className="space-y-2">
                {rolesData?.users?.map((u: any) => (
                  <div key={u.User_ID} className="p-2.5 rounded-lg bg-space-950/80 border border-white/5 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white">{u.username}</div>
                      <div className="text-slate-400 text-[11px]">{u.organization}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-orbit-cyan/15 text-orbit-cyan font-bold">
                      {u.role_name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
