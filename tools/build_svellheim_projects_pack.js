#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * build_svellheim_projects_pack.js
 *
 * Reads all Project JSON files from campaign/foundry-json-exports/Projects/
 * and writes them into a LevelDB compendium pack with Foundry folder structure.
 *
 * Directory layout expected:
 *   Projects/
 *     Crafting/  1st-Level/  5th-Level/  9th-Level/
 *     Research/  1st-Level/  5th-Level/  9th-Level/
 *     Other/     1st-Level/  5th-Level/  9th-Level/
 *
 * Usage (from repo root):
 *   node foundry-svellheim-character-options/tools/build_svellheim_projects_pack.js
 *   npm run build:svellheim-projects
 *
 * Output:
 *   foundry-svellheim-character-options/module/packs/svellheim-projects/  (LevelDB)
 */

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

// ── Paths ──────────────────────────────────────────────────────────────
const REPO_ROOT = process.cwd();
const MODULE_DIR = path.join(REPO_ROOT, 'foundry-svellheim-character-options', 'module');
const SOURCE_DIR = path.join(REPO_ROOT, 'foundry-svellheim-character-options', 'data', 'projects');
const PACK_NAME  = 'svellheim-projects';
const PACK_DIR   = path.join(MODULE_DIR, 'packs', PACK_NAME);
const MODULE_ID  = 'svellheim-character-options';

// ── ID helpers ─────────────────────────────────────────────────────────
const BASE62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

function base62FromBuffer(buf, len) {
  let n = BigInt('0x' + buf.toString('hex'));
  if (n === 0n) return '0'.repeat(len);
  let out = '';
  while (n > 0n) { out = BASE62[Number(n % 62n)] + out; n = n / 62n; }
  if (out.length < len) out = out.padStart(len, '0');
  if (out.length > len) out = out.slice(0, len);
  return out;
}

function foundryId(seed) {
  return base62FromBuffer(crypto.createHash('sha1').update(String(seed)).digest().subarray(0, 12), 16);
}

// ── Folder document factory ─────────────────────────────────────────────
function mkFolder({ id, name, parentId = null, sort = 0 }) {
  return {
    _id: id,
    name,
    type: 'Item',
    folder: parentId,
    color: null,
    sorting: 'a',
    sort,
    description: '',
    flags: {},
    _stats: {
      compendiumSource: null,
      duplicateSource: null,
      exportSource: null,
      coreVersion: '13',
      systemId: 'draw-steel',
      systemVersion: null,
      createdTime: Date.now(),
      modifiedTime: null,
      lastModifiedBy: null,
    },
  };
}

// ── Folder hierarchy ────────────────────────────────────────────────────
// Maps "Category/Level" path segments to Foundry folder documents.
// Category sort order: Crafting < Research < Other
// Level sort order: 1st < 5th < 9th

const CATEGORY_SORT = { 'Crafting': 100000, 'Research': 200000, 'Other': 300000 };
const LEVEL_SORT    = { '1st-Level': 100000, '5th-Level': 200000, '9th-Level': 300000 };
const LEVEL_LABEL   = { '1st-Level': '1st Level', '5th-Level': '5th Level', '9th-Level': '9th Level' };

function buildFolders() {
  const folders = [];
  const index   = {}; // "Category/Level" → folder._id

  // Root folder
  const rootId = foundryId('svp-folder:root');
  folders.push(mkFolder({ id: rootId, name: 'Projects', sort: 0 }));

  // Category + level folders
  for (const [cat, catSort] of Object.entries(CATEGORY_SORT)) {
    const catId = foundryId(`svp-folder:${cat.toLowerCase()}`);
    folders.push(mkFolder({ id: catId, name: cat, parentId: rootId, sort: catSort }));

    for (const [lvl, lvlSort] of Object.entries(LEVEL_SORT)) {
      const lvlId = foundryId(`svp-folder:${cat.toLowerCase()}:${lvl}`);
      folders.push(mkFolder({ id: lvlId, name: LEVEL_LABEL[lvl], parentId: catId, sort: lvlSort }));
      index[`${cat}/${lvl}`] = lvlId;
    }
  }

  return { folders, index };
}

// ── Scan JSON files from category/level subdirectories ─────────────────
function collectItems(folderIndex) {
  const items = [];

  for (const cat of Object.keys(CATEGORY_SORT)) {
    for (const lvl of Object.keys(LEVEL_SORT)) {
      const dir = path.join(SOURCE_DIR, cat, lvl);
      if (!fs.existsSync(dir)) continue;

      const folderId = folderIndex[`${cat}/${lvl}`];

      const jsonFiles = fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort();
      for (const file of jsonFiles) {
        const raw = fs.readFileSync(path.join(dir, file), 'utf8');
        let item;
        try {
          item = JSON.parse(raw);
        } catch (e) {
          console.warn(`  ⚠  Skipping ${file}: JSON parse error — ${e.message}`);
          continue;
        }

        // Generate a stable deterministic _id from the _dsid field (or filename stem)
        const dsid = item.system?._dsid || path.basename(file, '.json').toLowerCase();
        item._id    = foundryId(`svp-item:${dsid}`);
        item.folder = folderId;

        // Ensure _stats block is present
        item._stats = item._stats || {};
        item._stats.coreVersion    = item._stats.coreVersion    || '13';
        item._stats.systemId       = item._stats.systemId       || 'draw-steel';
        item._stats.systemVersion  = item._stats.systemVersion  || null;
        item._stats.createdTime    = item._stats.createdTime    || Date.now();
        item._stats.modifiedTime   = null;
        item._stats.lastModifiedBy = null;

        item.ownership = item.ownership || { default: 0 };
        item.effects   = item.effects   || [];
        item.flags     = item.flags     || {};

        items.push(item);
      }
    }
  }

  return items;
}

// ── LevelDB writer ──────────────────────────────────────────────────────
async function writeLevelDb({ folders, items }, outDir) {
  const { ClassicLevel } = require('classic-level');

  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  const db = new ClassicLevel(outDir, { keyEncoding: 'utf8', valueEncoding: 'utf8' });
  await db.open();

  for (const f of folders) await db.put(`!folders!${f._id}`, JSON.stringify(f));
  for (const i of items)   await db.put(`!items!${i._id}`,   JSON.stringify(i));

  await db.compactRange('\x00', '\xff');
  await db.close();
}

// ── Main ────────────────────────────────────────────────────────────────
async function main() {
  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`Source directory not found: ${SOURCE_DIR}`);
    process.exit(1);
  }

  const { folders, index } = buildFolders();
  const items = collectItems(index);

  console.log(`Found ${items.length} project items across ${folders.length} folders`);

  await writeLevelDb({ folders, items }, PACK_DIR);

  const byType = {};
  for (const i of items) byType[i.system?.type || i.type] = (byType[i.system?.type || i.type] || 0) + 1;

  console.log(`\nWrote ${items.length} items and ${folders.length} folders to ${path.relative(REPO_ROOT, PACK_DIR) + '/'}`);
  if (Object.keys(byType).length) {
    console.log('By project type:');
    for (const [t, c] of Object.entries(byType).sort()) console.log(`  ${t}: ${c}`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
