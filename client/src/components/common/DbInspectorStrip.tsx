import React, { useState } from 'react';
import { Terminal, Copy, Check, ChevronDown, ChevronUp, Database } from 'lucide-react';

interface DbInspectorStripProps {
  sql?: string;
  affectedRows?: number;
  executionTimeMs?: number;
  tableChanged?: string;
}

export const DbInspectorStrip: React.FC<DbInspectorStripProps> = ({
  sql,
  affectedRows,
  executionTimeMs,
  tableChanged
}) => {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(true);

  if (!sql) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full my-3 rounded-xl border border-[#2a2a2a] bg-[#111111] overflow-hidden shadow-2xl">
      <div 
        onClick={() => setExpanded(!expanded)}
        className="px-3.5 py-2.5 bg-[#161616] border-b border-[#242424] flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-2 text-xs text-orbit-yellow">
          <Database className="w-4 h-4 text-orbit-red" />
          <span className="font-bold uppercase tracking-wider text-white">MySQL Transaction Inspector</span>
          {tableChanged && (
            <span className="px-2 py-0.5 rounded bg-[#20180a] border border-amber-800/50 text-[10px] text-orbit-yellow font-bold">
              {tableChanged}
            </span>
          )}
          {affectedRows !== undefined && (
            <span className="text-neutral-400 text-[11px]">
              &bull; Rows: <span className="text-white font-bold">{affectedRows}</span>
            </span>
          )}
          {executionTimeMs !== undefined && (
            <span className="text-neutral-400 text-[11px]">
              &bull; Latency: <span className="text-emerald-400 font-bold">{executionTimeMs}ms</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCopy();
            }}
            className="p-1 rounded text-neutral-400 hover:text-white transition-colors"
            title="Copy SQL"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          {expanded ? <ChevronUp className="w-3.5 h-3.5 text-neutral-400" /> : <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />}
        </div>
      </div>

      {expanded && (
        <div className="p-3.5 bg-[#0a0a0a] text-xs text-neutral-200 overflow-x-auto border-t border-[#1a1a1a]">
          <pre className="whitespace-pre-wrap leading-relaxed text-amber-300 font-normal">{sql}</pre>
        </div>
      )}
    </div>
  );
};
