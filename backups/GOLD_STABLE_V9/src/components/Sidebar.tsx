"use client";

import {
  LayoutDashboard,
  Users,
  FlaskConical,
  Settings,
  LogOut,
  Bell,
  Atom,
  Magnet,
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { groups } from "@/lib/mockData";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppContext } from "@/context/AppContext";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: Users, label: "Alumnos", href: "/alumnos" },
  { icon: FlaskConical, label: "Laboratorios", href: "/laboratorios" },
  { icon: Settings, label: "Configuración", href: "/configuracion" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { selectedGroup, setSelectedGroup } = useAppContext();

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-60 flex-col border-r border-dash-border bg-dash-bg px-4 py-6">
      {/* Logo - CEN Corporate Badge */}
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/30 overflow-hidden">
          <Atom className="absolute h-6 w-6 text-white/90" style={{ top: 4, left: 4 }} />
          <Magnet className="absolute h-4 w-4 text-[#FB8500]" style={{ bottom: 4, right: 4, transform: "rotate(-45deg)" }} strokeWidth={3} />
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-xl font-black tracking-[0.1em] text-foreground uppercase">CEN</span>
          <span className="text-[9px] font-bold text-dash-accent uppercase tracking-widest">Laboratorios</span>
        </div>
      </div>

      {/* Theme Toggle */}
      <div className="mb-8 flex justify-center px-1">
        <ThemeToggle />
      </div>

      {/* Group Filter - Specialized Typography */}
      <div className="mb-10 px-1">
        <div className="flex items-center justify-between mb-2">
          <label className="block px-1 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
            Grupo / Filtro
          </label>
        </div>
        <Select value={selectedGroup} onValueChange={(value: string | null) => setSelectedGroup(value || 'all')}>
          <SelectTrigger className="h-12 w-full border-dash-border bg-dash-card px-4 text-sm font-semibold tracking-tight text-foreground ring-offset-background transition-all hover:border-primary/30 focus:ring-2 focus:ring-primary/10">
            <SelectValue placeholder="Seleccionar Grupo" />
          </SelectTrigger>
          <SelectContent className="border-dash-border bg-dash-card text-foreground">
            {groups.map((group) => (
              <SelectItem 
                key={group.value} 
                value={group.value} 
                className="text-xs font-semibold focus:bg-primary/10 focus:text-primary dark:focus:text-primary-foreground"
              >
                {group.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 space-y-1.5 px-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`group flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-bold transition-all duration-300 ${
                isActive
                  ? "bg-primary shadow-lg shadow-primary/20 text-white"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon
                className={`h-5 w-5 transition-transform duration-300 group-hover:scale-110 ${
                  isActive
                    ? "text-white"
                    : "text-muted-foreground group-hover:text-foreground"
                }`}
              />
              {item.label}
              {isActive && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-white/60" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Activities Notification */}
      <div className="mb-4 px-1">
        <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-bold text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground">
          <div className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#FB8500] text-[10px] font-black text-white ring-2 ring-dash-bg">
              12
            </span>
          </div>
          Notificaciones
        </button>
      </div>

      {/* Divider */}
      <div className="mx-3 mb-6 border-t border-dash-border/60" />

      {/* Sign Out - Rebranded to Orange as per user request */}
      <button className="group flex w-full items-center gap-3 rounded-xl bg-[#FB8500] px-5 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-white transition-all duration-300 hover:bg-[#E87A00] hover:shadow-lg hover:shadow-orange-500/30 active:scale-95">
        <LogOut className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
        Cerrar Sesión
      </button>
    </aside>
  );
}
