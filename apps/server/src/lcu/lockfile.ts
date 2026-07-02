import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

export interface LcuCredentials {
  port: number;
  password: string;
  protocol: string;
}

/**
 * Le client Riot écrit un "lockfile" (name:pid:port:password:protocol) au
 * démarrage. On le lit sur les emplacements connus, plus LCU_LOCKFILE pour
 * les installations non standard.
 */
const CANDIDATES = [
  process.env.LCU_LOCKFILE,
  'C:/Riot Games/League of Legends/lockfile',
  process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'Riot Games/Riot Client/Config/lockfile'),
  '/Applications/League of Legends.app/Contents/LoL/lockfile',
  join(homedir(), '.local/share/Riot Games/League of Legends/lockfile'),
].filter((p): p is string => Boolean(p));

export function readLockfile(): LcuCredentials | null {
  for (const path of CANDIDATES) {
    try {
      const raw = readFileSync(path, 'utf8').trim();
      const [, , port, password, protocol] = raw.split(':');
      if (port && password) {
        return { port: Number(port), password, protocol: protocol || 'https' };
      }
    } catch {
      // fichier absent : client fermé ou autre emplacement
    }
  }
  return null;
}
