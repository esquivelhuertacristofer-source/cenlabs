"use client";

import React from 'react';
import { 
  Radar, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer 
} from 'recharts';

const data = [
  { subject: 'Rigor Científico', A: 120, fullMark: 150 },
  { subject: 'Análisis de Datos', A: 98, fullMark: 150 },
  { subject: 'Destreza Técnica', A: 86, fullMark: 150 },
  { subject: 'Pensamiento Crítico', A: 99, fullMark: 150 },
  { subject: 'Fundamentos', A: 85, fullMark: 150 },
];

export default function RadarCompetencias({ color = "#219EBC" }) {
  return (
    <div className="w-full h-[300px] md:h-[400px] flex items-center justify-center bg-white/5 backdrop-blur-xl rounded-[40px] border border-white/10 p-6">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="#ffffff20" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
          />
          <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
          <Radar
            name="Competencias"
            dataKey="A"
            stroke={color}
            fill={color}
            fillOpacity={0.4}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
