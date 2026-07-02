import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_SETTINGS, type AppSettings } from '@krabi/shared';

const DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'data');
const FILE = join(DATA_DIR, 'settings.json');

export function loadSettings(): AppSettings {
  try {
    const raw = JSON.parse(readFileSync(FILE, 'utf8'));
    return {
      ...structuredClone(DEFAULT_SETTINGS),
      ...raw,
      draft: { ...DEFAULT_SETTINGS.draft, ...raw.draft },
      live: { ...DEFAULT_SETTINGS.live, ...raw.live },
    };
  } catch {
    return structuredClone(DEFAULT_SETTINGS);
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(FILE, JSON.stringify(settings, null, 2));
  } catch (err) {
    console.error('[settings] écriture impossible :', err);
  }
}
