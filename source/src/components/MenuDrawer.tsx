import { useState, type FormEvent } from 'react';
import { Check, Plus, RotateCcw, Trash2, X } from 'lucide-react';
import type { AccentColor, BaseWindowColor, PresetApp, StartupApp, ThemeConfig } from '../types/startup';
import { hasAppWithName, PRESET_APPS } from '../utils/startupState';
import { ACCENT_LIMITS, BASE_LIMITS, isThemeDefault } from '../utils/theme';
import { AppIcon } from './AppIcon';
import { ColorSlider } from './ColorSlider';

interface MenuDrawerProps {
  isOpen: boolean;
  apps: StartupApp[];
  theme: ThemeConfig;
  onClose: () => void;
  onAddCustomApp: (name: string, command: string) => { ok: boolean; error?: string };
  onAddPresetApp: (preset: PresetApp) => void;
  onRemoveApp: (id: string) => void;
  onUpdateBaseColor: (patch: Partial<BaseWindowColor>) => void;
  onUpdateAccentColor: (patch: Partial<AccentColor>) => void;
  onResetColors: () => void;
}

const HUE_GRADIENT =
  'linear-gradient(90deg, hsl(0, 58%, 52%), hsl(60, 58%, 52%), hsl(120, 52%, 48%), hsl(180, 55%, 48%), hsl(240, 58%, 58%), hsl(300, 55%, 54%), hsl(360, 58%, 52%))';

export function MenuDrawer({
  isOpen,
  apps,
  theme,
  onClose,
  onAddCustomApp,
  onAddPresetApp,
  onRemoveApp,
  onUpdateBaseColor,
  onUpdateAccentColor,
  onResetColors,
}: MenuDrawerProps) {
  const [appName, setAppName] = useState('');
  const [appCommand, setAppCommand] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const { base, accent } = theme;
  const isDefaultTheme = isThemeDefault(theme);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = onAddCustomApp(appName, appCommand);
    if (!result.ok) {
      setFormError(result.error ?? 'Не вдалося додати програму.');
      return;
    }
    setAppName('');
    setAppCommand('');
    setFormError(null);
  };

  return (
    <>
      {/* Mobile / narrow viewport scrim */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-0 z-20 bg-black/50 backdrop-blur-[2px] lg:hidden"
      />

      <aside
        id="startup-catcher-menu"
        aria-label="Меню керування програмами та кольорами вікна"
        className="fixed inset-x-3 bottom-3 top-3 z-30 flex flex-col overflow-hidden rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.62)] lg:static lg:inset-auto lg:z-10 lg:max-h-[min(700px,calc(100vh-48px))] lg:w-[392px] lg:shrink-0"
        style={{
          backgroundColor: 'var(--sc-panel-bg)',
          backdropFilter: 'blur(24px) saturate(120%)',
          WebkitBackdropFilter: 'blur(24px) saturate(120%)',
          border: '1px solid var(--sc-border)',
        }}
      >
        {/* Drawer header */}
        <div
          className="flex items-center justify-between gap-3 px-4 py-3.5"
          style={{ borderBottom: '1px solid var(--sc-border-subtle)' }}
        >
          <h2
            className="text-[14px] font-semibold tracking-[-0.01em]"
            style={{ color: 'var(--sc-text)' }}
          >
            Меню налаштувань
          </h2>
          <button
            type="button"
            aria-label="Закрити меню"
            onClick={onClose}
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg transition-colors duration-150 hover:brightness-125 focus-visible:outline-2 focus-visible:outline-white/60"
            style={{
              backgroundColor: 'var(--sc-inner-bg)',
              color: 'var(--sc-text-muted)',
              border: '1px solid var(--sc-border-subtle)',
            }}
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>

        {/* Scrollable content with both sections */}
        <div className="sc-scroll flex-1 space-y-5 overflow-y-auto px-4 py-4">
          {/* SECTION 1: App Management */}
          <section aria-labelledby="menu-section-apps" className="space-y-3.5">
            <h3
              id="menu-section-apps"
              className="text-[13px] font-semibold"
              style={{ color: 'var(--sc-text)' }}
            >
              Керування програмами
            </h3>

            {/* Add custom app form */}
            <form onSubmit={handleSubmit} noValidate className="space-y-2.5">
              <div className="space-y-1.5">
                <label
                  htmlFor="sc-new-app-name"
                  className="block text-[12px] font-medium"
                  style={{ color: 'var(--sc-text-muted)' }}
                >
                  Назва програми
                </label>
                <input
                  id="sc-new-app-name"
                  type="text"
                  value={appName}
                  onChange={(e) => {
                    setAppName(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  placeholder="Наприклад, Notion"
                  maxLength={48}
                  className="w-full rounded-lg px-3 py-2 text-[13px] outline-none transition-colors placeholder:text-white/35 focus:border-white/30"
                  style={{
                    backgroundColor: 'var(--sc-inner-bg)',
                    color: 'var(--sc-text)',
                    border: '1px solid var(--sc-border)',
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="sc-new-app-command"
                  className="block text-[12px] font-medium"
                  style={{ color: 'var(--sc-text-muted)' }}
                >
                  Шлях або команда (необов’язково)
                </label>
                <input
                  id="sc-new-app-command"
                  type="text"
                  value={appCommand}
                  onChange={(e) => setAppCommand(e.target.value)}
                  placeholder="C:\Program Files\...\app.exe"
                  className="w-full rounded-lg px-3 py-2 font-mono text-[11.5px] outline-none transition-colors placeholder:font-sans placeholder:text-white/35 focus:border-white/30"
                  style={{
                    backgroundColor: 'var(--sc-inner-bg)',
                    color: 'var(--sc-text)',
                    border: '1px solid var(--sc-border)',
                  }}
                />
              </div>

              {formError && (
                <p
                  role="alert"
                  className="text-[12px] text-[#f0b45b]"
                >
                  {formError}
                </p>
              )}

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-[12.5px] font-semibold transition-all duration-150 hover:brightness-95 focus-visible:outline-2 focus-visible:outline-white/70"
                style={{
                  backgroundColor: 'var(--sc-accent)',
                  color: 'var(--sc-accent-fg)',
                }}
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Додати до списку</span>
              </button>
            </form>

            {/* Quick presets */}
            <div className="space-y-2">
              <p
                className="text-[12px] font-medium"
                style={{ color: 'var(--sc-text-muted)' }}
              >
                Швидке додавання
              </p>
              <div className="flex flex-wrap gap-2">
                {PRESET_APPS.map((preset) => {
                  const alreadyAdded = hasAppWithName(apps, preset.name);
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      disabled={alreadyAdded}
                      onClick={() => onAddPresetApp(preset)}
                      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium whitespace-nowrap transition-colors duration-150 hover:brightness-115 focus-visible:outline-2 focus-visible:outline-white/60 disabled:cursor-default disabled:opacity-50"
                      style={{
                        backgroundColor: 'var(--sc-inner-bg)',
                        color: 'var(--sc-text)',
                        border: '1px solid var(--sc-border-subtle)',
                      }}
                    >
                      {alreadyAdded ? (
                        <Check className="h-3 w-3" aria-hidden="true" />
                      ) : (
                        <Plus className="h-3 w-3" aria-hidden="true" />
                      )}
                      <span>{preset.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active controlled list with delete buttons */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[12px]">
                <span style={{ color: 'var(--sc-text-muted)' }}>
                  У списку автозапуску
                </span>
                <span
                  className="font-mono text-[11.5px] tabular-nums"
                  style={{ color: 'var(--sc-text-dim)' }}
                >
                  {apps.length}
                </span>
              </div>

              {apps.length === 0 ? (
                <p
                  className="rounded-lg px-3 py-2.5 text-[12px]"
                  style={{
                    backgroundColor: 'var(--sc-inner-bg)',
                    color: 'var(--sc-text-dim)',
                    border: '1px solid var(--sc-border-subtle)',
                  }}
                >
                  Поки немає жодної програми.
                </p>
              ) : (
                <ul
                  className="sc-scroll max-h-[156px] divide-y overflow-y-auto rounded-lg"
                  style={{
                    backgroundColor: 'var(--sc-inner-bg)',
                    border: '1px solid var(--sc-border-subtle)',
                  }}
                >
                  {apps.map((app) => (
                    <li
                      key={app.id}
                      className="flex items-center justify-between gap-2 px-3 py-2"
                      style={{ borderColor: 'var(--sc-border-subtle)' }}
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <AppIcon
                          icon={app.icon}
                          className="h-4 w-4 shrink-0 opacity-80"
                        />
                        <div className="min-w-0">
                          <p
                            className="truncate text-[12.5px] font-medium"
                            style={{ color: 'var(--sc-text)' }}
                          >
                            {app.name}
                          </p>
                          <p
                            className="truncate text-[11px]"
                            style={{ color: 'var(--sc-text-dim)' }}
                          >
                            {app.source}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        aria-label={`Видалити ${app.name}`}
                        onClick={() => onRemoveApp(app.id)}
                        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-white/55 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-white/60"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* Divider between sections */}
          <hr
            className="border-0 border-t"
            style={{ borderColor: 'var(--sc-border-subtle)' }}
          />

          {/* SECTION 2: Live Color & Transparency Sliders */}
          <section aria-labelledby="menu-section-colors" className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3
                id="menu-section-colors"
                className="text-[13px] font-semibold"
                style={{ color: 'var(--sc-text)' }}
              >
                Колір та прозорість вікна
              </h3>
              <button
                type="button"
                disabled={isDefaultTheme}
                onClick={onResetColors}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11.5px] font-medium whitespace-nowrap transition-colors duration-150 hover:brightness-115 focus-visible:outline-2 focus-visible:outline-white/60 disabled:cursor-default disabled:opacity-45"
                style={{
                  backgroundColor: 'var(--sc-inner-bg)',
                  color: 'var(--sc-text)',
                  border: '1px solid var(--sc-border-subtle)',
                }}
              >
                <RotateCcw className="h-3 w-3" aria-hidden="true" />
                <span>Скинути кольори</span>
              </button>
            </div>

            {/* Base Window Color group */}
            <div
              className="space-y-3 rounded-xl p-3.5"
              style={{
                backgroundColor: 'var(--sc-inner-bg)',
                border: '1px solid var(--sc-border-subtle)',
              }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="text-[12.5px] font-semibold"
                  style={{ color: 'var(--sc-text)' }}
                >
                  Основний колір вікна
                </span>
                <span
                  aria-hidden="true"
                  className="relative h-4 w-7 overflow-hidden rounded border border-white/20"
                  style={{
                    backgroundImage:
                      'linear-gradient(45deg, rgba(255,255,255,0.22) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.22) 75%), linear-gradient(45deg, rgba(255,255,255,0.22) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.22) 75%)',
                    backgroundSize: '8px 8px',
                    backgroundPosition: '0 0, 4px 4px',
                  }}
                >
                  <span
                    className="absolute inset-0"
                    style={{
                      backgroundColor: `hsla(${base.hue}, ${base.saturation}%, ${base.lightness}%, ${base.opacity / 100})`,
                    }}
                  />
                </span>
              </div>

              <ColorSlider
                id="sc-base-hue"
                label="Відтінок (основний)"
                value={base.hue}
                min={BASE_LIMITS.hue.min}
                max={BASE_LIMITS.hue.max}
                unit="°"
                trackBackground={HUE_GRADIENT}
                onChange={(hue) => onUpdateBaseColor({ hue })}
              />

              <ColorSlider
                id="sc-base-saturation"
                label="Насиченість (основна)"
                value={base.saturation}
                min={BASE_LIMITS.saturation.min}
                max={BASE_LIMITS.saturation.max}
                unit="%"
                trackBackground={`linear-gradient(90deg, hsl(${base.hue}, 0%, ${Math.max(24, base.lightness)}%), hsl(${base.hue}, 100%, ${Math.max(24, base.lightness)}%))`}
                onChange={(saturation) => onUpdateBaseColor({ saturation })}
              />

              <ColorSlider
                id="sc-base-lightness"
                label="Яскравість (основна)"
                value={base.lightness}
                min={BASE_LIMITS.lightness.min}
                max={BASE_LIMITS.lightness.max}
                unit="%"
                trackBackground={`linear-gradient(90deg, hsl(${base.hue}, ${base.saturation}%, 5%), hsl(${base.hue}, ${base.saturation}%, 45%))`}
                onChange={(lightness) => onUpdateBaseColor({ lightness })}
              />

              <ColorSlider
                id="sc-base-opacity"
                label="Прозорість"
                value={base.opacity}
                min={BASE_LIMITS.opacity.min}
                max={BASE_LIMITS.opacity.max}
                unit="%"
                trackBackground={`linear-gradient(90deg, hsla(${base.hue}, ${base.saturation}%, ${Math.max(22, base.lightness)}%, 0.25), hsla(${base.hue}, ${base.saturation}%, ${Math.max(22, base.lightness)}%, 0.98))`}
                onChange={(opacity) => onUpdateBaseColor({ opacity })}
              />
            </div>

            {/* Accent Color group */}
            <div
              className="space-y-3 rounded-xl p-3.5"
              style={{
                backgroundColor: 'var(--sc-inner-bg)',
                border: '1px solid var(--sc-border-subtle)',
              }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="text-[12.5px] font-semibold"
                  style={{ color: 'var(--sc-text)' }}
                >
                  Акцентний колір
                </span>
                <span
                  aria-hidden="true"
                  className="h-4 w-7 rounded border border-white/20"
                  style={{
                    backgroundColor: `hsl(${accent.hue}, ${accent.saturation}%, ${accent.lightness}%)`,
                  }}
                />
              </div>

              <ColorSlider
                id="sc-accent-hue"
                label="Відтінок (акцент)"
                value={accent.hue}
                min={ACCENT_LIMITS.hue.min}
                max={ACCENT_LIMITS.hue.max}
                unit="°"
                trackBackground={HUE_GRADIENT}
                onChange={(hue) => onUpdateAccentColor({ hue })}
              />

              <ColorSlider
                id="sc-accent-saturation"
                label="Насиченість (акцент)"
                value={accent.saturation}
                min={ACCENT_LIMITS.saturation.min}
                max={ACCENT_LIMITS.saturation.max}
                unit="%"
                trackBackground={`linear-gradient(90deg, hsl(${accent.hue}, 0%, ${accent.lightness}%), hsl(${accent.hue}, 100%, ${accent.lightness}%))`}
                onChange={(saturation) => onUpdateAccentColor({ saturation })}
              />

              <ColorSlider
                id="sc-accent-lightness"
                label="Яскравість (акцент)"
                value={accent.lightness}
                min={ACCENT_LIMITS.lightness.min}
                max={ACCENT_LIMITS.lightness.max}
                unit="%"
                trackBackground={`linear-gradient(90deg, hsl(${accent.hue}, ${accent.saturation}%, 30%), hsl(${accent.hue}, ${accent.saturation}%, 90%))`}
                onChange={(lightness) => onUpdateAccentColor({ lightness })}
              />
            </div>
          </section>
        </div>
      </aside>
    </>
  );
}
