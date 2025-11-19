import { ClassName, ItemRarity, ItemSlot, MonsterDefinition, Skill, Stats, Zone, Item } from "./types";

export const TILE_SIZE = 40;
export const CANVAS_WIDTH = 1200;
export const CANVAS_HEIGHT = 800;

export const CLASS_BASE_STATS: Record<ClassName, Stats> = {
  KNIGHT: { str: 25, agi: 15, vit: 25, eng: 10 },
  WIZARD: { str: 10, agi: 15, vit: 15, eng: 35 },
  ARCHER: { str: 15, agi: 35, vit: 15, eng: 10 },
};

export const SKILLS: Record<ClassName, Skill[]> = {
  KNIGHT: [
    { id: 'k1', name: 'Slash', cooldown: 500, manaCost: 0, range: 60, damageMult: 1.0, effect: 'MELEE', icon: 'Sword', color: '#ef4444', unlockLevel: 1 },
    { id: 'k2', name: 'Spin', cooldown: 3000, manaCost: 15, range: 100, damageMult: 1.5, effect: 'AREA', icon: 'RotateCcw', color: '#f87171', unlockLevel: 3 },
    { id: 'k3', name: 'Rage', cooldown: 8000, manaCost: 30, range: 0, damageMult: 0, effect: 'BUFF', icon: 'Zap', color: '#b91c1c', unlockLevel: 6 },
  ],
  WIZARD: [
    { id: 'w1', name: 'Bolt', cooldown: 600, manaCost: 5, range: 400, damageMult: 1.0, projectileSpeed: 400, effect: 'PROJECTILE', icon: 'Zap', color: '#3b82f6', unlockLevel: 1 },
    { id: 'w2', name: 'Nova', cooldown: 4000, manaCost: 25, range: 150, damageMult: 2.0, effect: 'AREA', icon: 'Circle', color: '#60a5fa', unlockLevel: 3 },
    { id: 'w3', name: 'Meteor', cooldown: 6000, manaCost: 40, range: 300, damageMult: 3.0, projectileSpeed: 200, effect: 'PROJECTILE', icon: 'Flame', color: '#1d4ed8', unlockLevel: 6 },
  ],
  ARCHER: [
    { id: 'a1', name: 'Shot', cooldown: 400, manaCost: 0, range: 350, damageMult: 0.9, projectileSpeed: 500, effect: 'PROJECTILE', icon: 'ArrowUp', color: '#22c55e', unlockLevel: 1 },
    { id: 'a2', name: 'Multi', cooldown: 2500, manaCost: 15, range: 300, damageMult: 0.8, projectileSpeed: 500, effect: 'PROJECTILE', icon: 'GalleryVerticalEnd', color: '#4ade80', unlockLevel: 3 },
    { id: 'a3', name: 'Buff', cooldown: 10000, manaCost: 20, range: 0, damageMult: 0, effect: 'BUFF', icon: 'Feather', color: '#15803d', unlockLevel: 6 },
  ],
};

export const ZONES: Zone[] = [
  {
    id: 'zone1',
    name: 'Green Plains',
    width: 2000,
    height: 1500,
    color: '#1a2e1a',
    difficultyMult: 1.0,
    portalTo: 'zone2',
    monsters: [
      { name: 'Slime', baseHp: 30, baseDmg: 5, sprite: 'slime', color: '#86efac' },
      { name: 'Goblin', baseHp: 50, baseDmg: 8, sprite: 'goblin', color: '#166534' },
    ],
    boss: { name: 'King Slime', baseHp: 400, baseDmg: 15, sprite: 'king_slime', color: '#22c55e', isBoss: true }
  },
  {
    id: 'zone2',
    name: 'Dark Forest',
    width: 2000,
    height: 2000,
    color: '#0f172a',
    difficultyMult: 1.8,
    portalTo: 'zone3',
    monsters: [
      { name: 'Wolf', baseHp: 120, baseDmg: 18, sprite: 'wolf', color: '#94a3b8' },
      { name: 'Orc', baseHp: 200, baseDmg: 25, sprite: 'orc', color: '#3f6212' },
    ],
    boss: { name: 'Treant', baseHp: 1500, baseDmg: 40, sprite: 'treant', color: '#713f12', isBoss: true }
  },
  {
    id: 'zone3',
    name: 'Crimson Keep',
    width: 1500,
    height: 1500,
    color: '#450a0a',
    difficultyMult: 3.5,
    monsters: [
      { name: 'Knight', baseHp: 500, baseDmg: 50, sprite: 'dark_knight', color: '#7f1d1d' },
      { name: 'Mage', baseHp: 300, baseDmg: 80, sprite: 'dark_mage', color: '#991b1b' },
    ],
    boss: { name: 'Demon Lord', baseHp: 5000, baseDmg: 120, sprite: 'demon', color: '#ef4444', isBoss: true }
  }
];

export const RARITY_COLORS: Record<ItemRarity, string> = {
  NORMAL: '#9ca3af', // gray-400
  MAGIC: '#3b82f6', // blue-500
  RARE: '#eab308', // yellow-500
  EPIC: '#a855f7', // purple-500
  ANCIENT: '#f43f5e', // rose-500
};

export const UPGRADE_JEWEL: Item = {
  id: 'jewel_bless',
  name: 'Jewel of Bless',
  type: 'WEAPON', // Dummy type to fit interface, handled specially
  rarity: 'RARE',
  level: 0,
  baseStats: {},
  bonusStats: [],
  icon: 'Diamond',
  color: '#c084fc'
};