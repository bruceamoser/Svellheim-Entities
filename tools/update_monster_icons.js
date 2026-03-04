#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * update_monster_icons.js
 *
 * Replaces the plain `icons/svg/sword.svg` and `icons/svg/book.svg` icons on
 * monster ability/feature items with thematically appropriate Foundry icons.
 *
 * Usage (from repo root):
 *   node tools/update_monster_icons.js
 */

const fs = require('node:fs');
const path = require('node:path');

const DATA_DIR = path.join(__dirname, '..', 'data', 'monsters');

// ── Icon mappings by monster file → item name ─────────────────────────
// Shared icons used by multiple monsters
const SHARED = {
  'Supernatural Insight': 'icons/magic/perception/eye-ringed-green.webp',
  'Exploit Opening':      'icons/skills/melee/strike-dagger-white-orange.webp',
  'Staying Power':        'icons/magic/life/heart-hand-gold-green.webp',
  'Alchemical Device':    'icons/magic/acid/projectile-beams-salvo-green.webp',
  'With Captain':         'icons/skills/movement/arrow-upward-yellow.webp',
};

const ICON_MAP = {
  'chainwarden-enforcer': {
    'Chain-Mace':    'icons/skills/melee/strike-hammer-destructive-orange.webp',
    'Stand Fast':    'icons/skills/melee/shield-block-bash-blue.webp',
    'Overwhelm':     'icons/magic/control/debuff-chains-shackles-movement-blue.webp',
  },

  'chainwarden-guard': {
    'Halberd':       'icons/weapons/polearms/spear-hooked-broad.webp',
  },

  'chainwarden-militia': {
    'Billhook':         'icons/weapons/polearms/spear-simple-barbed.webp',
    "Warden's Resolve": 'icons/magic/defensive/barrier-shield-dome-blue-purple.webp',
  },

  'chainwarden-artillerist': {
    'Arbalest':        'icons/skills/ranged/arrows-flying-salvo-yellow.webp',
    'Alchemical Bolt': 'icons/magic/acid/projectile-beams-salvo-green.webp',
    'Covering Fire':   'icons/skills/ranged/target-bullseye-arrow-blue.webp',
  },

  'frost-draugr': {
    'Frozen Grip':              'icons/magic/water/snowflake-ice-purple.webp',
    'Relentless Advance':       'icons/skills/movement/arrows-up-trio-red.webp',
    'Cold Aura':                'icons/magic/air/wind-weather-snow-gusts.webp',
    'Undead Resilience':        'icons/magic/death/undead-skeleton-energy-green.webp',
    'Ravenous Horde':           'icons/magic/death/undead-ghosts-trio-blue.webp',
    'Paranormal Fling':         'icons/magic/control/debuff-chains-ropes-blue.webp',
    'The Grasping, the Hungry': 'icons/magic/death/hand-dirt-undead-zombie.webp',
    'Dread March':              'icons/magic/death/hand-undead-skeleton-fire-pink.webp',
  },

  'grave-wisp': {
    'Cold Touch':   'icons/magic/water/heart-ice-freeze.webp',
    'Lure':         'icons/magic/control/hypnosis-mesmerism-eye.webp',
    'Incorporeal':  'icons/creatures/magical/spirit-undead-ghost-blue.webp',
    'Ravenous Horde':           'icons/magic/death/undead-ghosts-trio-blue.webp',
    'Paranormal Fling':         'icons/magic/control/debuff-chains-ropes-blue.webp',
    'The Grasping, the Hungry': 'icons/magic/death/hand-dirt-undead-zombie.webp',
    'Dread March':              'icons/magic/death/hand-undead-skeleton-fire-pink.webp',
  },

  'warden-captain-halvard': {
    'Chain-Flail Sweep':          'icons/skills/melee/strike-hammer-destructive-blue.webp',
    "Warden's Warrant":           'icons/skills/targeting/crosshair-arrowhead-blue.webp',
    'Shield Wall':                'icons/skills/melee/shield-block-bash-blue.webp',
    'End Effect':                 'icons/magic/time/arrows-circling-green.webp',
    'Form Up!':                   'icons/skills/melee/weapons-crossed-swords-purple.webp',
    'Disperse!':                  'icons/magic/air/air-burst-spiral-blue-gray.webp',
    'By Authority of the Chain!': 'icons/magic/control/debuff-chains-shackles-movement-blue.webp',
  },
};

// ── Process ───────────────────────────────────────────────────────────
let totalUpdated = 0;

for (const file of fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json')).sort()) {
  const filePath = path.join(DATA_DIR, file);
  const stem = path.basename(file, '.json');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  const monsterMap = ICON_MAP[stem] || {};
  let fileUpdated = 0;

  for (const item of (data.items || [])) {
    const name = item.name;
    const newIcon = monsterMap[name] || SHARED[name];
    if (newIcon && (item.img === 'icons/svg/sword.svg' || item.img === 'icons/svg/book.svg')) {
      const old = item.img;
      item.img = newIcon;
      fileUpdated++;
      console.log(`  ${stem}/${name}: ${old} → ${newIcon}`);
    }
  }

  if (fileUpdated > 0) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
    console.log(`  ✓ Updated ${fileUpdated} items in ${file}\n`);
    totalUpdated += fileUpdated;
  } else {
    console.log(`  — No changes needed for ${file}\n`);
  }
}

console.log(`\nDone. Updated ${totalUpdated} item icons across all monster files.`);
