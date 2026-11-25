import {
  AlertCircle,
  CheckCircle2,
  FolderCog,
  HardDrive,
  RefreshCw,
  RotateCcw,
  Shield,
  ShieldCheck,
} from 'lucide-react';
import type { AutostartCandidate, StatusFeedback } from '../types/startup';

interface InterceptViewProps {
  candidates: AutostartCandidate[];
  isScanning: boolean;
  busyId: string | null;
  feedback: StatusFeedback | null;
  onRefresh: () => void;
  onIntercept: (candidate: AutostartCandidate) => void;
  onRestore: (candidate: AutostartCandidate) => void;
}

export function InterceptView({
  candidates,
  isScanning,
  busyId,
  feedback,
  onRefresh,
  onIntercept,
  onRestore,
}: InterceptViewProps) {
  const activeWindows = candidates.filter((c) => !c.isIntercepted);
  const intercepted = candidates.filter((c) => c.isIntercepted);

  return (
    <section
      aria-label="Перехоплення системного автозапуску"
      className="flex h-full flex-col"
    >
      {/* Top header + Refresh button */}
      <div className="mb-3 flex items-center justify-between gap-3 px-0.5">
        <div className="min-w-0">
          <p
            className="text-[13px] font-medium leading-snug"
            style={{ color: 'var(--sc-text)' }}
          >
            Автозапуск Windows (Startup та Реєстр Run)
          </p>
          <p
            className="mt-0.5 text-[11.5px] leading-snug"
            style={{ color: 'var(--sc-text-muted)' }}
          >
            Перехоплені програми прибираються з автостарту Windows і переносяться у «Запуск зараз».
          </p>
        </div>

        <button
          type="button"
          disabled={isScanning}
          onClick={onRefresh}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium whitespace-nowrap transition-colors duration-150 hover:brightness-115 focus-visible:outline-2 focus-visible:outline-white/60 disabled:opacity-60"
          style={{
            backgroundColor: 'var(--sc-control-bg)',
            color: 'var(--sc-text)',
            border: '1px solid var(--sc-border)',
          }}
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${isScanning ? 'animate-spin' : ''}`}
            aria-hidden="true"
          />
          <span>Оновити</span>
        </button>
      </div>

      {/* Scanned lists */}
      <div className="sc-scroll flex-1 space-y-3 overflow-y-auto pr-1 pb-0.5">
        {candidates.length === 0 ? (
          <div
            className="flex min-h-[214px] flex-col items-center justify-center rounded-xl px-6 py-8 text-center"
            style={{
              backgroundColor: 'var(--sc-row-inactive-bg)',
              border: '1px solid var(--sc-border-subtle)',
            }}
          >
            <ShieldCheck
              className="mb-3 h-7 w-7 opacity-65"
              style={{ color: 'var(--sc-accent)' }}
              aria-hidden="true"
            />
            <p
              className="text-[14px] font-medium"
              style={{ color: 'var(--sc-text)' }}
            >
              {isScanning ? 'Сканування автозапуску...' : 'Записів автозапуску не знайдено'}
            </p>
            <p
              className="mt-1 max-w-[340px] text-[12px] leading-relaxed"
              style={{ color: 'var(--sc-text-muted)' }}
            >
              Якщо ти щойно додав ярлик у папку автозавантаження (shell:startup) — натисни «Оновити».
            </p>
          </div>
        ) : (
          <>
            {/* Active in Windows autostart */}
            {activeWindows.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-0.5 text-[11.5px]">
                  <span style={{ color: 'var(--sc-text-muted)' }}>
                    Запускаються самі в Windows
                  </span>
                  <span
                    className="font-mono tabular-nums"
                    style={{ color: 'var(--sc-text-dim)' }}
                  >
                    {activeWindows.length}
                  </span>
                </div>

                <div className="space-y-2">
                  {activeWindows.map((item) => {
                    const isBusy = busyId === item.id;
                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5"
                        style={{
                          backgroundColor: 'var(--sc-row-active-bg)',
                          border: item.reappeared
                            ? '1px solid rgba(232, 184, 92, 0.45)'
                            : '1px solid var(--sc-border-subtle)',
                        }}
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          {item.source === 'Startup' ? (
                            <FolderCog
                              className="h-4 w-4 shrink-0"
                              style={{ color: 'var(--sc-accent)' }}
                              aria-hidden="true"
                            />
                          ) : (
                            <HardDrive
                              className="h-4 w-4 shrink-0"
                              style={{ color: 'var(--sc-accent)' }}
                              aria-hidden="true"
                            />
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p
                                className="truncate text-[13px] font-medium"
                                style={{ color: 'var(--sc-text)' }}
                              >
                                {item.name}
                              </p>
                              {item.reappeared && (
                                <span className="rounded px-1.5 py-0.5 text-[10px] font-medium text-[#e8b85c] bg-[#e8b85c]/15 whitespace-nowrap">
                                  Знову в автозапуску
                                </span>
                              )}
                            </div>
                            <p
                              className="truncate text-[11px]"
                              title={item.command}
                              style={{ color: 'var(--sc-text-muted)' }}
                            >
                              {item.source} · {item.command}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => onIntercept(item)}
                          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold whitespace-nowrap transition-all duration-150 hover:brightness-95 disabled:opacity-50"
                          style={{
                            backgroundColor: 'var(--sc-accent)',
                            color: 'var(--sc-accent-fg)',
                          }}
                        >
                          <Shield className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>{isBusy ? '...' : 'Перехопити'}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Already intercepted */}
            {intercepted.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-0.5 text-[11.5px]">
                  <span style={{ color: 'var(--sc-text-muted)' }}>
                    Під контролем Startup Catcher
                  </span>
                  <span
                    className="font-mono tabular-nums"
                    style={{ color: 'var(--sc-text-dim)' }}
                  >
                    {intercepted.length}
                  </span>
                </div>

                <div className="space-y-2">
                  {intercepted.map((item) => {
                    const isBusy = busyId === item.id;
                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5"
                        style={{
                          backgroundColor: 'var(--sc-row-inactive-bg)',
                          border: '1px solid var(--sc-border-subtle)',
                        }}
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <ShieldCheck
                            className="h-4 w-4 shrink-0"
                            style={{ color: 'var(--sc-accent)' }}
                            aria-hidden="true"
                          />
                          <div className="min-w-0">
                            <p
                              className="truncate text-[13px] font-medium"
                              style={{ color: 'var(--sc-text)' }}
                            >
                              {item.name}
                            </p>
                            <p
                              className="truncate text-[11px]"
                              title={item.command}
                              style={{ color: 'var(--sc-text-dim)' }}
                            >
                              Перехоплено ({item.source})
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => onRestore(item)}
                          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium whitespace-nowrap transition-colors duration-150 hover:brightness-115 disabled:opacity-50"
                          style={{
                            backgroundColor: 'var(--sc-control-bg)',
                            color: 'var(--sc-text)',
                            border: '1px solid var(--sc-border)',
                          }}
                        >
                          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>{isBusy ? '...' : 'Повернути'}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Feedback bar */}
      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className="mt-3 flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-[12px] leading-snug"
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
          <span className="break-words">{feedback.message}</span>
        </div>
      )}
    </section>
  );
}
