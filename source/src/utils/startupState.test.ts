import test from 'node:test';
import assert from 'node:assert/strict';
import {
  areAllAppsSelected,
  buildLaunchFeedback,
  buildSkipFeedback,
  createStartupApp,
  DEFAULT_APPS,
  getSelectedApps,
  removeAppById,
  sanitizeStoredApps,
  toggleAllApps,
  toggleAppSelection,
} from './startupState';

test('seed apps start with Telegram and Discord selected and Steam inactive', () => {
  assert.equal(DEFAULT_APPS.length, 3);
  assert.equal(getSelectedApps(DEFAULT_APPS).length, 2);
  assert.equal(areAllAppsSelected(DEFAULT_APPS), false);
});

test('toggling individual apps and toggling all works predictably', () => {
  const allOn = toggleAllApps(DEFAULT_APPS);
  assert.equal(areAllAppsSelected(allOn), true);
  assert.equal(getSelectedApps(allOn).length, 3);

  const allOff = toggleAllApps(allOn);
  assert.equal(areAllAppsSelected(allOff), false);
  assert.equal(getSelectedApps(allOff).length, 0);

  const toggledOne = toggleAppSelection(allOff, 'app-steam');
  assert.deepEqual(
    getSelectedApps(toggledOne).map((a) => a.name),
    ['Steam'],
  );
});

test('createStartupApp validates empty names, duplicates, and infers icon', () => {
  const emptyRes = createStartupApp(DEFAULT_APPS, { name: '   ' });
  assert.equal(emptyRes.ok, false);
  assert.ok(emptyRes.error);

  const dupRes = createStartupApp(DEFAULT_APPS, { name: 'discord' });
  assert.equal(dupRes.ok, false);

  const addedRes = createStartupApp(
    DEFAULT_APPS,
    { name: '  Spotify  ', command: 'spotify.exe' },
    () => 'app-spotify',
  );
  assert.equal(addedRes.ok, true);
  assert.equal(addedRes.app?.name, 'Spotify');
  assert.equal(addedRes.app?.icon, 'spotify');
  assert.equal(addedRes.app?.selected, true);
});

test('removeAppById and empty list behavior', () => {
  const remaining = removeAppById(DEFAULT_APPS, 'app-discord');
  assert.equal(remaining.length, 2);
  assert.equal(remaining.some((a) => a.id === 'app-discord'), false);

  assert.equal(areAllAppsSelected([]), false);
  assert.deepEqual(toggleAllApps([]), []);
});

test('launch and skip feedback produce expected Ukrainian messages', () => {
  const okFeedback = buildLaunchFeedback(getSelectedApps(DEFAULT_APPS), 100);
  assert.equal(okFeedback.kind, 'success');
  assert.equal(okFeedback.message, 'Запущено: Telegram Desktop, Discord');

  const emptyFeedback = buildLaunchFeedback([], 100);
  assert.equal(emptyFeedback.kind, 'warning');
  assert.equal(emptyFeedback.message, 'Нічого не обрано');

  const skipFeedback = buildSkipFeedback(100);
  assert.equal(skipFeedback.kind, 'muted');
  assert.equal(skipFeedback.message, 'Пропущено. Вікно закриється.');
});

test('sanitizeStoredApps handles empty array and filters malformed items', () => {
  assert.deepEqual(sanitizeStoredApps([]), []);
  assert.equal(sanitizeStoredApps('not-an-array'), null);

  const sanitized = sanitizeStoredApps([
    { id: '1', name: 'Obsidian', source: 'Startup', icon: 'obsidian', selected: true },
    { id: 123, name: 'Invalid' },
  ]);
  assert.equal(sanitized?.length, 1);
  assert.equal(sanitized?.[0].name, 'Obsidian');
});
