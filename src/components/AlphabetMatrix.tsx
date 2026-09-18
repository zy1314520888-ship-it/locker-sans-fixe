import React, { useState, useEffect, useRef } from 'react';
import { LockerModule } from './LockerModule';
import { KineticMatrixCanvas } from './KineticMatrixCanvas';
import { ViewMode, VisualTheme } from '../types';
import { ALPHABET_LIST, NUMBERS_LIST } from '../data/alphabetData';
import { ExportAndRecordBar } from './ExportAndRecordBar';
import { generateAlphabetSvgSheet, downloadSvgFile } from '../utils/svgExport';
import {
  Sliders,
  Shuffle,
  Play,
  Pause,
  RotateCcw,
  ExternalLink,
  Activity,
  Zap,
  Gauge,
  Sparkles,
  Box,
  FileCode,
  Cpu,
} from 'lucide-react';

interface AlphabetMatrixProps {
  viewMode: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  theme: VisualTheme;
  fontFamily: string;
  onSelectChar: (char: string) => void;
}

interface AutonomousState {
  current: number;
  target: number;
  speed: number;
  pause: number;
}

export const AlphabetMatrix: React.FC<AlphabetMatrixProps> = ({
  viewMode,
  onViewModeChange,
  theme,
  fontFamily,
  onSelectChar,
}) => {
  const [globalAngle, setGlobalAngle] = useState(45);
  const [filterType, setFilterType] = useState<'all' | 'letters' | 'numbers'>('all');
  const [isWaving, setIsWaving] = useState(false);
  const [isAutonomousSwarm, setIsAutonomousSwarm] = useState(false);
  const [swarmTempo, setSwarmTempo] = useState<'gentle' | 'normal' | 'rapid'>('normal');
  const [individualAngles, setIndividualAngles] = useState<Record<string, number>>({});
  const [isRenderingVideo, setIsRenderingVideo] = useState(false);
  const [useCanvasMatrix, setUseCanvasMatrix] = useState(true);

  const characters =
    filterType === 'letters'
      ? ALPHABET_LIST
      : filterType === 'numbers'
      ? NUMBERS_LIST
      : [...ALPHABET_LIST, ...NUMBERS_LIST];

  // Ref tracking independent dynamic states for each cabinet in autonomous mode
  const swarmStatesRef = useRef<Record<string, AutonomousState>>({});

  // Frame stepper for matrix 1080P silky export
  const handleMatrixFrameStep = (frameIndex: number, totalFrames: number, timeSeconds: number) => {
    const t = timeSeconds * 2.5;
    const newAngles: Record<string, number> = {};
    characters.forEach((char, idx) => {
      const wave = Math.sin(t + idx * 0.4);
      newAngles[char] = Math.max(0, Math.min(80, Math.round(40 + wave * 36)));
    });
    setIndividualAngles(newAngles);
  };

  // Initialize or re-sync autonomous states when character list changes
  useEffect(() => {
    const states: Record<string, AutonomousState> = {};
    const possibleAngles = [0, 15, 30, 45, 55, 65, 75];
    characters.forEach((char) => {
      const initial = Math.floor(Math.random() * 60);
      states[char] = {
        current: initial,
        target: possibleAngles[Math.floor(Math.random() * possibleAngles.length)],
        speed: 1.0 + Math.random() * 1.5,
        pause: Math.floor(Math.random() * 40),
      };
    });
    swarmStatesRef.current = states;
  }, [filterType]);

  // =========================================================================
  // 1. AUTONOMOUS KINETIC SWARM (全自治族矩阵 · 全部随机动起来)
  // =========================================================================
  useEffect(() => {
    if (!isAutonomousSwarm || isRenderingVideo) return;

    let frameId: number;
    const speedMultiplier = swarmTempo === 'gentle' ? 0.6 : swarmTempo === 'rapid' ? 2.2 : 1.2;

    const tickSwarm = () => {
      const states = swarmStatesRef.current;
      const updatedAngles: Record<string, number> = {};
      const possibleAngles = [0, 0, 15, 25, 35, 45, 55, 65, 75, 80];

      characters.forEach((char) => {
        let node = states[char];
        if (!node) {
          node = {
            current: 0,
            target: 45,
            speed: 1.2,
            pause: 10,
          };
          states[char] = node;
        }

        if (node.pause > 0) {
          node.pause -= 1;
        } else {
          // Approach target with easing
          const delta = node.target - node.current;
          if (Math.abs(delta) < 1.0) {
            node.current = node.target;
            // Pick next random target and pause duration
            node.target = possibleAngles[Math.floor(Math.random() * possibleAngles.length)];
            node.speed = (0.8 + Math.random() * 1.8) * speedMultiplier;
            node.pause = Math.floor((15 + Math.random() * 50) / speedMultiplier);
          } else {
            const step = Math.sign(delta) * Math.min(Math.abs(delta) * 0.12 + 0.5, node.speed * 2.5);
            node.current += step;
          }
        }

        updatedAngles[char] = node.current;
      });

      setIndividualAngles(updatedAngles);
      frameId = requestAnimationFrame(tickSwarm);
    };

    frameId = requestAnimationFrame(tickSwarm);
    return () => cancelAnimationFrame(frameId);
  }, [isAutonomousSwarm, swarmTempo, characters]);

  // =========================================================================
  // 2. SINE WAVE RIPPLE ANIMATION
  // =========================================================================
  useEffect(() => {
    if (!isWaving || isRenderingVideo) return;
    let frameId: number;
    let t = 0;

    const animate = () => {
      t += 0.05;
      const newAngles: Record<string, number> = {};
      characters.forEach((char, index) => {
        const wave = Math.sin(t + index * 0.35);
        newAngles[char] = 40 + wave * 30;
      });
      setIndividualAngles(newAngles);
      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [isWaving, characters]);

  // Handle global slider change
  const handleGlobalSlider = (angleVal: number) => {
    setIsWaving(false);
    setIsAutonomousSwarm(false);
    setGlobalAngle(angleVal);
    setIndividualAngles({});
  };

  // One-shot Randomize all locker angles instantly
  const handleRandomizeOnce = () => {
    setIsWaving(false);
    setIsAutonomousSwarm(false);
    const randomized: Record<string, number> = {};
    const angles = [0, 0, 20, 35, 45, 55, 65, 75];
    characters.forEach((char) => {
      randomized[char] = angles[Math.floor(Math.random() * angles.length)];
    });
    setIndividualAngles(randomized);
  };

  // Toggle Autonomous Kinetic Swarm
  const handleToggleAutonomous = () => {
    setIsWaving(false);
    setIsAutonomousSwarm((prev) => !prev);
  };

  // Reset all to specified angle
  const handleReset = (targetAngle: number) => {
    setIsWaving(false);
    setIsAutonomousSwarm(false);
    setGlobalAngle(targetAngle);
    setIndividualAngles({});
  };

  // Update single character angle manually
  const handleIndividualAngleChange = (char: string, angleVal: number) => {
    setIsWaving(false);
    setIndividualAngles((prev) => ({
      ...prev,
      [char]: angleVal,
    }));
  };

  return (
    <div id="alphabet-matrix" className="flex flex-col gap-6">
      {/* Top Header with Autonomous Motion & 4K/Video Export */}
      <div className="bg-[#141619] border border-zinc-800 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4 shadow-xl">
        {/* Left Side: Filter Buttons & Mode Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 text-xs font-mono rounded-md transition-all ${
                filterType === 'all'
                  ? 'bg-amber-400 text-black font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              全部字形 (36字)
            </button>
            <button
              onClick={() => setFilterType('letters')}
              className={`px-3 py-1.5 text-xs font-mono rounded-md transition-all ${
                filterType === 'letters'
                  ? 'bg-amber-400 text-black font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              大写字母 (A-Z)
            </button>
            <button
              onClick={() => setFilterType('numbers')}
              className={`px-3 py-1.5 text-xs font-mono rounded-md transition-all ${
                filterType === 'numbers'
                  ? 'bg-amber-400 text-black font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              阿拉伯数字 (0-9)
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
                title="正视二维快递柜投影"
              >
                2D正视柜
              </button>
              <button
                onClick={() => onViewModeChange('perspective3d')}
                className={`px-2.5 py-1 text-xs font-mono rounded transition-all ${
                  viewMode === 'perspective3d'
                    ? 'bg-amber-400 text-black font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="3D实体柜立体透视仿真"
              >
                3D实体柜
              </button>
              <button
                onClick={() => onViewModeChange('pure-glyph')}
                className={`px-2.5 py-1 text-xs font-mono rounded transition-all flex items-center gap-1 ${
                  viewMode === 'pure-glyph'
                    ? 'bg-gradient-to-r from-amber-400 to-amber-300 text-black font-bold shadow'
                    : 'text-amber-400 hover:text-amber-300 hover:bg-zinc-800'
                }`}
                title="2D正视脱媒新字：剥离快递柜媒介，正视投影下半段按 cos(θ) 横向压缩"
              >
                <Sparkles className="w-3 h-3" />
                <span>2D脱媒</span>
              </button>
              <button
                onClick={() => onViewModeChange('pure-glyph-3d')}
                className={`px-2.5 py-1 text-xs font-mono rounded transition-all flex items-center gap-1 ${
                  viewMode === 'pure-glyph-3d'
                    ? 'bg-gradient-to-r from-sky-400 to-amber-400 text-black font-bold shadow'
                    : 'text-sky-400 hover:text-sky-300 hover:bg-zinc-800'
                }`}
                title="3D实体脱媒纯字：真实3D空间下半段旋出，透视倾切与实体厚度"
              >
                <Box className="w-3 h-3" />
                <span>3D脱媒</span>
              </button>
            </div>
          )}
        </div>

        {/* Global Synchronized Angle Slider */}
        <div className="flex items-center gap-3 bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800">
          <Sliders className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-mono text-zinc-300">全局门角:</span>
          <input
            type="range"
            min="0"
            max="80"
            value={globalAngle}
            onChange={(e) => handleGlobalSlider(parseFloat(e.target.value))}
            className="w-28 sm:w-36 h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
          />
          <span className="text-xs font-mono text-amber-400 font-bold w-10">
            {Math.round(globalAngle)}°
          </span>
        </div>

        {/* Right Side: SVG Export, 4K UHD Save & Video Recording */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const allAngles: Record<string, number> = {};
              characters.forEach((char) => {
                allAngles[char] = individualAngles[char] !== undefined ? individualAngles[char] : globalAngle;
              });
              const svgStr = generateAlphabetSvgSheet({
                characters,
                angles: allAngles,
                is3D: viewMode === 'pure-glyph-3d',
                fontFamily,
                color: theme === 'safety-yellow' ? '#fbbf24' : '#ffffff',
                backgroundColor: '#0c0d10',
              });
              downloadSvgFile(`LOCKER-SANS-${viewMode.toUpperCase()}-ALPHABET-SHEET.svg`, svgStr);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 rounded-lg shadow transition-colors"
            title="导出全字族 26 字完整 SVG 矢量图谱（无损矢量精度，可在 Illustrator / Figma 直接编辑）"
          >
            <FileCode className="w-3.5 h-3.5 text-amber-400" />
            <span>导出 SVG 矢量图谱</span>
          </button>

          <button
            id="btn-toggle-matrix-canvas"
            onClick={() => setUseCanvasMatrix(!useCanvasMatrix)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-lg border transition-all ${
              useCanvasMatrix
                ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300 font-bold shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200'
            }`}
            title="切换 WebGL / Canvas 硬件加速 (RAF + 离屏双缓冲 60FPS) 与 DOM 矩阵"
          >
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            <span>{useCanvasMatrix ? 'Canvas 60FPS 极速矩阵: 开' : 'DOM 矩阵'}</span>
          </button>

          <ExportAndRecordBar
            targetElementId="alphabet-matrix-board"
            defaultFileNamePrefix="LOCKER-SANS-ALPHABET-MATRIX"
            onRecordStarted={() => {
              setIsRenderingVideo(true);
            }}
            onRecordStopped={() => {
              setIsRenderingVideo(false);
            }}
            onFrameStep={handleMatrixFrameStep}
          />
        </div>
      </div>

      {/* Kinetic Action Toolbar: Autonomous Motion, Random, Wave, Reset */}
      <div className="bg-[#111316] border border-zinc-800/90 px-4 py-3 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex flex-wrap items-center gap-2">
          {/* PRIMARY REQUEST: 全自治族矩阵 / 全部动起来的随机点击按钮 */}
          <button
            id="btn-autonomous-random-swarm"
            onClick={handleToggleAutonomous}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-mono font-bold rounded-lg transition-all shadow-md active:scale-95 ${
              isAutonomousSwarm
                ? 'bg-emerald-400 text-black shadow-emerald-500/20 shadow-lg ring-2 ring-emerald-300 ring-offset-2 ring-offset-black animate-pulse'
                : 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 text-black hover:brightness-110 shadow-amber-500/20'
            }`}
            title="激活全自治族矩阵，所有单元格柜门将自主持续随机摆动开合"
          >
            {isAutonomousSwarm ? (
              <Pause className="w-4 h-4 fill-black" />
            ) : (
              <Activity className="w-4 h-4" />
            )}
            <span>
              {isAutonomousSwarm ? '暂停全自治运动' : '⚡ 全自治族矩阵 · 全部随机动起来'}
            </span>
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                isAutonomousSwarm ? 'bg-black text-emerald-300' : 'bg-black/20 text-black'
              }`}
            >
              {isAutonomousSwarm ? 'LIVE 动效中' : '全矩阵动力'}
            </span>
          </button>

          {/* Tempo Selector for Autonomous Motion */}
          {isAutonomousSwarm && (
            <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-lg border border-emerald-500/40 text-[10px] font-mono animate-fade-in">
              <span className="text-zinc-400 px-1">频次:</span>
              <button
                onClick={() => setSwarmTempo('gentle')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  swarmTempo === 'gentle'
                    ? 'bg-emerald-400 text-black font-bold'
                    : 'text-zinc-300 hover:text-white'
                }`}
              >
                舒缓
              </button>
              <button
                onClick={() => setSwarmTempo('normal')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  swarmTempo === 'normal'
                    ? 'bg-emerald-400 text-black font-bold'
                    : 'text-zinc-300 hover:text-white'
                }`}
              >
                标准
              </button>
              <button
                onClick={() => setSwarmTempo('rapid')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  swarmTempo === 'rapid'
                    ? 'bg-emerald-400 text-black font-bold'
                    : 'text-zinc-300 hover:text-white'
                }`}
              >
                疾速
              </button>
            </div>
          )}

          {/* One-Shot Instant Randomize Button */}
          <button
            onClick={handleRandomizeOnce}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-mono bg-zinc-850 hover:bg-zinc-750 text-zinc-200 border border-zinc-700/80 rounded-lg transition-colors hover:border-amber-400/50"
            title="单次随机打乱所有柜门开合状态"
          >
            <Shuffle className="w-3.5 h-3.5 text-amber-400" />
            <span>单次随机开合</span>
          </button>

          {/* Sine Wave Ripple Button */}
          <button
            onClick={() => {
              setIsAutonomousSwarm(false);
              setIsWaving(!isWaving);
            }}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-mono rounded-lg transition-colors ${
              isWaving
                ? 'bg-sky-400 text-black font-bold'
                : 'bg-zinc-850 text-zinc-300 hover:bg-zinc-750 border border-zinc-700/80'
            }`}
            title="波浪开合动画摆动"
          >
            {isWaving ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>波浪起伏动画</span>
          </button>
        </div>

        {/* Quick Reset Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleReset(0)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-mono bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg border border-zinc-800 transition-colors"
            title="全部门复位闭合 (0°)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>全关 (0°)</span>
          </button>

          <button
            onClick={() => handleReset(45)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-mono bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg border border-zinc-800 transition-colors"
            title="全部门半开 (45°)"
          >
            <span>半开 (45°)</span>
          </button>
        </div>
      </div>

      {/* Grid of All Letters (Target container for 4K and high-res export) */}
      <div
        id="alphabet-matrix-board"
        className="bg-[#0e1012] border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative"
      >
        {/* Matrix Watermark / Meta Title for 4K Export */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-800/80 text-[11px] font-mono text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white tracking-wider">
              {viewMode === 'pure-glyph-3d'
                ? 'LOCKER SANS 3D PURE GLYPH VECTOR MATRIX'
                : viewMode === 'pure-glyph'
                ? 'LOCKER SANS 2D DE-MEDIUMIZED PURE GLYPH MATRIX'
                : 'LOCKER SANS AUTONOMOUS MATRIX'}
            </span>
            <span
              className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                viewMode === 'pure-glyph-3d'
                  ? 'bg-sky-400/20 text-sky-400'
                  : viewMode === 'pure-glyph'
                  ? 'bg-amber-400/20 text-amber-400'
                  : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {viewMode === 'pure-glyph-3d'
                ? '3D正视纯字'
                : viewMode === 'pure-glyph'
                ? '2D正视脱媒'
                : '全自治动力字族'}
            </span>
          </div>
          <div className="text-right text-zinc-400">
            TOTAL UNITS: {characters.length} | {viewMode === 'pure-glyph-3d' ? '3D PERSPECTIVE (W\', H\')' : 'ORTHO SCALE-X (W\'=W·cosθ)'}
          </div>
        </div>

        {useCanvasMatrix ? (
          <KineticMatrixCanvas
            characters={characters}
            viewMode={viewMode}
            theme={theme}
            fontFamily={fontFamily}
            globalAngle={globalAngle}
            individualAngles={individualAngles}
            isAutonomousSwarm={isAutonomousSwarm}
            isWaving={isWaving}
            swarmTempo={swarmTempo}
            onSelectChar={onSelectChar}
            onAngleChange={handleIndividualAngleChange}
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-9 gap-4 justify-items-center">
            {characters.map((char, idx) => {
              const charAngle =
                individualAngles[char] !== undefined ? individualAngles[char] : globalAngle;
              const paddedNum = (idx + 1).toString().padStart(2, '0');
              const isPureMode = viewMode === 'pure-glyph' || viewMode === 'pure-glyph-3d';

              return (
                <div
                  key={char}
                  className={`flex flex-col items-center p-2 rounded-xl transition-all group w-full ${
                    isPureMode
                      ? 'bg-zinc-900/10 border border-transparent hover:border-zinc-800 hover:bg-zinc-900/30'
                      : 'bg-[#141619] border border-zinc-800/80 hover:border-amber-400/50 hover:shadow-xl'
                  }`}
                >
                  <div className="w-full flex items-center justify-between pb-1 px-1 text-[10px] font-mono text-zinc-500">
                    <span className="font-bold text-zinc-300">{char}</span>
                    <button
                      onClick={() => onSelectChar(char)}
                      className="opacity-0 group-hover:opacity-100 text-amber-400 hover:text-amber-300 transition-opacity flex items-center gap-0.5"
                      title="在检查器中深度解剖该字"
                    >
                      <span>深度分析</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </button>
                  </div>

                  <LockerModule
                    char={char}
                    angle={charAngle}
                    viewMode={viewMode}
                    theme={theme}
                    fontFamily={fontFamily}
                    boxNumber={paddedNum}
                    showLockerDetails={true}
                    interactive={true}
                    onAngleChange={(newAngle) => handleIndividualAngleChange(char, newAngle)}
                    size="sm"
                  />

                  <div className="w-full flex items-center justify-between pt-2 px-1 text-[9px] font-mono text-zinc-400">
                    <span className="text-amber-300/80 font-bold">{Math.round(charAngle)}°</span>
                    <span>W: {Math.round(Math.cos((charAngle * Math.PI) / 180) * 100)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
