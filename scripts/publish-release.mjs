/**
 * Publishes StartupCatcher-win-x64.zip (built app\ without data\) to GitHub Releases
 * (MonoVoice/Startup-Catcher) using Node's built-in fetch (no git/gh CLI required).
 *
 * Usage:
 *   $env:GH_TOKEN="ghp_..." ; node scripts/publish-release.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const csproj = fs.readFileSync(path.join(root, 'native', 'StartupCatcher.csproj'), 'utf-8');
const verMatch = csproj.match(/<Version>([^<]+)<\/Version>/);
const version = verMatch ? verMatch[1].trim() : '1.0.1';
const owner = 'amyvibesato-prog';
const repo = 'Startup-Catcher';
const tag = `v${version}`;

const token = (process.env.GH_TOKEN || process.env.GITHUB_TOKEN || '').trim();
if (!token) {
  console.error('Помилка: не вказано GH_TOKEN. Передайте GitHub Personal Access Token.');
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${token}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': 'startup-catcher-publisher',
};

async function ghJson(url, opts = {}) {
  const res = await fetch(url, {
    ...opts,
    headers: { ...headers, ...(opts.headers || {}) },
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new Error(`GitHub API ${res.status}: ${data?.message || text}`);
  }
  return data;
}

const releaseDir = path.join(root, 'release');
fs.mkdirSync(releaseDir, { recursive: true });
const stagingDir = path.join(releaseDir, 'staging');
if (fs.existsSync(stagingDir)) fs.rmSync(stagingDir, { recursive: true, force: true });
fs.mkdirSync(stagingDir, { recursive: true });

// Copy app/ excluding data/ (user config & WebView2 cache)
const appDir = path.join(root, 'app');
for (const entry of fs.readdirSync(appDir, { withFileTypes: true })) {
  if (entry.name.toLowerCase() === 'data') continue;
  fs.cpSync(path.join(appDir, entry.name), path.join(stagingDir, entry.name), { recursive: true });
}

const zipName = `StartupCatcher-win-x64.zip`;
const zipPath = path.join(releaseDir, zipName);
if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

execFileSync('powershell', [
  '-NoProfile',
  '-Command',
  `Compress-Archive -Path "${stagingDir}\\*" -DestinationPath "${zipPath}" -Force`,
]);

let release;
try {
  release = await ghJson(`https://api.github.com/repos/${owner}/${repo}/releases/tags/${tag}`);
  console.log(`Found existing release ${tag} (id=${release.id})`);
} catch {
  console.log(`Creating GitHub Release ${tag}...`);
  release = await ghJson(`https://api.github.com/repos/${owner}/${repo}/releases`, {
    method: 'POST',
    body: JSON.stringify({
      tag_name: tag,
      name: `Startup Catcher ${tag}`,
      body: `Оновлення ${tag}: прибрано чорні рамки й гострі кути, додано перетягування в меню налаштувань, розширено максимальну непрозорість до 100%, додано швидке оновлення з GitHub.`,
      draft: false,
      prerelease: false,
    }),
  });
}

// Delete existing asset with same name if re-uploading
for (const asset of release.assets || []) {
  if (asset.name === zipName) {
    await ghJson(`https://api.github.com/repos/${owner}/${repo}/releases/assets/${asset.id}`, {
      method: 'DELETE',
    });
  }
}

const uploadUrl = release.upload_url.replace('{?name,label}', `?name=${encodeURIComponent(zipName)}`);
const zipBytes = fs.readFileSync(zipPath);
const uploadRes = await fetch(uploadUrl, {
  method: 'POST',
  headers: {
    ...headers,
    'Content-Type': 'application/zip',
    'Content-Length': String(zipBytes.length),
  },
  body: zipBytes,
});

if (!uploadRes.ok) {
  throw new Error(`Upload failed (${uploadRes.status}): ${await uploadRes.text()}`);
}

fs.rmSync(stagingDir, { recursive: true, force: true });
console.log(`✅ Published ${zipName} to https://github.com/${owner}/${repo}/releases/tag/${tag}`);
