# Svellheim: Entities

A Foundry VTT content module for the [Draw Steel](https://mcdm.gg/DrawSteel) system providing shared NPCs, monsters, items, rewards, downtime projects, and imbuing projects for the Svellheim campaign setting.

This is the **shared entity module** — the Act 1–3 modules depend on it.

![Foundry VTT v13](https://img.shields.io/badge/Foundry_VTT-v13-informational)
![Draw Steel System](https://img.shields.io/badge/System-Draw_Steel-orange)

---

## Compendium Packs

| Pack | Type | Contents |
|---|---|---|
| Svellheim NPCs | Actor | Named NPC actor definitions |
| Svellheim Monsters | Actor | Monster actor definitions |
| Svellheim Items | Item | In-game item definitions |
| Svellheim Rewards (Projects & Treasures) | Item | Reward items and treasure |
| Svellheim Projects | Item | Downtime project definitions (Crafting, Research, Other) |
| Svellheim Imbuing Projects | Item | Imbuing project definitions (Armor, Implement, Weapon) |

## Requirements

| Requirement | Version |
|---|---|
| [Foundry VTT](https://foundryvtt.com/) | v11+ (verified v13) |
| [Draw Steel System](https://github.com/MetaMorphic-Digital/draw-steel) | Any |

This module **only** works with the Draw Steel system. It has no other module dependencies.

## Installation

### Manifest URL (recommended)

1. In Foundry VTT, go to **Settings → Manage Modules → Install Module**.
2. Paste the manifest URL into the **Manifest URL** field:
   ```
   https://github.com/bruceamoser/Svellheim-Entities/releases/latest/download/module.json
   ```
3. Click **Install**.

### Manual

1. Download the latest release zip from the [Releases](https://github.com/bruceamoser/Svellheim-Entities/releases) page.
2. Extract the zip into your Foundry `Data/modules/` folder. The folder should be named `svellheim-entities`.
3. Restart Foundry and enable the module in your Draw Steel world.

## File Structure

```
svellheim-entities/
├── module.json                       # Module manifest
├── data/
│   ├── npcs/                         # NPC actor source JSON
│   ├── monsters/                     # Monster actor source JSON
│   ├── items/                        # In-game item definitions
│   ├── projects/                     # Downtime project definitions
│   └── imbuing-projects/             # Imbuing project definitions
├── module/
│   └── packs/                        # Compiled Foundry VTT LevelDB packs
├── tools/                            # Build scripts for compiling packs
└── README.md
```

## License

Content is setting-specific homebrew for Draw Steel by MCDM Productions. Draw Steel is a trademark of MCDM Productions, LLC.

## Acknowledgements

- [Foundry VTT](https://foundryvtt.com/) — Virtual tabletop platform.
- [Draw Steel](https://mcdm.gg/DrawSteel) by MCDM Productions — The RPG system this module supports.
- [MetaMorphic Digital](https://github.com/MetaMorphic-Digital/draw-steel) — Draw Steel system implementation for Foundry VTT.
