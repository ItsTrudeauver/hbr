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
  "#ffe599": "Thunder", // Secondary Thunder
  "#8e7cc3": "Dark",
  "#b6d7a8": "Unison",
};

// Unique list of elements for the dropdown
const ELEMENTS = ["Null", "Ice", "Light", "Fire", "Thunder", "Dark", "Unison"];

const ROLE_COLORS: Record<string, string> = {
  "Buffer": "#20922c",
  "Defender": "#205292",
  "Healer": "#209281",
  "Debuffer": "#682092",
  "Attacker": "#92207f",
  "Blaster": "#928d20",
  "Default": "#5e5e5e"
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

// --- Dimensions Config ---
const COLUMN_CONFIG: Record<string, { title: string; width: string }> = {
  "Buffer (General)": { title: "Buffer (Gen)", width: "420px" },
  "Buffer (Elemental)": { title: "Buffer (Elem)", width: "780px" },
  "Defender": { title: "Defender", width: "280px" },
  "Defender (General)": { title: "Defender", width: "280px" }, 
  "Healer": { title: "Healer", width: "420px" },
  "Debuffer (General)": { title: "Debuffer (Gen)", width: "420px" },
  "Debuffer (Elemental)": { title: "Debuffer (Elem)", width: "780px" },
  "Utility Support": { title: "Utility", width: "580px" },
  "DPS (Single Target)": { title: "DPS (Single)", width: "780px" },
  "DPS (AoE)": { title: "DPS (AoE)", width: "780px" },
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
  const [searchElement, setSearchElement] = useState(""); // New Element Filter

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
      // 1. Element Filter Check
      if (searchElement) {
        const charElement = ELEMENT_MAP[char.color] || "Unknown";
        if (charElement !== searchElement) return; // Skip if no match
      }

      let roleKey = char.role;
      if (roleKey === "Defender (General)") roleKey = "Defender";
      
      if (rows[char.tier] && rows[char.tier][roleKey]) {
        rows[char.tier][roleKey].push(char);
      }
    });
    return rows;
  }, [data, searchElement]); // Re-run when filter changes

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
    if (!chars || chars.length === 0) return <div className="h-full w-full min-h-[180px]" />; 

    const grouped: Record<number, Character[]> = {};
    chars.forEach(c => {
        if (!grouped[c.row_id]) grouped[c.row_id] = [];
        grouped[c.row_id].push(c);
    });

    const sortedRowIds = Object.keys(grouped).map(Number).sort((a, b) => a - b);

    return (
      <div className="flex flex-col gap-10 p-8 h-full justify-start">
        {sortedRowIds.map(rowId => (
          <div key={rowId} className="flex flex-wrap gap-8 items-start">
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
                    relative group cursor-pointer rounded-xl overflow-hidden
                    w-[200px] h-[300px] flex-shrink-0 flex flex-col
                    transition-all duration-200 select-none
                    bg-[#0a0a0a] 
                    border-[3px] border-[var(--card-accent)]
                    shadow-lg shadow-black/80
                    hover:scale-105 hover:z-40
                    hover:shadow-[0_0_25px_var(--card-accent)]
                    
                    ${isFocused ? "scale-110 shadow-[0_0_40px_var(--card-accent)] z-50 ring-4 ring-white" : ""}
                    ${isDimmed ? "opacity-20 grayscale blur-[1px]" : "opacity-100"}
                  `}
                >
                    <div className="relative h-[72%] w-full bg-black overflow-hidden">
                        {imagePath ? (
                           <img 
                              src={imagePath} 
                              alt={char.name} 
                              className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-110"
                              loading="lazy"
                           />
                        ) : (
                           <div className="w-full h-full flex items-center justify-center text-white/20 text-5xl font-mono bg-[#111]">?</div>
                        )}
                    </div>
                    <div className="h-[28%] w-full px-4 py-3 flex flex-col justify-center relative bg-[#0a0a0a] border-t-2 border-white/5">
                        <span 
                            className="text-sm font-bold uppercase tracking-widest mb-1 truncate opacity-90"
                            style={{ color: accentColor === '#ffffff' ? '#d1d5db' : accentColor }}
                        >
                            {char.version}
                        </span>
                        <h3 className="text-xl font-extrabold text-white leading-tight line-clamp-2 drop-shadow-md">
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
                            className="absolute top-2 right-2 bg-black/80 hover:bg-white hover:text-black text-white border border-white/50 text-base w-10 h-10 flex items-center justify-center rounded-full shadow-xl z-50 transition-colors"
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
    <main className="h-screen w-screen flex flex-col bg-[#050505] text-gray-200 font-sans overflow-hidden relative">
      
      <div className="absolute inset-0 pointer-events-none opacity-[0.04]" 
           style={{ backgroundImage: 'linear-gradient(#444 1px, transparent 1px), linear-gradient(90deg, #444 1px, transparent 1px)', backgroundSize: '60px 60px' }}>
      </div>

      {/* --- HEADER --- */}
      <header className="h-32 flex-shrink-0 bg-[#080808] border-b border-white/10 flex items-center px-10 gap-10 z-50 shadow-2xl relative">
        <div className="absolute top-0 left-0 right-0 h-[4px]" style={{ background: SERAPH_PINK, boxShadow: `0 0 20px ${SERAPH_PINK}` }} />
        
        <div className="flex flex-col justify-center select-none pt-2">
            <h1 className="text-5xl font-black italic tracking-tighter flex items-center gap-3">
                <div className="w-12 h-12 rounded-full border-[3px] border-pink-500 flex items-center justify-center mr-2 shadow-[0_0_15px_#d64f92] bg-black">
                    <span className="text-pink-500 text-2xl">✦</span>
                </div>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff7eb3] to-[#d64f92]" style={{ textShadow: `0 0 30px ${SERAPH_PINK}60` }}>MEMORIA</span> 
                <span className="text-white">TIER LIST</span>
            </h1>
            <span className="text-sm text-gray-500 font-mono tracking-[0.4em] ml-20 mt-1 uppercase font-bold">Tier List Ver 5.3.0</span>
        </div>
        
        {/* --- SEARCH BAR with Element Filter --- */}
        <div className="ml-auto flex items-center bg-black rounded-lg border border-gray-600 h-14 w-[900px] shadow-2xl relative overflow-hidden ring-1 ring-white/5">
            {/* Search Icon */}
            <div className="pl-4 pr-2 text-blue-400 text-2xl drop-shadow-[0_0_5px_rgba(96,165,250,0.8)]">
                🔍
            </div>
            
            {/* 1. Name Input */}
            <input 
                list="names-list" 
                placeholder="SEARCH IDENTITY..." 
                className="bg-transparent text-gray-200 px-2 py-2 outline-none flex-1 text-lg font-bold placeholder-gray-500 uppercase tracking-widest h-full"
                value={searchName}
                onChange={(e) => { setSearchName(e.target.value); setSearchStyle(""); }}
            />
            <datalist id="names-list">
                {uniqueNames.map(name => <option key={name} value={name} />)}
            </datalist>

            {/* Divider */}
            <div className="w-[1px] h-3/5 bg-gray-700 mx-2" />

            {/* 2. Element Filter Dropdown */}
            <div className="w-[200px] relative h-full bg-[#0a0a0a] hover:bg-[#111] transition-colors flex items-center cursor-pointer border-l border-gray-800">
                <select 
                    className="bg-black text-white w-full h-full pl-6 pr-8 outline-none text-lg font-bold uppercase cursor-pointer appearance-none relative z-10"
                    value={searchElement}
                    onChange={(e) => setSearchElement(e.target.value)}
                >
                    <option value="">ALL ELEMENTS</option>
                    {ELEMENTS.map(elem => <option key={elem} value={elem}>{elem}</option>)}
                </select>
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-white text-xs">▼</div>
            </div>

            {/* Divider */}
            <div className="w-[1px] h-3/5 bg-gray-700 mx-2" />
            
            {/* 3. Style Dropdown */}
            <div className="w-[220px] relative h-full bg-[#0a0a0a] hover:bg-[#111] transition-colors flex items-center cursor-pointer border-l border-gray-800">
                <select 
                    className="bg-black text-white w-full h-full pl-6 pr-8 outline-none disabled:opacity-50 text-lg font-bold uppercase cursor-pointer appearance-none relative z-10"
                    disabled={!searchName || availableStyles.length === 0}
                    value={searchStyle}
                    onChange={(e) => setSearchStyle(e.target.value)}
                >
                    <option value="">ALL STYLES</option>
                    {availableStyles.map(style => <option key={style} value={style}>{style}</option>)}
                </select>
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-white text-xs">▼</div>
            </div>
        </div>
      </header>

      {/* --- MAIN GRID --- */}
      <div className="flex-1 overflow-auto bg-transparent relative scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent" onClick={() => setFocusedKey(null)}>
        <div className="inline-block min-w-max pb-40">
            
            <div className="flex sticky top-0 z-40 bg-[#080808] shadow-2xl border-b-2 border-white/10">
                <div className="sticky left-0 z-50 bg-[#080808] w-[300px] flex-shrink-0 border-r border-white/10 flex items-center justify-center h-28">
                    <span className="text-4xl font-black text-[#2292d2] tracking-[0.2em] italic drop-shadow-[0_0_10px_rgba(34,146,210,0.5)]">TIER</span>
                </div>
                {COLUMN_ORDER.map(role => {
                    const headerColor = getRoleColor(role);
                    return (
                        <div 
                            key={role} 
                            className="flex-shrink-0 flex flex-col items-center justify-center border-r border-white/10 relative overflow-hidden bg-[#0a0a0a] h-28" 
                            style={{ width: COLUMN_CONFIG[role].width }}
                        >
                            <div className="absolute top-0 left-0 right-0 h-[6px] shadow-[0_0_25px_currentColor]" style={{ backgroundColor: headerColor, color: headerColor }} />
                            <span className="relative z-10 text-3xl font-black uppercase tracking-widest text-white drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
                                {COLUMN_CONFIG[role].title}
                            </span>
                        </div>
                    );
                })}
            </div>

            {TIER_ORDER.map((tier) => (
                <div key={tier} className="flex border-b border-white/5 hover:bg-white/[0.01] transition-colors group/row">
                    <div className="sticky left-0 z-30 bg-[#090909] w-[300px] flex-shrink-0 border-r border-white/10 flex flex-col items-center justify-center p-4 shadow-[5px_0_30px_rgba(0,0,0,0.6)] overflow-visible">
                        <span 
                            className="text-9xl font-black italic tracking-tighter select-none transition-all duration-300 group-hover/row:scale-105 leading-[0.8]"
                            style={{ 
                                background: `linear-gradient(180deg, #ffffff 15%, ${SERAPH_PINK} 100%)`, 
                                WebkitBackgroundClip: 'text', 
                                WebkitTextFillColor: 'transparent',
                                filter: `drop-shadow(0px 0px 15px ${SERAPH_PINK}40)`,
                                paddingRight: '1rem' 
                            }}
                        >
                            {tier.split(" ")[0]}
                        </span>
                        {tier.includes("(") && (
                            <span className="text-2xl uppercase font-bold text-gray-500 mt-6 tracking-[0.3em] bg-black/60 px-4 py-1 rounded border border-white/5">
                                {tier.split("(")[1].replace(")", "")}
                            </span>
                        )}
                    </div>
                    {COLUMN_ORDER.map((role, idx) => (
                        <div 
                            key={`${tier}-${role}`} 
                            className={`flex-shrink-0 border-r border-white/5 ${idx % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.005]'}`} 
                            style={{ width: COLUMN_CONFIG[role].width }}
                        >
                            {renderCell(tier, role)}
                        </div>
                    ))}
                </div>
            ))}
        </div>
      </div>
    </main>
  );
}