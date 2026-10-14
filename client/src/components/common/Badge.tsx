import React from 'react';

interface BadgeProps {
  type: 'orbit' | 'risk' | 'status' | 'size' | 'source';
  value: string;
}

export const Badge: React.FC<BadgeProps> = ({ type, value }) => {
  const upper = value.toUpperCase();

  let style = 'bg-[#1a1a1a] text-neutral-300 border-[#333333]';

  if (type === 'risk') {
    if (upper === 'CRITICAL') {
      style = 'bg-red-950/90 text-red-400 border-red-700 font-bold';
    } else if (upper === 'WARNING') {
      style = 'bg-amber-950/90 text-amber-400 border-amber-700 font-bold';
    } else if (upper === 'MONITOR') {
      style = 'bg-yellow-950/80 text-yellow-500 border-yellow-800';
    } else {
      style = 'bg-emerald-950/80 text-emerald-400 border-emerald-800';
    }
  } else if (type === 'orbit') {
    if (upper === 'LEO') style = 'bg-amber-950/70 text-orbit-yellow border-amber-800/70 font-bold';
    else if (upper === 'MEO') style = 'bg-red-950/60 text-red-300 border-red-800/60 font-bold';
    else if (upper === 'GEO') style = 'bg-yellow-950/60 text-yellow-400 border-yellow-800/60 font-bold';
    else if (upper === 'HEO') style = 'bg-neutral-800 text-neutral-200 border-neutral-600 font-bold';
  } else if (type === 'status') {
    if (upper === 'ACTIVE') style = 'bg-emerald-950/80 text-emerald-400 border-emerald-800 font-bold';
    else if (upper === 'SATELLITE') style = 'bg-[#20180a] text-orbit-yellow border-amber-800/60 font-bold';
    else if (upper === 'DEBRIS') style = 'bg-[#220a0a] text-red-400 border-red-800/60 font-bold';
    else style = 'bg-[#181818] text-neutral-400 border-[#2a2a2a]';
  } else if (type === 'size') {
    if (upper === 'LARGE') style = 'bg-red-950/80 text-red-400 border-red-800 font-bold';
    else if (upper === 'MEDIUM') style = 'bg-amber-950/80 text-amber-400 border-amber-800 font-bold';
    else style = 'bg-[#181818] text-neutral-300 border-[#2a2a2a]';
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border shadow-sm ${style}`}>
      {value}
    </span>
  );
};
