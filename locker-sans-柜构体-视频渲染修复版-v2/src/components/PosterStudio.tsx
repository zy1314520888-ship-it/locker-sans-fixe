import React, { useState, useEffect } from 'react';
import { LockerModule } from './LockerModule';
import { ViewMode, VisualTheme, PosterConfig } from '../types';
import { PRESET_WORDS } from '../data/alphabetData';
import { ExportAndRecordBar } from './ExportAndRecordBar';
import { Download, Sliders, Shuffle, Type, Sparkles, Layers, QrCode, Printer, Activity, Pause } from 'lucide-react';

interface PosterStudioProps {
  viewMode: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  theme: VisualTheme;
  fontFamily: string;
  onThemeChange: (theme: VisualTheme) => void;
}

export const PosterStudio: React.FC<PosterStudioProps> = ({
  viewMode,
  onViewModeChange,
  theme,
  fontFamily,
  onThemeChange,
}) => {
  const [customWord, setCustomWord] = useState('LOCKER');
  const [layoutMode, setLayoutMode] = useState<'word' | 'wall' | 'poster'>('poster');
  const [posterConfig, setPosterConfig] = useState<PosterConfig>({
    headline: '请及时领取',
    subheadline: 'Plz Collect In Time',
    pickupCode: '849-204',
    lockerRows: 4,
    lockerCols: 4,
    theme: 'brutalist-mono',
    showGridLines: true,
    showLockerNumbers: true,
    showDotMatrixTexture: true,
  });

  // State of door angles for each locker in the poster grid
  const [gridAngles, setGridAngles] = useState<number[]>([
    0, 45, 0, 60,
    0, 0, 50, 0,
    30, 0, 0, 70,
    0, 55, 40, 0,
  ]);
  const [isAutonomousMotion, setIsAutonomousMotion] = useState(false);
  const [isRenderingVideo, setIsRenderingVideo] = useState(false);

  // Autonomous animation loop for poster (paused during deterministic video rendering)
  useEffect(() => {
    if (!isAutonomousMotion || isRenderingVideo) return;
    let frameId: number;
    let t = 0;
    const animate = () => {
      t += 0.04;
      setGridAngles((prev) =>
        prev.map((_, i) => {
          // Dynamic organic wave + random oscillation
          const wave = Math.sin(t + i * 0.7) * Math.cos(t * 0.5 + i * 0.3);
          return Math.max(0, Math.min(80, 40 + wave * 38));
        })
      );
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [isAutonomousMotion, isRenderingVideo]);

  // Frame stepper for 100% stutter-free 1080P video export
  const handleFrameStep = (frameIndex: number, totalFrames: number, timeSeconds: number) => {
    const t = timeSeconds * 2.2;
    setGridAngles((prev) =>
      prev.map((_, i) => {
        const wave = Math.sin(t + i * 0.7) * Math.cos(t * 0.5 + i * 0.3);
        return Math.max(0, Math.min(80, 40 + wave * 38));
      })
    );
  };

  // Handle word input
  const sanitizedWord = customWord.toUpperCase().replace(/[^A-Z0-9]/g, '') || 'BOX';

  // Randomize door openings for artistic poster layout
  const handleRandomizePoster = () => {
    const totalCells = posterConfig.lockerRows * posterConfig.lockerCols;
    const newAngles: number[] = [];
    const possibleAngles = [0, 0, 0, 25, 45, 60, 75];
    for (let i = 0; i < totalCells; i++) {
      newAngles.push(possibleAngles[Math.floor(Math.random() * possibleAngles.length)]);
    }
    setGridAngles(newAngles);
  };

  // Toggle single cell
  const handleCellAngleChange = (index: number, newAngle: number) => {
    setGridAngles((prev) => {
      const copy = [...prev];
      copy[index] = newAngle;
      return copy;
    });
  };

  // Preset phrases
  const posterPhrases = [
    { zh: '请及时领取', en: 'Plz Collect In Time', code: '849-204' },
    { zh: '下半字左旋缩窄', en: 'Lower Half Left-Swung', code: 'FONT-2026' },
    { zh: '实验字体实验室', en: 'Kinetic Locker Type Lab', code: 'EXP-889' },
    { zh: '取件码 774-902', en: 'Express Self-Pickup Station', code: '774-902' },
  ];

  return (
    <div id="poster-studio" className="flex flex-col gap-6">
      {/* Configuration Header */}
      <div className="bg-[#141619] border border-zinc-800 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4 shadow-lg">
        {/* Layout Modes & ViewMode Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
            <button
              onClick={() => setLayoutMode('poster')}
              className={`px-3 py-1.5 text-xs font-mono rounded-md transition-all ${
                layoutMode === 'poster' ? 'bg-amber-400 text-black font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              海报编排 (参考图风格)
            </button>
            <button
              onClick={() => setLayoutMode('word')}
              className={`px-3 py-1.5 text-xs font-mono rounded-md transition-all ${
                layoutMode === 'word' ? 'bg-amber-400 text-black font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              单词单行排印
            </button>
          </div>

          {onViewModeChange && (
            <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
              <button
                onClick={() => onViewModeChange('orthographic')}
                className={`px-2.5 py-1 text-xs font-mono rounded transition-all ${
                  viewMode === 'orthographic'
                    ? 'bg-amber-400 text-black font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="柜体投影排版"
              >
                2D柜体
              </button>
              <button
                onClick={() => onViewModeChange('pure-glyph')}
                className={`px-2.5 py-1 text-xs font-mono rounded transition-all flex items-center gap-1 ${
                  viewMode === 'pure-glyph'
                    ? 'bg-gradient-to-r from-amber-400 to-amber-300 text-black font-bold shadow'
                    : 'text-amber-400 hover:text-amber-300 hover:bg-zinc-800'
                }`}
                title="剥离柜体媒介，纯粹字形海报"
              >
                <Sparkles className="w-3 h-3" />
                <span>脱媒纯字</span>
              </button>
            </div>
          )}
        </div>

        {/* Word Input */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-zinc-400">输入文本:</span>
          <input
            type="text"
            value={customWord}
            maxLength={12}
            onChange={(e) => setCustomWord(e.target.value.toUpperCase())}
            placeholder="输入字母..."
            className="bg-zinc-900 border border-zinc-700 text-amber-400 font-mono font-bold text-sm px-3 py-1.5 rounded-lg focus:outline-none focus:border-amber-400 w-36 uppercase tracking-wider"
          />
          {/* Quick preset buttons */}
          <div className="hidden sm:flex gap-1">
            {PRESET_WORDS.slice(0, 4).map((w) => (
              <button
                key={w}
                onClick={() => setCustomWord(w)}
                className="text-[10px] font-mono px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded"
              >
                {w}
              </button>
            ))}
          </div>
        </div>

        {/* Poster Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Dynamic Autonomous Kinetic Motion for Poster */}
          <button
            onClick={() => setIsAutonomousMotion(!isAutonomousMotion)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-lg transition-all shadow ${
              isAutonomousMotion
                ? 'bg-emerald-400 text-black font-bold animate-pulse ring-2 ring-emerald-400/50'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
            }`}
            title="全部柜门实时自主动态开合"
          >
            {isAutonomousMotion ? <Pause className="w-3.5 h-3.5 fill-black" /> : <Activity className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{isAutonomousMotion ? '暂停海报动态' : '全柜门随机动起来'}</span>
          </button>

          <button
            onClick={handleRandomizePoster}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg transition-colors"
            title="随机开合度模拟海报错落构图"
          >
            <Shuffle className="w-3.5 h-3.5 text-amber-400" />
            <span>单次错落</span>
          </button>

          {/* 4K UHD Save & Video Recording */}
          <ExportAndRecordBar
            targetElementId="brutalist-poster-canvas"
            defaultFileNamePrefix="LOCKER-SANS-BRUTALIST-POSTER"
            onRecordStarted={() => {
              setIsRenderingVideo(true);
            }}
            onRecordStopped={() => {
              setIsRenderingVideo(false);
            }}
            onFrameStep={handleFrameStep}
          />
        </div>
      </div>

      {/* Main Poster Artboard */}
      <div className="flex justify-center p-4 sm:p-8 bg-[#0a0b0d] border border-zinc-800/80 rounded-2xl overflow-x-auto shadow-2xl">
        {layoutMode === 'poster' ? (
          /* ==========================================================
             BRUTALIST GRAPHIC POSTER (Direct homage to image.png)
             ========================================================== */
          <div
            id="brutalist-poster-canvas"
            className="w-full max-w-[620px] bg-black text-white p-6 sm:p-8 flex flex-col justify-between border-2 border-zinc-800 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative min-h-[820px]"
          >
            {/* Top Poster Meta Header */}
            <div className="flex items-start justify-between pb-4 border-b border-zinc-800 text-[10px] font-mono text-zinc-400">
              <div className="space-y-0.5">
                <div className="font-bold text-white tracking-widest uppercase">
                  LOCKER SANS / 柜构实验黑体
                </div>
                <div className="text-zinc-500">KINETIC DISPLACEMENT TYPOGRAPHY SPECIMEN</div>
              </div>
              <div className="text-right space-y-0.5 font-mono">
                <div>SYSTEM NO. LK-{posterConfig.pickupCode}</div>
                <div className="text-amber-400 font-bold">ORTHO-PROJECTION: SCALE-X</div>
              </div>
            </div>

            {/* Poster Matrix Locker Grid (4 columns × 4 rows) */}
            <div className="my-6 grid grid-cols-4 gap-2 sm:gap-3 justify-items-center">
              {Array.from({ length: 16 }).map((_, idx) => {
                // Get character from sanitizedWord repeated
                const char = sanitizedWord[idx % sanitizedWord.length] || 'A';
                const angle = gridAngles[idx] !== undefined ? gridAngles[idx] : 0;
                const paddedNum = (idx + 1).toString().padStart(2, '0');

                return (
                  <div key={idx} className="relative group">
                    <LockerModule
                      char={char}
                      angle={angle}
                      viewMode={viewMode}
                      theme="brutalist-mono"
                      fontFamily={fontFamily}
                      boxNumber={paddedNum}
                      showLockerDetails={true}
                      interactive={true}
                      onAngleChange={(newAngle) => handleCellAngleChange(idx, newAngle)}
                      size="sm"
                    />
                  </div>
                );
              })}
            </div>

            {/* Middle Barcode & Tracking Ribbon */}
            <div className="flex items-center justify-between py-3 border-y border-zinc-800 my-2">
              <div className="flex items-center gap-3">
                {/* Simulated barcode */}
                <div className="flex items-center gap-[2px] h-8">
                  {[2, 4, 1, 3, 5, 2, 1, 4, 2, 6, 1, 3, 4, 2, 1, 5, 3, 2, 4].map((w, i) => (
                    <div
                      key={i}
                      className="bg-white h-full"
                      style={{ width: `${w}px` }}
                    />
                  ))}
                </div>
                <span className="font-mono text-xs text-zinc-400">
                  REF: 2026-LOCKER-TYPO
                </span>
              </div>

              <div className="text-right font-mono text-[10px] text-zinc-400">
                <div>HINGE: LEFT PIN (X=0)</div>
                <div className="text-white">HEIGHT: INVARIANT (ΔY=0)</div>
              </div>
            </div>

            {/* Poster Bottom Dot-Matrix Headline (From image.png: "请及时领取 Plz Collect In Time") */}
            <div className="pt-4 flex flex-col gap-2">
              {/* Dot-matrix style Chinese text */}
              <div
                className="text-3xl sm:text-4xl font-black tracking-widest text-white uppercase"
                style={{
                  fontFamily: '"DotGothic16", monospace, sans-serif',
                  letterSpacing: '0.15em',
                }}
              >
                {posterConfig.headline}
              </div>

              {/* English Subheadline */}
              <div
                className="text-base sm:text-lg font-mono text-zinc-400 tracking-wider"
                style={{
                  fontFamily: '"Space Grotesk", monospace, sans-serif',
                }}
              >
                {posterConfig.subheadline}
              </div>

              {/* Bottom Footer Notice */}
              <div className="pt-3 mt-2 border-t border-zinc-900 flex items-center justify-between text-[9px] font-mono text-zinc-500">
                <span>PARCEL LOCKER KINETIC TYPOGRAPHY EXPERIMENT</span>
                <span>ORIGIN: LEFT HINGE · HORIZONTAL CONTRACTION</span>
              </div>
            </div>
          </div>
        ) : (
          /* ==========================================================
             WORD LINE SPECIMEN MODE
             ========================================================== */
          <div className="w-full flex flex-col items-center gap-8 py-8">
            <div className="text-center space-y-1">
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest">
                WORD TYPOGRAPHIC COMPOSITION (点击独立开闭各柜门)
              </span>
              <h2 className="text-lg font-bold text-white font-mono">{sanitizedWord}</h2>
            </div>

            {/* Horizontal Stack of Lockers */}
            <div className="flex flex-wrap justify-center gap-3 p-4 bg-[#141619] rounded-2xl border border-zinc-800">
              {sanitizedWord.split('').map((char, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <LockerModule
                    char={char}
                    angle={gridAngles[idx % gridAngles.length] || 45}
                    viewMode={viewMode}
                    theme={theme}
                    fontFamily={fontFamily}
                    boxNumber={(idx + 1).toString().padStart(2, '0')}
                    showLockerDetails={true}
                    interactive={true}
                    onAngleChange={(newAngle) => handleCellAngleChange(idx % gridAngles.length, newAngle)}
                    size="md"
                  />
                  <span className="mt-2 text-[10px] font-mono text-zinc-500">
                    POS {idx + 1}: {char}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Poster Text Customizer Presets */}
      <div className="bg-[#141619] border border-zinc-800 p-4 rounded-xl flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-mono text-zinc-400">海报文案快速套用:</span>
        <div className="flex flex-wrap gap-2">
          {posterPhrases.map((phrase, i) => (
            <button
              key={i}
              onClick={() => {
                setPosterConfig((prev) => ({
                  ...prev,
                  headline: phrase.zh,
                  subheadline: phrase.en,
                  pickupCode: phrase.code,
                }));
              }}
              className="text-xs font-mono px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-amber-400 text-zinc-300 rounded-lg transition-colors"
            >
              {phrase.zh} ({phrase.en})
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
