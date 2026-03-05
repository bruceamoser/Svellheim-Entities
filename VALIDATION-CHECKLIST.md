# Svellheim Entities Validation Checklist

This document is the implementation plan for validating every entity in `Svellheim-Entities`.

## Status Legend

- `Not Started`: Entity has not been reviewed yet.
- `In Progress`: Entity is currently being reviewed/updated.
- `Complete`: Entity has been fully validated and accepted.

## Validation Process (Per Entity)

### Execution Mode (Mandatory)

1. Work entities strictly in the order they appear in this file.
2. Process exactly one entity at a time.
3. Do not run batch validation scripts for implementation work.
4. Do not run batch update scripts for implementation work.
5. Before editing an entity: set status to `In Progress`.
6. After finishing that same entity: set status to `Complete`.
7. Only then move to the next entity in the checklist.

1. Open the entity JSON file and read all fields end-to-end.
2. Confirm theme matching: names, mechanics, keywords, and flavor text fit Svellheim lore and faction identity.
3. Confirm valid values: no zero/invalid baseline fields, valid type/category/keywords, and required schema fields present.
4. Confirm icons are valid and system-matched:
	- Every `img` value (entity and embedded items/effects) must point to an existing icon path.
	- Prefer `systems/draw-steel/...`, `modules/svellheim/...`, or known Foundry core `icons/...` paths.
	- If an icon path is missing or invalid, replace it with a thematically correct existing icon from the Draw Steel system or Svellheim module assets.
5. Confirm scale and counts using core Draw Steel references: role/organization/level baseline, stamina/free strike, and expected ability/feature counts.
6. Confirm descriptions are present and meaningful: rules text, effect text, and source metadata are complete and readable.
7. Update this checklist status for the entity (`Not Started` -> `In Progress` -> `Complete`).

## Entity Checklist

### data/monsters

| Status | Entity | File |
|---|---|---|
| Complete | Barrow-Draugr (Act 2) | `data/monsters/barrow-draugr-act-2.json` |
| Complete | Barrow-Draugr | `data/monsters/barrow-draugr.json` |
| Complete | Barrow-Warden | `data/monsters/barrow-warden.json` |
| Complete | Barrow-Wight | `data/monsters/barrow-wight.json` |
| Complete | Blind Draugr Wolf | `data/monsters/blind-draugr-wolf.json` |
| Complete | Bone-Singer | `data/monsters/bone-singer.json` |
| Complete | Chainwarden Artillerist | `data/monsters/chainwarden-artillerist.json` |
| Complete | Chainwarden Enforcer | `data/monsters/chainwarden-enforcer.json` |
| Complete | Chainwarden Guard | `data/monsters/chainwarden-guard.json` |
| Complete | Chainwarden Militia | `data/monsters/chainwarden-militia.json` |
| Complete | Dire Draugr Wolf | `data/monsters/dire-draugr-wolf.json` |
| Complete | Draugr-Thrall (Act 2) | `data/monsters/draugr-thrall-act-2.json` |
| Complete | Draugr Thrall | `data/monsters/draugr-thrall.json` |
| Complete | Dreyfus, Shape-Walker Agent | `data/monsters/dreyfus-shape-walker-agent.json` |
| Complete | Dreyfus, the Shape-Walker (L5 Elite) | `data/monsters/dreyfus-the-shape-walker.json` |
| Complete | Drowned Wolf | `data/monsters/drowned-wolf.json` |
| Complete | Frost-Draugr | `data/monsters/frost-draugr.json` |
| Complete | Frost-Ghoul | `data/monsters/frost-ghoul.json` |
| Complete | Goblin Monarch | `data/monsters/goblin-monarch.json` |
| Complete | Goblin Runner | `data/monsters/goblin-runner.json` |
| Complete | Goblin Warrior | `data/monsters/goblin-warrior.json` |
| Complete | Grafvitnir, the Grave-Wolf — Stage 1 (L7 Solo) | `data/monsters/grafvitnir-stage-1-the-grave-wolf.json` |
| Complete | Grafvitnir, Rot-Given-Shape — Stage 2 (L7 Solo) | `data/monsters/grafvitnir-stage-2-rot-given-shape.json` |
| Complete | Grafvitnir, the Hunger Made Manifest — Stage 3 (L8 Solo) | `data/monsters/grafvitnir-stage-3-hunger-made-manifest.json` |
| Complete | Grave-Singer | `data/monsters/grave-singer.json` |
| Complete | Grave-Wisp | `data/monsters/grave-wisp.json` |
| Complete | Grave-Construct | `data/monsters/graveconstruct.json` |
| Complete | Heitfolk Sentry | `data/monsters/heitfolk-sentry.json` |
| Complete | Keeper Guardian Construct | `data/monsters/keeper-guardian-construct.json` |
| Complete | Lakewalker Draugr | `data/monsters/lakewalker-draugr.json` |
| Complete | Oath-Broken Draugr | `data/monsters/oath-broken-draugr.json` |
| Complete | Pale Maw Acolyte | `data/monsters/pale-maw-acolyte.json` |
| Complete | Pale Maw Inquisitor (Thráinn Ashward) | `data/monsters/pale-maw-inquisitor-thrinn-ashward.json` |
| Complete | Pale Maw Operative | `data/monsters/pale-maw-operative.json` |
| Complete | Pale Maw Soldier | `data/monsters/pale-maw-soldier.json` |
| Complete | Pale Maw Strike Leader (Yrsa Frostbane) | `data/monsters/pale-maw-strike-leader-yrsa-frostbane.json` |
| Complete | Pale Maw Veteran | `data/monsters/pale-maw-veteran.json` |
| Complete | Pale Maw Zealot | `data/monsters/pale-maw-zealot.json` |
| Complete | Rootgnaw Grub | `data/monsters/rootgnaw-grub.json` |
| Complete | Rootgnaw Queen | `data/monsters/rootgnaw-queen.json` |
| Complete | Rot-Beast | `data/monsters/rot-beast.json` |
| Complete | Rot-Echo | `data/monsters/rot-echo.json` |
| Complete | Rot Grub (L1 Minion) | `data/monsters/rot-grub.json` |
| Complete | Rot-Warped Landvaettr | `data/monsters/rot-warped-landvaettr.json` |
| Complete | Rot-Touched | `data/monsters/rottouched.json` |
| Complete | Vine Strangler | `data/monsters/vine-strangler.json` |
| Complete | Warden-Captain Halvard | `data/monsters/warden-captain-halvard.json` |
| Complete | Wight-Commander (L4 Standard) | `data/monsters/wight-commander.json` |
| Complete | Wight-Lord | `data/monsters/wight-lord.json` |
| Complete | Wyrd-Draugr | `data/monsters/wyrd-draugr.json` |

### data/npcs

| Status | Entity | File |
|---|---|---|
| Complete | Bolverkt (Djúpdvergr Scout) | `data/npcs/bolverkt-djpdvergr-scout.json` |
| Complete | Bryn Ketilsdottir | `data/npcs/bryn-ketilsdottir.json` |
| Complete | Brynja Steinsdóttir (Refugee Leader) | `data/npcs/brynja-steinsdottir-refugee-leader.json` |
| Complete | Dreyfus (The King's Hound) | `data/npcs/dreyfus.json` |
| Complete | Warden-Sergeant Eirik Greyhand | `data/npcs/eirik-greyhand.json` |
| Complete | Elder Thyra (Steam-Oasis Leader) | `data/npcs/elder-thyra-steamoasis-leader.json` |
| Complete | Gragnir, Ash-Walker | `data/npcs/gragnir-the-druid.json` |
| Complete | Grénvörðr (Elder of the Green Heart) | `data/npcs/grenvordr-elder-of-the-green-heart.json` |
| Complete | High King Harald | `data/npcs/high-king-harald.json` |
| Complete | Hild (Innkeeper) | `data/npcs/hild.json` |
| Complete | Hildvarð Bruneson (Forgemaster) | `data/npcs/hildvar-bruneson-forgemaster.json` |
| Complete | Kaelen (The Seventh) | `data/npcs/kaelen-the-seventh.json` |
| Complete | Llewyellen "Lew" Tosferd | `data/npcs/lew-tosferd.json` |
| Complete | Rickety Frets | `data/npcs/rickety-frets.json` |
| Complete | Söldís Glóðfari | `data/npcs/soldis-glodfari.json` |
| Complete | Solveig the Burner | `data/npcs/solveig-the-burner.json` |
| Complete | Solvi (Ember-Keeper of Stairwatch) | `data/npcs/solvi.json` |
| Complete | Thráinn Ashward (Pale Maw Inquisitor) | `data/npcs/thrinn-ashward-pale-maw-inquisitor.json` |
| Complete | Thyra Blackhand | `data/npcs/thyra-blackhand.json` |
| Complete | Vigmund Haldorsson (Jarl of Rindgate) | `data/npcs/vigmund-haldorsson-jarl-of-rindgate.json` |
| Complete | Yrsa Frostbane (Pale Maw Strike Leader) | `data/npcs/yrsa-frostbane-pale-maw-strike-leader.json` |

### data/items

| Status | Entity | File |
|---|---|---|
| Complete | Bioluminescent Lantern | `data/items/bioluminescent-lantern.json` |
| Complete | Bundingsteinn (The Binding Record) | `data/items/bundingsteinn-the-binding-record.json` |
| Complete | Chainwarden Toll-Token | `data/items/chainwarden-toll-token.json` |
| Complete | Chainwarden's Confiscated Dagger | `data/items/chainwardens-confiscated-dagger.json` |
| Complete | Dreyfus's Eye | `data/items/dreyfus-eye.json` |
| Complete | Dryad's Thorn-Graft Spear | `data/items/dryads-thorn-graft-spear.json` |
| Complete | Ember-Keeper's Burial Coin | `data/items/ember-keepers-burial-coin.json` |
| Complete | Forged Merchants' Papers | `data/items/forged-merchants-papers.json` |
| Complete | Frost-Etched Barrow-Blade | `data/items/frost-etched-barrow-blade.json` |
| Complete | Frostfen Marsh-Root Poultice | `data/items/frostfen-marsh-root-poultice.json` |
| Complete | Frozen Messenger's Satchel | `data/items/frozen-messenger-satchel.json` |
| Complete | Heitfolk Cold-Wraps (×4) | `data/items/heitfolk-cold-wraps.json` |
| Complete | Heitfolk Tunnel-Key | `data/items/heitfolk-tunnel-key.json` |
| Complete | Hildvarð's Sealed Iron Canteen | `data/items/hildvars-sealed-iron-canteen.json` |
| Complete | Hollow Waystation Lantern | `data/items/hollow-waystation-lantern.json` |
| Complete | Iron Lantern of the Keeper | `data/items/iron-lantern-of-the-keeper.json` |
| Complete | Jardúttr's Gift | `data/items/jardttrs-gift.json` |
| Complete | Jötunfolk Traveller's Ring | `data/items/jotunfolk-travellers-ring.json` |
| Complete | King's Cipher Packet | `data/items/kings-cipher-packet.json` |
| Complete | Root-Shard of the Grove | `data/items/root-shard-of-the-grove.json` |
| Complete | Rootgnaw Chitin Buckler | `data/items/rootgnaw-chitin-buckler.json` |
| Complete | Sealed Letter from V.A. | `data/items/sealed-letter-from-va.json` |
| Complete | Shape-Walker's Talon | `data/items/shape-walkers-talon.json` |
| Complete | Solvi's Ember-Coal Box | `data/items/solvis-ember-coal-box.json` |
| Complete | Yggdrasil Sap-Amber Pendant | `data/items/yggdrasil-sap-amber-pendant.json` |

### data/imbuing-projects

| Status | Entity | File |
|---|---|---|
| Complete | Deep-Rune Stitching | `data/imbuing-projects/Armor/1st-Level/Deep-Rune-Stitching.json` |
| Complete | Frost-Quiet Buckles | `data/imbuing-projects/Armor/1st-Level/Frost-Quiet-Buckles.json` |
| Complete | House-songs of Iron | `data/imbuing-projects/Armor/1st-Level/House-songs-of-Iron.json` |
| Complete | Saltward Lining | `data/imbuing-projects/Armor/1st-Level/Saltward-Lining.json` |
| Complete | Amber-Bark Lamellae | `data/imbuing-projects/Armor/5th-Level/Amber-Bark-Lamellae.json` |
| Complete | Bright-Sun Filigree | `data/imbuing-projects/Armor/5th-Level/Bright-Sun-Filigree.json` |
| Complete | Jötun-Pledge Plates | `data/imbuing-projects/Armor/5th-Level/Jotun-Pledge-Plates.json` |
| Complete | Marsh-Reed Buffer | `data/imbuing-projects/Armor/5th-Level/Marsh-Reed-Buffer.json` |
| Complete | Bone-March Harness | `data/imbuing-projects/Armor/9th-Level/Bone-March-Harness.json` |
| Complete | Skyshield Sigils | `data/imbuing-projects/Armor/9th-Level/Skyshield-Sigils.json` |
| Complete | Throat-Oath Gorget | `data/imbuing-projects/Armor/9th-Level/Throat-Oath-Gorget.json` |
| Complete | White-Expanse Mantle | `data/imbuing-projects/Armor/9th-Level/White-Expanse-Mantle.json` |
| Complete | Ash-Script Focus | `data/imbuing-projects/Implement/1st-Level/Ash-Script-Focus.json` |
| Complete | Resonant Claim | `data/imbuing-projects/Implement/1st-Level/Resonant-Claim.json` |
| Complete | Summerdell Ink | `data/imbuing-projects/Implement/1st-Level/Summerdell-Ink.json` |
| Complete | Wyrm-Whisper Etching | `data/imbuing-projects/Implement/1st-Level/Wyrm-Whisper-Etching.json` |
| Complete | Mirror-True Formulae | `data/imbuing-projects/Implement/5th-Level/Mirror-True-Formulae.json` |
| Complete | Shieldfell Countermark | `data/imbuing-projects/Implement/5th-Level/Shieldfell-Countermark.json` |
| Complete | Tonttu Ward-Knot | `data/imbuing-projects/Implement/5th-Level/Tonttu-Ward-Knot.json` |
| Complete | White-Quiet Invocation | `data/imbuing-projects/Implement/5th-Level/White-Quiet-Invocation.json` |
| Complete | Beinmark Oath-Suture | `data/imbuing-projects/Implement/9th-Level/Beinmark-Oath-Suture.json` |
| Complete | Gråtstrand Salt-Circle | `data/imbuing-projects/Implement/9th-Level/Gratstrand-Salt-Circle.json` |
| Complete | Light-Tongue Benediction | `data/imbuing-projects/Implement/9th-Level/Light-Tongue-Benediction.json` |
| Complete | Svellspraak True-Name Margin | `data/imbuing-projects/Implement/9th-Level/Svellspraak-True-Name-Margin.json` |
| Complete | Dverg Hammer-Truth | `data/imbuing-projects/Weapon/1st-Level/Dverg-Hammer-Truth.json` |
| Complete | Fjord-Edge Balance | `data/imbuing-projects/Weapon/1st-Level/Fjord-Edge-Balance.json` |
| Complete | Marsh-Swallow Temper | `data/imbuing-projects/Weapon/1st-Level/Marsh-Swallow-Temper.json` |
| Complete | Tonttu Tripwire Notch | `data/imbuing-projects/Weapon/1st-Level/Tonttu-Tripwire-Notch.json` |
| Complete | Beinmark Drill-Scar | `data/imbuing-projects/Weapon/5th-Level/Beinmark-Drill-Scar.json` |
| Complete | Shieldfell Gale-Runes | `data/imbuing-projects/Weapon/5th-Level/Shieldfell-Gale-Runes.json` |
| Complete | Sunbright Edge | `data/imbuing-projects/Weapon/5th-Level/Sunbright-Edge.json` |
| Complete | Wyrm-Tongue Challenge | `data/imbuing-projects/Weapon/5th-Level/Wyrm-Tongue-Challenge.json` |
| Complete | Ash-Word Sundering | `data/imbuing-projects/Weapon/9th-Level/Ash-Word-Sundering.json` |
| Complete | Jötun War-Name | `data/imbuing-projects/Weapon/9th-Level/Jotun-War-Name.json` |
| Complete | Summerdell Mercy | `data/imbuing-projects/Weapon/9th-Level/Summerdell-Mercy.json` |
| Complete | White-Expanse Severance | `data/imbuing-projects/Weapon/9th-Level/White-Expanse-Severance.json` |

### data/projects

| Status | Entity | File |
|---|---|---|
| Complete | Askmål Hearth-Lamp | `data/projects/Crafting/1st-Level/Askmal-Hearth-Lamp.json` |
| Complete | Dverg Camp-Iron | `data/projects/Crafting/1st-Level/Dverg-Camp-Iron.json` |
| Complete | Fjordmål Trade-Rope | `data/projects/Crafting/1st-Level/Fjordmal-Trade-Rope.json` |
| Complete | Headsman's Blade | `data/projects/Crafting/1st-Level/Headsmans-Blade.json` |
| Complete | Tonttu Snare-Set | `data/projects/Crafting/1st-Level/Tonttu-Snare-Set.json` |
| Complete | Beinmark March-Drum | `data/projects/Crafting/5th-Level/Beinmark-March-Drum.json` |
| Complete | Gråtstrand Salt-Cure Kit | `data/projects/Crafting/5th-Level/Gratstrand-Salt-Cure-Kit.json` |
| Complete | Myrmål Reed-Raft | `data/projects/Crafting/5th-Level/Myrmal-Reed-Raft.json` |
| Complete | Skjoldfjellsmål Storm-Lantern | `data/projects/Crafting/5th-Level/Skjoldfjeldsmal-Storm-Lantern.json` |
| Complete | Askeskogsmål Root-Shelter | `data/projects/Crafting/9th-Level/Askeskogdsmal-Root-Shelter.json` |
| Complete | Hvitvidde Far-North Sled | `data/projects/Crafting/9th-Level/Hvitvidde-Far-North-Sled.json` |
| Complete | Jötuntunga War-Banner | `data/projects/Crafting/9th-Level/Jotuntunga-War-Banner.json` |
| Complete | Svellspraak Binding-Codex | `data/projects/Crafting/9th-Level/Svellspraak-Binding-Codex.json` |
| Complete | Beinmark Foot-Drill | `data/projects/Other/1st-Level/Beinmark-Foot-Drill.json` |
| Complete | Fjordmål Rope-Work | `data/projects/Other/1st-Level/Fjordmal-Rope-Work.json` |
| Complete | Gråtstrand Cold-Swim | `data/projects/Other/1st-Level/Gratstrand-Cold-Swim.json` |
| Complete | Tonttumál Quiet-Step | `data/projects/Other/1st-Level/Tonttumal-Quiet-Step.json` |
| Complete | Dvergsmål Stone-Reading | `data/projects/Other/5th-Level/Dvergsmal-Stone-Reading.json` |
| Complete | Myrmål Bog-Scout Fieldcraft | `data/projects/Other/5th-Level/Myrmal-Bog-Scout-Fieldcraft.json` |
| Complete | Ormstunga Wyrm-Caller Basics | `data/projects/Other/5th-Level/Ormstunga-Wyrm-Caller-Basics.json` |
| Complete | Skjoldfjellsmål Dueling Form | `data/projects/Other/5th-Level/Skjoldfjellsmal-Dueling-Form.json` |
| Complete | Askeskogsmål Grove-Walking | `data/projects/Other/9th-Level/Askeskogdsmal-Grove-Walking.json` |
| Complete | Jötuntunga Oath-Combat | `data/projects/Other/9th-Level/Jotuntunga-Oath-Combat.json` |
| Complete | Strupemål War-Chant Mastery | `data/projects/Other/9th-Level/Strupemal-War-Chant-Mastery.json` |
| Complete | Svellspraak Court-Tongue | `data/projects/Other/9th-Level/Svellspraak-Court-Tongue.json` |
| Complete | Fjordmål Tidal Tables | `data/projects/Research/1st-Level/Fjordmal-Tidal-Tables.json` |
| Complete | Ormstunga Drake-Signs | `data/projects/Research/1st-Level/Ormstunga-Drake-Signs.json` |
| Complete | Sommerdalsmål Peace-Customs | `data/projects/Research/1st-Level/Sommerdalsmal-Peace-Customs.json` |
| Complete | Tonttumál Ward-Sign Primer | `data/projects/Research/1st-Level/Tonttumal-Ward-Sign-Primer.json` |
| Complete | Askeskogsmål Grove-Lore | `data/projects/Research/5th-Level/Askeskogdsmal-Grove-Lore.json` |
| Complete | Beinmarksmål Border-History | `data/projects/Research/5th-Level/Beinmarksmal-Border-History.json` |
| Complete | Dvergsmål Deep-Survey | `data/projects/Research/5th-Level/Dvergsmal-Deep-Survey.json` |
| Complete | Gråtstrandsmål Wreck-Records | `data/projects/Research/5th-Level/Gratstrandsmal-Wreck-Records.json` |
| Complete | Hvittviddemål Far-North Survey | `data/projects/Research/9th-Level/Hvittviddemal-Far-North-Survey.json` |
| Complete | Jötuntunga True-Names Registry | `data/projects/Research/9th-Level/Jotuntunga-True-Names-Registry.json` |
| Complete | Strupemål War-Chant Etymology | `data/projects/Research/9th-Level/Strupemal-War-Chant-Etymology.json` |
| Complete | Svellspraak Court-Chronicles | `data/projects/Research/9th-Level/Svellspraak-Court-Chronicles.json` |

## Final Validation Step

After all entities are marked `Complete`, rebuild packs and ensure all builds succeed:

```powershell
Set-Location C:\Repos\Svellheim-Entities
node tools/build_svellheim_monsters_pack.js
node tools/build_svellheim_npcs_pack.js
node tools/build_svellheim_items_pack.js
node tools/build_svellheim_projects_pack.js
```

If any build fails, move affected entities back to `In Progress`, fix issues, and re-run builds.
