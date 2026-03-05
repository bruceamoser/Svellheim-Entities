#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * build_svellheim_npcs_pack.js
 *
 * Reads NPC actor JSON files from data/npcs/ and writes them into a
 * LevelDB compendium pack at module/packs/svellheim-npcs/.
 *
 * NPCs are organised into role-based folders:
 *   Allies, Antagonists, Authorities, Neutral
 *
 * Each actor gets a deterministic _id derived from its filename so that
 * compendium UUIDs remain stable across rebuilds.
 *
 * Usage:
 *   node tools/build_svellheim_npcs_pack.js
 *   npm run build:svellheim-npcs
 */

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

// ── Paths ──────────────────────────────────────────────────────────────
const REPO_ROOT = process.cwd();
const MODULE_DIR = path.join(REPO_ROOT, 'module');
const ACTORS_DIR = path.join(REPO_ROOT, 'data', 'npcs');
const PACK_NAME = 'svellheim-npcs';
const PACK_DIR = path.join(MODULE_DIR, 'packs', PACK_NAME);
const MODULE_ID = 'svellheim-entities';
const MODULE_ASSET_BASE = `modules/${MODULE_ID}/assets/icons/npc-images`;

// ── Deterministic ID helpers (same as other build scripts) ─────────────

const B62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

function base62FromBuffer(buf, length) {
  let n = BigInt('0x' + Buffer.from(buf).toString('hex'));
  const base = BigInt(B62.length);
  let out = '';
  while (n > 0n) {
    out = B62[Number(n % base)] + out;
    n /= base;
  }
  if (out.length < length) out = out.padStart(length, '0');
  if (out.length > length) out = out.slice(0, length);
  return out;
}

function foundryId(seed) {
  const digest = crypto.createHash('sha1').update(String(seed)).digest();
  return base62FromBuffer(digest.subarray(0, 12), 16);
}

// ── Try to resolve an NPC portrait image ───────────────────────────────
function resolvePortrait(stem) {
  const imgDir = path.join(MODULE_DIR, 'assets', 'icons', 'npc-images');
  if (!fs.existsSync(imgDir)) return null;
  const files = fs.readdirSync(imgDir);
  for (const ext of ['webp', 'png', 'jpg', 'svg']) {
    if (files.includes(`${stem}.${ext}`)) {
      return `${MODULE_ASSET_BASE}/${stem}.${ext}`;
    }
  }
  return null;
}

// ── Folder infrastructure ──────────────────────────────────────────────

function mkFolder({ id, name, sort = 0 }) {
  return {
    _id: id,
    name,
    type: 'Actor',
    folder: null,
    color: null,
    sorting: 'a',
    sort,
    description: '',
    flags: {},
    _stats: {
      compendiumSource: null, duplicateSource: null, exportSource: null,
      coreVersion: '13', systemId: 'draw-steel', systemVersion: null,
      createdTime: Date.now(), modifiedTime: null, lastModifiedBy: null,
    },
  };
}

// Role folder definitions (single level)
const ROLES = [
  { key: 'allies',       name: 'Allies',       sort: 100000 },
  { key: 'antagonists',  name: 'Antagonists',   sort: 200000 },
  { key: 'authorities',  name: 'Authorities',   sort: 300000 },
  { key: 'neutral',      name: 'Neutral',       sort: 400000 },
];

// Map filename stems to role keys
const ROLE_MAP = {
  // Allies — party companions and friendly NPCs
  'bryn-ketilsdottir':      'allies',
  'eirik-greyhand':         'allies',
  'gragnir-the-druid':      'allies',
  'hild':                   'allies',
  'kaelen-the-seventh':     'allies',
  'lew-tosferd':            'allies',
  'solveig-the-burner':     'allies',
  'solvi':                  'allies',

  // Antagonists — enemies and hostile NPCs
  'dreyfus':                              'antagonists',
  'bolverkt-djpdvergr-scout':             'antagonists',
  'thrinn-ashward-pale-maw-inquisitor':   'antagonists',
  'yrsa-frostbane-pale-maw-strike-leader':'antagonists',

  // Authorities — rulers, leaders, and officials
  'high-king-harald':                     'authorities',
  'high-king-harold':                     'authorities',
  'elder-thyra-steamoasis-leader':        'authorities',
  'vigmund-haldorsson-jarl-of-rindgate':  'authorities',
  'thyra-blackhand':                      'authorities',

  // Neutral — merchants, refugees, and other non-aligned NPCs
  'brynja-steinsdottir-refugee-leader':   'neutral',
  'grenvordr-elder-of-the-green-heart':   'neutral',
  'hildvar-bruneson-forgemaster':         'neutral',
  'rickety-frets':                        'neutral',
  'soldis-glodfari':                      'neutral',
};

function resolveRole(stem) {
  return ROLE_MAP[stem] || 'neutral';
}

function buildFolders() {
  const folders = [];
  const index = {};
  for (const r of ROLES) {
    const id = foundryId(`svn-folder:${r.key}`);
    folders.push(mkFolder({ id, name: r.name, sort: r.sort }));
    index[r.key] = id;
  }
  return { folders, index };
}

// ── LevelDB writer ────────────────────────────────────────────────────

async function writeLevelDb({ folders, actors }, outDir) {
  const { ClassicLevel } = require('classic-level');

  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  const db = new ClassicLevel(outDir, { keyEncoding: 'utf8', valueEncoding: 'utf8' });
  await db.open();

  for (const f of folders) await db.put(`!folders!${f._id}`, JSON.stringify(f));
  for (const a of actors)  await db.put(`!actors!${a._id}`, JSON.stringify(a));

  await db.compactRange('\x00', '\xff');
  await db.close();
}

// ── Main ──────────────────────────────────────────────────────────────

async function main() {
  if (!fs.existsSync(ACTORS_DIR)) {
    console.error(`Source directory not found: ${ACTORS_DIR}`);
    process.exit(1);
  }

  const { folders, index } = buildFolders();
  const jsonFiles = fs.readdirSync(ACTORS_DIR).filter(f => f.endsWith('.json')).sort();
  console.log(`Found ${jsonFiles.length} NPC files in ${path.relative(REPO_ROOT, ACTORS_DIR)}/\n`);

  const actors = [];
  const roleCounts = {};

  for (const file of jsonFiles) {
    const filePath = path.join(ACTORS_DIR, file);
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    const stem = path.basename(file, '.json');
    const _id = foundryId(`actor:${PACK_NAME}:${stem}`);
    const role = resolveRole(stem);

    raw._id = _id;
    raw.folder = index[role] || null;

    // Try to assign a module-provided portrait
    const portrait = resolvePortrait(stem);
    if (portrait) {
      raw.img = portrait;
      if (raw.prototypeToken) {
        raw.prototypeToken.texture = raw.prototypeToken.texture || {};
        raw.prototypeToken.texture.src = portrait;
      }
    }

    actors.push(raw);
    roleCounts[role] = (roleCounts[role] || 0) + 1;
    console.log(`  [${role}] ${raw.name} → ${_id}${portrait ? ' (portrait)' : ''}`);
  }

  await writeLevelDb({ folders, actors }, PACK_DIR);

  console.log(`\nWrote pack: ${path.relative(REPO_ROOT, PACK_DIR)} (${actors.length} NPCs, ${folders.length} folders)`);
  console.log('By role:');
  for (const [r, c] of Object.entries(roleCounts).sort()) console.log(`  ${r}: ${c}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
