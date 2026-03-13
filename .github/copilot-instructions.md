# Svellheim-Entities — Copilot Instructions

Monster, NPC, item, and project data for the Svellheim campaign. All files are Foundry VTT V13 JSON documents.

## File Layout
- `data/monsters/` — Monster actor JSON (58 files, kebab-case names)
- `data/npcs/` — NPC actor JSON (23 files)
- `data/items/` — Items: abilities, features, treasures (25+ files)
- `data/projects/` — Downtime projects (Crafting/, Research/, Other/)
- `data/imbuing-projects/` — Imbuing enchantments (Armor/, Weapon/, Implement/)
- `module/packs/` — Compiled LevelDB packs (rebuilt from data/)

## Mandatory Workflows

### Creating Monsters/NPCs
1. `list_monster_templates` → find best base template
2. `generate_monster` (from intent) or `generate_monster_actor` (reskin template)
3. `validate_actor_deep` on the result — fix all errors
4. `build_pack` to compile

**NEVER manually write monster JSON.** The generation tools handle stamina, EV, characteristics, and ability structure correctly.

### Fixing Existing Entities
1. `read_campaign_entity` to load current state
2. `update_campaign_entity` to patch fields — don't hand-edit JSON
3. `validate_actor_deep` (or `validate_item_deep`) to verify
4. `build_pack` to recompile

### Batch Validation
Run `validate_directory` on `data/monsters`, `data/npcs`, `data/items` before any release.

## Data Integrity Rules
- **Stamina**: ((10 × Level) + RoleModifier) × OrgMultiplier
- **EV**: ((2 × Level) + 4) × OrgMultiplier
- **Leaders/solos**: role field must be empty string `""`
- **Min abilities**: elite ≥ 3, leader ≥ 3 + villain actions, solo ≥ 5
- **Valid damage types**: acid, cold, corruption, fire, holy, lightning, poison, psychic, sonic
- **"force" is NOT a valid damage type** — this has caused crashes before
- **File names**: kebab-case (`frost-shambler.json`, not `Frost Shambler.json`)
- **No UTF-8 BOM** — if using PowerShell to write files, use `[System.Text.UTF8Encoding]::new($false)`
