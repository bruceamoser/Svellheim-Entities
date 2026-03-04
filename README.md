# Svellheim: Entities

A **Foundry VTT** module for the [Draw Steel](https://mcdmproductions.com) system.  
Shared NPCs, monsters, items, rewards, downtime projects, and imbuing projects for the Svellheim campaign setting.

## Installation

1. In Foundry VTT, go to **Add-on Modules → Install Module**.
2. Paste the manifest URL:
   ```
   https://github.com/bruceamoser/Svellheim-Entities/releases/latest/download/module.json
   ```
3. Click **Install**.

## Dependencies

| Module | Required |
|---|---|
| [Draw Steel](https://github.com/MetaMorphic-Digital/draw-steel) (system) | Yes |

> **Note:** This module has no other module dependencies. The Act 1–3 modules depend on this module.

## Compendium Packs

| Pack | Type | Contents |
|---|---|---|
| Svellheim NPCs | Actor | Named NPC actor definitions |
| Svellheim Monsters | Actor | Monster actor definitions |
| Svellheim Items | Item | In-game item definitions |
| Svellheim Rewards (Projects & Treasures) | Item | Reward items and treasure |
| Svellheim Projects | Item | Downtime project definitions (Crafting, Research, Other) |
| Svellheim Imbuing Projects | Item | Imbuing project definitions (Armor, Implement, Weapon) |

## Repository Structure

```
data/                 Source JSON entity files
  monsters/           Monster actor definitions
  npcs/               NPC actor definitions
  items/              In-game item definitions
  projects/           Downtime project definitions
  imbuing-projects/   Imbuing project definitions
module/packs/         Compiled Foundry VTT LevelDB packs
tools/                Build scripts for compiling packs
```

## Version

Current release: **v0.1.1**  
Compatibility: Foundry VTT v11 – v13

## Author

Bruce A. Moser
