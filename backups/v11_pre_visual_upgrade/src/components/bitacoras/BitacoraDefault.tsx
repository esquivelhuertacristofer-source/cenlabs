"use client";

import React from 'react';
import { FileText } from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';

export default function BitacoraDefault() {
  const { bitacoraData } = useSimuladorStore();

  return (
    <div className="space-y-4">
      <div className="relative p-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] text-center">
        <FileText size={40} className="mx-auto text-slate-300 mb-2" />
        <h4 className="text-sm font-black text-[#023047] uppercase italic">Bitácora Científica</h4>
      </div>
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-5 space-y-4">
        <div className="flex justify-between items-center text-xs pb-3 border-b border-slate-50">
          <span className="font-bold text-slate-500">Masa (A)</span>
          <span className="font-black text-[#023047]">{bitacoraData?.masaA || '--'} u</span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="font-bold text-slate-500">Carga Neta</span>
          <span className="font-black px-2 py-1 rounded-lg bg-blue-100 text-[#219EBC]">{bitacoraData?.carga || 'N/A'}</span>
        </div>
      </div>
    </div>
  );
}
