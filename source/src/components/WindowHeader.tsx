import type { MouseEvent } from 'react';
import { Menu, Minus, Square, X } from 'lucide-react';
import { isNativeDesktop, windowControls } from '../adapters/systemAdapter';
import type { MainTab } from '../types/startup';

interface WindowHeaderProps {
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
  isMenuOpen: boolean;
  onToggleMenu: () => void;
  pendingInterceptCount?: number;
}

export function WindowHeader({
  activeTab,
  onTabChange,
  isMenuOpen,
  onToggleMenu,
  pendingInterceptCount = 0,
}: WindowHeaderProps) {
  const native = isNativeDesktop();

  const handleHeaderMouseDown = (event: MouseEvent<HTMLElement>) => {
    if (!native || event.button !== 0) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest('button, a, input, [role="tab"]')) return;
    windowControls.startDrag();
  };

  const handleHeaderDoubleClick = (event: MouseEvent<HTMLElement>) => {
    if (!native) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest('button, a, input, [role="tab"]')) return;
    windowControls.toggleMaximize();
  };

  return (
    <header
      onMouseDown={handleHeaderMouseDown}
      onDoubleClick={handleHeaderDoubleClick}
      className="flex flex-wrap items-center justify-between gap-2 px-4 pt-3.5 pb-3 select-none sm:flex-nowrap sm:px-5"
    >
      {/* Left: subtle status dot + brand name */}
      <div className="flex items-center gap-2.5 shrink-0">
        <span
          aria-hidden="true"
          className="h-2.5 w-2.5 rounded-full shrink-0 transition-colors duration-150"
          style={{
            backgroundColor: 'var(--sc-accent)',
          }}
        />
        <span
          className="text-[14px] font-semibold tracking-[-0.01em] whitespace-nowrap"
          style={{ color: 'var(--sc-text)' }}
        >
          Startup Catcher
        </span>
      </div>

      {/* Center: two-tab switcher */}
      <div
        role="tablist"
        aria-label="Режими Startup Catcher"
        className="order-3 flex w-full items-center justify-center rounded-full p-1 sm:order-none sm:w-auto"
        style={{
          backgroundColor: 'var(--sc-inner-bg)',
          border: '1px solid var(--sc-border-subtle)',
        }}
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'launch'}
          onClick={() => onTabChange('launch')}
          className="flex-1 rounded-full px-3.5 py-1 text-[12.5px] font-medium whitespace-nowrap transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-white/60 sm:flex-none"
          style={
            activeTab === 'launch'
              ? {
                  backgroundColor: 'var(--sc-row-active-bg)',
                  color: 'var(--sc-text)',
                  border: '1px solid var(--sc-border-active)',
                }
              : {
                  backgroundColor: 'transparent',
                  color: 'var(--sc-text-muted)',
                  border: '1px solid transparent',
                }
          }
        >
          Запуск зараз
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'intercept'}
          onClick={() => onTabChange('intercept')}
          className="flex-1 rounded-full px-3.5 py-1 text-[12.5px] font-medium whitespace-nowrap transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-white/60 sm:flex-none"
          style={
            activeTab === 'intercept'
              ? {
                  backgroundColor: 'var(--sc-row-active-bg)',
                  color: 'var(--sc-text)',
                  border: '1px solid var(--sc-border-active)',
                }
              : {
                  backgroundColor: 'transparent',
                  color: 'var(--sc-text-muted)',
                  border: '1px solid transparent',
                }
          }
        >
          Перехоплення{pendingInterceptCount > 0 ? ` (${pendingInterceptCount})` : ''}
        </button>
      </div>

      {/* Right: Menu button + native window controls */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          aria-expanded={isMenuOpen}
          aria-controls="startup-catcher-menu"
          onClick={onToggleMenu}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[12.5px] font-medium whitespace-nowrap shrink-0 transition-colors duration-150 hover:brightness-110 focus-visible:outline-2 focus-visible:outline-white/60"
          style={{
            backgroundColor: isMenuOpen ? 'var(--sc-row-active-bg)' : 'var(--sc-inner-bg)',
            color: isMenuOpen ? 'var(--sc-text)' : 'var(--sc-text-muted)',
            border: `1px solid ${isMenuOpen ? 'var(--sc-border-active)' : 'var(--sc-border-subtle)'}`,
          }}
        >
          {isMenuOpen ? (
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <Menu className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          <span>Меню</span>
        </button>

        {native && (
          <div
            className="ml-1 flex items-center gap-0.5 pl-1.5"
            style={{ borderLeft: '1px solid var(--sc-border-subtle)' }}
          >
            <button
              type="button"
              title="Згорнути"
              aria-label="Згорнути"
              onClick={() => windowControls.minimize()}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-white/10"
              style={{ color: 'var(--sc-text-muted)' }}
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              title="Розгорнути / Відновити"
              aria-label="Розгорнути"
              onClick={() => windowControls.toggleMaximize()}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-white/10"
              style={{ color: 'var(--sc-text-muted)' }}
            >
              <Square className="h-3 w-3" />
            </button>
            <button
              type="button"
              title="Закрити"
              aria-label="Закрити"
              onClick={() => windowControls.close()}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-red-500/80 hover:text-white"
              style={{ color: 'var(--sc-text-muted)' }}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
