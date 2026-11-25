import type {
  AppIconId,
  AppSourceTag,
  PresetApp,
  StartupApp,
  StatusFeedback,
} from '../types/startup';

export const DEFAULT_APPS: StartupApp[] = [
  {
    id: 'app-telegram',
    name: 'Telegram Desktop',
    source: 'Реєстр Run',
    command: 'C:\\Users\\User\\AppData\\Roaming\\Telegram Desktop\\Telegram.exe -autostart',
    icon: 'telegram',
    selected: true,
  },
  {
    id: 'app-discord',
    name: 'Discord',
    source: 'Реєстр Run',
    command: 'C:\\Users\\User\\AppData\\Local\\Discord\\Update.exe --processStart Discord.exe',
    icon: 'discord',
    selected: true,
  },
  {
    id: 'app-steam',
    name: 'Steam',
    source: 'Реєстр Run',
    command: 'C:\\Program Files (x86)\\Steam\\steam.exe -silent',
    icon: 'steam',
    selected: false,
  },
];

export const PRESET_APPS: PresetApp[] = [
  {
    name: 'Obsidian',
    source: 'Startup',
    command: 'C:\\Users\\User\\AppData\\Local\\Obsidian\\Obsidian.exe',
    icon: 'obsidian',
  },
  {
    name: 'Spotify',
    source: 'Startup',
    command: 'C:\\Users\\User\\AppData\\Roaming\\Spotify\\Spotify.exe --minimized',
    icon: 'spotify',
  },
  {
    name: 'VS Code',
    source: 'Вручну',
    command: 'C:\\Users\\User\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe',
    icon: 'vscode',
  },
];

export function inferIconForName(name: string): AppIconId {
  const normalized = name.trim().toLowerCase();
  if (normalized.includes('telegram')) return 'telegram';
  if (normalized.includes('discord')) return 'discord';
  if (normalized.includes('steam')) return 'steam';
  if (normalized.includes('spotify')) return 'spotify';
  if (normalized.includes('obsidian')) return 'obsidian';
  if (normalized.includes('vs code') || normalized.includes('vscode') || normalized.includes('code')) {
    return 'vscode';
  }
  return 'custom';
}

export function normalizeAppName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

export function hasAppWithName(apps: StartupApp[], name: string): boolean {
  const target = normalizeAppName(name).toLowerCase();
  return apps.some((app) => normalizeAppName(app.name).toLowerCase() === target);
}

export interface AddAppValidationResult {
  ok: boolean;
  error?: string;
  app?: StartupApp;
}

export function createStartupApp(
  existingApps: StartupApp[],
  input: {
    name: string;
    command?: string;
    source?: AppSourceTag;
    icon?: AppIconId;
    selected?: boolean;
  },
  idFactory: () => string = () => `app-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
): AddAppValidationResult {
  const cleanName = normalizeAppName(input.name);
  if (!cleanName) {
    return { ok: false, error: 'Введіть назву програми.' };
  }
  if (cleanName.length > 48) {
    return { ok: false, error: 'Назва не повинна перевищувати 48 символів.' };
  }
  if (hasAppWithName(existingApps, cleanName)) {
    return { ok: false, error: `«${cleanName}» вже є у списку.` };
  }

  const cleanCommand = input.command?.trim() || undefined;
  const app: StartupApp = {
    id: idFactory(),
    name: cleanName,
    source: input.source ?? 'Вручну',
    command: cleanCommand,
    icon: input.icon ?? inferIconForName(cleanName),
    selected: input.selected ?? true,
  };

  return { ok: true, app };
}

export function toggleAppSelection(apps: StartupApp[], id: string): StartupApp[] {
  return apps.map((app) => (app.id === id ? { ...app, selected: !app.selected } : app));
}

export function areAllAppsSelected(apps: StartupApp[]): boolean {
  return apps.length > 0 && apps.every((app) => app.selected);
}

export function toggleAllApps(apps: StartupApp[]): StartupApp[] {
  if (apps.length === 0) return apps;
  const nextSelected = !areAllAppsSelected(apps);
  return apps.map((app) => ({ ...app, selected: nextSelected }));
}

export function removeAppById(apps: StartupApp[], id: string): StartupApp[] {
  return apps.filter((app) => app.id !== id);
}

export function getSelectedApps(apps: StartupApp[]): StartupApp[] {
  return apps.filter((app) => app.selected);
}

export function buildLaunchFeedback(
  selectedApps: StartupApp[],
  now: number = Date.now(),
): StatusFeedback {
  if (selectedApps.length === 0) {
    return {
      kind: 'warning',
      message: 'Нічого не обрано',
      timestamp: now,
    };
  }
  const names = selectedApps.map((app) => app.name).join(', ');
  return {
    kind: 'success',
    message: `Запущено: ${names}`,
    timestamp: now,
  };
}

export function buildSkipFeedback(now: number = Date.now()): StatusFeedback {
  return {
    kind: 'muted',
    message: 'Пропущено. Вікно закриється.',
    timestamp: now,
  };
}

export function sanitizeStoredApps(raw: unknown): StartupApp[] | null {
  if (!Array.isArray(raw)) return null;
  const validSources: AppSourceTag[] = ['Реєстр Run', 'Startup', 'Вручну', 'Планувальник'];
  const validIcons: AppIconId[] = [
    'telegram',
    'discord',
    'steam',
    'spotify',
    'obsidian',
    'vscode',
    'custom',
  ];

  const cleaned: StartupApp[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const record = item as Record<string, unknown>;
    if (typeof record.id !== 'string' || typeof record.name !== 'string') continue;
    const cleanName = normalizeAppName(record.name);
    if (!cleanName) continue;
    const source = validSources.includes(record.source as AppSourceTag)
      ? (record.source as AppSourceTag)
      : 'Вручну';
    const icon = validIcons.includes(record.icon as AppIconId)
      ? (record.icon as AppIconId)
      : inferIconForName(cleanName);

    cleaned.push({
      id: record.id,
      name: cleanName,
      source,
      command: typeof record.command === 'string' && record.command.trim() ? record.command.trim() : undefined,
      icon,
      selected: Boolean(record.selected),
    });
  }
  return cleaned;
}
