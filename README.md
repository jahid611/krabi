# KRABI — League Companion

Companion local pour League of Legends, façon op.gg/Porofessor mais **100% local** :
clone la champ select en direct, affiche l'elo et la forme des alliés, analyse la
compo (AD/AP, CC, alertes), puis fournit en jeu les timers de flash, d'ults, de
camps de jungle et d'objectifs — placés au bon endroit sur la carte.

UI/UX : design "Draft & VOD Analyst" (variante Clair) — Plus Jakarta Sans +
JetBrains Mono, cartes arrondies, chips pastel, accent violet — décliné en
thème sombre à contraste renforcé (défaut) et thème clair.

## Fonctionnalités

**Draft (`/`)**
- Clone temps réel de la champ select (picks, bans, phase, timer) via l'API locale
  du client (LCU) — lecture du lockfile, aucune clé API Riot nécessaire.
- Par allié : elo solo/duo, winrate des 5 dernières games (W/L), lien op.gg
  ouvert dans un nouvel onglet.
- Analyse de compo par équipe : répartition dégâts physiques/magiques (hybrides
  50/50), CC lock total, alertes (« full AD ▸ demande un pick AP » avec
  suggestions, CC ennemi élevé ▸ pense Cleanse/Mercury, …).

**Live (`/live`)**
- Flux Live Client Data (`https://127.0.0.1:2999`) : score, niveaux, événements.
- Timers de flash ennemis (clic ▸ 5:00), timers d'ult estimés par niveau
  (rangs 6/11/16), carte cliquable des camps de jungle (buffs 5:00, camps 2:15,
  sentinelles 2:30), timers Dragon/Baron/Héraut démarrés automatiquement sur
  les événements du jeu.
- Feed d'événements type terminal.

**Settings (`/settings`)**
- Chaque module s'active/désactive individuellement ; thème sombre/clair,
  couleur d'accent, mode démo. Persisté côté serveur
  (`apps/server/data/settings.json`).

**Mode démo** : rejoue en boucle une draft complète puis une partie simulée —
permet de voir toute l'app fonctionner sans client League.

## Architecture

```
packages/shared   types partagés, dataset champions (dégâts/CC/ults),
                  moteur d'analyse de compo, constantes camps/objectifs
apps/server       Node + ws : watcher LCU (lockfile, gameflow, champ select,
                  enrichissement elo/forme via LCU), poller Live Client Data,
                  timers server-authoritative, simulateur démo, API REST + WS
apps/web          React + Vite : pages Draft / Live / Settings, design system
                  sombre/clair à tokens CSS, WebSocket temps réel
```

Le serveur est la source de vérité unique (`AppState`) et pousse chaque
changement aux clients via WebSocket (`/ws`). Les timers vivent côté serveur :
plusieurs onglets/écrans restent synchronisés.

## Démarrage

```bash
npm install

# développement (serveur :4600 + web :5173 avec proxy)
npm run dev

# production : build du front puis serveur unique qui sert tout
npm run build
npm run start        # http://localhost:4600
```

À lancer sur la même machine que le client League (le LCU et le Live Client
Data ne sont accessibles qu'en loopback). Aucune donnée ne sort de la machine.

## Notes techniques

- Elo & historique : endpoints LCU `lol-ranked` / `lol-match-history` — dispo
  uniquement pour les alliés (anonymat des ennemis en ranked, comme op.gg).
- Le dataset champions (`packages/shared/src/champions.ts`) contient des
  approximations curatées (CC, cooldowns) ; `npm run data:refresh` vérifie les
  clés contre Data Dragon.
- Icônes champions chargées depuis le CDN Data Dragon avec fallback texte
  hors-ligne.

Non affilié à Riot Games. League of Legends est une marque de Riot Games, Inc.
