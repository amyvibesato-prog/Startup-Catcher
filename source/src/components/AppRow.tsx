import { Check } from 'lucide-react';
import type { StartupApp } from '../types/startup';
import { AppIcon } from './AppIcon';

interface AppRowProps {
  app: StartupApp;
  onToggle: (id: string) => void;
}

export function AppRow({ app, onToggle }: AppRowProps) {
  const isActive = app.selected;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isActive}
      aria-label={`${app.name} (${app.source})`}
      title={app.command ? `${app.name} — ${app.command}` : app.name}
      onClick={() => onToggle(app.id)}
      className="group flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3.5 text-left transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60"
      style={{
        backgroundColor: isActive ? 'var(--sc-row-active-bg)' : 'var(--sc-row-inactive-bg)',
        border: `1px solid ${isActive ? 'var(--sc-border-active)' : 'var(--sc-border-subtle)'}`,
      }}
    >
      <div className="flex min-w-0 items-center gap-3.5">
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center transition-opacity duration-150"
          style={{
            color: isActive ? 'var(--sc-text)' : 'var(--sc-text-dim)',
            opacity: isActive ? 0.96 : 0.62,
          }}
        >
          <AppIcon icon={app.icon} className="h-[22px] w-[22px]" />
        </span>

        <div className="flex min-w-0 flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
          <span
            className="truncate text-[15.5px] font-medium tracking-[-0.01em] transition-colors duration-150"
            style={{
              color: isActive ? 'var(--sc-text)' : 'var(--sc-text-dim)',
            }}
          >
            {app.name}
          </span>
          <span
            className="text-[11.5px] font-normal whitespace-nowrap transition-opacity duration-150"
            style={{
              color: isActive ? 'var(--sc-text-muted)' : 'var(--sc-text-dim)',
              opacity: isActive ? 0.85 : 0.65,
            }}
          >
            · {app.source}
          </span>
        </div>
      </div>

      {/* Tactile Windows 11 matte toggle switch matching mockup */}
      <span
        aria-hidden="true"
        className="relative inline-flex h-[26px] w-[48px] shrink-0 items-center rounded-full p-[3px] transition-colors duration-150"
        style={
          isActive
            ? {
                backgroundColor: 'var(--sc-accent)',
                border: '1px solid transparent',
              }
            : {
                backgroundColor: 'var(--sc-switch-off-bg)',
                border: '1px solid var(--sc-border)',
              }
        }
      >
        <span
          className="flex h-[18px] w-[18px] items-center justify-center rounded-full transition-transform duration-150 ease-out"
          style={
            isActive
              ? {
                  transform: 'translateX(22px)',
                  backgroundColor: 'var(--sc-accent-fg)',
                  color: 'var(--sc-accent)',
                }
              : {
                  transform: 'translateX(0px)',
                  backgroundColor: 'rgba(255, 255, 255, 0.14)',
                  color: 'transparent',
                }
          }
        >
          {isActive && <Check className="h-3 w-3 stroke-[3]" />}
        </span>
      </span>
    </button>
  );
}
