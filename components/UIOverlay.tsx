import React, { useState } from 'react';
import { PlayerEntity, Item, Stats, ItemSlot, ClassName } from '../types';
import { calculatePlayerStats } from '../services/engine';
import { RARITY_COLORS, CLASS_BASE_STATS, UPGRADE_JEWEL } from '../constants';
import { 
  Heart, Zap, Shield, Sword, User, Backpack, ChevronUp, X, Gem, 
  RotateCcw, MousePointer2, Skull
} from 'lucide-react';

interface UIProps {
  player: PlayerEntity;
  onStatAlloc: (stat: keyof Stats) => void;
  onEquip: (item: Item) => void;
  onUnequip: (slot: ItemSlot) => void;
  onUpgrade: (item: Item) => void;
  restart: () => void;
}

export const UIOverlay: React.FC<UIProps> = ({ player, onStatAlloc, onEquip, onUnequip, onUpgrade, restart }) => {
  const [activeTab, setActiveTab] = useState<'NONE' | 'INVENTORY' | 'CHARACTER'>('NONE');
  const derived = calculatePlayerStats(player);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  const toggleTab = (tab: 'INVENTORY' | 'CHARACTER') => {
    setActiveTab(prev => prev === tab ? 'NONE' : tab);
    setSelectedItem(null);
  };

  const handleUpgrade = () => {
    if (!selectedItem) return;
    // Check if player has jewel
    const jewelIdx = player.inventory.findIndex(i => i.name === UPGRADE_JEWEL.name);
    if (jewelIdx === -1) return;
    
    onUpgrade(selectedItem);
  };

  if (player.isDead) {
    return (
      <div className="absolute inset-0 bg-black/80 flex items-center justify-center flex-col z-50">
        <h1 className="text-6xl font-fantasy text-red-600 mb-4">YOU DIED</h1>
        <p className="text-gray-400 mb-8">Level {player.level} {player.class}</p>
        <button 
          onClick={restart}
          className="px-8 py-3 bg-red-700 hover:bg-red-600 text-white rounded font-bold flex items-center gap-2"
        >
          <RotateCcw size={20} /> RESPAWN
        </button>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4">
      {/* Top Left: HUD */}
      <div className="flex gap-4 pointer-events-auto">
        <div className="relative w-64 h-20 bg-black/60 border border-gray-700 rounded-lg p-2 flex flex-col justify-center gap-2 backdrop-blur-sm">
          {/* HP Bar */}
          <div className="w-full h-6 bg-gray-900 rounded-full overflow-hidden relative border border-gray-800">
            <div 
              className="h-full bg-gradient-to-r from-red-800 to-red-600 transition-all duration-200" 
              style={{ width: `${(player.hp / derived.maxHp) * 100}%` }} 
            />
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-md">
              {Math.floor(player.hp)} / {derived.maxHp}
            </span>
          </div>
          {/* Mana/Exp Bar - Simplified to Exp for now */}
          <div className="w-full h-3 bg-gray-900 rounded-full overflow-hidden relative border border-gray-800">
            <div 
              className="h-full bg-yellow-500 transition-all duration-200" 
              style={{ width: `${(player.exp / player.expToNext) * 100}%` }} 
            />
          </div>
          <div className="absolute -bottom-3 left-2 text-xs text-gray-400 font-mono">LVL {player.level}</div>
        </div>
      </div>

      {/* Center Bottom: Skills */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 pointer-events-auto">
         {player.activeSkills.map((skill, idx) => {
             const onCd = (player.cooldowns[skill.id] || 0) > Date.now();
             return (
                <div key={skill.id} className="relative group">
                    <div className={`w-12 h-12 rounded bg-gray-900 border-2 ${onCd ? 'border-gray-700 opacity-50' : 'border-gray-500 hover:border-white'} flex items-center justify-center`}>
                        <div style={{ color: skill.color }}><Zap size={20} /></div>
                        <span className="absolute -top-2 -right-2 w-5 h-5 bg-black rounded-full text-[10px] flex items-center justify-center border border-gray-700">
                            {idx + 1}
                        </span>
                    </div>
                </div>
             );
         })}
      </div>

      {/* Right: Menus */}
      <div className="absolute right-4 top-4 flex flex-col gap-2 pointer-events-auto">
        <button onClick={() => toggleTab('CHARACTER')} className="w-10 h-10 bg-gray-800 rounded border border-gray-600 flex items-center justify-center hover:bg-gray-700">
            <User size={20} className={player.statPoints > 0 ? "text-yellow-400" : "text-gray-200"} />
        </button>
        <button onClick={() => toggleTab('INVENTORY')} className="w-10 h-10 bg-gray-800 rounded border border-gray-600 flex items-center justify-center hover:bg-gray-700">
            <Backpack size={20} className="text-gray-200" />
        </button>
      </div>

      {/* Character Sheet Modal */}
      {activeTab === 'CHARACTER' && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 bg-gray-900/95 border border-gray-600 rounded-lg p-6 text-white pointer-events-auto shadow-2xl backdrop-blur-md">
           <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
             <h2 className="font-fantasy text-xl text-yellow-500">Character Stats</h2>
             <button onClick={() => setActiveTab('NONE')}><X size={20}/></button>
           </div>
           <div className="space-y-4">
             <div className="flex justify-between text-sm">
                <span>Stat Points Available:</span>
                <span className="text-yellow-400 font-bold">{player.statPoints}</span>
             </div>
             {(Object.keys(player.stats) as Array<keyof Stats>).map(stat => (
               <div key={stat} className="flex items-center justify-between">
                 <span className="uppercase text-gray-400 font-bold w-12">{stat}</span>
                 <span className="flex-1 text-right mr-4 text-lg">{player.stats[stat]} <span className="text-xs text-gray-500">(+{(derived.stats[stat] - player.stats[stat]).toFixed(0)})</span></span>
                 <button 
                   disabled={player.statPoints <= 0}
                   onClick={() => onStatAlloc(stat)}
                   className="w-6 h-6 bg-blue-700 hover:bg-blue-600 disabled:bg-gray-800 rounded flex items-center justify-center text-xs"
                 >
                   +
                 </button>
               </div>
             ))}
             <div className="border-t border-gray-700 pt-4 mt-4 grid grid-cols-2 gap-2 text-xs text-gray-300">
                <div>DMG: {Math.floor(derived.damageMin)}-{Math.floor(derived.damageMax)}</div>
                <div>DEF: {Math.floor(derived.defense)}</div>
                <div>HP: {Math.floor(derived.maxHp)}</div>
                <div>SPD: {Math.floor(derived.attackSpeed * 100)}%</div>
             </div>
           </div>
        </div>
      )}

      {/* Inventory Modal */}
      {activeTab === 'INVENTORY' && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] bg-gray-900/95 border border-gray-600 rounded-lg p-6 text-white pointer-events-auto shadow-2xl backdrop-blur-md flex gap-4">
            {/* Left: Equipment */}
            <div className="w-1/3 flex flex-col items-center gap-2">
                <h3 className="font-fantasy text-gray-400 border-b border-gray-700 w-full text-center pb-1">Equipment</h3>
                <div className="grid grid-cols-2 gap-2 mt-4">
                    {(['HELMET', 'ARMOR', 'WEAPON', 'GLOVES', 'BOOTS', 'WINGS'] as ItemSlot[]).map(slot => {
                        const item = player.equipment[slot];
                        return (
                            <div 
                                key={slot} 
                                onClick={() => item && setSelectedItem(item)}
                                className={`w-12 h-12 border ${item ? 'border-yellow-600 bg-gray-800' : 'border-gray-700 bg-black/50'} rounded flex items-center justify-center cursor-pointer hover:border-white relative`}
                            >
                                {item ? (
                                    <>
                                        <div style={{ color: item.color }}><Shield size={16}/></div>
                                        <span className="absolute bottom-0 right-0 text-[10px] bg-black px-1">+{item.level}</span>
                                    </>
                                ) : <span className="text-[8px] text-gray-600">{slot}</span>}
                            </div>
                        );
                    })}
                </div>
                {selectedItem && Object.values(player.equipment).includes(selectedItem) && (
                     <button onClick={() => { onUnequip(selectedItem.type); setSelectedItem(null); }} className="mt-auto w-full bg-red-900/50 hover:bg-red-800 text-xs py-1 rounded border border-red-700">
                        Unequip
                     </button>
                )}
            </div>

            {/* Middle: Bag */}
            <div className="flex-1 flex flex-col">
                <h3 className="font-fantasy text-gray-400 border-b border-gray-700 w-full pb-1 mb-2">Inventory</h3>
                <div className="grid grid-cols-5 gap-1 overflow-y-auto content-start h-full pr-1">
                    {player.inventory.map((item, i) => (
                        <div 
                            key={item.id} 
                            onClick={() => setSelectedItem(item)}
                            className={`aspect-square border ${selectedItem?.id === item.id ? 'border-white' : 'border-gray-700'} bg-gray-800/50 rounded flex flex-col items-center justify-center cursor-pointer relative group`}
                        >
                            <div style={{ color: item.color }}>
                                {item.name === UPGRADE_JEWEL.name ? <Gem size={16} /> : <Sword size={16} />}
                            </div>
                            {item.level > 0 && <span className="absolute bottom-0 right-0 text-[8px] bg-black px-0.5">+{item.level}</span>}
                        </div>
                    ))}
                    {/* Empty slots filler */}
                    {Array.from({length: Math.max(0, 25 - player.inventory.length)}).map((_, i) => (
                        <div key={`empty-${i}`} className="aspect-square border border-gray-800 bg-black/20 rounded"></div>
                    ))}
                </div>
            </div>

            {/* Right: Details / Actions */}
            <div className="w-1/3 border-l border-gray-700 pl-4 flex flex-col">
                {selectedItem ? (
                    <>
                         <div className={`font-bold text-sm mb-1`} style={{ color: selectedItem.color }}>
                             {selectedItem.name} {selectedItem.level > 0 && `+${selectedItem.level}`}
                         </div>
                         <div className="text-[10px] text-gray-400 mb-4 italic">{selectedItem.rarity} {selectedItem.type}</div>
                         
                         <div className="flex-1 space-y-1 text-xs text-gray-300">
                            {Object.entries(selectedItem.baseStats).map(([key, val]) => (
                                <div key={key} className="flex justify-between uppercase">
                                    <span>{key}</span>
                                    <span>+{val}</span>
                                </div>
                            ))}
                         </div>

                         <div className="mt-auto flex flex-col gap-2">
                             {player.inventory.includes(selectedItem) && selectedItem.name !== UPGRADE_JEWEL.name && (
                                 <button 
                                     onClick={() => { onEquip(selectedItem); setSelectedItem(null); }} 
                                     className="w-full bg-green-800 hover:bg-green-700 text-xs py-2 rounded"
                                 >
                                     Equip
                                 </button>
                             )}
                             {selectedItem.name !== UPGRADE_JEWEL.name && (
                                 <button 
                                     onClick={handleUpgrade}
                                     className="w-full bg-purple-900 hover:bg-purple-700 text-xs py-2 rounded border border-purple-500 flex items-center justify-center gap-1"
                                 >
                                     <Gem size={12} /> Upgrade
                                 </button>
                             )}
                         </div>
                    </>
                ) : (
                    <div className="text-xs text-gray-500 text-center mt-10">Select an item</div>
                )}
                 <button onClick={() => setActiveTab('NONE')} className="absolute top-2 right-2 text-gray-500 hover:text-white"><X size={16}/></button>
            </div>
        </div>
      )}
    </div>
  );
};
