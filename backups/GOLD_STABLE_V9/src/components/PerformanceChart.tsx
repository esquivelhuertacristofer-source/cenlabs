"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { performanceData } from "@/lib/mockData";
import { ChevronDown, BarChart3 } from "lucide-react";
import { useTheme } from "next-themes";

export default function PerformanceChart() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <div className="rounded-2xl border border-dash-border bg-dash-card p-6 shadow-sm transition-all duration-300 hover:shadow-md">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <BarChart3 className="h-4 w-4" />
          </div>
          <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground/80">
            Tiempo Promedio de Uso
          </h3>
        </div>
        <button className="flex items-center gap-1.5 rounded-xl border border-dash-border bg-dash-card-alt px-4 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground transition-all hover:border-primary/40 hover:text-primary">
          Semanal
          <ChevronDown className="h-3 w-3" />
        </button>
      </div>

      {/* Chart */}
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={performanceData}
            margin={{ top: 5, right: 10, left: -15, bottom: 0 }}
          >
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#219EBC" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#219EBC" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="4 4"
              stroke={isDark ? "rgba(142,202,230,0.08)" : "rgba(2,48,71,0.05)"}
              vertical={false}
            />
            <XAxis
              dataKey="day"
              tick={{ fill: isDark ? "#8ECAE6" : "#023047", fontSize: 10, fontWeight: 700 }}
              axisLine={false}
              tickLine={false}
              dy={10}
            />
            <YAxis
              tick={{ fill: isDark ? "#8ECAE6" : "#023047", fontSize: 10, fontWeight: 700 }}
              axisLine={false}
              tickLine={false}
              domain={[0, 4]}
              dx={-5}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? "#023047" : "#ffffff",
                border: isDark ? "1px solid rgba(142,202,230,0.2)" : "1px solid rgba(2,48,71,0.1)",
                borderRadius: "12px",
                color: isDark ? "#EFF9FF" : "#023047",
                fontSize: "11px",
                fontWeight: "900",
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                padding: "8px 12px",
              }}
              itemStyle={{ color: "#219EBC" }}
              cursor={{ stroke: "#219EBC", strokeWidth: 1, strokeDasharray: "3 3" }}
              formatter={(value: any) => [`${value} hrs`, "Uso"]}
            />
            <Area
              type="monotone"
              dataKey="hours"
              stroke="#219EBC"
              strokeWidth={3}
              fill="url(#chartGradient)"
              dot={{ r: 0 }}
              activeDot={{
                r: 6,
                fill: "#219EBC",
                stroke: isDark ? "#011627" : "#ffffff",
                strokeWidth: 3,
              }}
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
