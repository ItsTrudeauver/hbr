"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import tierDataRaw from "../tier_list.json"; 

// --- Types ---
type Character = {
  name: string;
  version: string;
  color: string;
  image: string;
  tier: string;
  role: string;
  row_id: number;
  rank_index: number;
};

// --- Config & Colors ---
const SERAPH_PINK = "#d64f92";

// 1. Element Mapping Config
const ELEMENT_MAP: Record<string, string> = {
  "#b7b7b7": "Null",
  "#a4c2f4": "Ice",
  "#ffffff": "Light",
  "#ea9999": "Fire",
  "#ffd966": "Thunder",
  "#ffe599": "Thunder",
  "#8e7cc3": "Dark",
  "#b6d7a8": "Unison",
};

const ELEMENTS = ["Null", "Ice", "Light", "Fire", "Thunder", "Dark", "Unison"];

const ROLE_COLORS: Record<string, string> = {
  "Buffer": "#4ade80",   // Neon Green
  "Defender": "#3b82f6", // Neon Blue
  "Healer": "#2dd4bf",   // Neon Teal
  "Debuffer": "#a855f7", // Neon Purple
  "Attacker": "#f472b6", // Neon Pink
  "Blaster": "#facc15",  // Neon Yellow
  "Default": "#9ca3af"
};

const getRoleColor = (roleName: string) => {
  if (roleName.includes("Buffer")) return ROLE_COLORS["Buffer"];
  if (roleName.includes("Defender")) return ROLE_COLORS["Defender"];
  if (roleName.includes("Healer")) return ROLE_COLORS["Healer"];
  if (roleName.includes("Debuffer")) return ROLE_COLORS["Debuffer"];
  if (roleName.includes("AoE")) return ROLE_COLORS["Blaster"];
  if (roleName.includes("DPS")) return ROLE_COLORS["Attacker"];
  return ROLE_COLORS["Default"];
};

// --- Dimensions Config (Scaled Down for Better Fit) ---
const COLUMN_CONFIG: Record<string, { title: string; width: string }> = {
  "Buffer (General)": { title: "Buffer (Gen)", width: "320px" },
  "Buffer (Elemental)": { title: "Buffer (Elem)", width: "500px" },
  "Defender": { title: "Defender", width: "220px" },
  "Defender (General)": { title: "Defender", width: "220px" }, 
  "Healer": { title: "Healer", width: "320px" },
  "Debuffer (General)": { title: "Debuffer (Gen)", width: "320px" },
  "Debuffer (Elemental)": { title: "Debuffer (Elem)", width: "500px" },
  "Utility Support": { title: "Utility", width: "380px" },
  "DPS (Single Target)": { title: "DPS (Single)", width: "500px" },
  "DPS (AoE)": { title: "DPS (AoE)", width: "500px" },
};

const COLUMN_ORDER = [
  "Buffer (General)",
  "Buffer (Elemental)",
  "Defender",
  "Healer",
  "Debuffer (General)",
  "Debuffer (Elemental)",
  "Utility Support",
  "DPS (Single Target)",
  "DPS (AoE)",
];

const TIER_ORDER = ["10 (Best)", "9", "8", "7 (Strong)", "6", "5", "4 (Viable)", "3", "2", "1", "0 (Fringe)"];

export default function TierList() {
  const [data] = useState<Character[]>(tierDataRaw as Character[]);
  const [focusedKey, setFocusedKey] = useState<string | null>(null);
  
  // Search States
  const [searchName, setSearchName] = useState("");
  const [searchStyle, setSearchStyle] = useState("");
  const [searchElement, setSearchElement] = useState(""); 

  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const uniqueNames = useMemo(() => {
    return Array.from(new Set(data.map((c) => c.name))).sort();
  }, [data]);

  const availableStyles = useMemo(() => {
    if (!searchName) return [];
    return data
      .filter((c) => c.name.toLowerCase() === searchName.toLowerCase())
      .map((c) => c.version);
  }, [data, searchName]);

  // --- Grid Data Filtering ---
  const gridData = useMemo(() => {
    const rows: Record<string, Record<string, Character[]>> = {};
    TIER_ORDER.forEach((tier) => {
      rows[tier] = {};
      COLUMN_ORDER.forEach((role) => {
        rows[tier][role] = [];
      });
    });

    data.forEach((char) => {
      if (searchElement) {
        const charElement = ELEMENT_MAP[char.color] || "Unknown";
        if (charElement !== searchElement) return; 
      }

      let roleKey = char.role;
      if (roleKey === "Defender (General)") roleKey = "Defender";
      
      if (rows[char.tier] && rows[char.tier][roleKey]) {
        rows[char.tier][roleKey].push(char);
      }
    });
    return rows;
  }, [data, searchElement]); 

  const handleCardClick = (char: Character, e: React.MouseEvent) => {
    e.stopPropagation();
    const key = `${char.name}|${char.version}`;
    setFocusedKey(prev => (prev === key ? null : key));
  };

  const scrollToId = (id: number) => {
      const el = cardRefs.current[id];
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
  };
  
  const setRef = (el: HTMLDivElement | null, id: number) => {
      if (el) cardRefs.current[id] = el;
  };

  useEffect(() => {
      if (searchName) {
          const lowerName = searchName.toLowerCase();
          
          if (searchStyle) {
              const target = data.find(c => c.name.toLowerCase() === lowerName && c.version === searchStyle);
              if (target) {
                  setFocusedKey(`${target.name}|${target.version}`);
                  scrollToId(target.rank_index);
              }
          } else {
              const firstMatch = data.find(c => c.name.toLowerCase() === lowerName);
              if (firstMatch) {
                  setFocusedKey(firstMatch.name); 
                  scrollToId(firstMatch.rank_index);
              }
          }
      } else {
          setFocusedKey(null);
      }
  }, [searchName, searchStyle, data]);

  const renderCell = (tier: string, role: string) => {
    const chars = gridData[tier][role];
    if (!chars || chars.length === 0) return <div className="h-full w-full min-h-[160px]" />; 

    const grouped: Record<number, Character[]> = {};
    chars.forEach(c => {
        if (!grouped[c.row_id]) grouped[c.row_id] = [];
        grouped[c.row_id].push(c);
    });

    const sortedRowIds = Object.keys(grouped).map(Number).sort((a, b) => a - b);

    return (
      <div className="flex flex-col gap-6 p-4 h-full justify-start">
        {sortedRowIds.map(rowId => (
          <div key={rowId} className="flex flex-wrap gap-4 items-start">
            {grouped[rowId].map(char => {
              const charUniqueKey = `${char.name}|${char.version}`;
              const imagePath = char.image ? `/images/${char.image}` : null;
              const accentColor = char.color || '#4b5563';
              
              const isFocused = focusedKey === charUniqueKey || focusedKey === char.name;
              const isDimmed = focusedKey !== null && !isFocused;

              return (
                <div
                  key={char.rank_index}
                  ref={(el) => setRef(el, char.rank_index)}
                  onClick={(e) => handleCardClick(char, e)}
                  style={{ '--card-accent': accentColor } as React.CSSProperties}
                  className={`
                    relative group cursor-pointer rounded-lg overflow-hidden
                    w-[160px] h-[240px] flex-shrink-0 flex flex-col
                    transition-all duration-200 select-none
                    bg-[#1a1b2e] border border-white/20
                    shadow-lg shadow-black/50
                    hover:scale-105 hover:z-40 hover:border-[var(--card-accent)]
                    hover:shadow-[0_0_15px_var(--card-accent)]
                    
                    ${isFocused ? "scale-110 shadow-[0_0_30px_var(--card-accent)] z-50 ring-2 ring-white border-[var(--card-accent)]" : ""}
                    ${isDimmed ? "opacity-30 grayscale blur-[1px]" : "opacity-100"}
                  `}
                >
                    <div className="relative h-[72%] w-full bg-[#0f0f13] overflow-hidden">
                        {imagePath ? (
                           <img 
                              src={imagePath} 
                              alt={char.name} 
                              className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-110"
                              loading="lazy"
                           />
                        ) : (
                           <div className="w-full h-full flex items-center justify-center text-white/20 text-4xl font-mono bg-[#111]">?</div>
                        )}
                        {/* Element Dot */}
                        <div 
                          className="absolute top-2 left-2 w-3 h-3 rounded-full shadow-[0_0_5px_black] border border-white/50" 
                          style={{ backgroundColor: accentColor }}
                        />
                    </div>
                    <div className="h-[28%] w-full px-3 py-2 flex flex-col justify-center relative bg-[#151520] border-t border-white/10 group-hover:bg-[#1a1a28] transition-colors">
                        <span 
                            className="text-[10px] font-bold uppercase tracking-widest mb-0.5 truncate opacity-90"
                            style={{ color: accentColor === '#ffffff' ? '#d1d5db' : accentColor }}
                        >
                            {char.version}
                        </span>
                        <h3 className="text-sm font-bold text-white leading-tight line-clamp-2 drop-shadow-md">
                            {char.name}
                        </h3>
                    </div>
                    
                    {isFocused && focusedKey !== char.name && (
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                const sameCards = data.filter(c => c.name === char.name && c.version === char.version)
                                                    .sort((a,b) => a.rank_index - b.rank_index);
                                const currIdx = sameCards.findIndex(c => c.rank_index === char.rank_index);
                                const nextCard = sameCards[(currIdx + 1) % sameCards.length];
                                scrollToId(nextCard.rank_index);
                            }}
                            className="absolute top-2 right-2 bg-black/80 hover:bg-white hover:text-black text-white border border-white/50 text-base w-8 h-8 flex items-center justify-center rounded-full shadow-xl z-50 transition-colors"
                        >
                            ⏭
                        </button>
                    )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  return (
    <main 
        className="h-screen w-screen flex flex-col bg-[#0b0d17] text-gray-200 font-sans overflow-hidden relative"
    >
      {/* --- SCROLLBAR STYLES --- */}
      <style>{`
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: #334155; /* Slate-700 */
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: ${SERAPH_PINK}; /* Glow Pink on Hover */
          box-shadow: 0 0 10px ${SERAPH_PINK};
        }
        ::-webkit-scrollbar-corner {
          background: transparent;
        }
        /* Firefox Support */
        * {
            scrollbar-width: thin;
            scrollbar-color: #334155 transparent;
        }
      `}</style>
      
      {/* --- BACKGROUND EFFECTS --- */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0b0d17] via-[#161b2e] to-[#251e3e] z-0 pointer-events-none" />
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.1]" 
           style={{ 
             backgroundImage: `
                linear-gradient(rgba(100, 116, 139, 0.3) 1px, transparent 1px), 
                linear-gradient(90deg, rgba(100, 116, 139, 0.3) 1px, transparent 1px)
             `, 
             backgroundSize: '40px 40px' 
           }}>
      </div>

      {/* Glow Orbs */}
      <div className="absolute top-[-20%] left-[20%] w-[800px] h-[800px] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[10%] w-[600px] h-[600px] bg-blue-900/10 rounded-full blur-[100px] pointer-events-none" />

      {/* --- HEADER --- */}
      <header className="h-24 flex-shrink-0 bg-[#0f111a]/80 backdrop-blur-md border-b border-white/10 flex items-center px-8 gap-8 z-50 shadow-2xl relative">
        <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, ${SERAPH_PINK}, #6366f1)` }} />
        
        <div className="flex flex-col justify-center select-none">
            <h1 className="text-4xl font-black italic tracking-tighter flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border-[2px] border-pink-500 flex items-center justify-center shadow-[0_0_15px_#d64f92] bg-black/50">
                    <span className="text-pink-500 text-xl">✦</span>
                </div>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff7eb3] to-[#d64f92]" style={{ textShadow: `0 0 20px ${SERAPH_PINK}50` }}>MEMORIA</span> 
                <span className="text-white">TIER LIST</span>
            </h1>
            <span className="text-xs text-gray-400 font-mono tracking-[0.4em] ml-[3.5rem] mt-0.5 uppercase font-bold">Ver 5.3.0</span>
        </div>
        
        {/* --- FILTERS --- */}
        <div className="ml-auto flex items-center bg-[#13151f] rounded-md border border-white/10 h-12 w-[800px] shadow-lg relative overflow-hidden ring-1 ring-white/5">
            <div className="pl-4 pr-3 text-blue-400 text-xl drop-shadow-[0_0_5px_rgba(96,165,250,0.8)]">
                🔍
            </div>
            
            <input 
                list="names-list" 
                placeholder="SEARCH IDENTITY..." 
                className="bg-transparent text-gray-200 px-2 outline-none flex-1 text-base font-bold placeholder-gray-600 uppercase tracking-widest h-full"
                value={searchName}
                onChange={(e) => { setSearchName(e.target.value); setSearchStyle(""); }}
            />
            <datalist id="names-list">
                {uniqueNames.map(name => <option key={name} value={name} />)}
            </datalist>

            <div className="w-[1px] h-1/2 bg-white/10 mx-1" />

            {/* Element Filter */}
            <div className="w-[180px] relative h-full bg-transparent hover:bg-white/5 transition-colors border-l border-white/10">
                <select 
                    className="bg-transparent text-gray-300 w-full h-full pl-4 pr-8 outline-none text-sm font-bold uppercase cursor-pointer appearance-none relative z-10"
                    value={searchElement}
                    onChange={(e) => setSearchElement(e.target.value)}
                >
                    <option value="" className="bg-[#13151f]">ALL ELEMENTS</option>
                    {ELEMENTS.map(elem => <option key={elem} value={elem} className="bg-[#13151f]">{elem}</option>)}
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-white/50 text-[10px]">▼</div>
            </div>
            
            <div className="w-[1px] h-1/2 bg-white/10 mx-1" />

            {/* Style Filter */}
            <div className="w-[200px] relative h-full bg-transparent hover:bg-white/5 transition-colors border-l border-white/10">
                <select 
                    className="bg-transparent text-gray-300 w-full h-full pl-4 pr-8 outline-none disabled:opacity-30 text-sm font-bold uppercase cursor-pointer appearance-none relative z-10"
                    disabled={!searchName || availableStyles.length === 0}
                    value={searchStyle}
                    onChange={(e) => setSearchStyle(e.target.value)}
                >
                    <option value="" className="bg-[#13151f]">ALL STYLES</option>
                    {availableStyles.map(style => <option key={style} value={style} className="bg-[#13151f]">{style}</option>)}
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-white/50 text-[10px]">▼</div>
            </div>
        </div>
      </header>

      {/* --- MAIN GRID --- */}
      <div className="flex-1 overflow-auto bg-transparent relative z-10 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-black/20" onClick={() => setFocusedKey(null)}>
        <div className="inline-block min-w-max pb-40">
            
            {/* Column Headers */}
            <div className="flex sticky top-0 z-40 bg-[#0b0d17]/95 backdrop-blur shadow-2xl border-b border-white/10">
                <div className="sticky left-0 z-50 bg-[#0b0d17] w-[200px] flex-shrink-0 border-r border-white/10 flex items-center justify-center h-20 shadow-[5px_0_20px_black]">
                    <span className="text-3xl font-black text-[#6888c3] tracking-[0.2em] italic drop-shadow-[0_0_15px_rgba(104,136,195,0.4)]">TIER</span>
                </div>
                {COLUMN_ORDER.map(role => {
                    const headerColor = getRoleColor(role);
                    return (
                        <div 
                            key={role} 
                            className="flex-shrink-0 flex flex-col items-center justify-center border-r border-white/5 relative overflow-hidden h-20" 
                            style={{ 
                                width: COLUMN_CONFIG[role].width,
                                background: `linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.2) 100%)`
                            }}
                        >
                            <div className="absolute bottom-0 left-0 right-0 h-[3px] shadow-[0_0_15px_currentColor]" style={{ backgroundColor: headerColor, color: headerColor }} />
                            <span className="relative z-10 text-xl font-black uppercase tracking-widest text-gray-100 drop-shadow-md">
                                {COLUMN_CONFIG[role].title}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Grid Body */}
            {TIER_ORDER.map((tier, idx) => {
                const rowBg = idx % 2 === 0 ? "bg-white/[0.02]" : "bg-transparent";
                
                return (
                    <div key={tier} className={`flex border-b border-white/5 transition-colors group/row ${rowBg}`}>
                        
                        {/* Sticky Tier Label */}
                        <div className="sticky left-0 z-30 w-[200px] flex-shrink-0 border-r border-white/10 flex flex-col items-center justify-center p-4 shadow-[5px_0_30px_rgba(0,0,0,0.5)] overflow-visible"
                             style={{ background: 'linear-gradient(135deg, #131221 0%, #0b0d17 100%)' }}
                        >
                            <span 
                                className="text-7xl font-black italic tracking-tighter select-none transition-all duration-300 group-hover/row:scale-110 leading-[0.8]"
                                style={{ 
                                    background: `linear-gradient(180deg, #ffffff 0%, ${SERAPH_PINK} 100%)`, 
                                    WebkitBackgroundClip: 'text', 
                                    WebkitTextFillColor: 'transparent',
                                    filter: `drop-shadow(0px 0px 20px ${SERAPH_PINK}30)`,
                                    paddingRight: '0.5rem' 
                                }}
                            >
                                {tier.split(" ")[0]}
                            </span>
                            {tier.includes("(") && (
                                <span className="text-xs uppercase font-bold text-gray-500 mt-4 tracking-[0.2em] bg-black/40 px-3 py-1 rounded border border-white/10 backdrop-blur-sm">
                                    {tier.split("(")[1].replace(")", "")}
                                </span>
                            )}
                        </div>

                        {/* Cells */}
                        {COLUMN_ORDER.map((role) => (
                            <div 
                                key={`${tier}-${role}`} 
                                className="flex-shrink-0 border-r border-white/5 relative" 
                                style={{ width: COLUMN_CONFIG[role].width }}
                            >
                                {renderCell(tier, role)}
                            </div>
                        ))}
                    </div>
                );
            })}
        </div>
      </div>
    </main>
  );
}