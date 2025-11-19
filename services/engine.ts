
import { v4 as uuidv4 } from 'uuid';
import { Entity, EntityType, Item, LootDrop, MonsterEntity, PlayerEntity, ProjectileEntity, Stats, TextParticle, Vector2, Zone, Skill, ItemSlot, ItemRarity } from '../types';
import { ZONES, TILE_SIZE, RARITY_COLORS, UPGRADE_JEWEL } from '../constants';

// --- Helper Math ---
const getDistance = (a: Vector2, b: Vector2) => Math.hypot(b.x - a.x, b.y - a.y);
const normalize = (v: Vector2) => {
  const mag = Math.hypot(v.x, v.y);
  return mag === 0 ? { x: 0, y: 0 } : { x: v.x / mag, y: v.y / mag };
};
const clamp = (num: number, min: number, max: number) => Math.min(Math.max(num, min), max);

// --- Stat Calculation ---
export const calculatePlayerStats = (player: PlayerEntity) => {
  const stats: Stats = { ...player.stats };
  // Add equipment stats
  Object.values(player.equipment).forEach(item => {
    if (!item) return;
    stats.str += (item.baseStats.str || 0) * (1 + item.level * 0.1);
    stats.agi += (item.baseStats.agi || 0) * (1 + item.level * 0.1);
    stats.vit += (item.baseStats.vit || 0) * (1 + item.level * 0.1);
    stats.eng += (item.baseStats.eng || 0) * (1 + item.level * 0.1);
  });

  const maxHp = stats.vit * 10 + player.level * 20;
  const maxMana = stats.eng * 5 + player.level * 10;
  const damageMin = stats.str * 2 + stats.eng * 0.5;
  const damageMax = stats.str * 3 + stats.eng * 1.0;
  const defense = stats.agi * 0.5 + stats.str * 0.2;
  const attackSpeed = 1 + stats.agi * 0.005;
  const moveSpeed = 200 + stats.agi * 0.5;

  return { maxHp, maxMana, damageMin, damageMax, defense, attackSpeed, moveSpeed, stats };
};

// --- Game Logic Class ---
export class GameEngine {
  player: PlayerEntity;
  monsters: MonsterEntity[] = [];
  projectiles: ProjectileEntity[] = [];
  loot: LootDrop[] = [];
  particles: TextParticle[] = [];
  zone: Zone;
  lastTime: number = 0;

  constructor(initialPlayer: PlayerEntity) {
    this.player = initialPlayer;
    this.zone = ZONES[0];
    this.spawnMonsters();
  }

  loadZone(zoneId: string) {
      const nextZone = ZONES.find(z => z.id === zoneId);
      if (!nextZone) return;

      this.zone = nextZone;
      this.projectiles = [];
      this.loot = [];
      
      // Move player to start
      this.player.x = 100;
      this.player.y = this.zone.height / 2;
      
      this.spawnMonsters();
      
      this.particles.push({
          id: uuidv4(), text: `Entered ${this.zone.name}`, color: '#fff',
          x: this.player.x, y: this.player.y - 50,
          velocity: {x: 0, y: -20}, duration: 3, createdAt: Date.now()
      });
  }

  spawnMonsters() {
    this.monsters = [];
    const count = 10 + Math.floor(Math.random() * 5);
    for (let i = 0; i < count; i++) {
      this.addMonster(false);
    }
    // Spawn boss if any
    if (this.zone.boss) {
      this.addMonster(true);
    }
  }

  addMonster(isBoss: boolean) {
    const def = isBoss && this.zone.boss ? this.zone.boss : this.zone.monsters[Math.floor(Math.random() * this.zone.monsters.length)];
    const padding = 200;
    this.monsters.push({
      id: uuidv4(),
      type: EntityType.MONSTER,
      x: padding + Math.random() * (this.zone.width - padding * 2),
      y: padding + Math.random() * (this.zone.height - padding * 2),
      radius: isBoss ? 40 : 25,
      color: def.color,
      velocity: { x: 0, y: 0 },
      hp: def.baseHp * this.zone.difficultyMult,
      maxHp: def.baseHp * this.zone.difficultyMult,
      isDead: false,
      name: def.name,
      sprite: def.sprite,
      level: Math.floor(this.zone.difficultyMult * 5),
      aggroRange: 500,
      attackRange: isBoss ? 100 : 50,
      damage: def.baseDmg * this.zone.difficultyMult,
      expReward: def.baseHp * this.zone.difficultyMult,
      dropChance: isBoss ? 1.0 : 0.3,
      isBoss,
      targetId: null,
      attackCooldown: 0,
      facing: 0,
      attackTimer: 0
    });
  }

  update(deltaTime: number, input: { x: number, y: number, attack: boolean, skillId?: string, mouse: Vector2 }) {
    const derived = calculatePlayerStats(this.player);
    const now = Date.now();

    // --- Player Facing & Animation ---
    const dx = input.mouse.x - this.player.x;
    const dy = input.mouse.y - this.player.y;
    this.player.facing = Math.atan2(dy, dx);

    if (this.player.attackTimer > 0) {
        this.player.attackTimer -= deltaTime * 3; // Attack animation speed
        if (this.player.attackTimer < 0) this.player.attackTimer = 0;
    }

    // --- Player Movement ---
    if (!this.player.isDead) {
      this.player.velocity = {
        x: input.x * derived.moveSpeed,
        y: input.y * derived.moveSpeed
      };
      
      const newX = this.player.x + this.player.velocity.x * deltaTime;
      const newY = this.player.y + this.player.velocity.y * deltaTime;
      
      // Bounds check
      this.player.x = clamp(newX, 0, this.zone.width);
      this.player.y = clamp(newY, 0, this.zone.height);

      // Regen
      if (this.player.hp < derived.maxHp) this.player.hp += derived.maxHp * 0.01 * deltaTime;
    }

    // --- Player Attack/Skill ---
    if (!this.player.isDead) {
        // Auto attack or Skill
        if (input.attack) {
             const basicSkill = this.player.activeSkills[0];
             this.tryUseSkill(basicSkill, derived, now, input.mouse);
        }
        if (input.skillId) {
            const skill = this.player.activeSkills.find(s => s.id === input.skillId);
            if (skill) this.tryUseSkill(skill, derived, now, input.mouse);
        }
    }

    // --- Monsters AI ---
    this.monsters.forEach(m => {
      if (m.isDead) return;
      
      // Decaying attack timer for monsters
      if (m.attackTimer > 0) m.attackTimer -= deltaTime * 2;

      const dist = getDistance(m, this.player);
      if (dist < m.aggroRange && !this.player.isDead) {
        // Face player
        m.facing = Math.atan2(this.player.y - m.y, this.player.x - m.x);

        // Chase
        const dir = normalize({ x: this.player.x - m.x, y: this.player.y - m.y });
        if (dist > m.attackRange) {
            m.x += dir.x * (100 * (m.isBoss ? 1.2 : 1)) * deltaTime;
            m.y += dir.y * (100 * (m.isBoss ? 1.2 : 1)) * deltaTime;
        } else {
            // Attack
            if (now > m.attackCooldown) {
                m.attackCooldown = now + 1500; // 1.5s attack speed
                m.attackTimer = 1.0; // Trigger animation
                
                // Deal damage
                const dmg = Math.max(1, Math.floor(m.damage - derived.defense));
                this.player.hp -= dmg;
                this.particles.push({
                    id: uuidv4(), text: `-${dmg}`, color: '#ef4444', 
                    x: this.player.x, y: this.player.y - 20, 
                    velocity: {x: 0, y: -50}, duration: 1, createdAt: now
                });
                if (this.player.hp <= 0) {
                    this.player.hp = 0;
                    this.player.isDead = true;
                }
            }
        }
      }
    });

    // --- Projectiles ---
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
        const p = this.projectiles[i];
        p.x += p.velocity.x * deltaTime;
        p.y += p.velocity.y * deltaTime;
        
        // Collision with monsters
        if (p.ownerId === this.player.id) {
            for (const m of this.monsters) {
                if (m.isDead) continue;
                if (getDistance(p, m) < m.radius + p.radius) {
                    // Hit
                    m.hp -= p.damage;
                    this.particles.push({
                        id: uuidv4(), text: `${Math.floor(p.damage)}`, color: '#fbbf24',
                        x: m.x, y: m.y - m.radius,
                        velocity: {x: (Math.random()-0.5)*50, y: -50}, duration: 0.8, createdAt: now
                    });

                    if (m.hp <= 0) {
                        m.isDead = true;
                        this.handleMonsterDeath(m);
                    }

                    if (!p.piercing) {
                        p.duration = 0; // Kill projectile
                        break;
                    }
                }
            }
        }

        if (now - p.createdAt > p.duration * 1000) {
            this.projectiles.splice(i, 1);
        }
    }

    // --- Loot & Portals ---
    // Check portal - Portal is always at right center of map
    const portalPos = { x: this.zone.width - 100, y: this.zone.height / 2 };
    if (this.zone.portalTo && getDistance(this.player, portalPos) < 80) {
       if (this.monsters.every(m => m.isDead)) {
           this.loadZone(this.zone.portalTo);
       } else {
           // Optional warning: "Clear area first!"
       }
    }

    // --- Cleanup ---
    this.monsters = this.monsters.filter(m => !m.isDead);
    this.particles = this.particles.filter(p => now - p.createdAt < p.duration * 1000);
    this.particles.forEach(p => {
        p.x += p.velocity.x * deltaTime;
        p.y += p.velocity.y * deltaTime;
    });
  }

  tryUseSkill(skill: Skill, derived: any, now: number, target: Vector2) {
      const cdEnd = this.player.cooldowns[skill.id] || 0;
      if (now < cdEnd) return;
      
      // Set cooldown
      this.player.cooldowns[skill.id] = now + skill.cooldown;
      
      // Set visual attack timer if it's a melee/shoot skill
      if (skill.effect !== 'BUFF') {
        this.player.attackTimer = 1.0;
      }

      const dmg = (derived.damageMin + Math.random() * (derived.damageMax - derived.damageMin)) * skill.damageMult;

      if (skill.effect === 'MELEE' || skill.effect === 'AREA') {
          // Area check around player or in front
          this.monsters.forEach(m => {
              const dist = getDistance(this.player, m);
              if (dist < skill.range + m.radius) {
                  m.hp -= dmg;
                  this.particles.push({
                    id: uuidv4(), text: `${Math.floor(dmg)}`, color: '#ffffff',
                    x: m.x, y: m.y - m.radius,
                    velocity: {x: (Math.random()-0.5)*50, y: -80}, duration: 0.8, createdAt: now
                });
                  if (m.hp <= 0) {
                      m.isDead = true;
                      this.handleMonsterDeath(m);
                  }
              }
          });
      } else if (skill.effect === 'PROJECTILE') {
          const dir = normalize({ x: target.x - this.player.x, y: target.y - this.player.y });
          this.projectiles.push({
              id: uuidv4(), type: EntityType.PROJECTILE,
              x: this.player.x, y: this.player.y,
              velocity: { x: dir.x * (skill.projectileSpeed || 400), y: dir.y * (skill.projectileSpeed || 400) },
              radius: 10, color: skill.color, ownerId: this.player.id,
              damage: dmg, duration: 2, createdAt: now, piercing: false,
              hp: 1, maxHp: 1, isDead: false,
              facing: Math.atan2(dir.y, dir.x), attackTimer: 0
          });
      } else if (skill.effect === 'BUFF') {
          // Implement buff logic (simplified: just heal for now)
          this.player.hp = Math.min(this.player.hp + dmg, derived.maxHp);
          this.particles.push({
            id: uuidv4(), text: `Heal`, color: '#22c55e',
            x: this.player.x, y: this.player.y - 40,
            velocity: {x: 0, y: -50}, duration: 1, createdAt: now
        });
      }
  }

  handleMonsterDeath(m: MonsterEntity) {
      // Grant Exp
      this.player.exp += m.expReward;
      if (this.player.exp >= this.player.expToNext) {
          this.player.level++;
          this.player.exp -= this.player.expToNext;
          this.player.expToNext = Math.floor(this.player.expToNext * 1.5);
          this.player.statPoints += 5;
          this.player.hp = calculatePlayerStats(this.player).maxHp; // Full heal
          this.particles.push({
            id: uuidv4(), text: `LEVEL UP!`, color: '#fbbf24',
            x: this.player.x, y: this.player.y - 60,
            velocity: {x: 0, y: -100}, duration: 2, createdAt: Date.now()
        });
      }

      // Drop Loot
      if (Math.random() < m.dropChance) {
          const isJewel = Math.random() < 0.1;
          const lootItem: Item = isJewel ? { ...UPGRADE_JEWEL, id: uuidv4() } : this.generateRandomItem(m.level);
          
          this.loot.push({
              id: uuidv4(),
              x: m.x + (Math.random() - 0.5) * 30,
              y: m.y + (Math.random() - 0.5) * 30,
              item: lootItem,
              createdAt: Date.now()
          });
      }
  }

  generateRandomItem(level: number): Item {
      const slots: ItemSlot[] = ['WEAPON', 'HELMET', 'ARMOR', 'GLOVES', 'BOOTS'];
      const slot = slots[Math.floor(Math.random() * slots.length)];
      const rarities: ItemRarity[] = ['NORMAL', 'MAGIC', 'RARE', 'EPIC', 'ANCIENT'];
      const rarityIndex = Math.random() > 0.9 ? 3 : Math.random() > 0.7 ? 2 : Math.random() > 0.4 ? 1 : 0;
      const rarity = rarities[rarityIndex];
      
      return {
          id: uuidv4(),
          name: `${rarity} ${slot}`,
          type: slot,
          rarity,
          level: 0,
          icon: slot === 'WEAPON' ? 'Sword' : 'Shield', // Simplified
          color: RARITY_COLORS[rarity],
          baseStats: { str: level, agi: level },
          bonusStats: []
      };
  }
}
