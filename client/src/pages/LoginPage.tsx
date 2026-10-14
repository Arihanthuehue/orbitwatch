import React, { useState } from 'react';
import { ShieldCheck, LogIn, Globe2, UserCheck, KeyRound, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { RoleName } from '../types/index.js';

interface LoginPageProps {
  onSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess }) => {
  const { login, switchRoleQuick } = useAuth();
  const { addToast } = useToast();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const ok = await login(username, password);
    setLoading(false);
    if (ok) {
      addToast({ type: 'success', title: 'Login Successful', message: `Welcome back, ${username}!` });
      onSuccess();
    } else {
      setError('Invalid username or password. Check credentials or use quick demo logins below.');
    }
  };

  const handleQuickDemo = async (role: RoleName) => {
    await switchRoleQuick(role);
    addToast({ type: 'success', title: 'Session Initialized', message: `Logged in as ${role}.` });
    onSuccess();
  };

  return (
    <div className="min-h-[calc(100vh-60px)] flex items-center justify-center p-4 bg-[#050505]">
      <div className="w-full max-w-md bg-[#111111] p-8 rounded-3xl border border-[#282828] shadow-2xl space-y-6">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#181818] border border-orbit-red/60 mx-auto shadow-md flex items-center justify-center">
            <Globe2 className="w-6 h-6 text-orbit-yellow" />
          </div>
          <h2 className="text-2xl font-bold text-white">ORBIT<span className="text-orbit-red">WATCH</span> Access</h2>
          <p className="text-xs text-neutral-400">
            Role-Based Access Control &bull; VIT Chennai DBMS Lab
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-[#220a0a] border border-red-800 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Manual Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-neutral-400 block mb-1 font-bold">Username or Email</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full glass-input px-3.5 py-2.5 text-xs font-normal"
              placeholder="e.g. admin or isro_admin"
            />
          </div>

          <div>
            <label className="text-neutral-400 block mb-1 font-bold">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full glass-input px-3.5 py-2.5 text-xs font-normal"
              placeholder="••••••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-orbit-red text-white font-bold text-xs hover:bg-red-700 transition-all shadow-lg shadow-red-950/60 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            <span>{loading ? 'Authenticating...' : 'Sign In with Credentials'}</span>
          </button>
        </form>

        {/* Quick Demo Role Logins */}
        <div className="pt-5 border-t border-[#242424] space-y-2">
          <div className="text-[11px] text-neutral-400 text-center uppercase tracking-wider mb-2 font-bold">
            One-Click Demo Roles (For Evaluation):
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <button
              onClick={() => handleQuickDemo('Administrator')}
              className="p-2.5 rounded-xl bg-[#161616] border border-[#2a2a2a] hover:border-orbit-red text-left space-y-0.5 shadow-sm"
            >
              <div className="font-bold text-white">Administrator</div>
              <div className="text-[10px] text-neutral-400">admin &bull; Full CRUD</div>
            </button>

            <button
              onClick={() => handleQuickDemo('Space Agency')}
              className="p-2.5 rounded-xl bg-[#161616] border border-[#2a2a2a] hover:border-orbit-yellow text-left space-y-0.5 shadow-sm"
            >
              <div className="font-bold text-orbit-yellow">Space Agency</div>
              <div className="text-[10px] text-neutral-400">isro_admin &bull; Assets</div>
            </button>

            <button
              onClick={() => handleQuickDemo('Satellite Operator')}
              className="p-2.5 rounded-xl bg-[#161616] border border-[#2a2a2a] hover:border-amber-600 text-left space-y-0.5 shadow-sm"
            >
              <div className="font-bold text-amber-500">Sat Operator</div>
              <div className="text-[10px] text-neutral-400">operator_starlink</div>
            </button>

            <button
              onClick={() => handleQuickDemo('Research Scientist')}
              className="p-2.5 rounded-xl bg-[#161616] border border-[#2a2a2a] hover:border-red-500 text-left space-y-0.5 shadow-sm"
            >
              <div className="font-bold text-red-400">Researcher</div>
              <div className="text-[10px] text-neutral-400">dr_scientist &bull; Read-Only</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
