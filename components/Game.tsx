
import React, { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { GameEngine } from '../services/engine';
import { UIOverlay } from './UIOverlay';
import { ClassName, EntityType, Item, ItemSlot, PlayerEntity, Stats, MonsterEntity } from '../types';
import { CLASS_BASE_STATS, SKILLS, UPGRADE_JEWEL, CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants';
import { Skull, Ghost, User, Droplet } from 'lucide-react';

// Helper to create initial player
const createPlayer = (className: ClassName): PlayerEntity => ({
  id: 'player',
  type: EntityType.PLAYER,
  class: className,
  x: 100,
  y: 100,
  radius: 20,
  color: '#3b82f6',
  velocity: { x: 0, y: 0 },
  hp: 100,
  maxHp: 100,
  isDead: false,
  level: 1,
  exp: 0,
  expToNext: 100,
  stats: { ...CLASS_BASE_STATS[className] },
  statPoints: 0,
  skillPoints: 0,
  equipment: {},
  inventory: [
     { ...UPGRADE_JEWEL, id: uuidv4() }, 
     { ...UPGRADE_JEWEL, id: uuidv4() },
     { ...UPGRADE_JEWEL, id: uuidv4() }
  ],
  gold: 0,
  activeSkills: SKILLS[className],
  cooldowns: {},
  facing: 0,
  attackTimer: 0
});

// --- Visual Components ---

const PlayerRenderer: React.FC<{ player: PlayerEntity }> = ({ player }) => {
    // Simple Humanoid "Pawn" style top-down
    const isKnight = player.class === 'KNIGHT';
    const isArcher = player.class === 'ARCHER';
    
    // Attack animation: swing weapon arm from 45deg to -45deg relative to facing
    const attackAnim = player.attackTimer > 0 ? -120 * player.attackTimer : 0;
    
    return (
        <div 
            className="absolute z-20 transition-transform"
            style={{ 
                left: player.x - 24, top: player.y - 24, 
                width: 48, height: 48,
                transform: `rotate(${player.facing}rad)`
            }}
        >
            {/* Body */}
            <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-8 rounded-md border-2 border-black/50 ${isKnight ? 'bg-gray-300' : isArcher ? 'bg-green-700' : 'bg-blue-800'}`}>
                {/* Shoulders/Detail */}
                <div className="w-full h-full opacity-30 bg-gradient-to-b from-white to-transparent"></div>
            </div>
            
            {/* Head */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-amber-200 rounded-full border border-black/20 shadow-sm z-10">
                 {/* Helmet/Hat */}
                 {isKnight && <div className="absolute -top-1 -left-1 w-8 h-8 bg-gray-400 rounded-full -z-10 border border-gray-600"></div>}
                 {player.class === 'WIZARD' && <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-8 bg-indigo-900 rounded-t-full -z-10"></div>}
            </div>

            {/* Hands */}
            <div className="absolute top-2 -left-1 w-4 h-4 bg-amber-200 rounded-full border border-black/20"></div>
            
            {/* Weapon Hand */}
            <div 
                className="absolute top-2 -right-1 w-4 h-4 bg-amber-200 rounded-full border border-black/20 origin-left transition-transform duration-75"
                style={{ transform: `rotate(${attackAnim}deg)`}}
            >
                {/* Weapon Graphic */}
                <div className="absolute left-2 top-1/2 -translate-y-1/2 origin-left">
                    {isKnight && <div className="w-16 h-3 bg-gray-200 border border-gray-600 rounded-sm shadow-md relative"><div className="absolute left-0 w-4 h-full bg-amber-700"></div></div>}
                    {isArcher && <div className="w-4 h-12 border-2 border-amber-800 rounded-full -translate-y-1/2 relative"><div className="absolute top-0 w-full h-full border-l border-white/50"></div></div>}
                    {player.class === 'WIZARD' && <div className="w-14 h-2 bg-amber-900 rounded-sm relative"><div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-blue-400 rounded-full animate-pulse shadow-[0_0_10px_cyan]"></div></div>}
                </div>
            </div>
        </div>
    );
}

const MonsterRenderer: React.FC<{ monster: MonsterEntity }> = ({ monster }) => {
    const isSlime = monster.sprite === 'slime' || monster.sprite === 'king_slime';
    const isGoblin = monster.sprite === 'goblin' || monster.sprite === 'orc';
    const isBoss = monster.isBoss;

    // Hit flash effect
    const hitEffect = monster.attackTimer > 0.5 ? 'scale-110 brightness-150' : '';

    return (
        <div 
            className={`absolute transition-transform duration-100 ${hitEffect}`}
            style={{ 
                left: monster.x - monster.radius, top: monster.y - monster.radius, 
                width: monster.radius * 2, height: monster.radius * 2,
                transform: `rotate(${monster.facing}rad) scale(${isBoss ? 1.5 : 1})`
            }}
        >
            {/* HP Bar */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-[120%] h-1.5 bg-black/50 rounded overflow-hidden pointer-events-none" style={{transform: `rotate(-${monster.facing}rad)`}}>
                 <div className="h-full bg-red-600" style={{width: `${(monster.hp / monster.maxHp) * 100}%`}} />
            </div>

            {isSlime && (
                <div 
                    className="w-full h-full rounded-full opacity-90 animate-pulse flex items-center justify-center border-2 border-black/10"
                    style={{ backgroundColor: monster.color, borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%' }}
                >
                   <div className="text-black/20"><Droplet size={monster.radius} /></div>
                </div>
            )}

            {isGoblin && (
                <div className="w-full h-full relative">
                    <div className="absolute inset-0 rounded-sm border border-black/30 flex items-center justify-center" style={{ backgroundColor: monster.color }}>
                         <User size={monster.radius} className="text-black/30" />
                    </div>
                    {/* Ears */}
                    <div className="absolute -left-1 top-0 w-2 h-4 bg-green-800 rounded-full -rotate-45"></div>
                    <div className="absolute -right-1 top-0 w-2 h-4 bg-green-800 rounded-full rotate-45"></div>
                </div>
            )}

            {!isSlime && !isGoblin && (
                <div 
                    className="w-full h-full rounded-lg border-2 border-black/30 flex items-center justify-center shadow-lg"
                    style={{ backgroundColor: monster.color }}
                >
                   {isBoss ? <Skull size={monster.radius * 1.2} className="text-white/80" /> : <Ghost size={monster.radius} className="text-white/50" />}
                </div>
            )}
        </div>
    );
}


export const Game: React.FC = () => {
  const [gameStarted, setGameStarted] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassName>('KNIGHT');
  
  // Game State Refs for performance
  const engineRef = useRef<GameEngine | null>(null);
  const requestRef = useRef<number>();
  const inputRef = useRef({ x: 0, y: 0, attack: false, mouse: { x: 0, y: 0 } });
  
  // React State for UI updates (lower frequency)
  const [uiState, setUiState] = useState<{player: PlayerEntity, zoneId: string, version: number} | null>(null);

  const startGame = () => {
    const player = createPlayer(selectedClass);
    engineRef.current = new GameEngine(player);
    setUiState({ player, zoneId: engineRef.current.zone.id, version: 0 });
    setGameStarted(true);
  };

  const loop = (time: number) => {
    if (!engineRef.current) return;
    const engine = engineRef.current;
    
    const deltaTime = (time - engine.lastTime) / 1000;
    engine.lastTime = time;

    const safeDelta = Math.min(deltaTime, 0.1);

    engine.update(safeDelta, inputRef.current);

    setUiState(prev => ({ 
        player: { ...engine.player }, 
        zoneId: engine.zone.id,
        version: time 
    }));
    
    requestRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => {
    if (gameStarted) {
      engineRef.current!.lastTime = performance.now();
      requestRef.current = requestAnimationFrame(loop);
    }
    return () => cancelAnimationFrame(requestRef.current!);
  }, [gameStarted]);

  // Input Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch(e.key.toLowerCase()) {
        case 'w': inputRef.current.y = -1; break;
        case 's': inputRef.current.y = 1; break;
        case 'a': inputRef.current.x = -1; break;
        case 'd': inputRef.current.x = 1; break;
        case ' ': inputRef.current.attack = true; break;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      switch(e.key.toLowerCase()) {
        case 'w': if (inputRef.current.y < 0) inputRef.current.y = 0; break;
        case 's': if (inputRef.current.y > 0) inputRef.current.y = 0; break;
        case 'a': if (inputRef.current.x < 0) inputRef.current.x = 0; break;
        case 'd': if (inputRef.current.x > 0) inputRef.current.x = 0; break;
        case ' ': inputRef.current.attack = false; break;
      }
    };
    const handleMouseMove = (e: MouseEvent) => {
        const rect = document.getElementById('game-viewport')?.getBoundingClientRect();
        if (rect && engineRef.current) {
             const centerX = window.innerWidth / 2;
             const centerY = window.innerHeight / 2;
             const camX = engineRef.current.player.x - centerX;
             const camY = engineRef.current.player.y - centerY;
             
             inputRef.current.mouse = {
                 x: e.clientX + camX,
                 y: e.clientY + camY
             };
        }
    };
    const handleMouseDown = () => { inputRef.current.attack = true; };
    const handleMouseUp = () => { inputRef.current.attack = false; };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mousedown', handleMouseDown);
        window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // UI Actions
  const handleStatAlloc = (stat: keyof Stats) => {
    if (engineRef.current && engineRef.current.player.statPoints > 0) {
      engineRef.current.player.stats[stat]++;
      engineRef.current.player.statPoints--;
    }
  };

  const handleEquip = (item: Item) => {
     if (!engineRef.current) return;
     const p = engineRef.current.player;
     p.inventory = p.inventory.filter(i => i.id !== item.id);
     const current = p.equipment[item.type];
     if (current) {
         p.inventory.push(current);
     }
     p.equipment[item.type] = item;
  };

  const handleUnequip = (slot: ItemSlot) => {
      if (!engineRef.current) return;
      const p = engineRef.current.player;
      const item = p.equipment[slot];
      if (item) {
          delete p.equipment[slot];
          p.inventory.push(item);
      }
  };

  const handleUpgrade = (item: Item) => {
      if (!engineRef.current) return;
      const p = engineRef.current.player;
      const jewelIndex = p.inventory.findIndex(i => i.name === UPGRADE_JEWEL.name);
      if (jewelIndex === -1) return;
      p.inventory.splice(jewelIndex, 1);

      const successChance = item.level < 3 ? 1.0 : item.level < 6 ? 0.8 : 0.5;
      if (Math.random() < successChance) {
          item.level++;
      } else {
          item.level = Math.max(0, item.level - 1);
      }
  };

  const handleLootClick = (lootId: string) => {
      if (!engineRef.current) return;
      const lootIndex = engineRef.current.loot.findIndex(l => l.id === lootId);
      if (lootIndex !== -1) {
          const l = engineRef.current.loot[lootIndex];
          if (Math.hypot(engineRef.current.player.x - l.x, engineRef.current.player.y - l.y) < 100) {
            engineRef.current.player.inventory.push(l.item);
            engineRef.current.loot.splice(lootIndex, 1);
          }
      }
  }

  // --- RENDER ---
  if (!gameStarted) {
    return (
      <div className="h-screen w-screen bg-gray-900 flex items-center justify-center text-white">
        <div className="bg-black/50 p-10 rounded-2xl border border-gray-700 text-center backdrop-blur-lg shadow-2xl">
            <h1 className="text-6xl font-fantasy text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-600 mb-8">Legend of React</h1>
            <p className="mb-8 text-gray-400">Select your Destiny</p>
            <div className="flex gap-6 mb-8">
                {(['KNIGHT', 'WIZARD', 'ARCHER'] as ClassName[]).map(c => (
                    <button 
                        key={c}
                        onClick={() => setSelectedClass(c)}
                        className={`p-6 w-32 rounded-lg border-2 transition-all ${selectedClass === c ? 'border-yellow-500 bg-yellow-900/20 scale-110' : 'border-gray-700 hover:border-gray-500 bg-gray-800'}`}
                    >
                        <div className="text-2xl mb-2">{c === 'KNIGHT' ? '⚔️' : c === 'WIZARD' ? '🔮' : '🏹'}</div>
                        <div className="font-bold text-sm">{c}</div>
                    </button>
                ))}
            </div>
            <button onClick={startGame} className="px-10 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded shadow-[0_0_20px_rgba(37,99,235,0.5)] transition-all">
                ENTER WORLD
            </button>
        </div>
      </div>
    );
  }

  const eng = engineRef.current;
  if (!eng || !uiState) return <div>Loading...</div>;

  // Camera Transform
  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;
  const camX = -eng.player.x + viewportW / 2;
  const camY = -eng.player.y + viewportH / 2;

  const activePortal = eng.zone.portalTo && eng.monsters.length === 0;

  return (
    <div id="game-viewport" className="relative w-full h-screen bg-black overflow-hidden cursor-crosshair">
        
        {/* Game World Layer */}
        <div 
            className="absolute top-0 left-0 will-change-transform"
            style={{ transform: `translate3d(${camX}px, ${camY}px, 0)` }}
        >
            {/* Map Background */}
            <div 
                className="absolute top-0 left-0 transition-colors duration-1000"
                style={{ 
                    width: eng.zone.width, 
                    height: eng.zone.height, 
                    backgroundColor: eng.zone.color,
                    backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.05) 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }}
            />
            
            {/* Portal */}
            {eng.zone.portalTo && (
                <div 
                    className={`absolute w-[160px] h-[160px] border-4 rounded-full flex items-center justify-center transition-all duration-500 ${activePortal ? 'border-blue-400 animate-pulse shadow-[0_0_80px_blue]' : 'border-gray-700 opacity-30'}`}
                    style={{ left: eng.zone.width - 150, top: eng.zone.height / 2 - 80 }}
                >
                    <div className={`w-full h-full rounded-full blur-md transition-colors ${activePortal ? 'bg-blue-500/30' : 'bg-gray-900'}`} />
                    {activePortal && <div className="absolute text-blue-200 font-fantasy tracking-widest text-sm animate-bounce">PORTAL OPEN</div>}
                    {!activePortal && <div className="absolute text-gray-500 text-xs font-mono">LOCKED</div>}
                </div>
            )}

            {/* Loot */}
            {eng.loot.map(l => (
                <div 
                    key={l.id}
                    onClick={(e) => { e.stopPropagation(); handleLootClick(l.id); }}
                    className="absolute w-8 h-8 flex items-center justify-center bg-black/50 rounded-full border animate-bounce cursor-pointer hover:scale-125 transition-transform z-10"
                    style={{ 
                        left: l.x - 16, top: l.y - 16, 
                        borderColor: l.item.color,
                        boxShadow: `0 0 10px ${l.item.color}`
                    }}
                >
                    <div className="w-4 h-4 rounded-full" style={{backgroundColor: l.item.color}} />
                </div>
            ))}

            {/* Monsters */}
            {eng.monsters.map(m => (
                <MonsterRenderer key={m.id} monster={m} />
            ))}

            {/* Player */}
            <PlayerRenderer player={eng.player} />

            {/* Projectiles */}
            {eng.projectiles.map(p => (
                <div 
                    key={p.id}
                    className="absolute rounded-full"
                    style={{
                        left: p.x - p.radius, top: p.y - p.radius,
                        width: p.radius * 2, height: p.radius * 2,
                        backgroundColor: p.color,
                        boxShadow: `0 0 10px ${p.color}`
                    }}
                />
            ))}

            {/* Particles / Floating Text */}
            {eng.particles.map(p => (
                <div
                    key={p.id}
                    className="absolute font-bold text-shadow-md pointer-events-none z-50"
                    style={{
                        left: p.x, top: p.y,
                        color: p.color,
                        textShadow: '1px 1px 0 #000'
                    }}
                >
                    {p.text}
                </div>
            ))}
        </div>

        {/* UI Layer */}
        <UIOverlay 
            player={uiState.player} 
            onStatAlloc={handleStatAlloc} 
            onEquip={handleEquip}
            onUnequip={handleUnequip}
            onUpgrade={handleUpgrade}
            restart={startGame}
        />
    </div>
  );
};
