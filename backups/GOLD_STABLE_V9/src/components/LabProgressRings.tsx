import { labProgress } from "@/lib/mockData";

function ProgressRing({
  progress,
  color,
  size = 56,
  strokeWidth = 5,
}: {
  progress: number;
  color: string;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className="stroke-slate-200 dark:stroke-slate-700/30"
          strokeWidth={strokeWidth}
        />
        {/* Progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-foreground">
        {progress}%
      </span>
    </div>
  );
}

export default function LabProgressRings() {
  return (
    <div className="rounded-2xl border border-dash-border bg-dash-card p-5">
      <h3 className="mb-5 text-sm font-semibold text-muted-foreground">
        Progreso por Laboratorio
      </h3>
      <div className="space-y-4">
        {labProgress.map((lab) => (
          <div key={lab.name} className="flex items-center gap-4 group">
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                {lab.name}
              </p>
              <p className="text-xs text-muted-foreground italic font-medium">
                {lab.description}
              </p>
            </div>
            <ProgressRing progress={lab.progress} color={lab.color} />
          </div>
        ))}
      </div>
    </div>
  );
}
