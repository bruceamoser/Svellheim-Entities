#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * build_svellheim_npcs_pack.js
 *
 * Reads NPC actor JSON files from data/npcs/ and writes them into a
 * LevelDB compendium pack at module/packs/svellheim-npcs/.
 *
 * Auto-discovers all .json files in the source directory.
 * Each actor gets a deterministic _id derived from its filename so that
 * compendium UUIDs remain stable across rebuilds.
 *
 * Usage:
 *   node foundry-svellheim-character-options/tools/build_svellheim_npcs_pack.js
 *   npm run build:svellheim-npcs
 */

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

// ── Paths ──────────────────────────────────────────────────────────────
const REPO_ROOT = process.cwd();
const MODULE_DIR = path.join(REPO_ROOT, 'foundry-svellheim-character-options', 'module');
const ACTORS_DIR = path.join(REPO_ROOT, 'foundry-svellheim-character-options', 'data', 'npcs');
const PACK_NAME = 'svellheim-npcs';
const PACK_DIR = path.join(MODULE_DIR, 'packs', PACK_NAME);
const MODULE_ID = 'svellheim-character-options';
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

function foundryIdFromSeed(seed) {
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

// ── LevelDB writer ────────────────────────────────────────────────────

async function writeLevelDb(items, outDir) {
  const { ClassicLevel } = require('classic-level');

  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  const db = new ClassicLevel(outDir, { keyEncoding: 'utf8', valueEncoding: 'utf8' });
  await db.open();

  for (const item of items) {
    await db.put(`!actors!${item._id}`, JSON.stringify(item));
  }

  await db.compactRange('\x00', '\xff');
  await db.close();
}

// ── Main ──────────────────────────────────────────────────────────────

async function main() {
  if (!fs.existsSync(ACTORS_DIR)) {
    console.error(`Source directory not found: ${ACTORS_DIR}`);
    process.exit(1);
  }

  const jsonFiles = fs.readdirSync(ACTORS_DIR).filter(f => f.endsWith('.json')).sort();
  console.log(`Found ${jsonFiles.length} NPC files in ${path.relative(REPO_ROOT, ACTORS_DIR)}/\n`);

  const actors = [];

  for (const file of jsonFiles) {
    const filePath = path.join(ACTORS_DIR, file);
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Generate a stable _id from the filename
    const stem = path.basename(file, '.json');
    const _id = foundryIdFromSeed(`actor:${PACK_NAME}:${stem}`);

    // Assign top-level _id and clear folder (compendium root)
    raw._id = _id;
    raw.folder = null;

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
    console.log(`  ${raw.name} → ${_id}${portrait ? ' (portrait)' : ''}`);
  }

  await writeLevelDb(actors, PACK_DIR);

  console.log(
    `\nWrote pack: ${path.relative(REPO_ROOT, PACK_DIR)} (${actors.length} actors)`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
