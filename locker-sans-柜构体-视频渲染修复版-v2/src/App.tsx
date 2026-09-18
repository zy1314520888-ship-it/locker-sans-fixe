import React, { useState } from 'react';
import { ViewMode, VisualTheme } from './types';
import { Navbar, ActiveTab } from './components/Navbar';
import { SingleLetterInspector } from './components/SingleLetterInspector';
import { AlphabetMatrix } from './components/AlphabetMatrix';
import { PosterStudio } from './components/PosterStudio';
import { TheoryDeduction } from './components/TheoryDeduction';
import { Lock, ArrowRight, CornerDownRight, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('inspector');
  const [selectedChar, setSelectedChar] = useState<string>('A');
  const [viewMode, setViewMode] = useState<ViewMode>('orthographic');
  const [theme, setTheme] = useState<VisualTheme>('dark-industrial');
  const [fontFamily, setFontFamily] = useState<string>('Archivo Black, sans-serif');

  const handleSelectCharAndInspect = (char: string) => {
    setSelectedChar(char);
    setActiveTab('inspector');
  };

  return (
    <div className="min-h-screen bg-[#0c0d0f] text-zinc-100 flex flex-col font-sans selection:bg-amber-400 selection:text-black">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        theme={theme}
        onThemeChange={setTheme}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        {/* Core Logic Banner (User's Exact Specification) */}
        <section
          id="specification-banner"
          className="bg-gradient-to-r from-amber-500/10 via-zinc-900 to-zinc-900/60 border border-amber-500/30 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg"
        >
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0 mt-0.5 sm:mt-0">
              <Lock className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                  动力学投影设计规则 (Design Axioms)
                </span>
                <span className="text-[10px] font-mono bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded border border-zinc-700">
                  正四角正视投影
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-200 font-sans leading-relaxed">
                上下两柜口 · 上层柜门不动 · 下层柜门左侧为铰链向左旋 ·
                <strong className="text-amber-300 ml-1">下半字高度不变，只横向缩窄并偏向左侧</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 bg-zinc-950/80 px-3 py-2 rounded-lg border border-zinc-800 shrink-0">
            <span className="text-emerald-400 font-bold">W' = W · cos(θ)</span>
            <span>|</span>
            <span className="text-sky-400 font-bold">H' = H</span>
            <span>|</span>
            <span className="text-amber-400 font-bold">Origin: Left (x=0)</span>
          </div>
        </section>

        {/* Tab Views */}
        {activeTab === 'inspector' && (
          <SingleLetterInspector
            selectedChar={selectedChar}
            onSelectChar={setSelectedChar}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            theme={theme}
            onThemeChange={setTheme}
            fontFamily={fontFamily}
            onFontFamilyChange={setFontFamily}
          />
        )}

        {activeTab === 'matrix' && (
          <AlphabetMatrix
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            theme={theme}
            fontFamily={fontFamily}
            onSelectChar={handleSelectCharAndInspect}
          />
        )}

        {activeTab === 'poster' && (
          <PosterStudio
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            theme={theme}
            fontFamily={fontFamily}
            onThemeChange={setTheme}
          />
        )}

        {activeTab === 'theory' && <TheoryDeduction />}
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-zinc-800/80 bg-[#090a0c] py-6 px-4 text-center text-xs font-mono text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-300">LOCKER SANS / 柜构体</span>
            <span>—</span>
            <span>基于快递柜开门动力学几何重构的实验字体</span>
          </div>
          <div className="flex items-center gap-4 text-zinc-400">
            <span>Projection: Orthographic 2D & 3D WebGL</span>
            <span>Axis: OpenType LKO (0-80)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
