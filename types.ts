
// Entities & Vector Math
export interface Vector2 {
  x: number;
  y: number;
}

export enum EntityType {
  PLAYER = 'PLAYER',
  MONSTER = 'MONSTER',
  PROJECTILE = 'PROJECTILE',
  LOOT = 'LOOT',
  PORTAL = 'PORTAL',
  TEXT_PARTICLE = 'TEXT_PARTICLE',
}

export type ClassName = 'KNIGHT' | 'WIZARD' | 'ARCHER';

export interface Stats {
  str: number;
  agi: number;
  vit: number;
  eng: number;
}

export interface DerivedStats {
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  damageMin: number;
  damageMax: number;
  defense: number;
  attackSpeed: number;
  moveSpeed: number;
  critChance: number;
}

// Items & Equipment
export type ItemRarity = 'NORMAL' | 'MAGIC' | 'RARE' | 'EPIC' | 'ANCIENT';
export type ItemSlot = 'WEAPON' | 'HELMET' | 'ARMOR' | 'GLOVES' | 'BOOTS' | 'WINGS' | 'PET';

export interface Item {
  id: string;
  name: string;
  type: ItemSlot;
  rarity: ItemRarity;
  level: number; // Upgrade level (+0 to +9)
  baseStats: Partial<Stats>;
  bonusStats: { label: string; value: number }[];
  icon: string; // Lucide icon name or custom identifier
  color: string;
}

export interface LootDrop extends Vector2 {
  id: string;
  item: Item;
  createdAt: number;
}

// Skills
export interface Skill {
  id: string;
  name: string;
  cooldown: number; // ms
  manaCost: number;
  range: number;
  damageMult: number; // Multiplier of base damage
  projectileSpeed?: number;
  effect: 'MELEE' | 'PROJECTILE' | 'AREA' | 'BUFF' | 'SUMMON';
  icon: string;
  color: string;
  unlockLevel: number;
}

// Game State
export interface Entity extends Vector2 {
  id: string;
  type: EntityType;
  radius: number;
  color: string;
  velocity: Vector2;
  hp: number;
  maxHp: number;
  isDead: boolean;
  facing: number; // Radians
  attackTimer: number; // 0 to 1, 1 being start of attack
}

export interface PlayerEntity extends Entity {
  class: ClassName;
  level: number;
  exp: number;
  expToNext: number;
  stats: Stats; // Base allocated stats
  statPoints: number;
  skillPoints: number;
  equipment: Partial<Record<ItemSlot, Item>>;
  inventory: Item[];
  gold: number;
  activeSkills: Skill[];
  cooldowns: Record<string, number>; // Timestamp when ready
}

export interface MonsterEntity extends Entity {
  name: string;
  level: number;
  aggroRange: number;
  attackRange: number;
  damage: number;
  expReward: number;
  dropChance: number;
  isBoss: boolean;
  targetId: string | null;
  attackCooldown: number;
  sprite: string; // New field for visual identification
}

export interface ProjectileEntity extends Entity {
  ownerId: string;
  damage: number;
  duration: number; // ms
  createdAt: number;
  piercing?: boolean;
}

export interface TextParticle extends Vector2 {
  id: string;
  text: string;
  color: string;
  createdAt: number;
  velocity: Vector2;
  duration: number;
}

export interface Zone {
  id: string;
  name: string;
  width: number;
  height: number;
  monsters: MonsterDefinition[];
  boss?: MonsterDefinition;
  portalTo?: string;
  color: string;
  difficultyMult: number;
}

export interface MonsterDefinition {
  name: string;
  baseHp: number;
  baseDmg: number;
  sprite: string; // simplified
  color: string;
  isBoss?: boolean;
}
