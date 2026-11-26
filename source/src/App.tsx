/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { isNativeDesktop, systemAdapter, windowControls } from './adapters/systemAdapter';
import { DesktopBackdrop } from './components/DesktopBackdrop';
import { InterceptView } from './components/InterceptView';
import { LaunchView } from './components/LaunchView';
import { MenuDrawer } from './components/MenuDrawer';
import { WindowHeader } from './components/WindowHeader';
import type {
  AccentColor,
  AutostartCandidate,
  BaseWindowColor,
  MainTab,
  PresetApp,
  StartupApp,
  StatusFeedback,
  ThemeConfig,
} from './types/startup';
import {
  buildLaunchFeedback,
  buildSkipFeedback,
  createStartupApp,
  getSelectedApps,
  inferIconForName,
  removeAppById,
  toggleAllApps,
  toggleAppSelection,
} from './utils/startupState';
import {
  buildThemeCssVariables,
  clampThemeConfig,
  DEFAULT_THEME_CONFIG,
} from './utils/theme';

export default function App() {
  const native = isNativeDesktop();

  const [apps, setApps] = useState<StartupApp[]>(() =>
    systemAdapter.loadControlledApps(),
  );
  const [theme, setTheme] = useState<ThemeConfig>(() =>
    systemAdapter.loadTheme(),
  );
  const [activeTab, setActiveTab] = useState<MainTab>('launch');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [feedback, setFeedback] = useState<StatusFeedback | null>(null);

  const [candidates, setCandidates] = useState<AutostartCandidate[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [busyCandidateId, setBusyCandidateId] = useState<string | null>(null);
  const [interceptFeedback, setInterceptFeedback] = useState<StatusFeedback | null>(null);

  useEffect(() => {
    systemAdapter.saveControlledApps(apps);
  }, [apps]);

  useEffect(() => {
    systemAdapter.saveTheme(theme);
  }, [theme]);

  // Sync real Windows Form.Opacity whenever opacity slider changes
  useEffect(() => {
    if (!native) return;
    windowControls.setOpacity(theme.base.opacity);
  }, [native, theme.base.opacity]);

  const refreshAutostart = useCallback(
    async (showFeedback: boolean) => {
      if (!native) return;
      setIsScanning(true);
      try {
        const scanned = await systemAdapter.scanAutostartCandidates();
        setCandidates(scanned);

        // Keep already-intercepted apps synced in the controlled Launch list
        const interceptedItems = scanned.filter((c) => c.isIntercepted);
        if (interceptedItems.length > 0) {
          setApps((prev) => {
            let changed = false;
            const next = [...prev];
            for (const item of interceptedItems) {
              const existingIdx = next.findIndex(
                (a) =>
                  a.id === item.id ||
                  a.name.trim().toLowerCase() === item.name.trim().toLowerCase(),
              );
              if (existingIdx === -1) {
                next.push({
                  id: item.id,
                  name: item.name,
                  source: item.source,
                  command: item.command,
                  icon: inferIconForName(item.name),
                  selected: true,
                });
                changed = true;
              } else if (next[existingIdx].command !== item.command && item.command) {
                next[existingIdx] = {
                  ...next[existingIdx],
                  id: item.id,
                  command: item.command,
                };
                changed = true;
              }
            }
            return changed ? next : prev;
          });
        }

        if (showFeedback) {
          const activeCount = scanned.filter((c) => !c.isIntercepted).length;
          const interceptedCount = interceptedItems.length;
          const now = Date.now();
          setInterceptFeedback({
            kind: activeCount > 0 ? 'success' : 'muted',
            message: `Оновлено: активних у Windows — ${activeCount}, перехоплено — ${interceptedCount}.`,
            timestamp: now,
          });
          setFeedback({
            kind: activeCount > 0 ? 'success' : 'muted',
            message:
              activeCount > 0
                ? `Оновлено: знайдено ${activeCount} прогр. в автозавантаженні Windows. Відкрий «Перехоплення», щоб додати їх.`
                : 'Оновлено: нових програм в автозавантаженні Windows не знайдено.',
            timestamp: now,
          });
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Помилка сканування автозапуску.';
        const errFeedback: StatusFeedback = {
          kind: 'warning',
          message: msg,
          timestamp: Date.now(),
        };
        setInterceptFeedback(errFeedback);
        if (showFeedback) setFeedback(errFeedback);
      } finally {
        setIsScanning(false);
      }
    },
    [native],
  );

  // Initial scan on startup in native mode
  useEffect(() => {
    if (!native) return;
    void refreshAutostart(false);
  }, [native, refreshAutostart]);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMenuOpen]);

  const cssVariables = useMemo(() => {
    const vars = buildThemeCssVariables(theme);
    if (native) {
      // Real see-through transparency is handled by Windows Form.Opacity,
      // so keep the root surface color solid instead of blending into black.
      const { hue: bh, saturation: bs, lightness: bl } = clampThemeConfig(theme).base;
      vars['--sc-window-bg'] = `hsl(${bh}, ${bs}%, ${bl}%)`;
      vars['--sc-panel-bg'] = `hsl(${bh}, ${bs}%, ${Math.max(5, bl - 2)}%)`;
    }
    return vars as CSSProperties;
  }, [theme, native]);

  const pendingInterceptCount = useMemo(
    () => candidates.filter((c) => !c.isIntercepted).length,
    [candidates],
  );

  const handleToggleApp = (id: string) => {
    setApps((prev) => toggleAppSelection(prev, id));
    setFeedback(null);
  };

  const handleToggleAll = () => {
    setApps((prev) => toggleAllApps(prev));
    setFeedback(null);
  };

  const handleLaunchSelected = async () => {
    const selected = getSelectedApps(apps);
    if (selected.length > 0) {
      await systemAdapter.launchSelectedApps(apps);
    }
    setFeedback(buildLaunchFeedback(selected));
  };

  const handleSkipAll = async () => {
    await systemAdapter.skipSession();
    setFeedback(buildSkipFeedback());
  };

  const handleInterceptCandidate = async (candidate: AutostartCandidate) => {
    setBusyCandidateId(candidate.id);
    setInterceptFeedback(null);
    try {
      const res = await systemAdapter.interceptAutostartEntry(candidate.id);
      if (!res.ok) {
        setInterceptFeedback({
          kind: 'warning',
          message: res.error ?? `Не вдалося перехопити «${candidate.name}».`,
          timestamp: Date.now(),
        });
        return;
      }

      const finalCommand = res.command ?? candidate.command;
      const finalName = res.name ?? candidate.name;
      const finalSource = res.source ?? candidate.source;

      setApps((prev) => {
        const idx = prev.findIndex(
          (a) =>
            a.id === candidate.id ||
            a.name.trim().toLowerCase() === finalName.trim().toLowerCase(),
        );
        const entry: StartupApp = {
          id: candidate.id,
          name: finalName,
          source: finalSource,
          command: finalCommand,
          icon: inferIconForName(finalName),
          selected: true,
        };
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = entry;
          return copy;
        }
        return [...prev, entry];
      });

      await refreshAutostart(false);
      setInterceptFeedback({
        kind: 'success',
        message: `«${finalName}» перехоплено та додано до «Запуск зараз».`,
        timestamp: Date.now(),
      });
    } catch (err) {
      setInterceptFeedback({
        kind: 'warning',
        message: err instanceof Error ? err.message : 'Помилка перехоплення.',
        timestamp: Date.now(),
      });
    } finally {
      setBusyCandidateId(null);
    }
  };

  const handleRestoreCandidate = async (candidate: AutostartCandidate) => {
    setBusyCandidateId(candidate.id);
    setInterceptFeedback(null);
    try {
      const res = await systemAdapter.restoreAutostartEntry(
        candidate.id,
        candidate.command,
      );
      if (!res.ok) {
        setInterceptFeedback({
          kind: 'warning',
          message: res.error ?? `Не вдалося повернути «${candidate.name}».`,
          timestamp: Date.now(),
        });
        return;
      }

      setApps((prev) =>
        prev.filter(
          (a) =>
            a.id !== candidate.id &&
            a.name.trim().toLowerCase() !== candidate.name.trim().toLowerCase(),
        ),
      );

      await refreshAutostart(false);
      setInterceptFeedback({
        kind: 'success',
        message: `«${candidate.name}» повернуто в автозапуск Windows.`,
        timestamp: Date.now(),
      });
    } catch (err) {
      setInterceptFeedback({
        kind: 'warning',
        message: err instanceof Error ? err.message : 'Помилка відновлення.',
        timestamp: Date.now(),
      });
    } finally {
      setBusyCandidateId(null);
    }
  };

  const handleAddCustomApp = (name: string, command: string) => {
    const result = createStartupApp(apps, {
      name,
      command,
      source: 'Вручну',
      selected: true,
    });
    if (result.ok && result.app) {
      setApps((prev) => [...prev, result.app!]);
      setFeedback(null);
    }
    return { ok: result.ok, error: result.error };
  };

  const handleAddPresetApp = (preset: PresetApp) => {
    const result = createStartupApp(apps, {
      name: preset.name,
      command: preset.command,
      source: preset.source,
      icon: preset.icon,
      selected: true,
    });
    if (result.ok && result.app) {
      setApps((prev) => [...prev, result.app!]);
      setFeedback(null);
    }
  };

  const handleRemoveApp = (id: string) => {
    setApps((prev) => removeAppById(prev, id));
    setFeedback(null);
  };

  const handleUpdateBaseColor = (patch: Partial<BaseWindowColor>) => {
    setTheme((prev) =>
      clampThemeConfig({
        ...prev,
        base: { ...prev.base, ...patch },
      }),
    );
  };

  const handleUpdateAccentColor = (patch: Partial<AccentColor>) => {
    setTheme((prev) =>
      clampThemeConfig({
        ...prev,
        accent: { ...prev.accent, ...patch },
      }),
    );
  };

  const handleResetColors = () => {
    setTheme(clampThemeConfig(DEFAULT_THEME_CONFIG));
  };

  if (native) {
    return (
      <div
        style={{
          ...cssVariables,
          backgroundColor: 'var(--sc-window-bg)',
        }}
        className="relative flex h-screen w-screen flex-col overflow-hidden rounded-none transition-[background-color] duration-150"
      >
        <WindowHeader
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            setFeedback(null);
            if (tab === 'intercept') {
              void refreshAutostart(false);
            }
          }}
          isMenuOpen={isMenuOpen}
          onToggleMenu={() => setIsMenuOpen((prev) => !prev)}
          pendingInterceptCount={pendingInterceptCount}
        />

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <div
            className="h-full rounded-xl p-4 sm:p-5"
            style={{
              backgroundColor: 'var(--sc-inner-bg)',
              border: '1px solid var(--sc-border-subtle)',
            }}
          >
            {activeTab === 'launch' ? (
              <LaunchView
                apps={apps}
                feedback={feedback}
                isRefreshing={isScanning}
                onRefresh={() => void refreshAutostart(true)}
                onToggleApp={handleToggleApp}
                onToggleAll={handleToggleAll}
                onLaunchSelected={handleLaunchSelected}
                onSkipAll={handleSkipAll}
                onOpenMenu={() => setIsMenuOpen(true)}
              />
            ) : (
              <InterceptView
                candidates={candidates}
                isScanning={isScanning}
                busyId={busyCandidateId}
                feedback={interceptFeedback}
                onRefresh={() => void refreshAutostart(true)}
                onIntercept={(c) => void handleInterceptCandidate(c)}
                onRestore={(c) => void handleRestoreCandidate(c)}
              />
            )}
          </div>
        </div>

        <MenuDrawer
          isOpen={isMenuOpen}
          apps={apps}
          theme={theme}
          onClose={() => setIsMenuOpen(false)}
          onAddCustomApp={handleAddCustomApp}
          onAddPresetApp={handleAddPresetApp}
          onRemoveApp={handleRemoveApp}
          onUpdateBaseColor={handleUpdateBaseColor}
          onUpdateAccentColor={handleUpdateAccentColor}
          onResetColors={handleResetColors}
        />
      </div>
    );
  }

  return (
    <div
      style={cssVariables}
      className="relative flex min-h-screen w-full items-center justify-center overflow-x-hidden px-3 py-6 sm:px-6"
    >
      <DesktopBackdrop />

      {/* Centered desktop utility stage (companion menu appears cleanly beside main window on desktop) */}
      <div className="relative z-10 flex w-full max-w-[976px] items-center justify-center gap-4">
        <main
          data-testid="startup-window"
          className="w-full max-w-[560px] rounded-2xl shadow-[0_28px_72px_rgba(0,0,0,0.62)] transition-[background-color,border-color] duration-150"
          style={{
            backgroundColor: 'var(--sc-window-bg)',
            backdropFilter: 'blur(24px) saturate(120%)',
            WebkitBackdropFilter: 'blur(24px) saturate(120%)',
            border: '1px solid var(--sc-border)',
          }}
        >
          <WindowHeader
            activeTab={activeTab}
            onTabChange={(tab) => {
              setActiveTab(tab);
              setFeedback(null);
            }}
            isMenuOpen={isMenuOpen}
            onToggleMenu={() => setIsMenuOpen((prev) => !prev)}
            pendingInterceptCount={pendingInterceptCount}
          />

          {/* Recessed inner smoked-glass container matching the Windows 11 mockup */}
          <div className="px-3.5 pb-3.5 sm:px-4 sm:pb-4">
            <div
              className="rounded-xl p-4 sm:p-5"
              style={{
                backgroundColor: 'var(--sc-inner-bg)',
                border: '1px solid var(--sc-border-subtle)',
              }}
            >
              {activeTab === 'launch' ? (
                <LaunchView
                  apps={apps}
                  feedback={feedback}
                  onToggleApp={handleToggleApp}
                  onToggleAll={handleToggleAll}
                  onLaunchSelected={handleLaunchSelected}
                  onSkipAll={handleSkipAll}
                  onOpenMenu={() => setIsMenuOpen(true)}
                />
              ) : (
                <InterceptView
                  candidates={candidates}
                  isScanning={isScanning}
                  busyId={busyCandidateId}
                  feedback={interceptFeedback}
                  onRefresh={() => void refreshAutostart(true)}
                  onIntercept={(c) => void handleInterceptCandidate(c)}
                  onRestore={(c) => void handleRestoreCandidate(c)}
                />
              )}
            </div>
          </div>
        </main>

        <MenuDrawer
          isOpen={isMenuOpen}
          apps={apps}
          theme={theme}
          onClose={() => setIsMenuOpen(false)}
          onAddCustomApp={handleAddCustomApp}
          onAddPresetApp={handleAddPresetApp}
          onRemoveApp={handleRemoveApp}
          onUpdateBaseColor={handleUpdateBaseColor}
          onUpdateAccentColor={handleUpdateAccentColor}
          onResetColors={handleResetColors}
        />
      </div>
    </div>
  );
}
