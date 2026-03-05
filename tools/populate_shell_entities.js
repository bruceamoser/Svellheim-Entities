const fs = require("fs");
const path = require("path");

const SOURCE_BOOK = "Svellheim Campaign (Era of Embers)";

const BASE_DIR = path.resolve(__dirname, "..");
const TARGET_DIRS = [
  path.join(BASE_DIR, "data", "monsters"),
  path.join(BASE_DIR, "data", "npcs"),
];

const CORE_MONSTERS_PACK_DIR = path.resolve(
  BASE_DIR,
  "..",
  "draw-steel-foundry-vtt-mcp",
  "reference",
  "draw-steel-foundry-system",
  "src",
  "packs",
  "monsters",
);

const PLACEHOLDER_ITEM_NAMES = new Set([
  "Crushing Assault",
  "Relentless Pressure",
  "Sudden Strike",
  "Skirmish Step",
  "Disrupting Bolt",
  "Control Pulse",
  "Guarding Strike",
  "Hold the Line",
  "Commanding Aid",
  "Bolster Ally",
  "Hexing Touch",
  "Baleful Sign",
  "Tactical Reversal",
  "Role Discipline",
  "Encounter Script",
  "Boss Resilience",
  "Minion Fragility",
]);

let coreActorCache = null;

function generateId(length = 16) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function stripHtml(value) {
  return String(value)
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&ndash;|&mdash;/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function extractSectionBullets(directorHtml, sectionName) {
  const sectionPattern = new RegExp(`<strong>${sectionName}</strong>[\\s\\S]*?<ul>([\\s\\S]*?)</ul>`, "i");
  const sectionMatch = directorHtml.match(sectionPattern);
  if (!sectionMatch) return [];

  const listHtml = sectionMatch[1];
  const bullets = [];
  const itemRegex = /<li>([\s\S]*?)<\/li>/gi;
  let match = itemRegex.exec(listHtml);
  while (match) {
    const text = stripHtml(match[1]);
    if (text) bullets.push(text);
    match = itemRegex.exec(listHtml);
  }
  return bullets;
}

function detectDamageType(text) {
  const lower = text.toLowerCase();
  if (lower.includes("fire")) return "fire";
  if (lower.includes("cold") || lower.includes("frost") || lower.includes("ice")) return "cold";
  if (lower.includes("holy") || lower.includes("radiant")) return "holy";
  if (lower.includes("lightning") || lower.includes("thunder")) return "lightning";
  if (lower.includes("poison") || lower.includes("venom")) return "poison";
  if (lower.includes("psychic")) return "psychic";
  if (lower.includes("corruption") || lower.includes("necrot")) return "corruption";
  if (lower.includes("sonic")) return "sonic";
  if (lower.includes("acid")) return "acid";
  return "weapon";
}

function walkJsonFiles(rootDir, out = []) {
  if (!fs.existsSync(rootDir)) return out;
  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      walkJsonFiles(full, out);
      continue;
    }
    if (entry.isFile() && entry.name.toLowerCase().endsWith(".json")) {
      out.push(full);
    }
  }
  return out;
}

function loadCoreMonsterActors() {
  if (coreActorCache) return coreActorCache;

  const actors = [];
  const files = walkJsonFiles(CORE_MONSTERS_PACK_DIR);
  for (const filePath of files) {
    const fileName = path.basename(filePath).toLowerCase();
    if (!fileName.startsWith("npc_")) continue;

    try {
      const raw = fs.readFileSync(filePath, "utf8");
      const data = JSON.parse(raw);
      if (!data || data.type !== "npc" || !Array.isArray(data.items)) continue;

      const monster = data?.system?.monster || {};
      const abilities = data.items.filter((item) => item?.type === "ability");
      const features = data.items.filter((item) => item?.type === "feature");
      if (abilities.length + features.length === 0) continue;

      actors.push({
        name: data.name || "",
        level: Number(monster.level || 1),
        role: String(monster.role || "").toLowerCase(),
        organization: String(monster.organization || "").toLowerCase(),
        keywords: Array.isArray(monster.keywords) ? monster.keywords.map((k) => String(k).toLowerCase()) : [],
        items: data.items,
      });
    } catch {
      // Ignore malformed references.
    }
  }

  coreActorCache = actors;
  return coreActorCache;
}

function scoreCoreActorMatch(coreActor, actorData) {
  const monster = actorData?.system?.monster || {};
  const level = Number(monster.level || 1);
  const role = String(monster.role || "").toLowerCase();
  const organization = String(monster.organization || "").toLowerCase();
  const keywords = Array.isArray(monster.keywords) ? monster.keywords.map((k) => String(k).toLowerCase()) : [];

  let score = 0;
  if (role && coreActor.role === role) score += 8;
  if (organization && coreActor.organization === organization) score += 7;

  const levelDelta = Math.abs(coreActor.level - level);
  score += Math.max(0, 6 - Math.min(levelDelta, 6));

  for (const kw of keywords) {
    if (coreActor.keywords.includes(kw)) score += 2;
  }

  return score;
}

function estimateTargetCounts(actorData) {
  const monster = actorData?.system?.monster || {};
  const level = Number(monster.level || 1);
  const role = String(monster.role || "").toLowerCase();
  const organization = String(monster.organization || "").toLowerCase();
  const coreActors = loadCoreMonsterActors();

  const similar = coreActors
    .map((actor) => ({ actor, score: scoreCoreActorMatch(actor, actorData) }))
    .filter((entry) => entry.score >= 8)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map((entry) => entry.actor);

  const pool = similar.length > 0 ? similar : coreActors;

  let abilities = 0;
  let features = 0;
  let counted = 0;

  for (const ref of pool) {
    const refAbilities = ref.items.filter((item) => item?.type === "ability").length;
    const refFeatures = ref.items.filter((item) => item?.type === "feature").length;
    abilities += refAbilities;
    features += refFeatures;
    counted += 1;
  }

  const avgAbilities = counted > 0 ? Math.max(1, Math.round(abilities / counted)) : 2;
  const avgFeatures = counted > 0 ? Math.max(1, Math.round(features / counted)) : 2;

  const soloBump = organization === "solo" ? 1 : 0;
  const eliteBump = organization === "elite" ? 1 : 0;
  const levelBump = level >= 5 ? 1 : 0;

  return {
    abilities: avgAbilities + soloBump + eliteBump + levelBump,
    features: avgFeatures,
  };
}

function getCoreReferenceItems(actorData) {
  const coreActors = loadCoreMonsterActors();
  if (coreActors.length === 0) return { abilities: [], features: [] };

  const matches = coreActors
    .map((actor) => ({ actor, score: scoreCoreActorMatch(actor, actorData) }))
    .filter((entry) => entry.score >= 6)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  if (matches.length === 0) {
    return { abilities: [], features: [] };
  }

  const abilities = [];
  const features = [];
  const seenAbility = new Set();
  const seenFeature = new Set();

  for (const match of matches) {
    for (const item of match.actor.items) {
      if (item?.type === "ability") {
        const key = String(item.name || "").toLowerCase();
        if (key && !seenAbility.has(key)) {
          abilities.push(item);
          seenAbility.add(key);
        }
      }
      if (item?.type === "feature") {
        const key = String(item.name || "").toLowerCase();
        if (key && !seenFeature.has(key)) {
          features.push(item);
          seenFeature.add(key);
        }
      }
    }
  }

  return {
    abilities,
    features,
  };
}

function parseAbilityBullet(text) {
  const match = text.match(/^([^(:]+?)(?:\s*\(([^)]*)\))?\s*:\s*(.+)$/);
  const name = (match?.[1] || text).trim();
  const tags = (match?.[2] || "").toLowerCase();
  const body = (match?.[3] || "").trim();

  const tierMatch = body.match(/T1\s*(\d+)[^\d]+T2\s*(\d+)[^\d]+T3\s*(\d+)/i);
  const tier1 = tierMatch ? Number(tierMatch[1]) : 1;
  const tier2 = tierMatch ? Number(tierMatch[2]) : 2;
  const tier3 = tierMatch ? Number(tierMatch[3]) : 3;

  const isTriggered = tags.includes("triggered") || body.toLowerCase().includes("trigger");
  const isManeuver = tags.includes("maneuver");
  const isRanged = tags.includes("ranged") || tags.includes("range") || body.toLowerCase().includes("ranged");
  const isArea = body.toLowerCase().includes("burst") || body.toLowerCase().includes("area");

  const abilityType = isTriggered ? "triggered" : isManeuver ? "maneuver" : "main";
  const distanceType = isRanged ? "ranged" : isArea ? "burst" : "melee";
  const keywords = isRanged ? ["ranged", "weapon"] : ["melee", "strike", "weapon"];
  const damageType = detectDamageType(`${tags} ${body}`);

  return {
    name,
    body,
    abilityType,
    distanceType,
    keywords,
    tier1,
    tier2,
    tier3,
    damageType,
  };
}

function getPrimaryCharacteristic(actorData) {
  const chars = actorData?.system?.characteristics || {};
  const entries = ["might", "agility", "reason", "intuition", "presence"]
    .map((name) => ({ name, value: Number(chars?.[name]?.value ?? -99) }))
    .sort((a, b) => b.value - a.value);
  return entries[0]?.name || "might";
}

function buildFallbackAbilityTemplates(actorData) {
  const role = String(actorData?.system?.monster?.role || "support").toLowerCase();
  const organization = String(actorData?.system?.monster?.organization || "platoon").toLowerCase();
  const level = Number(actorData?.system?.monster?.level || 1);
  const freeStrike = Number(actorData?.system?.monster?.freeStrike || Math.max(2, level + 2));

  const tier1 = Math.max(1, freeStrike - 2);
  const tier2 = Math.max(2, freeStrike);
  const tier3 = Math.max(3, freeStrike + 2);

  const primaryCharacteristic = getPrimaryCharacteristic(actorData);

  const roleTemplates = {
    brute: {
      main: { name: "Mawbreaker Swing", body: `T1 ${tier1} dmg; T2 ${tier2} dmg; T3 ${tier3} dmg + pushed 1.`, distanceType: "melee", damageType: "weapon", keywords: ["melee", "strike", "weapon"] },
      maneuver: { name: "Iron Advance", body: "Shift up to speed and mark one adjacent enemy EoNT.", distanceType: "melee", damageType: "weapon", keywords: ["melee", "weapon"] },
    },
    ambusher: {
      main: { name: "Veilfang Lunge", body: `T1 ${tier1} dmg; T2 ${tier2} dmg + edge if hidden; T3 ${tier3} dmg + edge and shifted 1.`, distanceType: "melee", damageType: "weapon", keywords: ["melee", "strike", "weapon"] },
      maneuver: { name: "Shadow Reposition", body: "Shift 2 and gain concealment until start of next turn if not adjacent to enemies.", distanceType: "melee", damageType: "weapon", keywords: ["melee", "weapon"] },
    },
    controller: {
      main: { name: "Mindspike Volley", body: `T1 ${tier1} psychic; T2 ${tier2} psychic + slowed EoNT; T3 ${tier3} psychic + slowed (save ends).`, distanceType: "ranged", damageType: "psychic", keywords: ["ranged", "magic", "psychic"] },
      maneuver: { name: "Grasping Current", body: "Burst 2 within 5. Targets Presence test or take bane on next action.", distanceType: "burst", damageType: "psychic", keywords: ["area", "magic", "psychic"] },
    },
    defender: {
      main: { name: "Bulwark Rebuke", body: `T1 ${tier1} dmg; T2 ${tier2} dmg + taunted EoNT; T3 ${tier3} dmg + taunted (save ends).`, distanceType: "melee", damageType: "weapon", keywords: ["melee", "strike", "weapon"] },
      maneuver: { name: "Shielded Front", body: "Until start of next turn, enemies moving adjacent must pass Agility test or stop.", distanceType: "melee", damageType: "weapon", keywords: ["melee", "weapon"] },
    },
    support: {
      main: { name: "Rallying Shot", body: `T1 ${tier1} dmg; T2 ${tier2} dmg + one ally gains edge; T3 ${tier3} dmg + one ally shifts 1.`, distanceType: "ranged", damageType: "weapon", keywords: ["ranged", "weapon"] },
      maneuver: { name: "Warcall Support", body: "One ally within 5 gains +1 to next test or power roll.", distanceType: "ranged", damageType: "weapon", keywords: ["ranged", "support"] },
    },
    hexer: {
      main: { name: "Blightbrand Curse", body: `T1 ${tier1} corruption; T2 ${tier2} corruption + weakened EoNT; T3 ${tier3} corruption + weakened (save ends).`, distanceType: "ranged", damageType: "corruption", keywords: ["ranged", "magic", "corruption"] },
      maneuver: { name: "Oath-Scour Sigil", body: "One enemy within 5 has bane on next save and cannot gain edge EoNT.", distanceType: "ranged", damageType: "corruption", keywords: ["ranged", "magic", "corruption"] },
    },
  };

  const selected = roleTemplates[role] || roleTemplates.support;

  const templates = [
    {
      ...selected.main,
      abilityType: "main",
      category: "signature",
      characteristic: primaryCharacteristic,
    },
    {
      ...selected.maneuver,
      abilityType: "maneuver",
      category: "signature",
      characteristic: primaryCharacteristic,
      tier1: 1,
      tier2: 2,
      tier3: 3,
    },
  ];

  if (organization === "solo" || organization === "elite") {
    templates.push({
      name: "Predator's Reposition",
      body: "Triggered: when targeted by an attack, shift 1 and gain edge on next power roll.",
      abilityType: "triggered",
      category: "signature",
      distanceType: "melee",
      damageType: "weapon",
      keywords: ["melee", "weapon", "triggered"],
      tier1: 1,
      tier2: 2,
      tier3: 3,
      characteristic: primaryCharacteristic,
    });
  }

  return templates.map((template) => ({
    ...template,
    tier1: Number(template.tier1 ?? tier1),
    tier2: Number(template.tier2 ?? tier2),
    tier3: Number(template.tier3 ?? tier3),
  }));
}

function buildFallbackFeatureTexts(actorData, directorHtml) {
  const role = String(actorData?.system?.monster?.role || "support");
  const organization = String(actorData?.system?.monster?.organization || "platoon");
  const notes = stripHtml(directorHtml);
  const notesPreview = notes.length > 420 ? `${notes.slice(0, 417)}...` : notes;
  const encounterScript = notesPreview || "No director-script text was available; run this creature using its role-driven tactics and abilities.";

  const features = [
    `${role} Doctrine: This creature acts as a ${role}; gains edge on tests aligned with that role's battlefield function.`,
    `${organization} Battle Script: ${encounterScript}`,
  ];

  if (organization.toLowerCase() === "minion") {
    features.push("Disposable Body: When this creature takes damage from an attack, it is defeated unless the Director determines otherwise.");
  } else if (organization.toLowerCase() === "solo" || organization.toLowerCase() === "elite") {
    features.push("Unbroken Engine: This creature can clear one non-permanent condition at the start of each turn.");
  }

  return features;
}

function makeAbility(actorName, parsedAbility) {
  const id = generateId();
  const damageId = generateId();
  const isTriggered = parsedAbility.abilityType === "triggered";

  return {
    _id: id,
    name: parsedAbility.name,
    img: parsedAbility.damageType === "cold"
      ? "icons/magic/water/snowflake-ice-purple.webp"
      : "icons/skills/melee/strike-sword-steel.webp",
    effects: [],
    flags: {},
    folder: null,
    sort: 0,
    ownership: { default: 0 },
    _stats: {
      compendiumSource: null,
      duplicateSource: null,
      exportSource: null,
      coreVersion: "13.351",
      systemId: "draw-steel",
      systemVersion: "0.10.0",
      createdTime: 0,
      modifiedTime: 0,
      lastModifiedBy: null,
    },
    type: "ability",
    system: {
      source: {
        book: SOURCE_BOOK,
        page: "",
        license: "",
      },
      _dsid: `${slugify(actorName)}-${slugify(parsedAbility.name)}`,
      prerequisites: {
        value: "",
        dsid: [],
        level: null,
      },
      story: "",
      keywords: parsedAbility.keywords,
      type: parsedAbility.abilityType,
      category: parsedAbility.category || "signature",
      resource: null,
      trigger: isTriggered ? "See effect text." : "",
      distance: {
        type: parsedAbility.distanceType,
        primary: parsedAbility.distanceType === "melee" ? 1 : 5,
        secondary: null,
        tertiary: null,
      },
      damageDisplay: parsedAbility.distanceType,
      target: {
        type: "creatureObject",
        value: 1,
        custom: "",
      },
      power: {
        roll: {
          reactive: false,
          formula: "@chr",
          characteristics: [parsedAbility.characteristic || "might"],
        },
        effects: {
          [damageId]: {
            type: "damage",
            _id: damageId,
            name: "",
            img: null,
            sort: 0,
            damage: {
              tier1: {
                value: String(parsedAbility.tier1),
                types: [parsedAbility.damageType],
                properties: [],
                potency: { value: "@potency.weak", characteristic: "none" },
              },
              tier2: {
                value: String(parsedAbility.tier2),
                types: [parsedAbility.damageType],
                properties: [],
                potency: { value: "@potency.average", characteristic: "none" },
              },
              tier3: {
                value: String(parsedAbility.tier3),
                types: [parsedAbility.damageType],
                properties: [],
                potency: { value: "@potency.strong", characteristic: "none" },
              },
            },
          },
        },
      },
      effect: {
        before: "",
        after: `<p>${parsedAbility.body}</p>`,
      },
      spend: {
        value: null,
        text: "",
      },
    },
  };
}

function retierAbilityToActor(item, actorData) {
  const freeStrike = Number(actorData?.system?.monster?.freeStrike || Math.max(2, Number(actorData?.system?.monster?.level || 1) + 2));
  const tierTargets = [Math.max(1, freeStrike - 2), Math.max(2, freeStrike), Math.max(3, freeStrike + 2)];
  const tiers = ["tier1", "tier2", "tier3"];

  const powerEffects = item?.system?.power?.effects;
  if (!powerEffects || typeof powerEffects !== "object") return;

  for (const effect of Object.values(powerEffects)) {
    if (!effect || effect.type !== "damage" || !effect.damage) continue;
    for (let i = 0; i < tiers.length; i += 1) {
      const t = tiers[i];
      if (!effect.damage[t]) continue;
      effect.damage[t].value = String(tierTargets[i]);
    }
  }
}

function cloneCoreItem(templateItem, actorName, actorData) {
  const clone = JSON.parse(JSON.stringify(templateItem));
  clone._id = generateId();

  if (Array.isArray(clone.effects)) {
    clone.effects = clone.effects.map((effect) => {
      const effectClone = { ...effect };
      effectClone._id = generateId();
      return effectClone;
    });
  }

  if (clone.type === "ability") {
    retierAbilityToActor(clone, actorData);
  }

  if (clone.system && clone.system.source) {
    clone.system.source.book = SOURCE_BOOK;
    clone.system.source.page = "";
  }

  if (clone.system && typeof clone.system._dsid === "string") {
    clone.system._dsid = `${slugify(actorName)}-${slugify(clone.name || generateId(6))}`;
  }

  return clone;
}

function makeFeature(actorName, featureText) {
  const match = featureText.match(/^([^:]+):\s*(.+)$/);
  const name = (match?.[1] || featureText).trim();
  const description = (match?.[2] || featureText).trim();

  return {
    _id: generateId(),
    name,
    img: "icons/magic/death/undead-skeleton-deformed-red.webp",
    effects: [],
    flags: {},
    folder: null,
    sort: 0,
    ownership: { default: 0 },
    _stats: {
      compendiumSource: null,
      duplicateSource: null,
      exportSource: null,
      coreVersion: "13.351",
      systemId: "draw-steel",
      systemVersion: "0.10.0",
      createdTime: 0,
      modifiedTime: 0,
      lastModifiedBy: null,
    },
    type: "feature",
    system: {
      description: {
        value: `<p>${description}</p>`,
        director: "",
      },
      source: {
        book: SOURCE_BOOK,
        page: "",
        license: "",
      },
      _dsid: `${slugify(actorName)}-${slugify(name)}`,
      advancements: {},
      prerequisites: {
        value: "",
        dsid: [],
        level: null,
      },
    },
  };
}

function makeDirectorNotesFeature(actorName, directorHtml) {
  const text = stripHtml(directorHtml);
  const clipped = text.length > 4000 ? `${text.slice(0, 3997)}...` : text;
  return {
    _id: generateId(),
    name: "Director Notes",
    img: "icons/sundries/books/book-open-brown.webp",
    effects: [],
    flags: {},
    folder: null,
    sort: 0,
    ownership: { default: 0 },
    _stats: {
      compendiumSource: null,
      duplicateSource: null,
      exportSource: null,
      coreVersion: "13.351",
      systemId: "draw-steel",
      systemVersion: "0.10.0",
      createdTime: 0,
      modifiedTime: 0,
      lastModifiedBy: null,
    },
    type: "feature",
    system: {
      description: {
        value: `<p>${clipped}</p>`,
        director: "",
      },
      source: {
        book: SOURCE_BOOK,
        page: "",
        license: "",
      },
      _dsid: `${slugify(actorName)}-director-notes`,
      advancements: {},
      prerequisites: {
        value: "",
        dsid: [],
        level: null,
      },
    },
  };
}

function processFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const data = JSON.parse(raw);

  const actorName = data.name || path.basename(filePath, ".json");
  const existingItems = Array.isArray(data.items) ? [...data.items] : [];
  const existingAbilityCount = existingItems.filter((item) => item?.type === "ability").length;
  const existingFeatureCount = existingItems.filter((item) => item?.type === "feature").length;
  const level = Number(data?.system?.monster?.level || 1);
  const organization = String(data?.system?.monster?.organization || "").toLowerCase();

  const desiredMinAbilities = organization === "solo" || organization === "elite"
    ? 3
    : (level >= 2 ? 2 : 1);

  const targetCounts = estimateTargetCounts(data);

  const isDirectorOnly = Array.isArray(data.items)
    && data.items.length === 1
    && data.items[0]?.name === "Director Notes";

  const needsAbilityAugment = existingAbilityCount < desiredMinAbilities;
  const needsFeatureAugment = existingFeatureCount === 0;
  const hasPlaceholders = existingItems.some((item) => PLACEHOLDER_ITEM_NAMES.has(String(item?.name || "")));
  const scriptGeneratedItems = existingItems.filter((item) => String(item?.system?.source?.book || "") === SOURCE_BOOK);
  const overGenerated = existingFeatureCount > (targetCounts.features + 4) || existingAbilityCount > (Math.max(desiredMinAbilities, targetCounts.abilities) + 4);

  const shouldRegenerate = !Array.isArray(data.items)
    || data.items.length === 0
    || isDirectorOnly
    || hasPlaceholders
    || (overGenerated && scriptGeneratedItems.length > 0);
  const shouldAugment = !shouldRegenerate && (needsAbilityAugment || needsFeatureAugment);

  if (!shouldRegenerate && !shouldAugment) {
    return { updated: false, reason: "already-has-items" };
  }

  const directorHtml = data?.system?.biography?.director || "";

  const abilityBullets = extractSectionBullets(directorHtml, "ABILITIES");
  const featureBullets = extractSectionBullets(directorHtml, "FEATURES");

  const coreReference = getCoreReferenceItems(data);

  const nextItems = shouldRegenerate
    ? existingItems.filter((item) => {
      const isPlaceholder = PLACEHOLDER_ITEM_NAMES.has(String(item?.name || ""));
      const isScriptGenerated = String(item?.system?.source?.book || "") === SOURCE_BOOK;
      return !isPlaceholder && !isScriptGenerated;
    })
    : [...existingItems];
  const existingNames = new Set(nextItems.map((item) => String(item?.name || "").toLowerCase()).filter(Boolean));

  let addedAbilities = 0;
  let addedFeatures = 0;

  // Prefer explicit ABILITIES bullets from director notes, then core reference abilities, then fallback templates.
  const abilityCandidates = [];
  for (const bullet of abilityBullets) {
    abilityCandidates.push(parseAbilityBullet(bullet));
  }
  for (const refAbility of coreReference.abilities) {
    abilityCandidates.push({ __core: true, template: refAbility, name: refAbility.name });
  }
  for (const fallback of buildFallbackAbilityTemplates(data)) {
    abilityCandidates.push(fallback);
  }

  for (const candidate of abilityCandidates) {
    const key = String(candidate.name || "").toLowerCase();
    if (!key || existingNames.has(key)) continue;
    if ((nextItems.filter((item) => item?.type === "ability").length) >= Math.max(desiredMinAbilities, targetCounts.abilities)) {
      break;
    }
    if (candidate.__core) {
      nextItems.push(cloneCoreItem(candidate.template, actorName, data));
    } else {
      nextItems.push(makeAbility(actorName, candidate));
    }
    existingNames.add(key);
    addedAbilities += 1;
  }

  // Add explicit feature bullets; then core reference features; then fallback feature text.
  const featureCandidates = [];
  for (const featureText of featureBullets) {
    featureCandidates.push({ __core: false, text: featureText, name: featureText.match(/^([^:]+):/)?.[1]?.trim() || featureText });
  }
  for (const refFeature of coreReference.features) {
    featureCandidates.push({ __core: true, template: refFeature, name: refFeature.name });
  }
  const existingFeatureCountNow = nextItems.filter((item) => item?.type === "feature").length;
  if (featureCandidates.length === 0 && existingFeatureCountNow === 0) {
    for (const featureText of buildFallbackFeatureTexts(data, directorHtml)) {
      featureCandidates.push({ __core: false, text: featureText, name: featureText.match(/^([^:]+):/)?.[1]?.trim() || featureText });
    }
  }

  const targetFeatureCount = Math.max(targetCounts.features, featureBullets.length > 0 ? featureBullets.length : 0);

  for (const candidate of featureCandidates) {
    const key = String(candidate.name || "").toLowerCase();
    if (!key || existingNames.has(key)) continue;
    if ((nextItems.filter((item) => item?.type === "feature").length) >= targetFeatureCount) break;

    if (candidate.__core) {
      nextItems.push(cloneCoreItem(candidate.template, actorName, data));
    } else {
      nextItems.push(makeFeature(actorName, candidate.text));
    }

    existingNames.add(key);
    addedFeatures += 1;
  }

  if (nextItems.length === 0) {
    return { updated: false, reason: "no-generated-items" };
  }

  data.items = nextItems;
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");

  return {
    updated: true,
    reason: "ok",
    abilities: abilityBullets.length,
    features: featureBullets.length,
    generated: nextItems.length,
    addedAbilities,
    addedFeatures,
  };
}

function run() {
  const report = {
    updated: [],
    skipped: [],
    errors: [],
  };

  for (const dir of TARGET_DIRS) {
    const files = fs.readdirSync(dir).filter((file) => file.toLowerCase().endsWith(".json"));
    for (const file of files) {
      const filePath = path.join(dir, file);
      try {
        const result = processFile(filePath);
        if (result.updated) {
          report.updated.push({ file: filePath, ...result });
        } else {
          report.skipped.push({ file: filePath, reason: result.reason });
        }
      } catch (error) {
        report.errors.push({
          file: filePath,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  console.log(`Updated: ${report.updated.length}`);
  for (const entry of report.updated) {
    console.log(`  + ${path.basename(entry.file)} (abilities=${entry.abilities}, features=${entry.features}, addedAbilities=${entry.addedAbilities || 0}, addedFeatures=${entry.addedFeatures || 0}, total=${entry.generated})`);
  }

  console.log(`Skipped: ${report.skipped.length}`);
  const skipSummary = report.skipped.reduce((acc, item) => {
    acc[item.reason] = (acc[item.reason] || 0) + 1;
    return acc;
  }, {});
  for (const [reason, count] of Object.entries(skipSummary)) {
    console.log(`  - ${reason}: ${count}`);
  }

  if (report.errors.length > 0) {
    console.log(`Errors: ${report.errors.length}`);
    for (const entry of report.errors) {
      console.log(`  ! ${path.basename(entry.file)}: ${entry.error}`);
    }
    process.exitCode = 1;
  }
}

run();