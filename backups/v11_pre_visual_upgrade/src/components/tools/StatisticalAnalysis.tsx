
'use client';

import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line 
} from 'recharts';
import { useSimuladorStore } from '@/store/simuladorStore';

export default function StatisticalAnalysis() {
  const { bitacoraData } = useSimuladorStore();
  const hallazgos = bitacoraData?.hallazgos || [];

  if (hallazgos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] p-10 text-center">
        <div className="text-4xl mb-4">📊</div>
        <p className="text-slate-500 font-bold max-w-xs">No hay datos registrados. Por favor, realiza registros en la bitácora durante tu práctica.</p>
      </div>
    );
  }

  // Preparar datos para gráficos
  const chartData = hallazgos.map((h, i) => ({
    name: `Obs ${i + 1}`,
    Z: h.z,
    A: h.a,
    Carga: h.carga
  }));

  return (
    <div className="space-y-10">
      <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Distribución Atómica (Z vs A)</h4>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
              />
              <Legend verticalAlign="top" align="right" />
              <Bar dataKey="Z" name="Nº Atómico (Z)" fill="#219EBC" radius={[4, 4, 0, 0]} />
              <Bar dataKey="A" name="Masa Atómica (A)" fill="#023047" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Estabilidad de Carga</h4>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
              />
              <Legend verticalAlign="top" align="right" />
              <Line type="monotone" dataKey="Carga" name="Carga Resultante" stroke="#FFB703" strokeWidth={3} dot={{ r: 6, fill: "#FFB703", strokeWidth: 2, stroke: "#fff" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
