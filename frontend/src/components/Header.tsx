import { useUIStore } from '../store';
import { Sun, Moon, Menu, X, Github, Scale, BarChart3 } from 'lucide-react';

interface HeaderProps {
  onMenuToggle: () => void;
  sidebarOpen: boolean;
}

export default function Header({ onMenuToggle, sidebarOpen }: HeaderProps) {
  const { theme, toggleTheme } = useUIStore();

  return (
    <header className="header-glow flex items-center justify-between px-5 py-0 border-b border-[var(--border)] bg-[var(--bg-sidebar)] z-50 relative" style={{ height: '56px', flexShrink: 0 }}>
      {/* Left: Menu + Brand */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? <X size={17} /> : <Menu size={17} />}
        </button>

        {/* Logo mark */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <Scale size={14} className="text-indigo-400" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-gradient leading-tight tracking-tight">
              Judicial Delay Analytics
            </h1>
            <p className="text-[10px] text-[var(--text-muted)] leading-none mt-0.5">
              India Court Backlog &amp; Pendency · NJDG 2024
            </p>
          </div>
        </div>
      </div>

      {/* Center: stat chips (hidden on small) */}
      <div className="hidden lg:flex items-center gap-2">
        <StatChip label="4.5Cr" sub="Total Pending" color="indigo" />
        <StatChip label="35" sub="States / UTs" color="purple" />
        <StatChip label="700+" sub="Districts" color="pink" />
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2">
        {/* Live data badge */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] text-emerald-400 font-semibold tracking-wide">LIVE DATA</span>
        </div>

        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          aria-label="GitHub repository"
        >
          <Github size={16} />
        </a>

        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  );
}

function StatChip({ label, sub, color }: { label: string; sub: string; color: string }) {
  const colorMap: Record<string, string> = {
    indigo: 'text-indigo-400 border-indigo-500/20 bg-indigo-500/8',
    purple: 'text-purple-400 border-purple-500/20 bg-purple-500/8',
    pink:   'text-pink-400 border-pink-500/20 bg-pink-500/8',
  };
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs ${colorMap[color]}`}>
      <span className="font-bold font-mono">{label}</span>
      <span className="text-[var(--text-muted)] text-[10px]">{sub}</span>
    </div>
  );
}
