import React, { useState } from 'react';
import { LockerModule } from './LockerModule';
import { KineticCanvasStage } from './KineticCanvasStage';
import { ViewMode, VisualTheme } from '../types';
import { GLYPH_ANATOMIES, ALPHABET_LIST } from '../data/alphabetData';
import { ExportAndRecordBar } from './ExportAndRecordBar';
import { generateLetterSvg, downloadSvgFile } from '../utils/svgExport';
import {
  RotateCcw,
  Sliders,
  Copy,
  Check,
  Code2,
  FileCode,
  Layers,
  Eye,
  Info,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Activity,
  Pause,
  Sparkles,
  Box,
  Compass,
  Cpu,
} from 'lucide-react';

interface SingleLetterInspectorProps {
  selectedChar: string;
  onSelectChar: (char: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  theme: VisualTheme;
  onThemeChange: (theme: VisualTheme) => void;
  fontFamily: string;
  onFontFamilyChange: (font: string) => void;
}

export const SingleLetterInspector: React.FC<SingleLetterInspectorProps> = ({
  selectedChar,
  onSelectChar,
  viewMode,
  onViewModeChange,
  theme,
  onThemeChange,
  fontFamily,
  onFontFamilyChange,
}) => {
  const [angle, setAngle] = useState(45);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showWireframe, setShowWireframe] = useState(true);
  const [showMidlineGuide, setShowMidlineGuide] = useState(false);
  const [showGhostMatrix, setShowGhostMatrix] = useState(false);
  const [useCanvasRenderer, setUseCanvasRenderer] = useState(true);

  // 3D Camera Orbit controls for perspective3d and pure-glyph-3d
  const [tiltX, setTiltX] = useState(0);
  const [tiltY, setTiltY] = useState(0);
  const [isOrbiting, setIsOrbiting] = useState(false);
  const [orbitStart, setOrbitStart] = useState({ x: 0, y: 0, tiltX: 0, tiltY: 0 });

  // Stage orbit pointer handlers
  const handleStagePointerDown = (e: React.PointerEvent) => {
    if (viewMode !== 'perspective3d' && viewMode !== 'pure-glyph-3d') return;
    const target = e.target as HTMLElement;
    if (target.closest('button, input, a, select, [id^="door-lower-"]')) return;
    try {
      target.setPointerCapture(e.pointerId);
    } catch (_) {}
    setIsOrbiting(true);
    setOrbitStart({ x: e.clientX, y: e.clientY, tiltX, tiltY });
  };

  const handleStagePointerMove = (e: React.PointerEvent) => {
    if (!isOrbiting) return;
    const deltaX = e.clientX - orbitStart.x;
    const deltaY = e.clientY - orbitStart.y;
    const newTiltY = Math.max(-55, Math.min(55, orbitStart.tiltY + deltaX * 0.35));
    const newTiltX = Math.max(-40, Math.min(40, orbitStart.tiltX - deltaY * 0.35));
    setTiltX(Math.round(newTiltX));
    setTiltY(Math.round(newTiltY));
  };

  const handleStagePointerUp = (e: React.PointerEvent) => {
    if (isOrbiting) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (_) {}
      setIsOrbiting(false);
    }
  };

  const handleSingleLetterFrameStep = (frameIndex: number, totalFrames: number) => {
    // Smooth kinematic swing loop: 0 -> 72 -> 0 degrees
    const progress = frameIndex / totalFrames; // 0 to 1
    const currentAngle = Math.round(36 - 36 * Math.cos(progress * 2 * Math.PI));
    setAngle(currentAngle);
  };

  const anatomy = GLYPH_ANATOMIES[selectedChar] || {
    char: selectedChar,
    name: `Char ${selectedChar}`,
    upperFeature: '上半部在顶门固定不动，保留原有笔画与轴宽',
    lowerFeature: '下半部在底门以左铰链旋转，横向投影按 cos(θ) 收拢',
    kineticEffect: '上下断层产生机械割裂与偏心重构',
    symmetryChange: '对称破缺，重心向左下倾斜',
  };

  const radians = (angle * Math.PI) / 180;
  const cosFactor = Math.cos(radians);
  const compressionPercent = Math.round(cosFactor * 100);

  // Navigate next/previous letter
  const currentIndex = ALPHABET_LIST.indexOf(selectedChar);
  const handlePrev = () => {
    if (currentIndex > 0) {
      onSelectChar(ALPHABET_LIST[currentIndex - 1]);
    } else {
      onSelectChar(ALPHABET_LIST[ALPHABET_LIST.length - 1]);
    }
  };
  const handleNext = () => {
    if (currentIndex < ALPHABET_LIST.length - 1) {
      onSelectChar(ALPHABET_LIST[currentIndex + 1]);
    } else {
      onSelectChar(ALPHABET_LIST[0]);
    }
  };

  // Generate SVG Code
  const getSvgCode = () => {
    return generateLetterSvg({
      char: selectedChar,
      angle,
      is3D: viewMode === 'pure-glyph-3d',
      fontFamily,
      color: theme === 'safety-yellow' ? '#fbbf24' : '#ffffff',
    });
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(getSvgCode());
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const fontOptions = [
    { label: 'Archivo Black (工业黑体)', value: 'Archivo Black, sans-serif' },
    { label: 'Anton (窄幅高耸黑体)', value: 'Anton, sans-serif' },
    { label: 'Syne 800 (先锋几何黑体)', value: 'Syne, sans-serif' },
    { label: 'Space Grotesk (科技格罗特)', value: 'Space Grotesk, sans-serif' },
    { label: 'Chakra Petch (机械切角体)', value: 'Chakra Petch, sans-serif' },
    { label: 'DotGothic16 (点阵像素体 / 类似参考图)', value: 'DotGothic16, monospace' },
  ];

  return (
    <div id="single-letter-inspector" className="flex flex-col gap-6">
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#141619] border border-zinc-800 p-4 rounded-xl shadow-lg">
        {/* Letter Navigator */}
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrev}
            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
            title="上一个字母"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-mono text-zinc-500">当前字母:</span>
            <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/40 rounded-lg flex items-center justify-center text-2xl font-black text-amber-400">
              {selectedChar}
            </div>
          </div>

          <button
            onClick={handleNext}
            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
            title="下一个字母"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* View Mode Switcher */}
        <div className="flex flex-wrap items-center gap-1.5 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
          <button
            onClick={() => onViewModeChange('orthographic')}
            className={`px-2.5 py-1.5 text-xs font-mono rounded-md transition-all ${
              viewMode === 'orthographic'
                ? 'bg-amber-400 text-black font-bold shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            2D正视柜体
          </button>
          <button
            onClick={() => onViewModeChange('perspective3d')}
            className={`px-2.5 py-1.5 text-xs font-mono rounded-md transition-all ${
              viewMode === 'perspective3d'
                ? 'bg-amber-400 text-black font-bold shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            3D实体柜
          </button>
          <button
            onClick={() => onViewModeChange('pure-glyph')}
            className={`px-2.5 py-1.5 text-xs font-mono rounded-md transition-all flex items-center gap-1.5 ${
              viewMode === 'pure-glyph'
                ? 'bg-gradient-to-r from-amber-400 to-amber-300 text-black font-bold shadow-lg ring-1 ring-amber-300'
                : 'text-amber-400/90 hover:text-amber-300 hover:bg-zinc-800'
            }`}
            title="2D正视脱媒新字：剥离快递柜媒介，正视投影下半段横向按 cos(θ) 压缩"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>2D正视脱媒</span>
          </button>
          <button
            onClick={() => onViewModeChange('pure-glyph-3d')}
            className={`px-2.5 py-1.5 text-xs font-mono rounded-md transition-all flex items-center gap-1.5 ${
              viewMode === 'pure-glyph-3d'
                ? 'bg-gradient-to-r from-sky-400 to-amber-400 text-black font-bold shadow-lg ring-1 ring-sky-300'
                : 'text-sky-400/90 hover:text-sky-300 hover:bg-zinc-800'
            }`}
            title="3D实体脱媒纯字：以真实3D视角观察立体纯字，下半部在三维空间中向外旋开，带有空间透视倾斜、立体厚度截面与光影"
          >
            <Box className="w-3.5 h-3.5" />
            <span>3D实体脱媒</span>
          </button>
          <button
            onClick={() => onViewModeChange('blueprint')}
            className={`px-2.5 py-1.5 text-xs font-mono rounded-md transition-all ${
              viewMode === 'blueprint'
                ? 'bg-amber-400 text-black font-bold shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            设计蓝图
          </button>
        </div>

        {/* Font Family Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-zinc-400">基础母体:</span>
          <select
            value={fontFamily}
            onChange={(e) => onFontFamilyChange(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 text-xs text-zinc-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-400"
          >
            {fontOptions.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Split Grid: Live Stage & Parametric Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Center: Interactive Hero Stage */}
        <div
          id="hero-letter-stage"
          className="lg:col-span-7 bg-[#101214] border border-zinc-800 rounded-2xl p-6 flex flex-col items-center justify-between relative overflow-hidden min-h-[540px] select-none"
          onPointerDown={handleStagePointerDown}
          onPointerMove={handleStagePointerMove}
          onPointerUp={handleStagePointerUp}
        >
          {/* Background Grid Texture */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(to right, #4f5b66 1px, transparent 1px), linear-gradient(to bottom, #4f5b66 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* Top Status & Export Controls */}
          <div className="w-full flex flex-wrap items-center justify-between gap-3 z-10">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block w-2 h-2 rounded-full animate-pulse ${
                    viewMode === 'pure-glyph-3d' ? 'bg-sky-400' : 'bg-emerald-400'
                  }`}
                />
                <span className="text-xs font-mono uppercase text-zinc-400 tracking-wider">
                  {viewMode === 'pure-glyph-3d'
                    ? '3D PURE GLYPH VECTOR / 3D正视纯字'
                    : viewMode === 'pure-glyph'
                    ? '2D ORTHO DE-MEDIUMIZED GLYPH / 2D正视脱媒'
                    : viewMode === 'orthographic'
                    ? 'ORTHO-PROJECTION STAGE'
                    : '3D KINETIC SIMULATOR'}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-zinc-500">θ:</span>
                <span className="text-amber-400 font-bold px-1.5 py-0.5 bg-amber-400/10 border border-amber-400/30 rounded">
                  {Math.round(angle)}°
                </span>
                <span className="text-emerald-400 font-bold px-1.5 py-0.5 bg-emerald-400/10 border border-emerald-400/30 rounded">
                  {compressionPercent}% (cos {cosFactor.toFixed(2)})
                </span>
              </div>
            </div>

            {/* SVG Vector Download + 4K UHD Save & Video Recording */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const svg = generateLetterSvg({
                    char: selectedChar,
                    angle,
                    is3D: viewMode === 'pure-glyph-3d',
                    fontFamily,
                    color: theme === 'safety-yellow' ? '#fbbf24' : '#ffffff',
                  });
                  downloadSvgFile(`LOCKER-SANS-${selectedChar}-${viewMode}-${Math.round(angle)}deg.svg`, svg);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-lg shadow transition-colors"
                title="导出当前纯字为标准 SVG 矢量图形（可直接导入 Illustrator/Figma 任意放大无损不失真）"
              >
                <FileCode className="w-3.5 h-3.5 text-amber-400" />
                <span>导出 SVG 矢量图</span>
              </button>

              <button
                id="btn-toggle-canvas-acceleration"
                onClick={() => setUseCanvasRenderer(!useCanvasRenderer)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-lg border transition-all ${
                  useCanvasRenderer
                    ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300 font-bold shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200'
                }`}
                title="切换 WebGL / Canvas 硬件加速 (60FPS + 离屏双缓冲) 与 DOM 模式"
              >
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                <span>{useCanvasRenderer ? 'Canvas 60FPS 加速: 开' : 'DOM 模式'}</span>
              </button>

              <ExportAndRecordBar
                targetElementId="hero-letter-stage"
                defaultFileNamePrefix={`LOCKER-SANS-${viewMode.toUpperCase()}-${selectedChar}`}
                onFrameStep={handleSingleLetterFrameStep}
              />
            </div>
          </div>

          {/* Notice banner: 3D Entity Pure Glyph mode */}
          {viewMode === 'pure-glyph-3d' && (
            <div className="w-full mt-3 bg-sky-950/40 border border-sky-500/30 rounded-xl p-3 flex flex-col gap-2.5 text-xs font-mono z-10">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Box className="w-4 h-4 text-sky-400 shrink-0" />
                  <span className="text-zinc-200">
                    <strong className="text-sky-400 font-bold">3D正视纯字：</strong>
                    彻底剥离柜体结构与残余线条，伴随 3D 旋转从正视角直观呈现空间透视与梯形收敛，字形边缘保持像 SVG 矢量般无瑕、纯净且极度清晰！
                  </span>
                </div>
                {/* Switch to 2D comparison */}
                <button
                  onClick={() => onViewModeChange('pure-glyph')}
                  className="px-2.5 py-1 text-[11px] rounded bg-zinc-900 border border-amber-400/40 text-amber-300 hover:bg-amber-400/10 transition-colors shrink-0"
                >
                  ⇄ 切至 2D正视脱媒对比
                </button>
              </div>

              {/* 3D Camera Controls */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-sky-500/20 text-[11px]">
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <Compass className="w-3.5 h-3.5 text-sky-400" />
                  <span>3D视角:</span>
                  <button
                    onClick={() => {
                      setTiltX(0);
                      setTiltY(0);
                    }}
                    className={`px-2 py-0.5 rounded border transition-colors ${
                      tiltX === 0 && tiltY === 0
                        ? 'bg-sky-400 text-black font-bold border-sky-400'
                        : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:text-white'
                    }`}
                    title="正视角透视：最直观对比2D与3D正视差异"
                  >
                    3D 正面正视 (0°)
                  </button>
                  <button
                    onClick={() => {
                      setTiltX(14);
                      setTiltY(-24);
                    }}
                    className={`px-2 py-0.5 rounded border transition-colors ${
                      tiltX === 14 && tiltY === -24
                        ? 'bg-sky-400 text-black font-bold border-sky-400'
                        : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:text-white'
                    }`}
                    title="3D 轴测悬浮透视"
                  >
                    轴测透视 (25°)
                  </button>
                  <button
                    onClick={() => {
                      setTiltX(0);
                      setTiltY(38);
                    }}
                    className={`px-2 py-0.5 rounded border transition-colors ${
                      tiltX === 0 && tiltY === 38
                        ? 'bg-sky-400 text-black font-bold border-sky-400'
                        : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:text-white'
                    }`}
                    title="3D 侧视斜角"
                  >
                    侧视开合 (38°)
                  </button>
                </div>

                <div className="flex items-center gap-2 text-zinc-400">
                  <span className="text-[10px] text-zinc-500">
                    Pitch: {tiltX}° / Yaw: {tiltY}° (可按住空白拖拽旋转)
                  </span>
                  <button
                    onClick={() => setShowMidlineGuide(!showMidlineGuide)}
                    className={`px-2 py-0.5 rounded border transition-colors ${
                      showMidlineGuide
                        ? 'bg-amber-400/20 border-amber-400 text-amber-300 font-bold'
                        : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {showMidlineGuide ? '✓ 中线' : '中线'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notice banner when in 2D Pure Glyph mode */}
          {viewMode === 'pure-glyph' && (
            <div className="w-full mt-3 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono z-10">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-zinc-200">
                  <strong className="text-amber-400 font-bold">2D正视脱媒新字：</strong>
                  纯平面正投影，剥离柜体，未变形上半段与按 cos(θ) 水平压缩下半段直接连接。
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onViewModeChange('pure-glyph-3d')}
                  className="px-2.5 py-1 text-[11px] rounded bg-zinc-900 border border-sky-400/40 text-sky-300 hover:bg-sky-400/10 transition-colors"
                >
                  ⇄ 切至 3D实体脱媒
                </button>
                <button
                  onClick={() => setShowMidlineGuide(!showMidlineGuide)}
                  className={`px-2.5 py-1 text-[11px] rounded border transition-colors ${
                    showMidlineGuide
                      ? 'bg-amber-400/20 border-amber-400 text-amber-300 font-bold'
                      : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {showMidlineGuide ? '✓ 对齐中线: 显示' : '对齐中线: 隐藏'}
                </button>
                <button
                  onClick={() => setShowGhostMatrix(!showGhostMatrix)}
                  className={`px-2.5 py-1 text-[11px] rounded border transition-colors ${
                    showGhostMatrix
                      ? 'bg-emerald-400/20 border-emerald-400 text-emerald-300 font-bold'
                      : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {showGhostMatrix ? '✓ 母体虚影: 显示' : '母体虚影: 隐藏'}
                </button>
              </div>
            </div>
          )}

          {/* Center: The Locker Module / Pure Glyph Stage */}
          <div className="py-6 flex items-center justify-center z-10 relative">
            {/* Ghost Undistorted Character silhouette for pure-glyph mode */}
            {viewMode === 'pure-glyph' && showGhostMatrix && (
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-15 select-none"
                style={{ width: '260px', height: '380px', margin: 'auto' }}
              >
                <span
                  className="font-black tracking-tight leading-none text-white border-2 border-dashed border-zinc-500 rounded-md p-2"
                  style={{
                    fontFamily,
                    fontSize: '260px',
                    lineHeight: 1,
                  }}
                >
                  {selectedChar}
                </span>
              </div>
            )}

            {/* Midline reference dashed line */}
            {(viewMode === 'pure-glyph' || viewMode === 'pure-glyph-3d') && showMidlineGuide && (
              <div
                className="absolute left-1/2 -translate-x-1/2 w-80 h-[1px] border-t-2 border-dashed border-amber-400/60 pointer-events-none z-30"
                style={{ top: '50%' }}
              >
                <span className="absolute -top-3 right-0 text-[9px] font-mono text-amber-400 bg-black/80 px-1 rounded">
                  MIDLINE Y=50%
                </span>
              </div>
            )}

            {useCanvasRenderer ? (
              <KineticCanvasStage
                char={selectedChar}
                angle={angle}
                viewMode={viewMode}
                theme={theme}
                fontFamily={fontFamily}
                tiltX={tiltX}
                tiltY={tiltY}
                showMidlineGuide={showMidlineGuide}
                showWireframe={showWireframe}
                onAngleChange={setAngle}
                onOrbitChange={(tx, ty) => {
                  setTiltX(tx);
                  setTiltY(ty);
                }}
              />
            ) : (
              <LockerModule
                char={selectedChar}
                angle={angle}
                viewMode={viewMode}
                theme={theme}
                fontFamily={fontFamily}
                boxNumber="08"
                showLockerDetails={true}
                showRays={showWireframe}
                interactive={true}
                onAngleChange={setAngle}
                size="hero"
                tiltX={tiltX}
                tiltY={tiltY}
              />
            )}
          </div>

          {/* Bottom Kinetic Controls */}
          <div className="w-full bg-[#181a1d] border border-zinc-800 rounded-xl p-4 flex flex-col gap-3 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-mono font-bold text-zinc-200">
                  下层门开合角调节 (0° ~ 80°)
                </span>
              </div>
              <span className="text-[11px] font-mono text-zinc-400">
                高度恒定 H' = H | 宽度投影 W' = W × cos(θ)
              </span>
            </div>

            {/* Slider */}
            <div className="flex items-center gap-4">
              <span className="text-xs font-mono text-zinc-500">0° 关门</span>
              <input
                type="range"
                min="0"
                max="80"
                step="1"
                value={angle}
                onChange={(e) => setAngle(parseFloat(e.target.value))}
                className="flex-1 h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
              <span className="text-xs font-mono text-zinc-500">80° 极窄</span>
            </div>

            {/* Quick Angle Presets */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-zinc-800/80">
              <span className="text-[10px] font-mono text-zinc-500">经典工况预设:</span>
              <button
                onClick={() => setAngle(0)}
                className={`px-2.5 py-1 text-xs font-mono rounded ${
                  angle === 0
                    ? 'bg-amber-400 text-black font-bold'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                0° 闭合 (标准黑体)
              </button>
              <button
                onClick={() => setAngle(30)}
                className={`px-2.5 py-1 text-xs font-mono rounded ${
                  angle === 30
                    ? 'bg-amber-400 text-black font-bold'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                30° 微张 (cos=0.87)
              </button>
              <button
                onClick={() => setAngle(45)}
                className={`px-2.5 py-1 text-xs font-mono rounded ${
                  angle === 45
                    ? 'bg-amber-400 text-black font-bold'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                45° 草图标准态 (cos=0.71)
              </button>
              <button
                onClick={() => setAngle(60)}
                className={`px-2.5 py-1 text-xs font-mono rounded ${
                  angle === 60
                    ? 'bg-amber-400 text-black font-bold'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                60° 剧烈变形 (cos=0.50)
              </button>
              <button
                onClick={() => setAngle(75)}
                className={`px-2.5 py-1 text-xs font-mono rounded ${
                  angle === 75
                    ? 'bg-amber-400 text-black font-bold'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                75° 极限收缩 (cos=0.26)
              </button>
            </div>
          </div>
        </div>

        {/* Right: Typographic Logic & Mathematical Deduction Panel */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Character Anatomy Card */}
          <div className="bg-[#141619] border border-zinc-800 rounded-2xl p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-400" />
                <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
                  字形形态与解剖逻辑 (Anatomy)
                </h3>
              </div>
              <span className="text-xs font-mono bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded">
                {anatomy.name}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800">
                <span className="text-[10px] font-mono uppercase text-zinc-400 block mb-1">
                  1. 上层柜门 (不动)
                </span>
                <p className="text-zinc-200 font-sans leading-relaxed">{anatomy.upperFeature}</p>
              </div>

              <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800">
                <span className="text-[10px] font-mono uppercase text-amber-400 block mb-1">
                  2. 下层柜门 (左铰链弹开并左旋)
                </span>
                <p className="text-zinc-200 font-sans leading-relaxed">{anatomy.lowerFeature}</p>
              </div>

              <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800">
                <span className="text-[10px] font-mono uppercase text-emerald-400 block mb-1">
                  3. 正视角构成的新字体特征 (Kinetic Effect)
                </span>
                <p className="text-zinc-200 font-sans leading-relaxed">{anatomy.kineticEffect}</p>
              </div>

              <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800">
                <span className="text-[10px] font-mono uppercase text-sky-400 block mb-1">
                  4. 对称性与重心演化
                </span>
                <p className="text-zinc-200 font-sans leading-relaxed">{anatomy.symmetryChange}</p>
              </div>

              {viewMode === 'pure-glyph-3d' ? (
                <div className="p-3 bg-sky-500/10 rounded-xl border border-sky-500/30 space-y-2">
                  <span className="text-[10px] font-mono uppercase text-sky-400 font-bold flex items-center gap-1.5">
                    <Box className="w-3.5 h-3.5" />
                    <span>5. 3D实体脱媒纯字态 (3D Entity Pure Font)</span>
                  </span>
                  <p className="text-zinc-200 font-sans leading-relaxed">
                    以实体3D视角脱媒：下部在三维空间中向外旋出，右侧边缘在三维空间中前突靠近观察点，产生<strong>透视梯形斜切倾角（顶底不再绝对水平平行）</strong>，并带有<strong>立体实体厚度、侧截面与法线受光</strong>，呈现出与2D正视截然不同的立体雕塑感。
                  </p>
                </div>
              ) : viewMode === 'pure-glyph' ? (
                <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/30 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-amber-400 font-bold flex items-center gap-1.5 mb-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>5. 2D正视脱媒新字形态 (2D Ortho Pure Font)</span>
                  </span>
                  <p className="text-zinc-200 font-sans leading-relaxed">
                    已彻底剔除物理快递柜媒介：上半部恒定保留未形变母体黑体骨架，下半部严格按正射平行投影横向按 cos(θ) 压缩偏向左侧，上下无缝熔接为扁窄复合平面新字。
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          {/* Mathematical Transformation Matrix */}
          <div className="bg-[#141619] border border-zinc-800 rounded-2xl p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-emerald-400" />
                <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
                  几何投影推导公式 (Mathematical Model)
                </h3>
              </div>
              <span className="text-[11px] font-mono text-zinc-400">
                {viewMode === 'pure-glyph-3d' ? '3D透视四元数/欧拉变换' : '2D仿射正交投影'}
              </span>
            </div>

            <div className="font-mono text-xs text-zinc-300 space-y-2 bg-zinc-950 p-3 rounded-lg border border-zinc-800">
              <div className="text-zinc-500">// 柜面切分点: Y_split = H / 2</div>
              <div>
                <span className="text-sky-400">上半段 (Y &lt; Y_split):</span> P'(x, y, z) = (x, y, 0)
              </div>
              {viewMode === 'pure-glyph-3d' ? (
                <>
                  <div>
                    <span className="text-amber-400">下半段 3D空间旋转:</span>
                    <span className="text-zinc-300 ml-1">R_y(-θ) · P = (x·cosθ, y, x·sinθ)</span>
                  </div>
                  <div>
                    <span className="text-emerald-400">正面透视投影成像:</span>
                    <span className="text-zinc-300 ml-1">x' = (x·cosθ) / (1 - x·sinθ/d), y' = y / (1 - x·sinθ/d)</span>
                  </div>
                  <div className="text-[11px] text-sky-400/90 pt-1 border-t border-zinc-800">
                    * 因分母含 (1 - x·sinθ/d)，产生透视近大远小与梯形斜切，且右侧在Z轴前突产生厚度立体侧截面！
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <span className="text-amber-400">下半段 2D正交投影:</span>
                    <span className="text-zinc-300 ml-1">P'(x, y) = (x · cos(θ), y)</span>
                  </div>
                  <div className="text-[11px] text-zinc-500 pt-1 border-t border-zinc-800">
                    * 铰链锚定在 x = 0，顶底边保持 0° 水平平行，无深度与近大远小。
                  </div>
                </>
              )}
            </div>

            {/* Quick Export Code */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg transition-colors"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? '已复制 SVG 源码' : '导出该字形 SVG 代码'}</span>
              </button>

              <button
                onClick={() => setShowWireframe(!showWireframe)}
                className={`px-3 py-1.5 text-xs font-mono rounded-lg border transition-colors ${
                  showWireframe
                    ? 'bg-amber-400/10 border-amber-400/40 text-amber-300'
                    : 'border-zinc-800 text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {showWireframe ? '投影射线: 显示中' : '投影射线: 隐藏'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
