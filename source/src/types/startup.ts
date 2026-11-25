export type MainTab = 'launch' | 'intercept';

export type AppSourceTag =
  | 'Реєстр Run'
  | 'Startup'
  | 'Вручну'
  | 'Планувальник';

export type AppIconId =
  | 'telegram'
  | 'discord'
  | 'steam'
  | 'spotify'
  | 'obsidian'
  | 'vscode'
  | 'custom';

export interface StartupApp {
  id: string;
  name: string;
  source: AppSourceTag;
  command?: string;
  icon: AppIconId;
  selected: boolean;
}

export interface PresetApp {
  name: string;
  source: AppSourceTag;
  command: string;
  icon: AppIconId;
}

export interface BaseWindowColor {
  hue: number; // 0 - 360
  saturation: number; // 0 - 100
  lightness: number; // 5 - 45
  opacity: number; // 35 - 98
}

export interface AccentColor {
  hue: number; // 0 - 360
  saturation: number; // 0 - 100
  lightness: number; // 30 - 90
}

export interface ThemeConfig {
  base: BaseWindowColor;
  accent: AccentColor;
}

export type StatusKind = 'success' | 'warning' | 'muted';

export interface StatusFeedback {
  kind: StatusKind;
  message: string;
  timestamp: number;
}

export interface LaunchExecutionResult {
  launchedNames: string[];
  skipped: boolean;
}

export interface AutostartCandidate {
  id: string;
  name: string;
  source: AppSourceTag;
  command: string;
  isIntercepted: boolean;
  reappeared?: boolean;
}

export interface InterceptActionResult {
  ok: boolean;
  id?: string;
  name?: string;
  source?: AppSourceTag;
  command?: string;
  error?: string;
}
