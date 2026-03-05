#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * build_svellheim_monsters_pack.js
 *
 * Reads monster actor JSON files from data/monsters/ and writes them into a
 * LevelDB compendium pack at module/packs/svellheim-monsters/.
 *
 * Monsters are organised into faction-based folders:
 *   Undead, Beasts, Pale Maw, Chainwardens, Goblins, Bosses, Corrupted
 *
 * Each actor gets a deterministic _id derived from its filename so that
 * compendium UUIDs remain stable across rebuilds.
 *
 * Usage:
 *   node tools/build_svellheim_monsters_pack.js
 *   npm run build:svellheim-monsters
 */

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

// ── Paths ──────────────────────────────────────────────────────────────
const REPO_ROOT = process.cwd();
const MODULE_DIR = path.join(REPO_ROOT, 'module');
const SOURCE_DIR = path.join(REPO_ROOT, 'data', 'monsters');
const PACK_NAME = 'svellheim-monsters';
const PACK_DIR = path.join(MODULE_DIR, 'packs', PACK_NAME);
const MODULE_ID = 'svellheim-entities';
const MODULE_ASSET_BASE = `modules/${MODULE_ID}/assets/icons/monster-images`;

// ── Deterministic ID helpers ───────────────────────────────────────────
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

// ── Try to resolve a monster portrait image ────────────────────────────
function resolvePortrait(stem) {
  const imgDir = path.join(MODULE_DIR, 'assets', 'icons', 'monster-images');
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

// Faction folder definitions (single level — no nesting)
const FACTIONS = [
  { key: 'undead',       name: 'Undead',       sort: 100000 },
  { key: 'beasts',       name: 'Beasts',       sort: 200000 },
  { key: 'pale-maw',     name: 'Pale Maw',     sort: 300000 },
  { key: 'chainwardens', name: 'Chainwardens', sort: 400000 },
  { key: 'goblins',      name: 'Goblins',      sort: 500000 },
  { key: 'bosses',       name: 'Bosses',       sort: 600000 },
  { key: 'corrupted',    name: 'Corrupted',    sort: 700000 },
];

// Map filename stems to faction keys
const FACTION_RULES = [
  { test: /^pale-maw-/,                                          faction: 'pale-maw' },
  { test: /^(chainwarden-|warden-captain-|heitfolk-)/,            faction: 'chainwardens' },
  { test: /^goblin-/,                                             faction: 'goblins' },
  { test: /^(grafvitnir|dreyfus-)/,                               faction: 'bosses' },
  { test: /^(blind-draugr-wolf|dire-draugr-wolf|drowned-wolf|rootgnaw-|rot-grub$|rot-beast|vine-strangler)/, faction: 'beasts' },
  { test: /^(rot-warped-|rottouched|graveconstruct|keeper-guardian-)/, faction: 'corrupted' },
  // Everything else → undead (default)
];

function resolveFaction(stem) {
  for (const rule of FACTION_RULES) {
    if (rule.test.test(stem)) return rule.faction;
  }
  return 'undead';
}

function buildFolders() {
  const folders = [];
  const index = {};
  for (const f of FACTIONS) {
    const id = foundryId(`svm-folder:${f.key}`);
    folders.push(mkFolder({ id, name: f.name, sort: f.sort }));
    index[f.key] = id;
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
  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`Source directory not found: ${SOURCE_DIR}`);
    process.exit(1);
  }

  const { folders, index } = buildFolders();
  const jsonFiles = fs.readdirSync(SOURCE_DIR).filter(f => f.endsWith('.json')).sort();
  console.log(`Found ${jsonFiles.length} monster files in ${path.relative(REPO_ROOT, SOURCE_DIR)}/\n`);

  const actors = [];
  const factionCounts = {};

  for (const file of jsonFiles) {
    const filePath = path.join(SOURCE_DIR, file);
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    const stem = path.basename(file, '.json');
    const _id = foundryId(`actor:${PACK_NAME}:${stem}`);
    const faction = resolveFaction(stem);

    raw._id = _id;
    raw.folder = index[faction] || null;

    // Try to assign a module-provided portrait
    const portrait = resolvePortrait(stem);
    if (portrait) {
      raw.img = portrait;
      if (raw.prototypeToken) {
        raw.prototypeToken.texture = raw.prototypeToken.texture || {};
        raw.prototypeToken.texture.src = portrait;
      }
    }

    // Ensure _stats
    raw._stats = raw._stats || {};
    raw._stats.coreVersion = raw._stats.coreVersion || '13';
    raw._stats.systemId = raw._stats.systemId || 'draw-steel';

    actors.push(raw);
    factionCounts[faction] = (factionCounts[faction] || 0) + 1;
    console.log(`  [${faction}] ${raw.name} → ${_id}${portrait ? ' (portrait)' : ''}`);
  }

  await writeLevelDb({ folders, actors }, PACK_DIR);

  console.log(`\nWrote pack: ${path.relative(REPO_ROOT, PACK_DIR)} (${actors.length} monsters, ${folders.length} folders)`);
  console.log('By faction:');
  for (const [f, c] of Object.entries(factionCounts).sort()) console.log(`  ${f}: ${c}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
