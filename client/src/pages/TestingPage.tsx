import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Play, RefreshCw, Activity, ShieldCheck, Zap } from 'lucide-react';
import { TestCase, TestRun } from '../types/index.js';
import { useToast } from '../context/ToastContext.js';
import api from '../services/api.js';

export const TestingPage: React.FC = () => {
  const { addToast } = useToast();

  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [latestRuns, setLatestRuns] = useState<Record<string, TestRun>>({});
  const [loading, setLoading] = useState(false);
  const [runningAll, setRunningAll] = useState(false);
  const [summary, setSummary] = useState<{ total: number; passed: number; passRate: string } | null>(null);

  const loadTestCases = async () => {
    setLoading(true);
    try {
      const res = await api.get('/tests/cases');
      if (res.data.success) {
        setTestCases(res.data.cases);
        const runMap: Record<string, TestRun> = {};
        (res.data.latestRuns || []).forEach((r: TestRun) => {
          runMap[r.Test_ID] = r;
        });
        setLatestRuns(runMap);

        const runs = Object.values(runMap);
        if (runs.length > 0) {
          const pass = runs.filter((r) => r.Pass_Fail === 'PASS').length;
          setSummary({
            total: runs.length,
            passed: pass,
            passRate: `${Math.round((pass / runs.length) * 100)}%`
          });
        }
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Load Error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTestCases();
  }, []);

  const handleExecuteAllTests = async () => {
    setRunningAll(true);
    try {
      const res = await api.post('/tests/execute-all');
      if (res.data.success) {
        addToast({
          type: 'success',
          title: 'All Test Cases Verified Live',
          message: `${res.data.passedCount} of ${res.data.totalTests} tests passed (${res.data.passRate}) against MySQL 8.x`
        });
        setSummary({
          total: res.data.totalTests,
          passed: res.data.passedCount,
          passRate: res.data.passRate
        });
        loadTestCases();
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Test Execution Failed', message: err.message });
    } finally {
      setRunningAll(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="bg-[#111111] p-6 rounded-2xl border border-[#262626] shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-orbit-red" />
            <h1 className="text-2xl font-bold text-white">
              Automated Verification &amp; Testing Suite
            </h1>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Automated unit and integration test assertions executed directly against MySQL constraints, triggers, and procedures.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {summary && (
            <div className="px-3.5 py-1.5 rounded-xl bg-amber-950/80 text-orbit-yellow border border-amber-800 text-xs font-bold flex items-center gap-2 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-orbit-yellow" />
              <span>Pass Rate: {summary.passRate} ({summary.passed}/{summary.total})</span>
            </div>
          )}

          <button
            onClick={handleExecuteAllTests}
            disabled={runningAll}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-orbit-red text-white font-bold text-xs hover:bg-red-700 transition-all shadow-md disabled:opacity-50"
          >
            <Play className={`w-4 h-4 fill-current ${runningAll ? 'animate-spin' : ''}`} />
            <span>{runningAll ? 'Executing Suite...' : 'Run All 12 Test Cases Live'}</span>
          </button>
        </div>
      </div>

      {/* Test Cases Table */}
      <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-space-950/80 text-slate-400 border-b border-white/10 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Test ID</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Expected Result</th>
                <th className="py-3 px-4">Actual Live Result</th>
                <th className="py-3 px-3 text-center">Latency</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {testCases.map((tc) => {
                const run = latestRuns[tc.Test_ID];
                const isPass = run?.Pass_Fail === 'PASS';
                return (
                  <tr key={tc.Test_ID} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-orbit-cyan">{tc.Test_ID}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-white/5 text-slate-300">
                        {tc.Category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white max-w-xs">{tc.Description}</td>
                    <td className="py-3.5 px-4 text-slate-400 max-w-xs">{tc.Expected_Result}</td>
                    <td className="py-3.5 px-4 text-slate-300 max-w-sm">
                      {run?.Actual_Result || 'Pending execution'}
                    </td>
                    <td className="py-3.5 px-3 text-center text-orbit-green font-bold">
                      {run ? `${run.Execution_Time_MS}ms` : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {run ? (
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            isPass
                              ? 'bg-orbit-green/15 text-orbit-green border-orbit-green/40'
                              : 'bg-orbit-red/15 text-orbit-red border-orbit-red/40'
                          }`}
                        >
                          {isPass ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          <span>{run.Pass_Fail}</span>
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[10px]">UNTESTED</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
