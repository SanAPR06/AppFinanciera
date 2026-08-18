import { Sun, Moon, Monitor } from 'lucide-react';
import type { Theme } from '../lib/useTheme';

const OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Oscuro', icon: Moon },
  { value: 'system', label: 'Sistema', icon: Monitor },
];

export function ThemeToggle({
  theme,
  onChange,
}: {
  theme: Theme;
  onChange: (theme: Theme) => void;
}) {
  return (
    <div className="inline-flex rounded-pills border border-ash dark:border-graphite/40 p-1 gap-1">
      {OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const active = theme === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-pills text-body-sm font-medium ${
              active
                ? 'bg-electric-lime text-off-black-ink'
                : 'text-graphite dark:text-smoke hover:text-off-black-ink dark:hover:text-off-white-canvas'
            }`}
          >
            <Icon size={15} />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
