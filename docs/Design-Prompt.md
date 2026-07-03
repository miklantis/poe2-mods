# Design-Prompt (Claude Design)

Wiederverwendbarer Prompt, um das UI-Grundgeruest von poe2-mods in Claude Design
zu prototypen. Ziel: eine visuelle Vorlage, die sich leicht in unseren Stack
(React 19, TypeScript, Tailwind v4, shadcn/ui, Lucide) uebersetzen laesst. Die
App-Oberflaeche ist durchgaengig Englisch; darum ist auch der Prompt Englisch,
damit die Beschriftungen im Mockup gleich Englisch herauskommen.

Bei einem neuen Patch oder groesseren UI-Aenderungen kann der Prompt angepasst
und erneut verwendet werden.

---

## Prompt

```
Design two screens for "poe2-mods", a static, read-only, searchable modifier
browser for Path of Exile 2. It works like the "ModifiersCalc" on poe2db but
with a cleaner, faster UI. Lookup only — no crafting simulation.

Visual and structural reference (for orientation only; do not scrape — all data
comes from our own exports):
- Overview of item categories: https://poe2db.tw/us/Modifiers
- Example per-item modifier view: https://poe2db.tw/us/Rings#ModifiersCalc
We follow that layout idea (item categories, base vs modifiers, prefix/suffix,
tier and weight columns) but with a cleaner, faster, mobile-friendly UI.

Build so the design maps cleanly to our code stack:
- React 19 + TypeScript
- Tailwind CSS v4 (utility classes and standard tokens only, no bespoke CSS)
- shadcn/ui components (Card, Table, Select, Slider, Badge, Tabs, Input, Button, Separator)
- Lucide icons
- Fully responsive (desktop and mobile)
- All UI copy in English

Screen 1 — Item type picker (landing):
A clean grid of item-type tiles (icon + name), organized into groups like poe2db:
One-Handed Weapons (Axe, Mace, Sword, Sceptre, Wand, Dagger, Claw, Spear, Flail),
Two-Handed Weapons (Two Hand Axe, Two Hand Mace, Two Hand Sword, Quarterstaff, Bow,
Crossbow, Staff), Off-Hand (Shield, Buckler, Focus, Quiver), Armour (Body Armour,
Helmet, Gloves, Boots), Jewellery (Ring, Amulet, Belt), Other (Talisman).
A search box at the top filters the tiles. Selecting a tile opens Screen 2.

Screen 2 — Modifier browser for the selected item type:
Header: item-type name; a selector for base / attribute variant (e.g. Body Armour:
Strength, Dexterity, Intelligence, Str/Dex, Str/Int, Dex/Int; Ring: no selector
needed); an item-level control (slider or number input, default 100).
A row of tag filter pills below the header (Caster, Fire, Cold, Lightning, Physical,
Chaos, Attack, Life, Mana, Resistance) — visual only.
Main area: two columns side by side, "Prefixes" and "Suffixes"; they stack on mobile.
Each column is a table of modifier tiers grouped by mod group. Columns: Tier (T1, T2…),
Modifier text (English game text), Roll range (min–max), Weight / Probability (%).
Use tabular numbers for ranges and weights.

Use realistic Ring content so it looks real:
Prefixes — "+# to maximum Life", "Adds # to # Physical Damage to Attacks",
"Adds # to # Fire Damage to Attacks", "+#% increased Mana".
Suffixes — "+#% to Fire Resistance", "+# to Dexterity",
"#% increased Rarity of Items found", "+#% to all Elemental Resistances".
Show 3–4 tiers per group with plausible roll ranges and weights.

Design tone: clean, modern, information-dense but readable, fast-feeling. A dark
theme fits the Path of Exile aesthetic. Strong prefix/suffix separation, good
typography, clear tier labeling.
```

---

## Hinweise zur Umsetzung

- Der Prompt beschreibt die Struktur bewusst textlich. Die poe2db-Links dienen
  nur der groben Orientierung; ob Claude Design sie tatsaechlich laedt, ist nicht
  garantiert. Das eigentliche Arbeitsmaterial ist die Textbeschreibung.
- Die verbindlichen Item-Typen und Groupings leiten wir spaeter aus den Daten
  (`item_types`, `tags`) ab. Die Gruppierung im Prompt ist der menschenlesbare
  Abgleich, damit im Mockup nichts fehlt.
- Uniques sind hier bewusst nicht enthalten: Der aktuelle Export liefert keine
  Unique-Daten. Eine Unique-Ansicht kommt erst mit eigener Quelle.
