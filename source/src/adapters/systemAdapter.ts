import type {
  AppSourceTag,
  AutostartCandidate,
  InterceptActionResult,
  LaunchExecutionResult,
  StartupApp,
  ThemeConfig,
} from '../types/startup';
import { DEFAULT_APPS, sanitizeStoredApps } from '../utils/startupState';
import { clampThemeConfig, DEFAULT_THEME_CONFIG } from '../utils/theme';

const STORAGE_KEYS = {
  apps: 'startup_catcher.v1.apps',
  theme: 'startup_catcher.v1.theme',
} as const;

export interface SystemAdapter {
  loadControlledApps(): StartupApp[];
  saveControlledApps(apps: StartupApp[]): void;
  loadTheme(): ThemeConfig;
  saveTheme(theme: ThemeConfig): void;
  launchSelectedApps(apps: StartupApp[]): Promise<LaunchExecutionResult>;
  skipSession(): Promise<LaunchExecutionResult>;
  scanAutostartCandidates(): Promise<AutostartCandidate[]>;
  interceptAutostartEntry(appId: string): Promise<InterceptActionResult>;
  restoreAutostartEntry(appId: string, command?: string): Promise<InterceptActionResult>;
}

interface WebView2Bridge {
  postMessage(message: unknown): void;
  addEventListener(type: 'message', listener: (event: { data: unknown }) => void): void;
  removeEventListener(type: 'message', listener: (event: { data: unknown }) => void): void;
}

function getWebView(): WebView2Bridge | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { chrome?: { webview?: WebView2Bridge } };
  return w.chrome?.webview ?? null;
}

export function isNativeDesktop(): boolean {
  return getWebView() !== null;
}

export const windowControls = {
  minimize: () => invokeNative<{ ok: boolean }>('windowMinimize').catch(() => undefined),
  toggleMaximize: () => invokeNative<{ ok: boolean }>('windowMaximize').catch(() => undefined),
  close: () => invokeNative<{ ok: boolean }>('windowClose').catch(() => undefined),
  startDrag: () => invokeNative<{ ok: boolean }>('windowDrag').catch(() => undefined),
  setOpacity: (opacity: number) =>
    invokeNative<{ ok: boolean }>('setWindowOpacity', { opacity }).catch(() => undefined),
};

function invokeNative<T>(action: string, payload?: unknown): Promise<T> {
  const webview = getWebView();
  if (!webview) {
    return Promise.reject(new Error('WebView2 bridge unavailable'));
  }

  return new Promise<T>((resolve, reject) => {
    const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const timer = window.setTimeout(() => {
      webview.removeEventListener('message', onMessage);
      reject(new Error(`Native call timed out: ${action}`));
    }, 15000);

    function onMessage(event: { data: unknown }) {
      const data = event.data as { requestId?: string; result?: T; error?: string } | null;
      if (!data || data.requestId !== requestId) return;
      window.clearTimeout(timer);
      webview!.removeEventListener('message', onMessage);
      if (data.error) {
        reject(new Error(data.error));
      } else {
        resolve(data.result as T);
      }
    }

    webview.addEventListener('message', onMessage);
    webview.postMessage({ requestId, action, payload });
  });
}

function getStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    // Ignore storage access errors in restricted sandboxes
  }
  return null;
}

export class BrowserLocalSystemAdapter implements SystemAdapter {
  loadControlledApps(): StartupApp[] {
    const storage = getStorage();
    if (!storage) return DEFAULT_APPS.map((a) => ({ ...a }));

    try {
      const raw = storage.getItem(STORAGE_KEYS.apps);
      if (raw === null) {
        return DEFAULT_APPS.map((a) => ({ ...a }));
      }
      const parsed: unknown = JSON.parse(raw);
      const sanitized = sanitizeStoredApps(parsed);
      return sanitized ?? DEFAULT_APPS.map((a) => ({ ...a }));
    } catch {
      return DEFAULT_APPS.map((a) => ({ ...a }));
    }
  }

  saveControlledApps(apps: StartupApp[]): void {
    const storage = getStorage();
    if (!storage) return;
    try {
      storage.setItem(STORAGE_KEYS.apps, JSON.stringify(apps));
    } catch {
      // Ignore quota or privacy mode errors
    }
  }

  loadTheme(): ThemeConfig {
    const storage = getStorage();
    if (!storage) return clampThemeConfig(DEFAULT_THEME_CONFIG);

    try {
      const raw = storage.getItem(STORAGE_KEYS.theme);
      if (!raw) return clampThemeConfig(DEFAULT_THEME_CONFIG);
      const parsed = JSON.parse(raw) as Partial<ThemeConfig>;
      return clampThemeConfig(parsed);
    } catch {
      return clampThemeConfig(DEFAULT_THEME_CONFIG);
    }
  }

  saveTheme(theme: ThemeConfig): void {
    const storage = getStorage();
    if (!storage) return;
    try {
      storage.setItem(STORAGE_KEYS.theme, JSON.stringify(clampThemeConfig(theme)));
    } catch {
      // Ignore quota or privacy mode errors
    }
  }

  async launchSelectedApps(apps: StartupApp[]): Promise<LaunchExecutionResult> {
    const selected = apps.filter((app) => app.selected);
    if (getWebView()) {
      const res = await invokeNative<LaunchExecutionResult>('launchApps', {
        apps: selected.map((a) => ({ name: a.name, command: a.command ?? '' })),
      });
      return res;
    }
    return {
      launchedNames: selected.map((app) => app.name),
      skipped: false,
    };
  }

  async skipSession(): Promise<LaunchExecutionResult> {
    if (getWebView()) {
      return invokeNative<LaunchExecutionResult>('skipSession');
    }
    return {
      launchedNames: [],
      skipped: true,
    };
  }

  async scanAutostartCandidates(): Promise<AutostartCandidate[]> {
    if (getWebView()) {
      const raw = await invokeNative<
        Array<{
          id: string;
          name: string;
          source: string;
          command: string;
          isIntercepted?: boolean;
          reappeared?: boolean;
        }>
      >('scanAutostart');
      return raw.map((item) => ({
        id: item.id,
        name: item.name,
        source: (item.source === 'Startup' ? 'Startup' : 'Реєстр Run') as AppSourceTag,
        command: item.command,
        isIntercepted: Boolean(item.isIntercepted),
        reappeared: Boolean(item.reappeared),
      }));
    }
    return [];
  }

  async interceptAutostartEntry(appId: string): Promise<InterceptActionResult> {
    if (getWebView()) {
      return invokeNative<InterceptActionResult>('interceptEntry', { id: appId });
    }
    return { ok: false, error: 'Перехоплення доступне лише в нативному Windows-додатку.' };
  }

  async restoreAutostartEntry(appId: string, command?: string): Promise<InterceptActionResult> {
    if (getWebView()) {
      return invokeNative<InterceptActionResult>('restoreEntry', { id: appId, command: command ?? '' });
    }
    return { ok: false, error: 'Відновлення доступне лише в нативному Windows-додатку.' };
  }
}

export const systemAdapter: SystemAdapter = new BrowserLocalSystemAdapter();
