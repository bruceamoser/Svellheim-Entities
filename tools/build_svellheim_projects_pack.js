#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * build_svellheim_projects_pack.js
 *
 * Consolidated Svellheim Projects compendium pack.  Merges three sources:
 *   1. data/projects/           — Crafting / Research / Other  (36 JSON)
 *   2. data/imbuing-projects/   — Armor / Implement / Weapon   (36 JSON)
 *   3. Inline reward projects   — 6 Crafting + 5 Research + 4 Other
 *
 * Everything sits inside 6 flat top-level folders (no nested subfolders):
 *   Crafting  ·  Research  ·  Other
 *   Imbuing: Armor  ·  Imbuing: Implement  ·  Imbuing: Weapon
 *
 * Usage:
 *   node tools/build_svellheim_projects_pack.js
 *   npm run build:svellheim-projects
 *
 * Output:
 *   module/packs/svellheim-projects/  (LevelDB)
 */

const fs   = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

// ── Paths ──────────────────────────────────────────────────────────────
const REPO_ROOT   = process.cwd();
const MODULE_DIR  = path.join(REPO_ROOT, 'module');
const PROJ_DIR    = path.join(REPO_ROOT, 'data', 'projects');
const IMBUE_DIR   = path.join(REPO_ROOT, 'data', 'imbuing-projects');
const PACK_NAME   = 'svellheim-projects';
const PACK_DIR    = path.join(MODULE_DIR, 'packs', PACK_NAME);

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

function slugify(input) {
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[øØ]/g, 'o').replace(/[æÆ]/g, 'ae')
    .replace(/[ðÐ]/g, 'd').replace(/[þÞ]/g, 'th')
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// ── Shared factories ───────────────────────────────────────────────────
function mkStats() {
  return {
    compendiumSource: null, duplicateSource: null, exportSource: null,
    coreVersion: '13', systemId: 'draw-steel', systemVersion: null,
    createdTime: Date.now(), modifiedTime: null, lastModifiedBy: null,
  };
}

function mkSource() {
  return { book: 'Svellheim Campaign', page: '', license: 'Homebrew' };
}

function mkFolder({ id, name, parentId = null, sort = 0 }) {
  return {
    _id: id, name, type: 'Item', folder: parentId, color: null,
    sorting: 'a', sort, description: '', flags: {}, _stats: mkStats(),
  };
}

/** Inline project factory — same shape as the old rewards build script. */
function mkProject({ name, dsid, type, desc, prerequisites, projectSource, chars, goal, img }) {
  const slug = dsid || slugify(name);
  const _id  = foundryId(`svr-project:${slug}`);   // keep rewards-era seed
  return {
    _id, name, type: 'project', folder: null, sort: 0,
    img: img || 'icons/svg/book.svg',
    system: {
      description: { value: desc, director: '' },
      source: mkSource(), _dsid: slug,
      type,
      prerequisites: prerequisites || 'None',
      projectSource: projectSource || 'None',
      rollCharacteristic: chars || [],
      points: 0, events: '',
      yield: { item: null, amount: '', display: '' },
      goal: goal || null,
    },
    effects: [], ownership: { default: 0 }, flags: {}, _stats: mkStats(),
  };
}

// ── 6 flat folders ─────────────────────────────────────────────────────
const FOLDERS = [
  { key: 'crafting',         name: 'Crafting',           sort: 100000 },
  { key: 'research',         name: 'Research',           sort: 200000 },
  { key: 'other',            name: 'Other',              sort: 300000 },
  { key: 'imbuing-armor',    name: 'Imbuing: Armor',     sort: 400000 },
  { key: 'imbuing-implement',name: 'Imbuing: Implement', sort: 500000 },
  { key: 'imbuing-weapon',   name: 'Imbuing: Weapon',    sort: 600000 },
];

function buildFolders() {
  const folders = [];
  const index   = {};  // key → folder_id
  for (const f of FOLDERS) {
    const id = foundryId(`svp-folder:${f.key}`);
    folders.push(mkFolder({ id, name: f.name, sort: f.sort }));
    index[f.key] = id;
  }
  return { folders, index };
}

// ── Read JSON files — flatten category/level hierarchy into one folder ──
function readJsonDir(baseDir, categories, seedPrefix, folderIndex) {
  const LEVELS = ['1st-Level', '5th-Level', '9th-Level'];
  const items  = [];
  for (const cat of Object.keys(categories)) {
    const folderId = folderIndex[categories[cat]];
    for (const lvl of LEVELS) {
      const dir = path.join(baseDir, cat, lvl);
      if (!fs.existsSync(dir)) continue;
      const files = fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort();
      for (const file of files) {
        const raw = fs.readFileSync(path.join(dir, file), 'utf8');
        let item;
        try { item = JSON.parse(raw); } catch (e) {
          console.warn(`  ⚠  Skipping ${file}: ${e.message}`);
          continue;
        }
        const dsid   = item.system?._dsid || path.basename(file, '.json').toLowerCase();
        item._id     = foundryId(`${seedPrefix}:${dsid}`);
        item.folder  = folderId;
        item._stats  = item._stats || {};
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

// ── Inline reward projects ──────────────────────────────────────────────
function buildInlineProjects(folderIndex) {
  const items = [];

  // ─── Crafting (6) ──────────────────────────────────────────────────
  const craftId = folderIndex['crafting'];

  const pImbueWeapon = mkProject({
    name: 'Imbue Weapon', type: 'crafting',
    desc: '<p>You work with a skilled rune-carver or smith to imbue a weapon with supernatural power. The weapon must be of masterwork quality or made from rare materials (star-metal, troll-bone, etc.).</p><p>When you start this project, choose a weapon you possess. When the project is complete, the weapon gains a magical property determined by the Director based on the materials and techniques used. This might grant bonus damage, a keyword, or a special on-hit effect.</p><p>Subsequent imbuing of the same weapon costs half the project points of the initial imbuing.</p>',
    prerequisites: 'A masterwork or rare-material weapon; access to a forge',
    projectSource: 'A smith or rune-carver of higher level, or texts describing the technique',
    chars: ['reason', 'intuition'], goal: 150,
    img: 'icons/weapons/swords/greatsword-crossguard-steel.webp',
  });
  pImbueWeapon.folder = craftId;

  const pImbueArmor = mkProject({
    name: 'Imbue Armor', type: 'crafting',
    desc: '<p>You work with a skilled rune-carver or smith to imbue a suit of armor or a shield with supernatural protection. The armor must be of masterwork quality or made from rare materials (star-metal, lindworm-scale, glacier-ice, etc.).</p><p>When you start this project, choose a piece of armor or a shield you possess. When the project is complete, the armor gains a magical property determined by the Director based on the materials and techniques used. This might grant bonus Stamina, a damage resistance, or a special defensive effect.</p><p>Subsequent imbuing of the same armor costs half the project points of the initial imbuing.</p>',
    prerequisites: 'A masterwork or rare-material armor or shield; access to a forge',
    projectSource: 'A smith or rune-carver of higher level, or texts describing the technique',
    chars: ['reason', 'intuition'], goal: 200,
    img: 'icons/equipment/chest/breastplate-banded-steel-gold.webp',
  });
  pImbueArmor.folder = craftId;

  const pForgeStarMetal = mkProject({
    name: 'Forge Star-Metal Weapon', type: 'crafting',
    desc: '<p>You work a fragment of meteoric iron — star-metal — in the traditions of the Red-Rivet Compact. Star-metal must be worked at extreme heat and quenched in blood or ash-water. The process is gruelling and the material unforgiving.</p><p>When you complete this project, you produce one star-metal weapon. Star-metal weapons count as magical and deal bonus damage equal to your level on critical hits.</p>',
    prerequisites: 'A fragment of star-metal (meteorite iron); a Red-Rivet forge or equivalent',
    projectSource: 'Instruction from a Red-Rivet master, or recovered forging texts',
    chars: ['might', 'reason'], goal: 300,
    img: 'icons/weapons/hammers/hammer-war-rounding.webp',
  });
  pForgeStarMetal.folder = craftId;

  const pCarveWardStaves = mkProject({
    name: 'Carve Ward-Staves', type: 'crafting',
    desc: '<p>You inscribe rune-posts with protective galdr to ward a settlement or camp against the restless dead. The staves must be placed at the boundaries of the area to be warded and require regular recharging.</p><p>When you complete this project, you create a set of ward-staves sufficient to protect a small settlement (up to 20 structures). Undead that attempt to cross the ward boundary suffer a bane on all power rolls while within the warded area.</p>',
    prerequisites: 'Seasoned ash-wood posts; runecraft tools; knowledge of protective galdr',
    projectSource: 'Instruction from a Quiet Warden or rune-reader, or recovered galdr texts',
    chars: ['reason', 'intuition'], goal: 120,
    img: 'icons/environment/wilderness/carved-standing-stone.webp',
  });
  pCarveWardStaves.folder = craftId;

  const pBuildIceRunner = mkProject({
    name: 'Build Ice-Runner', type: 'crafting',
    desc: '<p>You construct a wind-driven sled reinforced with bone runners and a hide sail, designed for crossing the frozen expanses of the White Waste or the ice-locked fjords.</p><p>When you complete this project, you produce one ice-runner. An ice-runner can carry up to six passengers and their gear across ice and packed snow at twice overland travel speed. It requires wind to function; in calm conditions it must be man-hauled.</p>',
    prerequisites: 'Timber, bone, cured hides, and rope; carpentry tools',
    projectSource: 'Instruction from a Lantern Road teamster or northern nomad',
    chars: ['might', 'reason'], goal: 180,
    img: 'icons/tools/navigation/map-chart-tan.webp',
  });
  pBuildIceRunner.folder = craftId;

  const pRepairHearthStone = mkProject({
    name: 'Repair the Hearth-Stone', type: 'crafting',
    desc: '<p>You restore a shattered communal hearthstone — the rune-carved slab at the centre of a longhouse that channels warmth through the structure. Without a functioning hearthstone, a community burns twice as much fuel to stay alive.</p><p>When you complete this project, the hearthstone is restored. The settlement it serves halves its fuel consumption and gains +1 Stability (as per the stronghold rules, if used).</p>',
    prerequisites: 'The fragments of the original hearthstone (or equivalent stone); runecraft tools',
    projectSource: 'Instruction from an elder rune-reader or recovered galdr texts',
    chars: ['reason', 'presence'], goal: 100,
    img: 'icons/environment/settlement/fire-camp.webp',
  });
  pRepairHearthStone.folder = craftId;

  // ─── Research (5) ──────────────────────────────────────────────────
  const resId = folderIndex['research'];

  const pDecipherRuneStave = mkProject({
    name: 'Decipher Rune-Stave', type: 'research',
    desc: '<p>You study an ancient carved stave — a plank or post inscribed with galdr in the Old Tongue — to learn the rune-word it encodes. Rune-staves are found in barrows, collapsed stave-temples, and the ruins of the Elder Age.</p><p>When you complete this project, you learn the galdr inscription and can reproduce its effect. The Director determines the specific rune-word and its mechanical application.</p>',
    prerequisites: 'Access to the rune-stave (or a detailed rubbing/sketch)',
    projectSource: 'The rune-stave itself, plus reference texts in the Old Tongue',
    chars: ['reason', 'intuition'], goal: 120,
    img: 'icons/sundries/documents/document-sealed-signatures-red.webp',
  });
  pDecipherRuneStave.folder = resId;

  const pMapDeepRoads = mkProject({
    name: 'Map the Deep Roads', type: 'research',
    desc: '<p>You chart a safe passage through the Deepforged tunnels beneath Midgard\'s Shield. The Deep Roads are vast, unstable, and haunted by deep-dwellers. Mapping even a short stretch is a significant feat.</p><p>When you complete this project, you have a reliable route through a section of the Deep Roads. Travel through that section takes half the normal time and does not require navigation tests.</p>',
    prerequisites: 'Access to the tunnel entrance; surveying tools or a guide',
    projectSource: 'A Deepforged guide or recovered Stone-Pact survey records',
    chars: ['reason', 'intuition'], goal: 150,
    img: 'icons/tools/navigation/map-chart-tan.webp',
  });
  pMapDeepRoads.folder = resId;

  const pStudyTheBlight = mkProject({
    name: 'Study the Blight', type: 'research',
    desc: '<p>You investigate the corruption spreading through the Ashen Woods — a creeping decay that twists plants, poisons water, and breeds monstrosities. Understanding its source is the first step towards stopping it.</p><p>When you complete this project, you learn one significant fact about the Blight\'s origin, vector, or weakness, as determined by the Director.</p>',
    prerequisites: 'Samples of blighted material (safely contained)',
    projectSource: 'Field study in the Ashen Woods, or texts from the Veil-Council',
    chars: ['reason', 'intuition'], goal: 120,
    img: 'icons/magic/nature/root-vine-entangled-green.webp',
  });
  pStudyTheBlight.folder = resId;

  const pLearnNeedFireRite = mkProject({
    name: 'Learn the Need-Fire Rite', type: 'research',
    desc: '<p>You piece together the fragments of the Need-Fire — the legendary ritual that could reignite the sun\'s connection to the mortal world. The rite requires reconciling Aesir temple liturgy with Vanir wild magic, a feat of theological and arcane scholarship that hasn\'t been attempted in living memory.</p><p>This is a campaign-scale project. When you accumulate enough project points, the Director will reveal the next component or step of the ritual.</p>',
    prerequisites: 'Access to both Aesir and Vanir sacred texts or practitioners',
    projectSource: 'Scattered across temples, groves, and barrow-libraries throughout Svellheim',
    chars: ['reason', 'intuition', 'presence'], goal: null,
    img: 'icons/magic/fire/flame-burning-campfire-orange.webp',
  });
  pLearnNeedFireRite.folder = resId;

  const pTranslateHollowCipher = mkProject({
    name: "Translate the Hollow Council's Cipher", type: 'research',
    desc: '<p>You work to crack the coded language used by the Hollow Council — the secret aristocracy of intelligent undead. Their messages are written in an archaic dialect laced with necromantic shorthand.</p><p>When you complete this project, you can read Hollow Council correspondence. The Director may reveal intelligence about their operations, alliances, or vulnerabilities.</p>',
    prerequisites: 'A sample of Hollow Council correspondence (intercepted message, recovered letter)',
    projectSource: 'The correspondence itself, plus reference texts in archaic Svellspraak',
    chars: ['reason'], goal: 150,
    img: 'icons/sundries/documents/letter-sealed-black.webp',
  });
  pTranslateHollowCipher.folder = resId;

  // ─── Other (4) ─────────────────────────────────────────────────────
  const othId = folderIndex['other'];

  const pFeedTheStarving = mkProject({
    name: 'Feed the Starving', type: 'other',
    desc: '<p>You organise food distribution in a settlement suffering from the Fimbulwinter famine. This involves sourcing provisions, negotiating with hoarding merchants, and physically distributing supplies to those in need.</p><p>When you complete this project, the settlement\'s morale improves and you earn the gratitude of the community. The Director determines the narrative reward — this might mean allies, information, safe harbour, or a favour owed.</p>',
    projectSource: 'None', chars: ['might', 'presence'], goal: 75,
    img: 'icons/consumables/food/bread-loaf-round-white.webp',
  });
  pFeedTheStarving.folder = othId;

  const pHonourTheDead = mkProject({
    name: 'Honour the Dead', type: 'other',
    desc: '<p>You perform proper funeral rites for the unburied dead — burning the bodies, speaking the names, and carving the rune of passage. Without these rites, the dead rise as draugr or worse.</p><p>When you complete this project, the restless dead in the area are laid to rest. The Director determines the scope — a single barrow, a battlefield, or a plague-village.</p>',
    projectSource: 'None', chars: ['intuition', 'presence'], goal: 60,
    img: 'icons/magic/fire/flame-burning-skull-orange.webp',
  });
  pHonourTheDead.folder = othId;

  const pStrengthenOaths = mkProject({
    name: 'Strengthen Oaths', type: 'other',
    desc: '<p>You reinforce the metaphysical bonds of a sworn warband, household, or oath-circle through ritual, song, and shared ordeal. In Svellheim, oaths have literal supernatural weight — a strong oath-bond protects against fear, domination, and despair.</p><p>When you complete this project, each member of the oath-circle can, once before the project must be undertaken again, reroll a failed resistance roll against a fear, domination, or charm effect.</p>',
    projectSource: 'None', chars: ['presence'], goal: 90,
    img: 'icons/skills/social/diplomacy-handshake.webp',
  });
  pStrengthenOaths.folder = othId;

  const pSeekOutlawrysEnd = mkProject({
    name: "Seek Outlawry's End", type: 'other',
    desc: '<p>You petition a Thing (assembly) to lift an outlawry sentence — yours or another\'s. This requires gathering evidence, securing character witnesses, and navigating the complex web of blood-debts and political alliances.</p><p>When you complete this project, the outlaw\'s sentence is lifted and they are restored to society. The Director determines any conditions imposed by the Thing.</p>',
    prerequisites: 'Knowledge of the original crime; access to a Thing assembly',
    projectSource: 'Witnesses, legal precedents, or the good will of a Lawspeaker',
    chars: ['reason', 'presence'], goal: 120,
    img: 'icons/skills/social/wave-halt-stop.webp',
  });
  pSeekOutlawrysEnd.folder = othId;

  items.push(
    pImbueWeapon, pImbueArmor, pForgeStarMetal, pCarveWardStaves, pBuildIceRunner, pRepairHearthStone,
    pDecipherRuneStave, pMapDeepRoads, pStudyTheBlight, pLearnNeedFireRite, pTranslateHollowCipher,
    pFeedTheStarving, pHonourTheDead, pStrengthenOaths, pSeekOutlawrysEnd,
  );

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
  const { folders, index } = buildFolders();

  // 1. Data-file projects  (seed: svp-item:{dsid})
  const projItems = readJsonDir(PROJ_DIR, {
    Crafting: 'crafting', Research: 'research', Other: 'other',
  }, 'svp-item', index);

  // 2. Data-file imbuings  (seed: svi-item:{dsid})
  const imbueItems = readJsonDir(IMBUE_DIR, {
    Armor: 'imbuing-armor', Implement: 'imbuing-implement', Weapon: 'imbuing-weapon',
  }, 'svi-item', index);

  // 3. Inline reward projects  (seed: svr-project:{slug})
  const inlineItems = buildInlineProjects(index);

  const items = [...projItems, ...imbueItems, ...inlineItems];

  console.log(`Collected ${items.length} project items across ${folders.length} folders`);
  console.log(`  data/projects:         ${projItems.length}`);
  console.log(`  data/imbuing-projects:  ${imbueItems.length}`);
  console.log(`  inline reward projects: ${inlineItems.length}`);

  await writeLevelDb({ folders, items }, PACK_DIR);

  // Per-folder counts
  const folderCounts = {};
  for (const f of FOLDERS) folderCounts[f.name] = 0;
  for (const i of items) {
    const match = FOLDERS.find(f => index[f.key] === i.folder);
    if (match) folderCounts[match.name]++;
  }

  console.log(`\nWrote ${items.length} items and ${folders.length} folders to ${path.relative(REPO_ROOT, PACK_DIR) + '/'}`);
  console.log('By folder:');
  for (const [name, count] of Object.entries(folderCounts)) {
    console.log(`  ${name}: ${count}`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
