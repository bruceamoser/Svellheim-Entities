#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Build the Svellheim Rewards compendium pack — projects, treasures, titles,
 * and their granted features/abilities — themed for the Fimbulwinter setting.
 *
 * Usage:
 *   node tools/build_svellheim_rewards_pack.js
 *
 * Output:
 *   svellheim-character-options/module/packs/svellheim-rewards/  (LevelDB pack folder)
 */

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const REPO_ROOT = process.cwd();

const MODULE_ID = 'svellheim-character-options';
const PACK_NAME = 'svellheim-rewards';
const PACK_DIR = path.join(REPO_ROOT, 'foundry-svellheim-character-options', 'module', 'packs', PACK_NAME);

// ---------------------------------------------------------------------------
// Shared helpers (same patterns as the character-options build)
// ---------------------------------------------------------------------------

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

function foundryId(slug) {
  return base62FromBuffer(crypto.createHash('sha1').update(slug).digest().subarray(0, 12), 16);
}

function mkStats() {
  return {
    compendiumSource: null, duplicateSource: null, exportSource: null,
    coreVersion: '13', systemId: 'draw-steel', systemVersion: null,
    createdTime: Date.now(), modifiedTime: null, lastModifiedBy: null,
  };
}

function mkFolder({ name, parentId = null, sorting = 'a', sort = 0 }) {
  const slug = slugify(name);
  const parentPart = parentId || 'root';
  return {
    type: 'Item', folder: parentId, name, color: null, sorting, sort,
    _id: foundryId(`svr-folder:${parentPart}:${slug}`),
    description: '', flags: {}, _stats: mkStats(),
  };
}

function itemId(type, slug) { return foundryId(`svr-${type}:${slug}`); }

function mkUuid(id) { return `Compendium.${MODULE_ID}.${PACK_NAME}.Item.${id}`; }

function mkSource() {
  return { book: 'Svellheim Campaign', page: '', license: 'Homebrew' };
}

// ---------------------------------------------------------------------------
// Item factory functions
// ---------------------------------------------------------------------------

function mkProject({ name, dsid, type, desc, prerequisites, projectSource, chars, goal, img }) {
  const slug = dsid || slugify(name);
  const _id = itemId('project', slug);
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
      points: 0,
      events: '',
      yield: { item: null, amount: '', display: '' },
      goal: goal || null,
    },
    effects: [], ownership: { default: 0 }, flags: {}, _stats: mkStats(),
  };
}

function mkTreasure({ name, dsid, category, echelon, desc, keywords, project, img }) {
  const slug = dsid || slugify(name);
  const _id = itemId('treasure', slug);
  return {
    _id, name, type: 'treasure', folder: null, sort: 0,
    img: img || 'icons/svg/item-bag.svg',
    system: {
      description: { value: desc, director: '' },
      source: mkSource(), _dsid: slug,
      kind: '', category, echelon: echelon || 1,
      keywords: keywords || [],
      quantity: 1,
      project: project || {
        prerequisites: '', source: '', rollCharacteristic: [], yield: { amount: '1', display: '' }, goal: null,
      },
    },
    effects: [], ownership: { default: 0 }, flags: {}, _stats: mkStats(),
  };
}

function mkTitle({ name, dsid, echelon, story, prerequisites, featureIds, desc, img }) {
  const slug = dsid || slugify(name);
  const _id = itemId('title', slug);

  // Build the advancement that grants features
  const advId = foundryId(`svr-adv:${slug}`);
  const pool = (featureIds || []).map((fid) => ({ uuid: mkUuid(fid) }));

  // Build embed-style description listing the features
  const embedLines = (featureIds || []).map((fid) =>
    `<li><p>@Embed[${mkUuid(fid)} inline]</p></li>`
  );
  const fullDesc = desc || [
    '<p><strong>Effect:</strong> Choose one of the following benefits:</p>',
    '<ul>', ...embedLines, '</ul>',
  ].join('');

  return {
    _id, name, type: 'title', folder: null, sort: 0,
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

function mkFeature({ name, dsid, desc, effects, img }) {
  const slug = dsid || slugify(name);
  const _id = itemId('feature', slug);
  return {
    _id, name, type: 'feature', folder: null, sort: 0,
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

// ---------------------------------------------------------------------------
// Content definitions
// ---------------------------------------------------------------------------

function buildAllContent() {
  const folders = [];
  const items = [];

  // ── Top-level folders ──────────────────────────────────────────────
  const projectsRoot   = mkFolder({ name: 'Downtime Projects', sort: 100000 });
  const treasuresRoot  = mkFolder({ name: 'Treasures', sort: 200000 });
  const titlesRoot     = mkFolder({ name: 'Titles', sort: 300000 });

  const craftingFolder = mkFolder({ name: 'Crafting', parentId: projectsRoot._id, sort: 100000 });
  const researchFolder = mkFolder({ name: 'Research', parentId: projectsRoot._id, sort: 200000 });
  const otherFolder    = mkFolder({ name: 'Other',    parentId: projectsRoot._id, sort: 300000 });

  const consE1Folder   = mkFolder({ name: 'Consumables — Echelon 1', parentId: treasuresRoot._id, sort: 100000 });
  const trinkE1Folder  = mkFolder({ name: 'Trinkets — Echelon 1', parentId: treasuresRoot._id, sort: 200000 });

  const titlesE1       = mkFolder({ name: '1st Echelon', parentId: titlesRoot._id, sort: 100000 });
  const titlesE1Grants = mkFolder({ name: 'Grants', parentId: titlesE1._id, sort: 100000 });
  const titlesE2       = mkFolder({ name: '2nd Echelon', parentId: titlesRoot._id, sort: 200000 });
  const titlesE2Grants = mkFolder({ name: 'Grants', parentId: titlesE2._id, sort: 100000 });

  folders.push(
    projectsRoot, craftingFolder, researchFolder, otherFolder,
    treasuresRoot, consE1Folder, trinkE1Folder,
    titlesRoot, titlesE1, titlesE1Grants, titlesE2, titlesE2Grants,
  );

  // ══════════════════════════════════════════════════════════════════
  // PROJECTS — Crafting
  // ══════════════════════════════════════════════════════════════════

  const pImbueWeapon = mkProject({
    name: 'Imbue Weapon',
    type: 'crafting',
    desc: [
      '<p>You work with a skilled rune-carver or smith to imbue a weapon with supernatural power. The weapon must be of masterwork quality or made from rare materials (star-metal, troll-bone, etc.).</p>',
      '<p>When you start this project, choose a weapon you possess. When the project is complete, the weapon gains a magical property determined by the Director based on the materials and techniques used. This might grant bonus damage, a keyword, or a special on-hit effect.</p>',
      '<p>Subsequent imbuing of the same weapon costs half the project points of the initial imbuing.</p>',
    ].join(''),
    prerequisites: 'A masterwork or rare-material weapon; access to a forge',
    projectSource: 'A smith or rune-carver of higher level, or texts describing the technique',
    chars: ['reason', 'intuition'],
    goal: 150,
    img: 'icons/weapons/swords/greatsword-crossguard-steel.webp',
  });
  pImbueWeapon.folder = craftingFolder._id;

  const pImbueArmor = mkProject({
    name: 'Imbue Armor',
    type: 'crafting',
    desc: [
      '<p>You work with a skilled rune-carver or smith to imbue a suit of armor or a shield with supernatural protection. The armor must be of masterwork quality or made from rare materials (star-metal, lindworm-scale, glacier-ice, etc.).</p>',
      '<p>When you start this project, choose a piece of armor or a shield you possess. When the project is complete, the armor gains a magical property determined by the Director based on the materials and techniques used. This might grant bonus Stamina, a damage resistance, or a special defensive effect.</p>',
      '<p>Subsequent imbuing of the same armor costs half the project points of the initial imbuing.</p>',
    ].join(''),
    prerequisites: 'A masterwork or rare-material armor or shield; access to a forge',
    projectSource: 'A smith or rune-carver of higher level, or texts describing the technique',
    chars: ['reason', 'intuition'],
    goal: 200,
    img: 'icons/equipment/chest/breastplate-banded-steel-gold.webp',
  });
  pImbueArmor.folder = craftingFolder._id;

  const pForgeStarMetal = mkProject({
    name: 'Forge Star-Metal Weapon',
    type: 'crafting',
    desc: [
      '<p>You work a fragment of meteoric iron — star-metal — in the traditions of the Red-Rivet Compact. Star-metal must be worked at extreme heat and quenched in blood or ash-water. The process is gruelling and the material unforgiving.</p>',
      '<p>When you complete this project, you produce one star-metal weapon. Star-metal weapons count as magical and deal bonus damage equal to your level on critical hits.</p>',
    ].join(''),
    prerequisites: 'A fragment of star-metal (meteorite iron); a Red-Rivet forge or equivalent',
    projectSource: 'Instruction from a Red-Rivet master, or recovered forging texts',
    chars: ['might', 'reason'],
    goal: 300,
    img: 'icons/weapons/hammers/hammer-war-rounding.webp',
  });
  pForgeStarMetal.folder = craftingFolder._id;

  const pCarveWardStaves = mkProject({
    name: 'Carve Ward-Staves',
    type: 'crafting',
    desc: [
      '<p>You inscribe rune-posts with protective galdr to ward a settlement or camp against the restless dead. The staves must be placed at the boundaries of the area to be warded and require regular recharging.</p>',
      '<p>When you complete this project, you create a set of ward-staves sufficient to protect a small settlement (up to 20 structures). Undead that attempt to cross the ward boundary suffer a bane on all power rolls while within the warded area.</p>',
    ].join(''),
    prerequisites: 'Seasoned ash-wood posts; runecraft tools; knowledge of protective galdr',
    projectSource: 'Instruction from a Quiet Warden or rune-reader, or recovered galdr texts',
    chars: ['reason', 'intuition'],
    goal: 120,
    img: 'icons/environment/wilderness/carved-standing-stone.webp',
  });
  pCarveWardStaves.folder = craftingFolder._id;

  const pBuildIceRunner = mkProject({
    name: 'Build Ice-Runner',
    type: 'crafting',
    desc: [
      '<p>You construct a wind-driven sled reinforced with bone runners and a hide sail, designed for crossing the frozen expanses of the White Waste or the ice-locked fjords.</p>',
      '<p>When you complete this project, you produce one ice-runner. An ice-runner can carry up to six passengers and their gear across ice and packed snow at twice overland travel speed. It requires wind to function; in calm conditions it must be man-hauled.</p>',
    ].join(''),
    prerequisites: 'Timber, bone, cured hides, and rope; carpentry tools',
    projectSource: 'Instruction from a Lantern Road teamster or northern nomad',
    chars: ['might', 'reason'],
    goal: 180,
    img: 'icons/tools/navigation/map-chart-tan.webp',
  });
  pBuildIceRunner.folder = craftingFolder._id;

  const pRepairHearthStone = mkProject({
    name: 'Repair the Hearth-Stone',
    type: 'crafting',
    desc: [
      '<p>You restore a shattered communal hearthstone — the rune-carved slab at the centre of a longhouse that channels warmth through the structure. Without a functioning hearthstone, a community burns twice as much fuel to stay alive.</p>',
      '<p>When you complete this project, the hearthstone is restored. The settlement it serves halves its fuel consumption and gains +1 Stability (as per the stronghold rules, if used).</p>',
    ].join(''),
    prerequisites: 'The fragments of the original hearthstone (or equivalent stone); runecraft tools',
    projectSource: 'Instruction from an elder rune-reader or recovered galdr texts',
    chars: ['reason', 'presence'],
    goal: 100,
    img: 'icons/environment/settlement/fire-camp.webp',
  });
  pRepairHearthStone.folder = craftingFolder._id;

  // ══════════════════════════════════════════════════════════════════
  // PROJECTS — Research
  // ══════════════════════════════════════════════════════════════════

  const pDecipherRuneStave = mkProject({
    name: 'Decipher Rune-Stave',
    type: 'research',
    desc: [
      '<p>You study an ancient carved stave — a plank or post inscribed with galdr in the Old Tongue — to learn the rune-word it encodes. Rune-staves are found in barrows, collapsed stave-temples, and the ruins of the Elder Age.</p>',
      '<p>When you complete this project, you learn the galdr inscription and can reproduce its effect. The Director determines the specific rune-word and its mechanical application.</p>',
    ].join(''),
    prerequisites: 'Access to the rune-stave (or a detailed rubbing/sketch)',
    projectSource: 'The rune-stave itself, plus reference texts in the Old Tongue',
    chars: ['reason', 'intuition'],
    goal: 120,
    img: 'icons/sundries/documents/document-sealed-signatures-red.webp',
  });
  pDecipherRuneStave.folder = researchFolder._id;

  const pMapDeepRoads = mkProject({
    name: 'Map the Deep Roads',
    type: 'research',
    desc: [
      '<p>You chart a safe passage through the Deepforged tunnels beneath Midgard\'s Shield. The Deep Roads are vast, unstable, and haunted by deep-dwellers. Mapping even a short stretch is a significant feat.</p>',
      '<p>When you complete this project, you have a reliable route through a section of the Deep Roads. Travel through that section takes half the normal time and does not require navigation tests.</p>',
    ].join(''),
    prerequisites: 'Access to the tunnel entrance; surveying tools or a guide',
    projectSource: 'A Deepforged guide or recovered Stone-Pact survey records',
    chars: ['reason', 'intuition'],
    goal: 150,
    img: 'icons/tools/navigation/map-chart-tan.webp',
  });
  pMapDeepRoads.folder = researchFolder._id;

  const pStudyTheBlight = mkProject({
    name: 'Study the Blight',
    type: 'research',
    desc: [
      '<p>You investigate the corruption spreading through the Ashen Woods — a creeping decay that twists plants, poisons water, and breeds monstrosities. Understanding its source is the first step towards stopping it.</p>',
      '<p>When you complete this project, you learn one significant fact about the Blight\'s origin, vector, or weakness, as determined by the Director.</p>',
    ].join(''),
    prerequisites: 'Samples of blighted material (safely contained)',
    projectSource: 'Field study in the Ashen Woods, or texts from the Veil-Council',
    chars: ['reason', 'intuition'],
    goal: 120,
    img: 'icons/magic/nature/root-vine-entangled-green.webp',
  });
  pStudyTheBlight.folder = researchFolder._id;

  const pLearnNeedFireRite = mkProject({
    name: 'Learn the Need-Fire Rite',
    type: 'research',
    desc: [
      '<p>You piece together the fragments of the Need-Fire — the legendary ritual that could reignite the sun\'s connection to the mortal world. The rite requires reconciling Aesir temple liturgy with Vanir wild magic, a feat of theological and arcane scholarship that hasn\'t been attempted in living memory.</p>',
      '<p>This is a campaign-scale project. When you accumulate enough project points, the Director will reveal the next component or step of the ritual.</p>',
    ].join(''),
    prerequisites: 'Access to both Aesir and Vanir sacred texts or practitioners',
    projectSource: 'Scattered across temples, groves, and barrow-libraries throughout Svellheim',
    chars: ['reason', 'intuition', 'presence'],
    goal: null,
    img: 'icons/magic/fire/flame-burning-campfire-orange.webp',
  });
  pLearnNeedFireRite.folder = researchFolder._id;

  const pTranslateHollowCipher = mkProject({
    name: "Translate the Hollow Council's Cipher",
    type: 'research',
    desc: [
      '<p>You work to crack the coded language used by the Hollow Council — the secret aristocracy of intelligent undead. Their messages are written in an archaic dialect laced with necromantic shorthand.</p>',
      '<p>When you complete this project, you can read Hollow Council correspondence. The Director may reveal intelligence about their operations, alliances, or vulnerabilities.</p>',
    ].join(''),
    prerequisites: 'A sample of Hollow Council correspondence (intercepted message, recovered letter)',
    projectSource: 'The correspondence itself, plus reference texts in archaic Svellspraak',
    chars: ['reason'],
    goal: 150,
    img: 'icons/sundries/documents/letter-sealed-black.webp',
  });
  pTranslateHollowCipher.folder = researchFolder._id;

  // ══════════════════════════════════════════════════════════════════
  // PROJECTS — Other
  // ══════════════════════════════════════════════════════════════════

  const pFeedTheStarving = mkProject({
    name: 'Feed the Starving',
    type: 'other',
    desc: [
      '<p>You organise food distribution in a settlement suffering from the Fimbulwinter famine. This involves sourcing provisions, negotiating with hoarding merchants, and physically distributing supplies to those in need.</p>',
      '<p>When you complete this project, the settlement\'s morale improves and you earn the gratitude of the community. The Director determines the narrative reward — this might mean allies, information, safe harbour, or a favour owed.</p>',
    ].join(''),
    projectSource: 'None',
    chars: ['might', 'presence'],
    goal: 75,
    img: 'icons/consumables/food/bread-loaf-round-white.webp',
  });
  pFeedTheStarving.folder = otherFolder._id;

  const pHonourTheDead = mkProject({
    name: 'Honour the Dead',
    type: 'other',
    desc: [
      '<p>You perform proper funeral rites for the unburied dead — burning the bodies, speaking the names, and carving the rune of passage. Without these rites, the dead rise as draugr or worse.</p>',
      '<p>When you complete this project, the restless dead in the area are laid to rest. The Director determines the scope — a single barrow, a battlefield, or a plague-village.</p>',
    ].join(''),
    projectSource: 'None',
    chars: ['intuition', 'presence'],
    goal: 60,
    img: 'icons/magic/fire/flame-burning-skull-orange.webp',
  });
  pHonourTheDead.folder = otherFolder._id;

  const pStrengthenOaths = mkProject({
    name: 'Strengthen Oaths',
    type: 'other',
    desc: [
      '<p>You reinforce the metaphysical bonds of a sworn warband, household, or oath-circle through ritual, song, and shared ordeal. In Svellheim, oaths have literal supernatural weight — a strong oath-bond protects against fear, domination, and despair.</p>',
      '<p>When you complete this project, each member of the oath-circle can, once before the project must be undertaken again, reroll a failed resistance roll against a fear, domination, or charm effect.</p>',
    ].join(''),
    projectSource: 'None',
    chars: ['presence'],
    goal: 90,
    img: 'icons/skills/social/diplomacy-handshake.webp',
  });
  pStrengthenOaths.folder = otherFolder._id;

  const pSeekOutlawrysEnd = mkProject({
    name: "Seek Outlawry's End",
    type: 'other',
    desc: [
      '<p>You petition a Thing (assembly) to lift an outlawry sentence — yours or another\'s. This requires gathering evidence, securing character witnesses, and navigating the complex web of blood-debts and political alliances.</p>',
      '<p>When you complete this project, the outlaw\'s sentence is lifted and they are restored to society. The Director determines any conditions imposed by the Thing.</p>',
    ].join(''),
    prerequisites: 'Knowledge of the original crime; access to a Thing assembly',
    projectSource: 'Witnesses, legal precedents, or the good will of a Lawspeaker',
    chars: ['reason', 'presence'],
    goal: 120,
    img: 'icons/skills/social/wave-halt-stop.webp',
  });
  pSeekOutlawrysEnd.folder = otherFolder._id;

  items.push(
    pImbueWeapon, pImbueArmor, pForgeStarMetal, pCarveWardStaves, pBuildIceRunner, pRepairHearthStone,
    pDecipherRuneStave, pMapDeepRoads, pStudyTheBlight, pLearnNeedFireRite, pTranslateHollowCipher,
    pFeedTheStarving, pHonourTheDead, pStrengthenOaths, pSeekOutlawrysEnd,
  );

  // ══════════════════════════════════════════════════════════════════
  // TREASURES — Consumables (Echelon 1)
  // ══════════════════════════════════════════════════════════════════

  const tRuneDust = mkTreasure({
    name: 'Rune-Dust',
    category: 'consumable', echelon: 1,
    desc: [
      '<p><em>A pouch of fine grey powder inscribed with barely-visible galdr. It smells of iron and burnt birch.</em></p>',
      '<p><strong>Effect:</strong> As a maneuver, you scatter the dust across a threshold, doorway, or boundary up to 2 squares wide. Until the end of the encounter, undead that attempt to cross the boundary suffer a bane on all power rolls until the end of their next turn.</p>',
    ].join(''),
    keywords: ['magic'],
    project: {
      prerequisites: 'Iron filings and birch ash; runecraft tools',
      source: 'Instruction from a Quiet Warden or rune-reader',
      rollCharacteristic: ['reason'],
      yield: { amount: '3', display: '' },
      goal: 30,
    },
    img: 'icons/commodities/materials/ite-ite-ite-ite-powder-ite-blue.webp',
  });
  tRuneDust.folder = consE1Folder._id;

  const tAshwrightFuelStone = mkTreasure({
    name: 'Ashwright Fuel-Stone',
    category: 'consumable', echelon: 1,
    desc: [
      '<p><em>A dense, palm-sized brick of compressed peat and alchemical accelerant. It glows faintly warm even before ignition.</em></p>',
      '<p><strong>Effect:</strong> When lit (no action required), the fuel-stone burns for 8 hours, producing heat equivalent to a large campfire in a 3-square radius. It cannot be extinguished by wind or mundane water. A fuel-stone can keep a small group alive through a night in the open during Fimbulwinter.</p>',
    ].join(''),
    keywords: ['magic'],
    project: {
      prerequisites: 'Peat, alchemical accelerant (from the Ashwright Kins), a press',
      source: 'Ashwright Kins trade secrets or equivalent alchemical knowledge',
      rollCharacteristic: ['reason', 'intuition'],
      yield: { amount: '3', display: '' },
      goal: 30,
    },
    img: 'icons/commodities/stone/ore-chunk-red.webp',
  });
  tAshwrightFuelStone.folder = consE1Folder._id;

  const tNornThreadFragment = mkTreasure({
    name: 'Norn-Thread Fragment',
    category: 'consumable', echelon: 1,
    desc: [
      '<p><em>A short length of shimmering thread that seems to shift colour depending on the angle — sometimes gold, sometimes black. It feels warm and impossibly heavy for its size.</em></p>',
      '<p><strong>Effect:</strong> As a maneuver, you snap the thread. Until the end of your next turn, you gain an edge on power rolls. After the effect ends, you are dazed until the end of your following turn as glimpses of possible futures crowd your vision.</p>',
    ].join(''),
    keywords: ['magic'],
    project: {
      prerequisites: 'A thread harvested from a Norn-loom, or gifted by a seidr-walker',
      source: 'The Loom-Circle or a Vanir sacred grove',
      rollCharacteristic: ['intuition'],
      yield: { amount: '1', display: '' },
      goal: 60,
    },
    img: 'icons/commodities/cloth/thread-spool-gold.webp',
  });
  tNornThreadFragment.folder = consE1Folder._id;

  const tTrollFatSalve = mkTreasure({
    name: 'Troll-Fat Salve',
    category: 'consumable', echelon: 1,
    desc: [
      '<p><em>A greasy, grey-green unguent that stinks abominably. Only the desperate use it willingly.</em></p>',
      '<p><strong>Effect:</strong> As a maneuver, you apply the salve to yourself or an adjacent creature. The target regains Stamina equal to twice their level at the start of each of their turns for 3 rounds. The stench imposes a bane on all Presence tests for the same duration.</p>',
    ].join(''),
    keywords: ['magic', 'potion'],
    project: {
      prerequisites: 'Rendered fat from a troll; alchemical fixative',
      source: 'Texts or lore from troll-hunters or the Quiet Wardens',
      rollCharacteristic: ['reason', 'intuition'],
      yield: { amount: '1', display: '' },
      goal: 45,
    },
    img: 'icons/consumables/potions/bottle-round-corked-yellow.webp',
  });
  tTrollFatSalve.folder = consE1Folder._id;

  // ── Stamina recovery consumables (low-impact) ──

  const tBoneMendersDraught = mkTreasure({
    name: "Bone-Mender's Draught",
    category: 'consumable', echelon: 1,
    desc: [
      '<p><em>A bitter, bark-brown liquid brewed from willow-bark, juniper, and rendered marrow. It warms the gut and dulls pain.</em></p>',
      '<p><strong>Effect:</strong> As a maneuver, you drink the draught. You regain Stamina equal to half your recovery value (rounded up) without spending a Recovery. [[/heal floor(@recoveries.recoveryValue / 2 + 0.5)]]</p>',
    ].join(''),
    keywords: ['potion'],
    project: {
      prerequisites: 'Willow-bark, juniper berries, rendered marrow',
      source: 'Knowledge of herbal medicine (any bone-mender or healer)',
      rollCharacteristic: ['reason', 'intuition'],
      yield: { amount: '2', display: '' },
      goal: 25,
    },
    img: 'icons/consumables/potions/bottle-round-corked-brown.webp',
  });
  tBoneMendersDraught.folder = consE1Folder._id;

  const tSkaldsHoneyMead = mkTreasure({
    name: "Skald's Honey-Mead",
    category: 'consumable', echelon: 1,
    desc: [
      "<p><em>Golden mead laced with rare upland honey and a whispered verse. It fills the drinker with resolve.</em></p>",
      '<p><strong>Effect:</strong> As a maneuver, you drink the mead. You gain temporary Stamina equal to your level + 2. This temporary Stamina lasts until the end of the encounter.</p>',
    ].join(''),
    keywords: ['potion'],
    project: {
      prerequisites: 'Upland honey; mead-brewing equipment',
      source: 'A practising skald or hall-singer',
      rollCharacteristic: ['intuition', 'presence'],
      yield: { amount: '2', display: '' },
      goal: 20,
    },
    img: 'icons/consumables/drinks/alcohol-mead-honey-gold.webp',
  });
  tSkaldsHoneyMead.folder = consE1Folder._id;

  const tPeatSmokePastille = mkTreasure({
    name: 'Peat-Smoke Pastille',
    category: 'consumable', echelon: 1,
    desc: [
      '<p><em>A small, dark tablet that crumbles to fragrant smoke when crushed. It smells of hearth-fires and home.</em></p>',
      '<p><strong>Effect:</strong> As a maneuver, you crush the pastille and inhale the smoke (or hold it near an adjacent ally). The target can spend a Recovery and regains additional Stamina equal to their level.</p>',
    ].join(''),
    keywords: ['magic'],
    project: {
      prerequisites: 'Enchanted peat, aromatic herbs, a combustion agent',
      source: 'Ashwright Kins recipe or equivalent folk remedy',
      rollCharacteristic: ['intuition'],
      yield: { amount: '3', display: '' },
      goal: 30,
    },
    img: 'icons/consumables/potions/vial-cork-black.webp',
  });
  tPeatSmokePastille.folder = consE1Folder._id;

  items.push(
    tRuneDust, tAshwrightFuelStone, tNornThreadFragment, tTrollFatSalve,
    tBoneMendersDraught, tSkaldsHoneyMead, tPeatSmokePastille,
  );

  // ══════════════════════════════════════════════════════════════════
  // TREASURES — Trinkets (Echelon 1)
  // ══════════════════════════════════════════════════════════════════

  const tHacksilverTorc = mkTreasure({
    name: 'Hacksilver Torc of Wergild',
    category: 'trinket', echelon: 1,
    desc: [
      '<p><em>A heavy silver neck-ring stamped with law-marks from a dozen different Things. Wearing it openly declares you a person of worth and legal standing.</em></p>',
      '<p><strong>Effect:</strong> While you wear this torc, you gain an edge on Presence tests made to invoke law, negotiate blood-prices, or demand legal rights at a Thing assembly.</p>',
    ].join(''),
    keywords: ['magic', 'neck'],
    project: {
      prerequisites: 'Silver worth at least 200 hacksilver; a law-mark stamp',
      source: 'A practising Lawspeaker or Chainwarden notary',
      rollCharacteristic: ['presence'],
      yield: { amount: '1', display: '' },
      goal: 120,
    },
    img: 'icons/equipment/neck/choker-chain-thick-gold.webp',
  });
  tHacksilverTorc.folder = trinkE1Folder._id;

  const tDraugrToothAmulet = mkTreasure({
    name: 'Draugr-Tooth Amulet',
    category: 'trinket', echelon: 1,
    desc: [
      '<p><em>A blackened molar strung on sinew, carved with a tiny binding rune. It was pulled from a properly slain draugr.</em></p>',
      '<p><strong>Effect:</strong> While you wear this amulet, you gain an edge on resistance rolls against fear effects from undead creatures.</p>',
    ].join(''),
    keywords: ['magic', 'neck'],
    project: {
      prerequisites: "A tooth from a draugr that was properly laid to rest (head between buttocks, body burned)",
      source: 'Instruction from a Quiet Warden',
      rollCharacteristic: ['intuition'],
      yield: { amount: '1', display: '' },
      goal: 100,
    },
    img: 'icons/commodities/bones/tooth-fang.webp',
  });
  tDraugrToothAmulet.folder = trinkE1Folder._id;

  const tWardStaveBracer = mkTreasure({
    name: 'Ward-Stave Bracer',
    category: 'trinket', echelon: 1,
    desc: [
      '<p><em>A leather bracer with thin ash-wood slats stitched into the surface, each inscribed with protective galdr in the Old Tongue.</em></p>',
      '<p><strong>Effect:</strong> While you wear this bracer, once per encounter when you take damage from a magical source, you can reduce that damage by an amount equal to your level (no action required).</p>',
    ].join(''),
    keywords: ['magic', 'arms'],
    project: {
      prerequisites: 'Ash-wood slats, runecraft tools, treated leather',
      source: 'A rune-reader or Veil-Council arcanist',
      rollCharacteristic: ['reason'],
      yield: { amount: '1', display: '' },
      goal: 120,
    },
    img: 'icons/equipment/hand/bracer-banded-leather-brown.webp',
  });
  tWardStaveBracer.folder = trinkE1Folder._id;

  const tLanternOfTheRoad = mkTreasure({
    name: 'Lantern of the Road',
    category: 'trinket', echelon: 1,
    desc: [
      '<p><em>A battered iron lantern bearing the brand of the Lantern Road. Its flame is pale blue and sheds no smoke.</em></p>',
      '<p><strong>Effect:</strong> This lantern cannot be extinguished by wind, rain, or being dropped. It sheds bright light in a 5-square radius. While the lantern is lit and you carry it openly, you gain an edge on tests to navigate, resist becoming lost, and find safe paths through wilderness.</p>',
    ].join(''),
    keywords: ['magic'],
    project: {
      prerequisites: 'An iron lantern; a flame willingly given by a Lantern Road member',
      source: 'The Lantern Road guild',
      rollCharacteristic: ['intuition'],
      yield: { amount: '1', display: '' },
      goal: 100,
    },
    img: 'icons/sundries/lights/lantern-iron-yellow.webp',
  });
  tLanternOfTheRoad.folder = trinkE1Folder._id;

  const tFossegrimsFiddleString = mkTreasure({
    name: "Fossegrim's Fiddle-String",
    category: 'trinket', echelon: 1,
    desc: [
      '<p><em>A single shimmering string that hums faintly when plucked, even when not attached to an instrument. It was gifted — or won — from a waterfall spirit.</em></p>',
      '<p><strong>Effect:</strong> When this string is attached to an instrument, performances made with that instrument gain an edge on Presence tests to influence or calm fey creatures. Additionally, once per encounter, a performance with this instrument can end the frightened condition on one ally who can hear you.</p>',
    ].join(''),
    keywords: ['magic'],
    project: {
      prerequisites: "A string freely given by a fossegrim (cannot be taken by force)",
      source: "Bargaining with a fossegrim — they typically demand a white goat thrown into a waterfall",
      rollCharacteristic: ['presence'],
      yield: { amount: '1', display: '' },
      goal: 80,
    },
    img: 'icons/tools/instruments/harp-yellow.webp',
  });
  tFossegrimsFiddleString.folder = trinkE1Folder._id;

  items.push(
    tHacksilverTorc, tDraugrToothAmulet, tWardStaveBracer, tLanternOfTheRoad, tFossegrimsFiddleString,
  );

  // ══════════════════════════════════════════════════════════════════
  // FEATURES (granted by titles)
  // ══════════════════════════════════════════════════════════════════

  // -- Echelon 1 features --
  const fEmberKeeperLore = mkFeature({
    name: 'Ember-Keeper Lore',
    desc: '<p>You gain the Ember-Keeper Lore skill. Once per respite, you can identify whether an object, location, or creature has a connection to the Primal Spark or primordial fire magic.</p>',
    img: 'icons/magic/fire/flame-burning-hand-orange.webp',
  });
  fEmberKeeperLore.folder = titlesE1Grants._id;

  const fEmberKeeperSalvage = mkFeature({
    name: 'Ember-Keeper Salvage',
    desc: '<p>When you complete a respite in a ruin or ancient site, you can make an easy Reason test to recover a minor alchemical component or runecraft material worth up to 10 hacksilver.</p>',
    img: 'icons/tools/laboratory/vials-blue-green.webp',
  });
  fEmberKeeperSalvage.folder = titlesE1Grants._id;

  const fLanternBearerLight = mkFeature({
    name: 'Lantern-Bearer\'s Light',
    desc: '<p>You can spend a maneuver to invoke the Lantern Road oath. Until the end of the encounter, your carried light source cannot be extinguished by any means, and allies within 5 squares of you gain an edge on resistance rolls against fear effects.</p>',
    img: 'icons/sundries/lights/lantern-iron-yellow.webp',
  });
  fLanternBearerLight.folder = titlesE1Grants._id;

  const fLanternBearerWay = mkFeature({
    name: 'Lantern-Bearer\'s Way',
    desc: '<p>You gain an edge on tests to navigate overland, and your group\'s overland travel speed increases by 1 mile per day.</p>',
    img: 'icons/tools/navigation/compass-brass.webp',
  });
  fLanternBearerWay.folder = titlesE1Grants._id;

  const fDraugrSlayerRites = mkFeature({
    name: 'Draugr-Slayer Rites',
    desc: '<p>You know the proper rites to lay undead to rest. When you reduce an undead creature to 0 Stamina, it cannot rise again through innate abilities or necromantic effects. Additionally, you gain an edge on tests to identify undead weaknesses.</p>',
    img: 'icons/magic/fire/flame-burning-skull-orange.webp',
  });
  fDraugrSlayerRites.folder = titlesE1Grants._id;

  const fDraugrSlayerNerve = mkFeature({
    name: 'Draugr-Slayer\'s Nerve',
    desc: '<p>You have advantage on resistance rolls against fear effects caused by undead. When an undead creature attempts to frighten you and fails, you gain a +1 bonus to your next power roll against that creature.</p>',
    img: 'icons/skills/melee/strike-sword-steel-yellow.webp',
  });
  fDraugrSlayerNerve.folder = titlesE1Grants._id;

  const fThingSpeakerVoice = mkFeature({
    name: 'Thing-Speaker\'s Voice',
    desc: '<p>You gain an edge on Presence tests to persuade, negotiate, or make legal arguments at a Thing assembly or other formal gathering. Once per session, you can invoke precedent to force a reroll of a social interaction test made against you.</p>',
    img: 'icons/skills/social/diplomacy-handshake.webp',
  });
  fThingSpeakerVoice.folder = titlesE1Grants._id;

  const fThingSpeakerLaw = mkFeature({
    name: 'Thing-Speaker\'s Law',
    desc: '<p>You gain the Law skill (or another lore skill if you already have it). You know the wergild value of every social rank and can accurately assess the legal standing of any person you converse with for at least one minute.</p>',
    img: 'icons/sundries/books/book-open-tan.webp',
  });
  fThingSpeakerLaw.folder = titlesE1Grants._id;

  const fRuneMarkPower = mkFeature({
    name: 'Rune-Mark Power',
    desc: '<p>Once per encounter, as a free triggered action when you make a power roll, you can invoke the rune on your body. You gain a +2 bonus to that power roll. After the effect resolves, you take damage equal to your level as the rune burns.</p>',
    img: 'icons/magic/symbols/runes-star-blue.webp',
  });
  fRuneMarkPower.folder = titlesE1Grants._id;

  const fRuneMarkInsight = mkFeature({
    name: 'Rune-Mark Insight',
    desc: '<p>You can read and understand basic galdr inscriptions without a test. When you encounter a rune-stave or warded area, you automatically learn whether it is protective, offensive, or communicative in nature.</p>',
    img: 'icons/magic/symbols/runes-etched-steel-purple.webp',
  });
  fRuneMarkInsight.folder = titlesE1Grants._id;

  items.push(
    fEmberKeeperLore, fEmberKeeperSalvage,
    fLanternBearerLight, fLanternBearerWay,
    fDraugrSlayerRites, fDraugrSlayerNerve,
    fThingSpeakerVoice, fThingSpeakerLaw,
    fRuneMarkPower, fRuneMarkInsight,
  );

  // -- Echelon 2 features --
  const fRedRivetSecrets = mkFeature({
    name: 'Red-Rivet Secrets',
    desc: '<p>You gain an edge on crafting tests involving metal. When you work at a Red-Rivet forge, you can complete crafting projects in half the normal time.</p>',
    img: 'icons/tools/smithing/anvil-iron.webp',
  });
  fRedRivetSecrets.folder = titlesE2Grants._id;

  const fRedRivetReputation = mkFeature({
    name: 'Red-Rivet Reputation',
    desc: '<p>Your association with the Red-Rivet Compact is known. You gain an edge on Presence tests when dealing with smiths, miners, or the Compact\'s allies. You can requisition basic metalwork supplies from any Red-Rivet forge without payment (up to 20 hacksilver per respite).</p>',
    img: 'icons/commodities/metal/ingot-steel.webp',
  });
  fRedRivetReputation.folder = titlesE2Grants._id;

  const fQuietWardenRites = mkFeature({
    name: 'Quiet Warden Rites',
    desc: '<p>You know the funeral rites of the Quiet Wardens. As a 10-minute activity, you can perform last rites on up to 6 corpses, preventing them from rising as undead. Additionally, you can sense the presence of undead within 10 squares as a maneuver (you know their approximate number and direction, not exact location).</p>',
    img: 'icons/magic/holy/prayer-hands-glowing-yellow.webp',
  });
  fQuietWardenRites.folder = titlesE2Grants._id;

  const fQuietWardenVigilance = mkFeature({
    name: 'Quiet Warden Vigilance',
    desc: '<p>You cannot be surprised by undead creatures. When initiative is rolled and undead are present, you can shift up to 2 squares as a free triggered action.</p>',
    img: 'icons/skills/melee/weapons-crossed-swords-yellow.webp',
  });
  fQuietWardenVigilance.folder = titlesE2Grants._id;

  const fFateTouchedVisions = mkFeature({
    name: 'Fate-Touched Visions',
    desc: '<p>Once per session, you can ask the Director a single yes-or-no question about a course of action you are about to take. The Director answers truthfully based on what the Norns would know. After receiving the answer, you are dazed until the end of your next turn as the vision recedes.</p>',
    img: 'icons/magic/perception/eye-ringed-glow-angry-small-purple.webp',
  });
  fFateTouchedVisions.folder = titlesE2Grants._id;

  const fFateTouchedResilience = mkFeature({
    name: 'Fate-Touched Resilience',
    desc: '<p>You have glimpsed your own death and it was not here. Once per encounter, when you would be reduced to 0 Stamina, you can instead be reduced to 1 Stamina. You can\'t use this feature again until you complete a respite.</p>',
    img: 'icons/magic/time/hourglass-tilted-blue-purple.webp',
  });
  fFateTouchedResilience.folder = titlesE2Grants._id;

  items.push(
    fRedRivetSecrets, fRedRivetReputation,
    fQuietWardenRites, fQuietWardenVigilance,
    fFateTouchedVisions, fFateTouchedResilience,
  );

  // ══════════════════════════════════════════════════════════════════
  // TITLES
  // ══════════════════════════════════════════════════════════════════

  // -- Echelon 1 --
  const titleEmberKeeper = mkTitle({
    name: 'Ember-Keeper Initiate',
    echelon: 1,
    story: 'You recovered a fragment of the Primal Spark or joined the Ember-Keepers — the technologist-archaeologists who believe the answer to the Fimbulwinter lies buried in the Elder Age.',
    prerequisites: 'You discovered an artefact connected to the Primal Spark, or performed a significant service for the Ember-Keepers.',
    featureIds: [fEmberKeeperLore._id, fEmberKeeperSalvage._id],
    img: 'icons/magic/fire/flame-burning-hand-orange.webp',
  });
  titleEmberKeeper.folder = titlesE1._id;

  const titleLanternBearer = mkTitle({
    name: 'Lantern-Bearer',
    echelon: 1,
    story: 'You kept the Lantern Road open through a deadly passage — whether blizzard, raiders, or worse. The teamsters and wayfinders remember.',
    prerequisites: 'You kept a road, pass, or route open against significant opposition, saving lives in the process.',
    featureIds: [fLanternBearerLight._id, fLanternBearerWay._id],
    img: 'icons/sundries/lights/lantern-iron-yellow.webp',
  });
  titleLanternBearer.folder = titlesE1._id;

  const titleDraugrSlayer = mkTitle({
    name: 'Draugr-Slayer',
    echelon: 1,
    story: "You put down your first draugr with the proper rites — head between buttocks, body burned. The Quiet Wardens took notice.",
    prerequisites: 'You destroyed an undead creature and performed the proper funeral rites.',
    featureIds: [fDraugrSlayerRites._id, fDraugrSlayerNerve._id],
    img: 'icons/magic/fire/flame-burning-skull-orange.webp',
  });
  titleDraugrSlayer.folder = titlesE1._id;

  const titleThingSpeaker = mkTitle({
    name: 'Thing-Speaker',
    echelon: 1,
    story: 'You won a case at the Thing through argument alone — no blades drawn, no threats made. The Lawspeaker smiled.',
    prerequisites: 'You successfully argued a case, brokered a peace, or settled a blood-debt at a Thing assembly.',
    featureIds: [fThingSpeakerVoice._id, fThingSpeakerLaw._id],
    img: 'icons/skills/social/diplomacy-handshake.webp',
  });
  titleThingSpeaker.folder = titlesE1._id;

  const titleRuneMarked = mkTitle({
    name: 'Rune-Marked',
    echelon: 1,
    story: 'A rune manifested on your body after channelling galdr — burned into your skin by forces you don\'t fully understand. It pulses when magic is near.',
    prerequisites: 'You channelled galdr or interacted with powerful rune-magic and survived a backlash that left a permanent mark.',
    featureIds: [fRuneMarkPower._id, fRuneMarkInsight._id],
    img: 'icons/magic/symbols/runes-star-blue.webp',
  });
  titleRuneMarked.folder = titlesE1._id;

  items.push(titleEmberKeeper, titleLanternBearer, titleDraugrSlayer, titleThingSpeaker, titleRuneMarked);

  // -- Echelon 2 --
  const titleRedRivetSworn = mkTitle({
    name: 'Red-Rivet Sworn',
    echelon: 2,
    story: 'You earned the trust of the Red-Rivet Compact — the smiths\' guild that controls all worked iron in Svellheim. "Iron does not forgive," they say, and neither do they, but they respect strength and skill.',
    prerequisites: 'You performed a significant service for the Red-Rivet Compact or demonstrated exceptional skill in metallurgy.',
    featureIds: [fRedRivetSecrets._id, fRedRivetReputation._id],
    img: 'icons/tools/smithing/anvil-iron.webp',
  });
  titleRedRivetSworn.folder = titlesE2._id;

  const titleQuietWarden = mkTitle({
    name: 'Quiet Warden',
    echelon: 2,
    story: 'The funerary order inducted you after you proved your dedication to keeping the dead where they belong — in the ground, not walking.',
    prerequisites: 'You destroyed multiple undead threats and performed proper funeral rites for the fallen. A Quiet Warden vouched for you.',
    featureIds: [fQuietWardenRites._id, fQuietWardenVigilance._id],
    img: 'icons/magic/holy/prayer-hands-glowing-yellow.webp',
  });
  titleQuietWarden.folder = titlesE2._id;

  const titleFateTouched = mkTitle({
    name: 'Fate-Touched',
    echelon: 2,
    story: 'A Norn showed you your death-thread. You saw how and when you will die. You act differently now — with either reckless courage or eerie calm.',
    prerequisites: 'You encountered a Norn, a seidr-walker, or a fate-spirit and glimpsed your own death. You survived the experience.',
    featureIds: [fFateTouchedVisions._id, fFateTouchedResilience._id],
    img: 'icons/magic/time/hourglass-tilted-blue-purple.webp',
  });
  titleFateTouched.folder = titlesE2._id;

  items.push(titleRedRivetSworn, titleQuietWarden, titleFateTouched);

  return { folders, items };
}

// ---------------------------------------------------------------------------
// LevelDB writer
// ---------------------------------------------------------------------------

async function writeLevelDb({ items, folders }, outDir) {
  const { ClassicLevel } = require('classic-level');

  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  const db = new ClassicLevel(outDir, { keyEncoding: 'utf8', valueEncoding: 'utf8' });
  await db.open();

  for (const f of folders)  await db.put(`!folders!${f._id}`, JSON.stringify(f));
  for (const i of items)    await db.put(`!items!${i._id}`, JSON.stringify(i));

  await db.compactRange('\x00', '\xff');
  await db.close();
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const { folders, items } = buildAllContent();

  await writeLevelDb({ items, folders }, PACK_DIR);

  const byType = {};
  for (const i of items) byType[i.type] = (byType[i.type] || 0) + 1;

  console.log(`\nWrote ${items.length} items and ${folders.length} folders to ${path.relative(REPO_ROOT, PACK_DIR)}/`);
  console.log('Breakdown:');
  for (const [t, c] of Object.entries(byType).sort()) console.log(`  ${t}: ${c}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
