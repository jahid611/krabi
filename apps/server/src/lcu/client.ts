import https from 'node:https';
import type { LcuCredentials } from './lockfile.js';

/**
 * Client REST minimal vers l'API locale du client League (LCU).
 * Le certificat du LCU est auto-signé : on désactive la vérification TLS
 * uniquement pour ces requêtes loopback (comportement standard des outils LCU).
 */
export class LcuClient {
  constructor(private creds: LcuCredentials) {}

  get<T>(path: string): Promise<T> {
    const { port, password } = this.creds;
    return new Promise((resolve, reject) => {
      const req = https.request(
        {
          host: '127.0.0.1',
          port,
          path,
          method: 'GET',
          rejectUnauthorized: false,
          timeout: 3000,
          headers: {
            Authorization: `Basic ${Buffer.from(`riot:${password}`).toString('base64')}`,
            Accept: 'application/json',
          },
        },
        (res) => {
          let body = '';
          res.on('data', (chunk) => (body += chunk));
          res.on('end', () => {
            if (!res.statusCode || res.statusCode >= 400) {
              reject(new Error(`LCU ${res.statusCode} sur ${path}`));
              return;
            }
            try {
              resolve(JSON.parse(body) as T);
            } catch (err) {
              reject(err);
            }
          });
        },
      );
      req.on('error', reject);
      req.on('timeout', () => req.destroy(new Error('LCU timeout')));
      req.end();
    });
  }
}
