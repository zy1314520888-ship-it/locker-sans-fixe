import React, { useState } from 'react';
import { ViewMode, VisualTheme } from '../types';
import { toggleAudio, isAudioEnabled } from '../utils/audio';
import {
  Volume2,
  VolumeX,
  Layers,
  Compass,
  LayoutGrid,
  FileImage,
  Sparkles,
  Box,
  Palette
} from 'lucide-react';

export type ActiveTab = 'inspector' | 'matrix' | 'poster' | 'theory';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  theme: VisualTheme;
  onThemeChange: (theme: VisualTheme) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  theme,
  onThemeChange,
  viewMode,
  onViewModeChange,
}) => {
  const [audioActive, setAudioActive] = useState(isAudioEnabled());

  const handleAudioToggle = () => {
    const newState = toggleAudio();
    setAudioActive(newState);
  };

  const navItems = [
    { id: 'inspector' as ActiveTab, label: '单字解剖与实时推导', icon: Layers },
    { id: 'matrix' as ActiveTab, label: '全字族矩阵 (A-Z / 0-9)', icon: LayoutGrid },
    { id: 'poster' as ActiveTab, label: '海报工坊 (参考图版式)', icon: FileImage },
    { id: 'theory' as ActiveTab, label: '字体设计推导论证', icon: Compass },
  ];

  const themes: { id: VisualTheme; label: string; color: string }[] = [
    { id: 'dark-industrial', label: '工业暗黑', color: 'bg-zinc-800' },
    { id: 'brutalist-mono', label: '极简黑白', color: 'bg-white' },
    { id: 'safety-yellow', label: '快递警戒黄', color: 'bg-amber-400' },
    { id: 'clean-white', label: '展厅白灰', color: 'bg-zinc-300' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#0d0f11]/95 backdrop-blur-md border-b border-zinc-800 px-4 sm:px-6 py-3">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          {/* Animated Mini Locker Icon */}
          <div className="w-8 h-10 border border-amber-400/80 rounded bg-zinc-900 flex flex-col overflow-hidden shadow-md">
            <div className="h-1/2 bg-zinc-800 border-b border-amber-400/50 flex items-center justify-center text-[9px] font-black text-amber-400">
              L
            </div>
            <div
              className="h-1/2 bg-zinc-900 origin-left transition-transform duration-500 hover:scale-x-50 flex items-center justify-center text-[9px] font-black text-amber-400"
              style={{ transform: 'scaleX(0.7)' }}
            >
              L
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-white text-base tracking-wider font-mono">
                LOCKER SANS
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-bold font-mono bg-amber-400 text-black rounded">
                柜构黑体
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-mono hidden sm:block">
              快递柜开合动力学 · 实验字体生成与推演系统
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800 text-xs font-mono">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  isActive
                    ? 'bg-amber-400 text-black font-bold shadow'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{item.label}</span>
                <span className="md:hidden">{item.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </nav>

        {/* Settings: Audio & Visual Theme */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick View Mode Selector */}
          <div className="hidden lg:flex items-center gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800 text-xs font-mono">
            <button
              onClick={() => onViewModeChange('orthographic')}
              className={`px-2 py-1 rounded transition-colors ${
                viewMode === 'orthographic'
                  ? 'bg-amber-400 text-black font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="2D正视投影柜体"
            >
              2D正视
            </button>
            <button
              onClick={() => onViewModeChange('pure-glyph')}
              className={`px-2 py-1 rounded transition-colors flex items-center gap-1 ${
                viewMode === 'pure-glyph'
                  ? 'bg-gradient-to-r from-amber-400 to-amber-300 text-black font-bold shadow'
                  : 'text-amber-400 hover:text-amber-300'
              }`}
              title="2D正视脱媒纯字：无柜体杂质，正交投影下半段缩窄"
            >
              <Sparkles className="w-3 h-3" />
              <span>2D纯字</span>
            </button>
            <button
              onClick={() => onViewModeChange('pure-glyph-3d')}
              className={`px-2 py-1 rounded transition-colors flex items-center gap-1 ${
                viewMode === 'pure-glyph-3d'
                  ? 'bg-gradient-to-r from-sky-400 to-amber-400 text-black font-bold shadow'
                  : 'text-sky-400 hover:text-sky-300'
              }`}
              title="3D正视纯字：无柜体杂质，纯净字体伴随3D旋转呈空间透视收敛"
            >
              <Box className="w-3 h-3" />
              <span>3D纯字</span>
            </button>
            <button
              onClick={() => onViewModeChange('perspective3d')}
              className={`px-2 py-1 rounded transition-colors ${
                viewMode === 'perspective3d'
                  ? 'bg-amber-400 text-black font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="3D实体柜仿真"
            >
              3D实体
            </button>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={handleAudioToggle}
            className={`p-2 rounded-lg border text-xs font-mono transition-colors flex items-center gap-1 ${
              audioActive
                ? 'bg-zinc-800 border-zinc-700 text-amber-400'
                : 'bg-zinc-900 border-zinc-800 text-zinc-500'
            }`}
            title={audioActive ? '关闭开合音效' : '开启开合音效'}
          >
            {audioActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Theme Dropdown / Selector */}
          <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => onThemeChange(t.id)}
                title={t.label}
                className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                  t.color
                } ${
                  theme === t.id
                    ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-black scale-110'
                    : 'opacity-40 hover:opacity-100'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};
