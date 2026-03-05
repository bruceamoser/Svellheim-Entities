#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * build_svellheim_items_pack.js
 *
 * Builds the consolidated Svellheim Items compendium pack containing:
 *   - Quest Items   (from data/items/ JSON files)
 *   - Consumables   (inline — formerly in svellheim-rewards)
 *   - Trinkets      (inline — formerly in svellheim-rewards)
 *   - Titles        (inline — formerly in svellheim-rewards)
 *   - Title Grants  (inline — formerly in svellheim-rewards)
 *
 * Items are organised into flat top-level folders (max depth 2).
 *
 * Usage:
 *   node tools/build_svellheim_items_pack.js
 *   npm run build:svellheim-items
 */

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

// ── Paths ──────────────────────────────────────────────────────────────
const REPO_ROOT = process.cwd();
const MODULE_DIR = path.join(REPO_ROOT, 'module');
const SOURCE_DIR = path.join(REPO_ROOT, 'data', 'items');
const PACK_NAME = 'svellheim-items';
const PACK_DIR = path.join(MODULE_DIR, 'packs', PACK_NAME);
const MODULE_ID = 'svellheim-entities';

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

function slugify(input) {
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[øØ]/g, 'o')
    .replace(/[æÆ]/g, 'ae')
    .replace(/[ðÐ]/g, 'd')
    .replace(/[þÞ]/g, 'th')
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Inline items use the same seed prefix as the old rewards pack (svr-)
// so that _id values remain stable for anyone who referenced them.
function itemId(type, slug) { return foundryId(`svr-${type}:${slug}`); }

function mkUuid(id) { return `Compendium.${MODULE_ID}.${PACK_NAME}.Item.${id}`; }

// ── Shared factory helpers ─────────────────────────────────────────────

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

function mkFolder({ id, name, sort = 0 }) {
  return {
    _id: id, name, type: 'Item', folder: null, color: null,
    sorting: 'a', sort, description: '', flags: {}, _stats: mkStats(),
  };
}

// ── Item factories (treasure, title, feature) ──────────────────────────

function mkTreasure({ name, dsid, category, echelon, desc, keywords, project, img, folderId }) {
  const slug = dsid || slugify(name);
  const _id = itemId('treasure', slug);
  return {
    _id, name, type: 'treasure', folder: folderId || null, sort: 0,
    img: img || 'icons/svg/item-bag.svg',
    system: {
      description: { value: desc, director: '' },
      source: mkSource(), _dsid: slug,
      kind: '', category, echelon: echelon || 1,
      keywords: keywords || [],
      quantity: 1,
      project: project || {
        prerequisites: '', source: '', rollCharacteristic: [],
        yield: { amount: '1', display: '' }, goal: null,
      },
    },
    effects: [], ownership: { default: 0 }, flags: {}, _stats: mkStats(),
  };
}

function mkFeature({ name, dsid, desc, effects, img, folderId }) {
  const slug = dsid || slugify(name);
  const _id = itemId('feature', slug);
  return {
    _id, name, type: 'feature', folder: folderId || null, sort: 0,
    img: img || 'icons/svg/book.svg',
    system: {
      description: { value: desc, director: '' },
      source: mkSource(), _dsid: slug,
      advancements: {},
    },
    effects: effects || [],
    ownership: { default: 0 }, flags: {}, _stats: mkStats(),
  };
}

function mkTitle({ name, dsid, echelon, story, prerequisites, featureIds, desc, img, folderId }) {
  const slug = dsid || slugify(name);
  const _id = itemId('title', slug);
  const advId = foundryId(`svr-adv:${slug}`);
  const pool = (featureIds || []).map((fid) => ({ uuid: mkUuid(fid) }));
  const embedLines = (featureIds || []).map((fid) =>
    `<li><p>@Embed[${mkUuid(fid)} inline]</p></li>`
  );
  const fullDesc = desc || [
    '<p><strong>Effect:</strong> Choose one of the following benefits:</p>',
    '<ul>', ...embedLines, '</ul>',
  ].join('');
  return {
    _id, name, type: 'title', folder: folderId || null, sort: 0,
    img: img || 'icons/svg/book.svg',
    system: {
      description: { value: fullDesc, director: '' },
      source: mkSource(), _dsid: slug,
      advancements: {
        [advId]: {
          name: 'Benefit', img: null, type: 'itemGrant',
          requirements: { level: null }, _id: advId,
          description: '<p><strong>Effect:</strong> Choose one of the following benefits:</p>',
          chooseN: 1, pool, sort: 0,
          additional: { type: '', perkType: [] },
        },
      },
      echelon: echelon || 1,
      story: story || '',
      prerequisites: { value: prerequisites || '' },
    },
    effects: [], ownership: { default: 0 }, flags: {}, _stats: mkStats(),
  };
}

// ── Build all content ──────────────────────────────────────────────────

function buildContent() {
  const folders = [];
  const items = [];

  // ── Folders (flat, single level) ─────────────────────────────────
  const questFolder = mkFolder({ id: foundryId('svi-folder:quest-items'),  name: 'Quest Items',   sort: 100000 });
  const consFolder  = mkFolder({ id: foundryId('svi-folder:consumables'),  name: 'Consumables',   sort: 200000 });
  const trinkFolder = mkFolder({ id: foundryId('svi-folder:trinkets'),     name: 'Trinkets',      sort: 300000 });
  const titleFolder = mkFolder({ id: foundryId('svi-folder:titles'),       name: 'Titles',        sort: 400000 });
  const grantFolder = mkFolder({ id: foundryId('svi-folder:title-grants'), name: 'Title Grants',  sort: 500000 });

  folders.push(questFolder, consFolder, trinkFolder, titleFolder, grantFolder);

  // ── Quest Items (from data/items/ JSON files) ────────────────────
  if (fs.existsSync(SOURCE_DIR)) {
    const jsonFiles = fs.readdirSync(SOURCE_DIR).filter(f => f.endsWith('.json')).sort();
    for (const file of jsonFiles) {
      const raw = JSON.parse(fs.readFileSync(path.join(SOURCE_DIR, file), 'utf8'));
      const stem = path.basename(file, '.json');
      raw._id = foundryId(`item:${PACK_NAME}:${stem}`);
      raw.folder = questFolder._id;
      raw._stats = raw._stats || {};
      raw._stats.coreVersion = raw._stats.coreVersion || '13';
      raw._stats.systemId = raw._stats.systemId || 'draw-steel';
      raw._stats.systemVersion = raw._stats.systemVersion || null;
      raw._stats.createdTime = raw._stats.createdTime || Date.now();
      raw._stats.modifiedTime = null;
      raw._stats.lastModifiedBy = null;
      raw.ownership = raw.ownership || { default: 0 };
      raw.effects = raw.effects || [];
      raw.flags = raw.flags || {};
      items.push(raw);
    }
    console.log(`  Quest Items: ${jsonFiles.length} (from data/items/)`);
  }

  // ══════════════════════════════════════════════════════════════════
  // CONSUMABLES (Echelon 1) — formerly in svellheim-rewards
  // ══════════════════════════════════════════════════════════════════

  items.push(mkTreasure({
    name: 'Rune-Dust', category: 'consumable', echelon: 1, folderId: consFolder._id,
    desc: [
      '<p><em>A pouch of fine grey powder inscribed with barely-visible galdr. It smells of iron and burnt birch.</em></p>',
      '<p><strong>Effect:</strong> As a maneuver, you scatter the dust across a threshold, doorway, or boundary up to 2 squares wide. Until the end of the encounter, undead that attempt to cross the boundary suffer a bane on all power rolls until the end of their next turn.</p>',
    ].join(''),
    keywords: ['magic'],
    project: { prerequisites: 'Iron filings and birch ash; runecraft tools', source: 'Instruction from a Quiet Warden or rune-reader', rollCharacteristic: ['reason'], yield: { amount: '3', display: '' }, goal: 30 },
    img: 'icons/magic/light/projectile-smoke-blue-white.webp',
  }));

  items.push(mkTreasure({
    name: 'Ashwright Fuel-Stone', category: 'consumable', echelon: 1, folderId: consFolder._id,
    desc: [
      '<p><em>A dense, palm-sized brick of compressed peat and alchemical accelerant. It glows faintly warm even before ignition.</em></p>',
      '<p><strong>Effect:</strong> When lit (no action required), the fuel-stone burns for 8 hours, producing heat equivalent to a large campfire in a 3-square radius. It cannot be extinguished by wind or mundane water. A fuel-stone can keep a small group alive through a night in the open during Fimbulwinter.</p>',
    ].join(''),
    keywords: ['magic'],
    project: { prerequisites: 'Peat, alchemical accelerant (from the Ashwright Kins), a press', source: 'Ashwright Kins trade secrets or equivalent alchemical knowledge', rollCharacteristic: ['reason', 'intuition'], yield: { amount: '3', display: '' }, goal: 30 },
    img: 'icons/commodities/stone/stone-meterorite-glowing-yellow.webp',
  }));

  items.push(mkTreasure({
    name: 'Norn-Thread Fragment', category: 'consumable', echelon: 1, folderId: consFolder._id,
    desc: [
      '<p><em>A short length of shimmering thread that seems to shift colour depending on the angle — sometimes gold, sometimes black. It feels warm and impossibly heavy for its size.</em></p>',
      '<p><strong>Effect:</strong> As a maneuver, you snap the thread. Until the end of your next turn, you gain an edge on power rolls. After the effect ends, you are dazed until the end of your following turn as glimpses of possible futures crowd your vision.</p>',
    ].join(''),
    keywords: ['magic'],
    project: { prerequisites: 'A thread harvested from a Norn-loom, or gifted by a seidr-walker', source: 'The Loom-Circle or a Vanir sacred grove', rollCharacteristic: ['intuition'], yield: { amount: '1', display: '' }, goal: 60 },
    img: 'icons/commodities/cloth/ribbon-bow-teal.webp',
  }));

  items.push(mkTreasure({
    name: 'Troll-Fat Salve', category: 'consumable', echelon: 1, folderId: consFolder._id,
    desc: [
      '<p><em>A greasy, grey-green unguent that stinks abominably. Only the desperate use it willingly.</em></p>',
      '<p><strong>Effect:</strong> As a maneuver, you apply the salve to yourself or an adjacent creature. The target regains Stamina equal to twice their level at the start of each of their turns for 3 rounds. The stench imposes a bane on all Presence tests for the same duration.</p>',
    ].join(''),
    keywords: ['magic', 'potion'],
    project: { prerequisites: 'Rendered fat from a troll; alchemical fixative', source: 'Texts or lore from troll-hunters or the Quiet Wardens', rollCharacteristic: ['reason', 'intuition'], yield: { amount: '1', display: '' }, goal: 45 },
    img: 'icons/consumables/potions/potion-bottle-corked-stopper-yellow.webp',
  }));

  items.push(mkTreasure({
    name: "Bone-Mender's Draught", category: 'consumable', echelon: 1, folderId: consFolder._id,
    desc: [
      '<p><em>A bitter, bark-brown liquid brewed from willow-bark, juniper, and rendered marrow. It warms the gut and dulls pain.</em></p>',
      '<p><strong>Effect:</strong> As a maneuver, you drink the draught. You regain Stamina equal to half your recovery value (rounded up) without spending a Recovery. [[/heal floor(@recoveries.recoveryValue / 2 + 0.5)]]</p>',
    ].join(''),
    keywords: ['potion'],
    project: { prerequisites: 'Willow-bark, juniper berries, rendered marrow', source: 'Knowledge of herbal medicine (any bone-mender or healer)', rollCharacteristic: ['reason', 'intuition'], yield: { amount: '2', display: '' }, goal: 25 },
    img: 'icons/consumables/potions/potion-bottle-corked-labeled-red.webp',
  }));

  items.push(mkTreasure({
    name: "Skald's Honey-Mead", category: 'consumable', echelon: 1, folderId: consFolder._id,
    desc: [
      "<p><em>Golden mead laced with rare upland honey and a whispered verse. It fills the drinker with resolve.</em></p>",
      '<p><strong>Effect:</strong> As a maneuver, you drink the mead. You gain temporary Stamina equal to your level + 2. This temporary Stamina lasts until the end of the encounter.</p>',
    ].join(''),
    keywords: ['potion'],
    project: { prerequisites: 'Upland honey; mead-brewing equipment', source: 'A practising skald or hall-singer', rollCharacteristic: ['intuition', 'presence'], yield: { amount: '2', display: '' }, goal: 20 },
    img: 'icons/consumables/drinks/alcohol-spirits-bottle-blue.webp',
  }));

  items.push(mkTreasure({
    name: 'Peat-Smoke Pastille', category: 'consumable', echelon: 1, folderId: consFolder._id,
    desc: [
      '<p><em>A small, dark tablet that crumbles to fragrant smoke when crushed. It smells of hearth-fires and home.</em></p>',
      '<p><strong>Effect:</strong> As a maneuver, you crush the pastille and inhale the smoke (or hold it near an adjacent ally). The target can spend a Recovery and regains additional Stamina equal to their level.</p>',
    ].join(''),
    keywords: ['magic'],
    project: { prerequisites: 'Enchanted peat, aromatic herbs, a combustion agent', source: 'Ashwright Kins recipe or equivalent folk remedy', rollCharacteristic: ['intuition'], yield: { amount: '3', display: '' }, goal: 30 },
    img: 'icons/consumables/potions/vial-cork-blue.webp',
  }));

  console.log('  Consumables: 7');

  // ══════════════════════════════════════════════════════════════════
  // TRINKETS (Echelon 1) — formerly in svellheim-rewards
  // ══════════════════════════════════════════════════════════════════

  items.push(mkTreasure({
    name: 'Hacksilver Torc of Wergild', category: 'trinket', echelon: 1, folderId: trinkFolder._id,
    desc: [
      '<p><em>A heavy silver neck-ring stamped with law-marks from a dozen different Things. Wearing it openly declares you a person of worth and legal standing.</em></p>',
      '<p><strong>Effect:</strong> While you wear this torc, you gain an edge on Presence tests made to invoke law, negotiate blood-prices, or demand legal rights at a Thing assembly.</p>',
    ].join(''),
    keywords: ['magic', 'neck'],
    project: { prerequisites: 'Silver worth at least 200 hacksilver; a law-mark stamp', source: 'A practising Lawspeaker or Chainwarden notary', rollCharacteristic: ['presence'], yield: { amount: '1', display: '' }, goal: 120 },
    img: 'icons/equipment/neck/torc-ball-captive.webp',
  }));

  items.push(mkTreasure({
    name: 'Draugr-Tooth Amulet', category: 'trinket', echelon: 1, folderId: trinkFolder._id,
    desc: [
      '<p><em>A blackened molar strung on sinew, carved with a tiny binding rune. It was pulled from a properly slain draugr.</em></p>',
      '<p><strong>Effect:</strong> While you wear this amulet, you gain an edge on resistance rolls against fear effects from undead creatures.</p>',
    ].join(''),
    keywords: ['magic', 'neck'],
    project: { prerequisites: "A tooth from a draugr that was properly laid to rest (head between buttocks, body burned)", source: 'Instruction from a Quiet Warden', rollCharacteristic: ['intuition'], yield: { amount: '1', display: '' }, goal: 100 },
    img: 'icons/commodities/bones/tooth-shark-brown-white.webp',
  }));

  items.push(mkTreasure({
    name: 'Ward-Stave Bracer', category: 'trinket', echelon: 1, folderId: trinkFolder._id,
    desc: [
      '<p><em>A leather bracer with thin ash-wood slats stitched into the surface, each inscribed with protective galdr in the Old Tongue.</em></p>',
      '<p><strong>Effect:</strong> While you wear this bracer, once per encounter when you take damage from a magical source, you can reduce that damage by an amount equal to your level (no action required).</p>',
    ].join(''),
    keywords: ['magic', 'arms'],
    project: { prerequisites: 'Ash-wood slats, runecraft tools, treated leather', source: 'A rune-reader or Veil-Council arcanist', rollCharacteristic: ['reason'], yield: { amount: '1', display: '' }, goal: 120 },
    img: 'icons/equipment/hand/gauntlet-tooled-leather-brown.webp',
  }));

  items.push(mkTreasure({
    name: 'Lantern of the Road', category: 'trinket', echelon: 1, folderId: trinkFolder._id,
    desc: [
      '<p><em>A battered iron lantern bearing the brand of the Lantern Road. Its flame is pale blue and sheds no smoke.</em></p>',
      '<p><strong>Effect:</strong> This lantern cannot be extinguished by wind, rain, or being dropped. It sheds bright light in a 5-square radius. While the lantern is lit and you carry it openly, you gain an edge on tests to navigate, resist becoming lost, and find safe paths through wilderness.</p>',
    ].join(''),
    keywords: ['magic'],
    project: { prerequisites: 'An iron lantern; a flame willingly given by a Lantern Road member', source: 'The Lantern Road guild', rollCharacteristic: ['intuition'], yield: { amount: '1', display: '' }, goal: 100 },
    img: 'icons/magic/light/light-lantern-lit-white.webp',
  }));

  items.push(mkTreasure({
    name: "Fossegrim's Fiddle-String", category: 'trinket', echelon: 1, folderId: trinkFolder._id,
    desc: [
      '<p><em>A single shimmering string that hums faintly when plucked, even when not attached to an instrument. It was gifted — or won — from a waterfall spirit.</em></p>',
      '<p><strong>Effect:</strong> When this string is attached to an instrument, performances made with that instrument gain an edge on Presence tests to influence or calm fey creatures. Additionally, once per encounter, a performance with this instrument can end the frightened condition on one ally who can hear you.</p>',
    ].join(''),
    keywords: ['magic'],
    project: { prerequisites: "A string freely given by a fossegrim (cannot be taken by force)", source: "Bargaining with a fossegrim — they typically demand a white goat thrown into a waterfall", rollCharacteristic: ['presence'], yield: { amount: '1', display: '' }, goal: 80 },
    img: 'icons/tools/instruments/harp-gold-glowing.webp',
  }));

  console.log('  Trinkets: 5');

  // ══════════════════════════════════════════════════════════════════
  // FEATURES (granted by titles) — must be created before titles
  // ══════════════════════════════════════════════════════════════════

  // -- Echelon 1 features --
  const fEmberKeeperLore = mkFeature({
    name: 'Ember-Keeper Lore', folderId: grantFolder._id,
    desc: '<p>You gain the Ember-Keeper Lore skill. Once per respite, you can identify whether an object, location, or creature has a connection to the Primal Spark or primordial fire magic.</p>',
    img: 'icons/magic/fire/flame-burning-hand-white.webp',
  });
  const fEmberKeeperSalvage = mkFeature({
    name: 'Ember-Keeper Salvage', folderId: grantFolder._id,
    desc: '<p>When you complete a respite in a ruin or ancient site, you can make an easy Reason test to recover a minor alchemical component or runecraft material worth up to 10 hacksilver.</p>',
    img: 'icons/consumables/potions/vial-ornet-silver-black.webp',
  });
  const fLanternBearerLight = mkFeature({
    name: 'Lantern-Bearer\'s Light', folderId: grantFolder._id,
    desc: '<p>You can spend a maneuver to invoke the Lantern Road oath. Until the end of the encounter, your carried light source cannot be extinguished by any means, and allies within 5 squares of you gain an edge on resistance rolls against fear effects.</p>',
    img: 'icons/magic/light/light-lantern-lit-white.webp',
  });
  const fLanternBearerWay = mkFeature({
    name: 'Lantern-Bearer\'s Way', folderId: grantFolder._id,
    desc: '<p>You gain an edge on tests to navigate overland, and your group\'s overland travel speed increases by 1 mile per day.</p>',
    img: 'icons/tools/navigation/map-marked-green.webp',
  });
  const fDraugrSlayerRites = mkFeature({
    name: 'Draugr-Slayer Rites', folderId: grantFolder._id,
    desc: '<p>You know the proper rites to lay undead to rest. When you reduce an undead creature to 0 Stamina, it cannot rise again through innate abilities or necromantic effects. Additionally, you gain an edge on tests to identify undead weaknesses.</p>',
    img: 'icons/magic/fire/flame-burning-earth-orange.webp',
  });
  const fDraugrSlayerNerve = mkFeature({
    name: 'Draugr-Slayer\'s Nerve', folderId: grantFolder._id,
    desc: '<p>You have advantage on resistance rolls against fear effects caused by undead. When an undead creature attempts to frighten you and fails, you gain a +1 bonus to your next power roll against that creature.</p>',
    img: 'icons/skills/melee/strike-sword-steel-yellow.webp',
  });
  const fThingSpeakerVoice = mkFeature({
    name: 'Thing-Speaker\'s Voice', folderId: grantFolder._id,
    desc: '<p>You gain an edge on Presence tests to persuade, negotiate, or make legal arguments at a Thing assembly or other formal gathering. Once per session, you can invoke precedent to force a reroll of a social interaction test made against you.</p>',
    img: 'icons/skills/social/diplomacy-handshake.webp',
  });
  const fThingSpeakerLaw = mkFeature({
    name: 'Thing-Speaker\'s Law', folderId: grantFolder._id,
    desc: '<p>You gain the Law skill (or another lore skill if you already have it). You know the wergild value of every social rank and can accurately assess the legal standing of any person you converse with for at least one minute.</p>',
    img: 'icons/sundries/books/book-open-brown.webp',
  });
  const fRuneMarkPower = mkFeature({
    name: 'Rune-Mark Power', folderId: grantFolder._id,
    desc: '<p>Once per encounter, as a free triggered action when you make a power roll, you can invoke the rune on your body. You gain a +2 bonus to that power roll. After the effect resolves, you take damage equal to your level as the rune burns.</p>',
    img: 'icons/magic/symbols/runes-star-pentagon-blue.webp',
  });
  const fRuneMarkInsight = mkFeature({
    name: 'Rune-Mark Insight', folderId: grantFolder._id,
    desc: '<p>You can read and understand basic galdr inscriptions without a test. When you encounter a rune-stave or warded area, you automatically learn whether it is protective, offensive, or communicative in nature.</p>',
    img: 'icons/magic/symbols/runes-etched-steel-blade.webp',
  });

  // -- Echelon 2 features --
  const fRedRivetSecrets = mkFeature({
    name: 'Red-Rivet Secrets', folderId: grantFolder._id,
    desc: '<p>You gain an edge on crafting tests involving metal. When you work at a Red-Rivet forge, you can complete crafting projects in half the normal time.</p>',
    img: 'icons/tools/smithing/anvil.webp',
  });
  const fRedRivetReputation = mkFeature({
    name: 'Red-Rivet Reputation', folderId: grantFolder._id,
    desc: '<p>Your association with the Red-Rivet Compact is known. You gain an edge on Presence tests when dealing with smiths, miners, or the Compact\'s allies. You can requisition basic metalwork supplies from any Red-Rivet forge without payment (up to 20 hacksilver per respite).</p>',
    img: 'icons/commodities/metal/fragments-sword-steel.webp',
  });
  const fQuietWardenRites = mkFeature({
    name: 'Quiet Warden Rites', folderId: grantFolder._id,
    desc: '<p>You know the funeral rites of the Quiet Wardens. As a 10-minute activity, you can perform last rites on up to 6 corpses, preventing them from rising as undead. Additionally, you can sense the presence of undead within 10 squares as a maneuver (you know their approximate number and direction, not exact location).</p>',
    img: 'icons/magic/holy/prayer-hands-glowing-yellow.webp',
  });
  const fQuietWardenVigilance = mkFeature({
    name: 'Quiet Warden Vigilance', folderId: grantFolder._id,
    desc: '<p>You cannot be surprised by undead creatures. When initiative is rolled and undead are present, you can shift up to 2 squares as a free triggered action.</p>',
    img: 'icons/skills/melee/weapons-crossed-swords-purple.webp',
  });
  const fFateTouchedVisions = mkFeature({
    name: 'Fate-Touched Visions', folderId: grantFolder._id,
    desc: '<p>Once per session, you can ask the Director a single yes-or-no question about a course of action you are about to take. The Director answers truthfully based on what the Norns would know. After receiving the answer, you are dazed until the end of your next turn as the vision recedes.</p>',
    img: 'icons/magic/perception/eye-ringed-glow-angry-small-teal.webp',
  });
  const fFateTouchedResilience = mkFeature({
    name: 'Fate-Touched Resilience', folderId: grantFolder._id,
    desc: '<p>You have glimpsed your own death and it was not here. Once per encounter, when you would be reduced to 0 Stamina, you can instead be reduced to 1 Stamina. You can\'t use this feature again until you complete a respite.</p>',
    img: 'icons/magic/time/hourglass-tilted-gray.webp',
  });

  items.push(
    fEmberKeeperLore, fEmberKeeperSalvage,
    fLanternBearerLight, fLanternBearerWay,
    fDraugrSlayerRites, fDraugrSlayerNerve,
    fThingSpeakerVoice, fThingSpeakerLaw,
    fRuneMarkPower, fRuneMarkInsight,
    fRedRivetSecrets, fRedRivetReputation,
    fQuietWardenRites, fQuietWardenVigilance,
    fFateTouchedVisions, fFateTouchedResilience,
  );
  console.log('  Title Grants: 16');

  // ══════════════════════════════════════════════════════════════════
  // TITLES — must be after features (they reference feature _ids)
  // ══════════════════════════════════════════════════════════════════

  // -- Echelon 1 --
  items.push(mkTitle({
    name: 'Ember-Keeper Initiate', echelon: 1, folderId: titleFolder._id,
    story: 'You recovered a fragment of the Primal Spark or joined the Ember-Keepers — the technologist-archaeologists who believe the answer to the Fimbulwinter lies buried in the Elder Age.',
    prerequisites: 'You discovered an artefact connected to the Primal Spark, or performed a significant service for the Ember-Keepers.',
    featureIds: [fEmberKeeperLore._id, fEmberKeeperSalvage._id],
    img: 'icons/magic/fire/flame-burning-hand-white.webp',
  }));

  items.push(mkTitle({
    name: 'Lantern-Bearer', echelon: 1, folderId: titleFolder._id,
    story: 'You kept the Lantern Road open through a deadly passage — whether blizzard, raiders, or worse. The teamsters and wayfinders remember.',
    prerequisites: 'You kept a road, pass, or route open against significant opposition, saving lives in the process.',
    featureIds: [fLanternBearerLight._id, fLanternBearerWay._id],
    img: 'icons/magic/light/light-lantern-lit-white.webp',
  }));

  items.push(mkTitle({
    name: 'Draugr-Slayer', echelon: 1, folderId: titleFolder._id,
    story: "You put down your first draugr with the proper rites — head between buttocks, body burned. The Quiet Wardens took notice.",
    prerequisites: 'You destroyed an undead creature and performed the proper funeral rites.',
    featureIds: [fDraugrSlayerRites._id, fDraugrSlayerNerve._id],
    img: 'icons/magic/fire/flame-burning-earth-orange.webp',
  }));

  items.push(mkTitle({
    name: 'Thing-Speaker', echelon: 1, folderId: titleFolder._id,
    story: 'You won a case at the Thing through argument alone — no blades drawn, no threats made. The Lawspeaker smiled.',
    prerequisites: 'You successfully argued a case, brokered a peace, or settled a blood-debt at a Thing assembly.',
    featureIds: [fThingSpeakerVoice._id, fThingSpeakerLaw._id],
    img: 'icons/skills/social/diplomacy-handshake.webp',
  }));

  items.push(mkTitle({
    name: 'Rune-Marked', echelon: 1, folderId: titleFolder._id,
    story: 'A rune manifested on your body after channelling galdr — burned into your skin by forces you don\'t fully understand. It pulses when magic is near.',
    prerequisites: 'You channelled galdr or interacted with powerful rune-magic and survived a backlash that left a permanent mark.',
    featureIds: [fRuneMarkPower._id, fRuneMarkInsight._id],
    img: 'icons/magic/symbols/runes-star-pentagon-blue.webp',
  }));

  // -- Echelon 2 --
  items.push(mkTitle({
    name: 'Red-Rivet Sworn', echelon: 2, folderId: titleFolder._id,
    story: 'You earned the trust of the Red-Rivet Compact — the smiths\' guild that controls all worked iron in Svellheim. "Iron does not forgive," they say, and neither do they, but they respect strength and skill.',
    prerequisites: 'You performed a significant service for the Red-Rivet Compact or demonstrated exceptional skill in metallurgy.',
    featureIds: [fRedRivetSecrets._id, fRedRivetReputation._id],
    img: 'icons/tools/smithing/anvil.webp',
  }));

  items.push(mkTitle({
    name: 'Quiet Warden', echelon: 2, folderId: titleFolder._id,
    story: 'The funerary order inducted you after you proved your dedication to keeping the dead where they belong — in the ground, not walking.',
    prerequisites: 'You destroyed multiple undead threats and performed proper funeral rites for the fallen. A Quiet Warden vouched for you.',
    featureIds: [fQuietWardenRites._id, fQuietWardenVigilance._id],
    img: 'icons/magic/holy/prayer-hands-glowing-yellow.webp',
  }));

  items.push(mkTitle({
    name: 'Fate-Touched', echelon: 2, folderId: titleFolder._id,
    story: 'A Norn showed you your death-thread. You saw how and when you will die. You act differently now — with either reckless courage or eerie calm.',
    prerequisites: 'You encountered a Norn, a seidr-walker, or a fate-spirit and glimpsed your own death. You survived the experience.',
    featureIds: [fFateTouchedVisions._id, fFateTouchedResilience._id],
    img: 'icons/magic/time/hourglass-tilted-gray.webp',
  }));

  console.log('  Titles: 8');

  return { folders, items };
}

// ── LevelDB writer ────────────────────────────────────────────────────
// Foundry VTT stores embedded effects as separate LevelDB entries.

async function writeLevelDb({ folders, items }, outDir) {
  const { ClassicLevel } = require('classic-level');

  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  const db = new ClassicLevel(outDir, { keyEncoding: 'utf8', valueEncoding: 'utf8' });
  await db.open();

  for (const f of folders) await db.put(`!folders!${f._id}`, JSON.stringify(f));

  for (const i of items) {
    const effects = Array.isArray(i.effects) ? i.effects : [];
    for (const e of effects) {
      await db.put(`!items.effects!${i._id}.${e._id}`, JSON.stringify(e));
    }
    const itemDoc = { ...i, effects: effects.map(e => e._id) };
    await db.put(`!items!${i._id}`, JSON.stringify(itemDoc));
  }

  await db.compactRange('\x00', '\xff');
  await db.close();
}

// ── Main ──────────────────────────────────────────────────────────────

async function main() {
  console.log('Building consolidated svellheim-items pack...\n');

  const { folders, items } = buildContent();

  await writeLevelDb({ folders, items }, PACK_DIR);

  const byType = {};
  for (const i of items) byType[i.type] = (byType[i.type] || 0) + 1;

  console.log(`\nWrote pack: ${path.relative(REPO_ROOT, PACK_DIR)} (${items.length} items, ${folders.length} folders)`);
  console.log('By type:');
  for (const [t, c] of Object.entries(byType).sort()) console.log(`  ${t}: ${c}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
