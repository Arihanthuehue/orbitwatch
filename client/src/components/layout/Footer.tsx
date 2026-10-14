import React from 'react';
import { ExternalLink, Database, Shield, Radio, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-white/5 bg-space-950/80 backdrop-blur-md px-6 py-6 text-xs text-slate-400">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Project & Team Credits */}
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
          <div className="font-heading font-semibold text-slate-200">
            ORBITWATCH &bull; Space Debris Tracking Platform
          </div>
          <span className="hidden sm:inline text-slate-600">|</span>
          <div className="font-mono text-slate-400">
            Pranil Vithlani (25BRS1210) &bull; Arihant Singh (25BRS1230) &bull; Tanzil Hassan (25BRS1201)
          </div>
        </div>

        {/* Live Data Sources Links */}
        <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
          <span className="text-slate-500">Data Sources:</span>
          <a
            href="https://celestrak.org/"
            target="_blank"
            rel="noreferrer"
            className="hover:text-orbit-cyan flex items-center gap-1 transition-colors"
          >
            <span>CelesTrak</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
          <a
            href="https://www.swpc.noaa.gov/"
            target="_blank"
            rel="noreferrer"
            className="hover:text-orbit-cyan flex items-center gap-1 transition-colors"
          >
            <span>NOAA SWPC</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
          <a
            href="https://api.nasa.gov/"
            target="_blank"
            rel="noreferrer"
            className="hover:text-orbit-cyan flex items-center gap-1 transition-colors"
          >
            <span>NASA NeoWs</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-4 pt-3 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 font-mono">
        <div>VIT Chennai &bull; School of Computer Science & Engineering &bull; Fall 2026 DBMS Lab</div>
        <div className="mt-1 sm:mt-0">MySQL 8.0 &bull; BCNF Relational Schema &bull; SGP4 Orbital Physics</div>
      </div>
    </footer>
  );
};
