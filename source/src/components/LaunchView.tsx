import { AlertCircle, CheckCircle2, FolderOpen, MinusCircle, Play, Plus, RefreshCw } from 'lucide-react';
import type { StartupApp, StatusFeedback } from '../types/startup';
import { areAllAppsSelected, getSelectedApps } from '../utils/startupState';
import { AppRow } from './AppRow';

interface LaunchViewProps {
  apps: StartupApp[];
  feedback: StatusFeedback | null;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  onToggleApp: (id: string) => void;
  onToggleAll: () => void;
  onLaunchSelected: () => void;
  onSkipAll: () => void;
  onOpenMenu: () => void;
}

export function LaunchView({
  apps,
  feedback,
  isRefreshing = false,
  onRefresh,
  onToggleApp,
  onToggleAll,
  onLaunchSelected,
  onSkipAll,
  onOpenMenu,
}: LaunchViewProps) {
  const selectedApps = getSelectedApps(apps);
  const selectedCount = selectedApps.length;
  const allSelected = areAllAppsSelected(apps);
  const isEmpty = apps.length === 0;

  return (
    <section
      aria-label="Запуск програм зараз"
      className="flex flex-col"
    >
      {/* Top prompt & Select All / Deselect All toggle */}
      <div className="mb-3 flex items-center justify-between gap-3 px-0.5">
        <p
          className="text-[13px] font-normal leading-snug"
          style={{ color: 'var(--sc-text-muted)' }}
        >
          Обери, що запустити після старту ПК:
        </p>

        <div className="flex items-center gap-2 shrink-0">
          {onRefresh && (
            <button
              type="button"
              disabled={isRefreshing}
              onClick={onRefresh}
              title="Оновити список із автозавантаження Windows"
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[12px] font-medium whitespace-nowrap transition-colors duration-150 hover:brightness-115 focus-visible:outline-2 focus-visible:outline-white/60 disabled:opacity-60"
              style={{
                backgroundColor: 'var(--sc-control-bg)',
                color: 'var(--sc-text)',
                border: '1px solid var(--sc-border-subtle)',
              }}
            >
              <RefreshCw
                className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              <span>Оновити</span>
            </button>
          )}

          {!isEmpty && (
            <button
              type="button"
              onClick={onToggleAll}
              className="text-[12.5px] font-medium whitespace-nowrap shrink-0 transition-opacity duration-150 hover:opacity-100 focus-visible:outline-2 focus-visible:outline-white/60 rounded px-1.5 py-0.5"
              style={{
                color: 'var(--sc-text)',
                opacity: 0.78,
              }}
            >
              {allSelected ? 'Зняти все' : 'Обрати все'}
            </button>
          )}
        </div>
      </div>

      {/* Controlled app rows or clean empty state */}
      {isEmpty ? (
        <div
          className="flex min-h-[214px] flex-col items-center justify-center rounded-xl px-6 py-8 text-center"
          style={{
            backgroundColor: 'var(--sc-row-inactive-bg)',
            border: '1px solid var(--sc-border-subtle)',
          }}
        >
          <FolderOpen
            className="mb-3 h-7 w-7 opacity-60"
            style={{ color: 'var(--sc-text-muted)' }}
            aria-hidden="true"
          />
          <p
            className="text-[14.5px] font-medium"
            style={{ color: 'var(--sc-text)' }}
          >
            Список програм порожній
          </p>
          <p
            className="mt-1 max-w-[320px] text-[12.5px] leading-relaxed"
            style={{ color: 'var(--sc-text-muted)' }}
          >
            Додайте потрібні програми через меню, щоб обирати їх запуск після старту Windows.
          </p>
          <button
            type="button"
            onClick={onOpenMenu}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[12.5px] font-medium transition-colors duration-150 hover:brightness-110 focus-visible:outline-2 focus-visible:outline-white/60"
            style={{
              backgroundColor: 'var(--sc-row-active-bg)',
              color: 'var(--sc-text)',
              border: '1px solid var(--sc-border-active)',
            }}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Відкрити меню</span>
          </button>
        </div>
      ) : (
        <div
          data-testid="startup-app-list"
          className="sc-scroll max-h-[344px] space-y-2.5 overflow-y-auto pr-1 pb-0.5"
        >
          {apps.map((app) => (
            <AppRow key={app.id} app={app} onToggle={onToggleApp} />
          ))}
        </div>
      )}

      {/* Semantic status message area */}
      {feedback && (
        <div
          role="status"
          aria-live="polite"
          data-testid="status-feedback"
          className="mt-3.5 flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-[12.5px] leading-snug"
          style={{
            backgroundColor:
              feedback.kind === 'success'
                ? 'var(--sc-accent-soft)'
                : feedback.kind === 'warning'
                  ? 'rgba(217, 160, 54, 0.14)'
                  : 'var(--sc-row-inactive-bg)',
            border:
              feedback.kind === 'warning'
                ? '1px solid rgba(226, 177, 78, 0.32)'
                : '1px solid var(--sc-border)',
            color:
              feedback.kind === 'muted'
                ? 'var(--sc-text-muted)'
                : 'var(--sc-text)',
          }}
        >
          {feedback.kind === 'success' && (
            <CheckCircle2
              className="h-4 w-4 shrink-0"
              style={{ color: 'var(--sc-accent)' }}
              aria-hidden="true"
            />
          )}
          {feedback.kind === 'warning' && (
            <AlertCircle
              className="h-4 w-4 shrink-0 text-[#e8b85c]"
              aria-hidden="true"
            />
          )}
          {feedback.kind === 'muted' && (
            <MinusCircle
              className="h-4 w-4 shrink-0"
              style={{ color: 'var(--sc-text-muted)' }}
              aria-hidden="true"
            />
          )}
          <span className="break-words">{feedback.message}</span>
        </div>
      )}

      {/* Bottom hairline divider + action bar */}
      <div
        className="mt-4 flex flex-col-reverse gap-2.5 pt-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
        style={{ borderTop: '1px solid var(--sc-border-subtle)' }}
      >
        <button
          type="button"
          onClick={onSkipAll}
          className="w-full rounded-full px-5 py-2.5 text-center text-[13.5px] font-medium whitespace-nowrap transition-colors duration-150 hover:brightness-110 focus-visible:outline-2 focus-visible:outline-white/60 sm:w-auto"
          style={{
            backgroundColor: 'var(--sc-control-bg)',
            color: 'var(--sc-text)',
            border: '1px solid var(--sc-border)',
          }}
        >
          Пропустити все
        </button>

        <button
          type="button"
          disabled={isEmpty}
          onClick={onLaunchSelected}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-2.5 text-[13.5px] font-semibold whitespace-nowrap tabular-nums transition-all duration-150 hover:brightness-95 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70 disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto"
          style={{
            backgroundColor: 'var(--sc-accent)',
            color: 'var(--sc-accent-fg)',
          }}
        >
          <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
          <span>Запустити обрані ({selectedCount})</span>
        </button>
      </div>
    </section>
  );
}
