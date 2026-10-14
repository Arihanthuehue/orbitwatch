import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { RoleName } from '../../types/index.js';
import api from '../../services/api.js';
import { 
  Globe2, AlertTriangle, Database, Radio, Flame, 
  BarChart3, Cpu, BookOpen, GraduationCap, CheckSquare, 
  Download, LogIn, LogOut, ChevronDown, ShieldCheck, RefreshCw 
} from 'lucide-react';

interface NavbarProps {
  activeSection: string;
  onNavigateSection: (sectionId: string) => void;
  onOpenLoginModal: () => void;
  onRefreshAllData?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  activeSection, 
  onNavigateSection, 
  onOpenLoginModal,
  onRefreshAllData 
}) => {
  const { user, logout, switchRoleQuick } = useAuth();
  const { addToast } = useToast();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const handleSyncLiveApis = async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      const res = await api.post('/admin/sync/trigger', {}, { timeout: 8000 });
      if (res.data.success) {
        addToast({
          type: 'success',
          title: 'Live Real-Time Sync Complete',
          message: res.data.message
        });
        if (onRefreshAllData) onRefreshAllData();
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Sync Notice',
        message: err.response?.data?.message || 'Synchronization timed out or completed in background.'
      });
    } finally {
      setSyncing(false);
    }
  };

  const navItems = [
    { id: 'explore', label: 'Explore', icon: Globe2 },
    { id: 'monitor', label: 'Monitor', icon: AlertTriangle },
    { id: 'catalog', label: 'Catalog', icon: Database },
    { id: 'stations', label: 'Stations', icon: Radio },
    { id: 'weather', label: 'Space Weather', icon: Flame },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'dbms-lab', label: 'DBMS Lab', icon: Cpu },
    { id: 'learn', label: 'Learn', icon: BookOpen },
    { id: 'viva-prep', label: 'Viva Prep', icon: GraduationCap },
    { id: 'checklist', label: 'DA3 Checklist', icon: CheckSquare },
    { id: 'exports', label: 'Exports', icon: Download }
  ];

  const roles: RoleName[] = [
    'Administrator',
    'Space Agency',
    'Satellite Operator',
    'Research Scientist'
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-[#0d0d0d]/95 backdrop-blur-md border-b border-[#262626] px-4 py-2.5 flex items-center justify-between shadow-xl">
      {/* Brand Logo - Scrolls to Top Hero */}
      <div 
        onClick={() => onNavigateSection('hero')}
        className="flex items-center gap-2.5 cursor-pointer group select-none"
      >
        <div className="w-9 h-9 rounded-xl bg-[#1a1a1a] border border-orbit-red/50 flex items-center justify-center p-0.5 shadow-md shadow-black group-hover:border-orbit-red transition-all">
          <Globe2 className="w-5 h-5 text-orbit-yellow" />
        </div>
        <div>
          <div className="font-bold text-base tracking-wider text-white">
            ORBIT<span className="text-orbit-red">WATCH</span>
          </div>
          <div className="text-[10px] text-neutral-400 font-normal tracking-tight -mt-0.5">
            SSA TELEMETRY &bull; VIT CHENNAI
          </div>
        </div>
      </div>

      {/* Primary Navigation Pills - Smooth Scroll Triggers */}
      <nav className="hidden xl:flex items-center gap-1 bg-[#161616] p-1 rounded-xl border border-[#2a2a2a]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigateSection(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-orbit-red text-white shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-[#222222]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Right Controls: Data Freshness, Role Switcher, Auth */}
      <div className="flex items-center gap-3">
        {/* Live Sync Trigger Button */}
        <button
          onClick={handleSyncLiveApis}
          disabled={syncing}
          title="Click to trigger real-time live synchronization from NOAA, NASA, and CelesTrak"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181818] border border-amber-700/60 text-orbit-yellow hover:border-orbit-yellow text-xs font-bold transition-all shadow-md disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-orbit-yellow ${syncing ? 'animate-spin' : ''}`} />
          <span>{syncing ? 'SYNCING LIVE...' : 'SYNC LIVE APIS'}</span>
        </button>

        {/* Role Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#161616] border border-[#2a2a2a] text-xs text-neutral-200 hover:border-orbit-red transition-colors shadow-sm"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-orbit-red" />
            <span className="hidden md:inline text-neutral-400">Role:</span>
            <span className="font-bold text-orbit-yellow">{user ? user.role : 'Guest'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
          </button>

          {roleMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-[#141414] rounded-xl border border-[#2a2a2a] shadow-2xl p-1.5 z-50">
              <div className="px-2.5 py-1.5 text-[11px] text-neutral-400 font-bold border-b border-[#222222] mb-1">
                SWITCH DEMO ROLE:
              </div>
              {roles.map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    switchRoleQuick(r);
                    setRoleMenuOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                    user?.role === r
                      ? 'bg-orbit-red text-white'
                      : 'text-neutral-300 hover:bg-[#222222]'
                  }`}
                >
                  <span>{r}</span>
                  {user?.role === r && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Login Modal Open / Logout */}
        {user ? (
          <button
            onClick={logout}
            title="Log Out"
            className="p-2 rounded-lg bg-[#161616] border border-[#2a2a2a] text-neutral-400 hover:text-orbit-red hover:border-orbit-red/40 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={onOpenLoginModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orbit-red text-white font-bold text-xs hover:bg-red-700 transition-all shadow-md"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Login</span>
          </button>
        )}
      </div>
    </header>
  );
};
