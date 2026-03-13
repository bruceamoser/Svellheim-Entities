# Monster QA Report

Generated: 2026-03-13 20:13:56 UTC  
Monsters checked: **58**  
Monsters with issues: **21**  
Parse errors: **0**

## Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical | 0 |
| 🟡 Warning  | 32 |
| 🔵 Info     | 4 |

## Monster Summary Table

| Monster | 🔴 Critical | 🟡 Warning | 🔵 Info | Parse Error |
|---------|------------|-----------|---------|-------------|
| Draugr Thrall |  | 2 | 1 |  |
| Jarðvættr |  | 3 |  |  |
| Rot Grub |  | 2 | 1 |  |
| Chainwarden Militia |  | 2 |  |  |
| Dire Draugr Wolf |  | 2 |  |  |
| Goblin Runner |  | 1 | 1 |  |
| Rootbound Demolisher |  | 2 |  |  |
| Rootgnaw Grub |  | 1 | 1 |  |
| Rot-Guardian |  | 2 |  |  |
| Rot-Touched |  | 2 |  |  |
| Tunnel Blight Swarm |  | 2 |  |  |
| Wight-Lord |  | 2 |  |  |
| Barrow-Sentinel |  | 1 |  |  |
| Bone-Singer |  | 1 |  |  |
| Dreyfus Shape-Walker Agent |  | 1 |  |  |
| Grafvitnir Stage 1 the Grave-Wolf |  | 1 |  |  |
| Grafvitnir Stage 2 Rot-Given Shape |  | 1 |  |  |
| Pale Maw Strike Leader Yrsa Frostbane |  | 1 |  |  |
| Rot-Forged Sentinel (Harrier) |  | 1 |  |  |
| Wight-Commander |  | 1 |  |  |
| Wyrd-Draugr |  | 1 |  |  |
| Barrow-Draugr Act 2 |  |  |  |  |
| Barrow-Draugr |  |  |  |  |
| Barrow-Warden |  |  |  |  |
| Barrow-Wight |  |  |  |  |
| Blind Draugr Wolf |  |  |  |  |
| Chainwarden Artillerist |  |  |  |  |
| Chainwarden Enforcer |  |  |  |  |
| Chainwarden Guard |  |  |  |  |
| Draugr Thrall Act 2 |  |  |  |  |
| Dreyfus the Shape-Walker |  |  |  |  |
| Drowned Wolf |  |  |  |  |
| Fire Beetle |  |  |  |  |
| Frost-Draugr |  |  |  |  |
| Frost-Ghoul |  |  |  |  |
| Goblin Monarch |  |  |  |  |
| Goblin Warrior |  |  |  |  |
| Grafvitnir Stage 3 Hunger Made Manifest |  |  |  |  |
| Grave-Construct |  |  |  |  |
| Grave-Singer |  |  |  |  |
| Grave-Wisp |  |  |  |  |
| Heitfolk Sentry |  |  |  |  |
| Keeper Guardian Construct |  |  |  |  |
| Lakewalker Draugr |  |  |  |  |
| Oath-Broken Draugr |  |  |  |  |
| Pale Maw Acolyte |  |  |  |  |
| Pale Maw Inquisitor Thrinn Ashward |  |  |  |  |
| Pale Maw Operative |  |  |  |  |
| Pale Maw Soldier |  |  |  |  |
| Pale Maw Veteran |  |  |  |  |
| Pale Maw Zealot |  |  |  |  |
| Rootgnaw Queen |  |  |  |  |
| Rot-Beast |  |  |  |  |
| Rot-Echo |  |  |  |  |
| Rot-Forged Sentinel (Brute) |  |  |  |  |
| Rot-Warped Landvaettr |  |  |  |  |
| Vine Strangler |  |  |  |  |
| Warden-Captain Halvard |  |  |  |  |

---

## Draugr Thrall

### 🟡 Reskin Completeness

- 🔵 `items[name="Wet"]._stats.compendiumSource`
  Item "Wet" was reskinned from official compendium (Compendium.draw-steel.monsters.Actor.R1CEitcfoGyEwRZY.Item.L…) but description does not mention monster name "Draugr Thrall" — verify text was updated.

### 🟡 Effect Configuration

- 🟡 `system.damage.immunities.lightning`
  Immunity to "lightning" (value 3) is declared but no matching ActiveEffect was found. Add an ActiveEffect so the immunity is applied mechanically.
- 🟡 `system.damage.immunities.poison`
  Immunity to "poison" (value 2) is declared but no matching ActiveEffect was found. Add an ActiveEffect so the immunity is applied mechanically.

## Jarðvættr

### 🟡 Effect Configuration

- 🟡 `system.damage.immunities.cold`
  Immunity to "cold" (value 3) is declared but no matching ActiveEffect was found. Add an ActiveEffect so the immunity is applied mechanically.
- 🟡 `system.damage.immunities.poison`
  Immunity to "poison" (value 3) is declared but no matching ActiveEffect was found. Add an ActiveEffect so the immunity is applied mechanically.
- 🟡 `system.damage.weaknesses.fire`
  Weakness to "fire" (value 3) is declared but no matching ActiveEffect was found. Add an ActiveEffect so the weakness is applied mechanically.

## Rot Grub

### 🟡 Reskin Completeness

- 🔵 `items[name="Wet"]._stats.compendiumSource`
  Item "Wet" was reskinned from official compendium (Compendium.draw-steel.monsters.Actor.R1CEitcfoGyEwRZY.Item.L…) but description does not mention monster name "Rot Grub" — verify text was updated.

### 🟡 Effect Configuration

- 🟡 `system.damage.immunities.lightning`
  Immunity to "lightning" (value 3) is declared but no matching ActiveEffect was found. Add an ActiveEffect so the immunity is applied mechanically.
- 🟡 `system.damage.immunities.poison`
  Immunity to "poison" (value 2) is declared but no matching ActiveEffect was found. Add an ActiveEffect so the immunity is applied mechanically.

## Chainwarden Militia

### 🟡 Effect Configuration

- 🟡 `system.damage.immunities.corruption`
  Immunity to "corruption" (value 1) is declared but no matching ActiveEffect was found. Add an ActiveEffect so the immunity is applied mechanically.
- 🟡 `system.damage.immunities.poison`
  Immunity to "poison" (value 1) is declared but no matching ActiveEffect was found. Add an ActiveEffect so the immunity is applied mechanically.

## Dire Draugr Wolf

### 🟡 Effect Configuration

- 🟡 `system.damage.immunities.corruption`
  Immunity to "corruption" (value 4) is declared but no matching ActiveEffect was found. Add an ActiveEffect so the immunity is applied mechanically.
- 🟡 `system.damage.immunities.poison`
  Immunity to "poison" (value 4) is declared but no matching ActiveEffect was found. Add an ActiveEffect so the immunity is applied mechanically.

## Goblin Runner

### 🟡 Reskin Completeness

- 🔵 `items[name="Wet"]._stats.compendiumSource`
  Item "Wet" was reskinned from official compendium (Compendium.draw-steel.monsters.Actor.R1CEitcfoGyEwRZY.Item.L…) but description does not mention monster name "Goblin Runner" — verify text was updated.

### 🟡 Effect Configuration

- 🟡 `system.damage.immunities.poison`
  Immunity to "poison" (value 2) is declared but no matching ActiveEffect was found. Add an ActiveEffect so the immunity is applied mechanically.

## Rootbound Demolisher

### 🟡 Effect Configuration

- 🟡 `system.damage.immunities.corruption`
  Immunity to "corruption" (value 4) is declared but no matching ActiveEffect was found. Add an ActiveEffect so the immunity is applied mechanically.
- 🟡 `system.damage.immunities.poison`
  Immunity to "poison" (value 4) is declared but no matching ActiveEffect was found. Add an ActiveEffect so the immunity is applied mechanically.

## Rootgnaw Grub

### 🟡 Reskin Completeness

- 🔵 `items[name="Wet"]._stats.compendiumSource`
  Item "Wet" was reskinned from official compendium (Compendium.draw-steel.monsters.Actor.R1CEitcfoGyEwRZY.Item.L…) but description does not mention monster name "Rootgnaw Grub" — verify text was updated.

### 🟡 Effect Configuration

- 🟡 `system.damage.immunities.poison`
  Immunity to "poison" (value 2) is declared but no matching ActiveEffect was found. Add an ActiveEffect so the immunity is applied mechanically.

## Rot-Guardian

### 🟡 Reskin Completeness

- 🟡 `items[name="Keeper's Seal"].system.description.value`
  Description contains "Keeper's" which may be an unreplaced original creature name (monster is "Rot-Guardian").

### 🟡 Effect Configuration

- 🟡 `system.damage.immunities.fire`
  Immunity to "fire" (value 5) is declared but no matching ActiveEffect was found. Add an ActiveEffect so the immunity is applied mechanically.

## Rot-Touched

### 🟡 Effect Configuration

- 🟡 `system.damage.immunities.corruption`
  Immunity to "corruption" (value 4) is declared but no matching ActiveEffect was found. Add an ActiveEffect so the immunity is applied mechanically.
- 🟡 `system.damage.immunities.poison`
  Immunity to "poison" (value 4) is declared but no matching ActiveEffect was found. Add an ActiveEffect so the immunity is applied mechanically.

## Tunnel Blight Swarm

### 🟡 Effect Configuration

- 🟡 `system.damage.immunities.corruption`
  Immunity to "corruption" (value 4) is declared but no matching ActiveEffect was found. Add an ActiveEffect so the immunity is applied mechanically.
- 🟡 `system.damage.immunities.poison`
  Immunity to "poison" (value 4) is declared but no matching ActiveEffect was found. Add an ActiveEffect so the immunity is applied mechanically.

## Wight-Lord

### 🟡 Effect Configuration

- 🟡 `system.damage.immunities.corruption`
  Immunity to "corruption" (value 4) is declared but no matching ActiveEffect was found. Add an ActiveEffect so the immunity is applied mechanically.
- 🟡 `system.damage.immunities.poison`
  Immunity to "poison" (value 4) is declared but no matching ActiveEffect was found. Add an ActiveEffect so the immunity is applied mechanically.

## Barrow-Sentinel

### 🟡 Effect Configuration

- 🟡 `system.damage.immunities.cold`
  Immunity to "cold" (value 3) is declared but no matching ActiveEffect was found. Add an ActiveEffect so the immunity is applied mechanically.

## Bone-Singer

### 🟡 Effect Configuration

- 🟡 `system.damage.weaknesses.holy`
  Weakness to "holy" (value 5) is declared but no matching ActiveEffect was found. Add an ActiveEffect so the weakness is applied mechanically.

## Dreyfus Shape-Walker Agent

### 🟡 Effect Configuration

- 🟡 `system.damage.immunities.acid`
  Immunity to "acid" (value 5) is declared but no matching ActiveEffect was found. Add an ActiveEffect so the immunity is applied mechanically.

## Grafvitnir Stage 1 the Grave-Wolf

### 🟡 Effect Configuration

- 🟡 `system.damage.immunities.all`
  "All damage" immunity (value 3) is declared but no matching ActiveEffect was found.

## Grafvitnir Stage 2 Rot-Given Shape

### 🟡 Effect Configuration

- 🟡 `system.damage.weaknesses.holy`
  Weakness to "holy" (value 5) is declared but no matching ActiveEffect was found. Add an ActiveEffect so the weakness is applied mechanically.

## Pale Maw Strike Leader Yrsa Frostbane

### 🟡 Effect Configuration

- 🟡 `system.damage.immunities.fire`
  Immunity to "fire" (value 4) is declared but no matching ActiveEffect was found. Add an ActiveEffect so the immunity is applied mechanically.

## Rot-Forged Sentinel (Harrier)

### 🟡 Effect Configuration

- 🟡 `system.damage.immunities.fire`
  Immunity to "fire" (value 5) is declared but no matching ActiveEffect was found. Add an ActiveEffect so the immunity is applied mechanically.

## Wight-Commander

### 🟡 Effect Configuration

- 🟡 `system.damage.immunities.fire`
  Immunity to "fire" (value 4) is declared but no matching ActiveEffect was found. Add an ActiveEffect so the immunity is applied mechanically.

## Wyrd-Draugr

### 🟡 Effect Configuration

- 🟡 `system.damage.immunities.cold`
  Immunity to "cold" (value 5) is declared but no matching ActiveEffect was found. Add an ActiveEffect so the immunity is applied mechanically.
