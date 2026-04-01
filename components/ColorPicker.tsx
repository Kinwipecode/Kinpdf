'use client';
import React, { useState, useRef, useEffect } from 'react';
import { MdClose, MdFormatColorFill } from 'react-icons/md';

interface ColorPickerProps {
    color: string;
    onChange: (color: string) => void;
    label: string;
    allowTransparent?: boolean;
}

// Office-style theme colors (approximate)
const THEME_BASE_COLORS = [
    '#FFFFFF', '#000000', '#E7E6E6', '#44546A', '#4472C4', '#ED7D31', '#A5A5A5', '#FFC000', '#5B9BD5', '#70AD47'
];

// Generate shades (darker/lighter) for theme colors
// Simplified for this implementation
const getShades = (base: string) => {
    if (base === '#FFFFFF') return ['#F2F2F2', '#DBDBDB', '#BFBFBF', '#A5A5A5', '#7F7F7F'];
    if (base === '#000000') return ['#7F7F7F', '#595959', '#3F3F3F', '#262626', '#0C0C0C'];
    // Custom logic for others would be better, but we'll use a fixed set for now to match the look
    const shades: Record<string, string[]> = {
        '#E7E6E6': ['#F2F2F2', '#D8D8D8', '#AEAEAE', '#757575', '#3A3A3A'],
        '#44546A': ['#D9E1F2', '#B4C6E7', '#8EA9DB', '#305496', '#203764'],
        '#4472C4': ['#D9E1F2', '#B4C6E7', '#8EA9DB', '#305496', '#203764'],
        '#ED7D31': ['#FBE5D6', '#F8CBAD', '#F4B084', '#C65911', '#843C0C'],
        '#A5A5A5': ['#EDEDED', '#DBDBDB', '#C9C9C9', '#7B7B7B', '#525252'],
        '#FFC000': ['#FFF2CC', '#FFE699', '#FFD966', '#BF8F00', '#7F6000'],
        '#5B9BD5': ['#DDEBF7', '#BDD7EE', '#9BC2E6', '#2F75B5', '#1F4E78'],
        '#70AD47': ['#E2EFDA', '#C6E0B4', '#A9D08E', '#548235', '#375623'],
    };
    return shades[base] || ['#FFFFFF', '#DDDDDD', '#BBBBBB', '#999999', '#777777'];
};

const STANDARD_COLORS = [
    '#C00000', '#FF0000', '#FFC000', '#FFFF00', '#92D050', '#00B050', '#00B0F0', '#0070C0', '#002060', '#7030A0'
];

export function ColorPicker({ color, onChange, label, allowTransparent }: ColorPickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const nativeInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const toggleOpen = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsOpen(!isOpen);
    };

    const handleSelect = (c: string) => {
        onChange(c);
        setIsOpen(false);
    };

    return (
        <div ref={containerRef} className="relative flex flex-col items-center">
            <div
                className="flex flex-col items-center gap-1 cursor-pointer transition-transform hover:scale-105 active:scale-95"
                onClick={toggleOpen}
                data-tooltip={label}
            >
                <div
                    className="w-6 h-6 rounded-full shadow-md relative overflow-hidden flex items-center justify-center border-2 border-white/20"
                    style={{
                        background: color === 'transparent' ? 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 50% / 8px 8px' : color,
                    }}
                >
                    {color === 'transparent' && (
                        <div className="absolute w-[150%] h-0.5 bg-red-500 rotate-45" />
                    )}
                </div>
                <span className="text-[9px] text-gray-400 font-medium uppercase tracking-wider">{label}</span>
            </div>

            {isOpen && (
                <div className="absolute top-[calc(100%+12px)] left-1/2 -translate-x-1/2 bg-white border border-gray-300 rounded-lg p-3 z-[1000] shadow-2xl min-w-[260px] animate-in fade-in slide-in-from-top-2">
                    <div className="flex justify-between items-center mb-2 px-1">
                        <span className="text-[10px] font-bold text-slate-600 tracking-tight">DESIGNFARBEN</span>
                        <button onClick={() => setIsOpen(false)} className="text-blue-600 hover:text-blue-700 transition-colors">
                            <MdClose size={18} />
                        </button>
                    </div>

                    <div className="grid grid-cols-10 gap-0.5 mb-4">
                        {/* Theme Base Colors Row */}
                        {THEME_BASE_COLORS.map((bc) => (
                            <div
                                key={bc}
                                className="w-5 h-5 cursor-pointer border border-gray-200 hover:scale-110 transition-transform z-10"
                                style={{ background: bc }}
                                onClick={() => handleSelect(bc)}
                                title={bc}
                            />
                        ))}
                        {/* Shades Rows */}
                        {[0, 1, 2, 3, 4].map((shadeIdx) => (
                            <React.Fragment key={shadeIdx}>
                                {THEME_BASE_COLORS.map((bc) => {
                                    const shade = getShades(bc)[shadeIdx];
                                    return (
                                        <div
                                            key={`${bc}-${shadeIdx}`}
                                            className="w-5 h-5 cursor-pointer border border-gray-100 hover:scale-110 transition-transform z-10"
                                            style={{ background: shade }}
                                            onClick={() => handleSelect(shade)}
                                            title={shade}
                                        />
                                    );
                                })}
                            </React.Fragment>
                        ))}
                    </div>

                    <div className="px-1 mb-2">
                        <span className="text-[10px] font-bold text-slate-600 tracking-tight">STANDARDFARBEN</span>
                    </div>
                    <div className="grid grid-cols-10 gap-0.5 mb-3">
                        {STANDARD_COLORS.map((sc) => (
                            <div
                                key={sc}
                                className="w-5 h-5 cursor-pointer border border-gray-200 hover:scale-110 transition-transform z-10"
                                style={{ background: sc }}
                                onClick={() => handleSelect(sc)}
                                title={sc}
                            />
                        ))}
                    </div>

                    <div className="mt-2 pt-2 border-t border-gray-100">
                        {allowTransparent && (
                            <button
                                className="flex items-center gap-2 w-full py-1.5 px-2 hover:bg-gray-50 text-gray-700 text-xs rounded transition-colors text-left"
                                onClick={() => handleSelect('transparent')}
                            >
                                <div
                                    className="w-4 h-4 rounded-sm border border-gray-300 relative overflow-hidden"
                                    style={{ background: 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 50% / 4px 4px' }}
                                >
                                    <div className="absolute w-[150%] h-0.5 bg-red-500 rotate-45 top-1/2 left-[-25%]" />
                                </div>
                                Transparent
                            </button>
                        )}
                        <button
                            className="flex items-center gap-2 w-full py-1.5 px-2 hover:bg-gray-50 text-gray-700 text-xs rounded transition-colors text-left"
                            onClick={() => nativeInputRef.current?.click()}
                        >
                            <MdFormatColorFill className="text-blue-600" /> Weitere Farben...
                        </button>
                        <input
                            ref={nativeInputRef}
                            type="color"
                            value={color.startsWith('#') ? color : '#000000'}
                            onChange={(e) => onChange(e.target.value)}
                            className="sr-only"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
