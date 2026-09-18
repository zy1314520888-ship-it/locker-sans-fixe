import React, { useState, useRef, useEffect } from 'react';
import { ViewMode, VisualTheme } from '../types';
import { playLockerOpenSound, playLockerCloseSound } from '../utils/audio';

interface LockerModuleProps {
  char: string;
  angle: number; // 0 to 80
  viewMode: ViewMode;
  theme?: VisualTheme;
  fontFamily?: string;
  boxNumber?: string;
  showLockerDetails?: boolean;
  showRays?: boolean;
  interactive?: boolean;
  onAngleChange?: (newAngle: number) => void;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  customClass?: string;
  tiltX?: number;
  tiltY?: number;
}

export const LockerModule: React.FC<LockerModuleProps> = ({
  char,
  angle,
  viewMode,
  theme = 'dark-industrial',
  fontFamily = 'Archivo Black, Impact, sans-serif',
  boxNumber = '01',
  showLockerDetails = true,
  showRays = false,
  interactive = true,
  onAngleChange,
  size = 'md',
  customClass = '',
  tiltX = 0,
  tiltY = 0,
}) => {
  const [internalAngle, setInternalAngle] = useState(angle);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef<number>(0);
  const startAngleRef = useRef<number>(0);

  useEffect(() => {
    setInternalAngle(angle);
  }, [angle]);

  const currentAngle = interactive ? internalAngle : angle;
  const radians = (currentAngle * Math.PI) / 180;
  const cosValue = Math.cos(radians); // scaleX factor in orthographic projection

  // Size dimensions
  const sizeMap = {
    sm: { width: 90, height: 130, fontSize: 88, numSize: 'text-[9px]' },
    md: { width: 140, height: 200, fontSize: 136, numSize: 'text-[10px]' },
    lg: { width: 190, height: 270, fontSize: 184, numSize: 'text-xs' },
    hero: { width: 260, height: 380, fontSize: 260, numSize: 'text-sm' },
  };

  const { width, height, fontSize, numSize } = sizeMap[size];
  const halfHeight = height / 2;

  // Visual Theme Palettes
  const themeStyles = {
    'dark-industrial': {
      bgLocker: 'bg-[#151719]',
      borderLocker: 'border-[#2a2e33]',
      doorTop: 'bg-[#1a1d20]',
      doorBottom: 'bg-[#1f2327]',
      interior: 'bg-[#0a0b0c]',
      textColor: 'text-white',
      accentColor: 'text-amber-400',
      badgeBg: 'bg-[#262b30]',
      lineColor: '#3b424a',
      rayColor: '#f59e0b',
    },
    'brutalist-mono': {
      bgLocker: 'bg-black',
      borderLocker: 'border-white',
      doorTop: 'bg-black',
      doorBottom: 'bg-black',
      interior: 'bg-zinc-900',
      textColor: 'text-white',
      accentColor: 'text-white',
      badgeBg: 'bg-zinc-800',
      lineColor: '#ffffff',
      rayColor: '#ffffff',
    },
    'safety-yellow': {
      bgLocker: 'bg-[#1a1708]',
      borderLocker: 'border-[#f59e0b]',
      doorTop: 'bg-[#f59e0b]',
      doorBottom: 'bg-[#f59e0b]',
      interior: 'bg-[#0f0e07]',
      textColor: 'text-black',
      accentColor: 'text-amber-400',
      badgeBg: 'bg-black text-amber-400',
      lineColor: '#d97706',
      rayColor: '#fbbf24',
    },
    'clean-white': {
      bgLocker: 'bg-[#f0f2f5]',
      borderLocker: 'border-[#d0d5dd]',
      doorTop: 'bg-[#ffffff]',
      doorBottom: 'bg-[#ffffff]',
      interior: 'bg-[#e4e7ec]',
      textColor: 'text-zinc-950',
      accentColor: 'text-blue-600',
      badgeBg: 'bg-[#e4e7ec] text-zinc-800',
      lineColor: '#98a2b3',
      rayColor: '#2563eb',
    },
  }[theme];

  // Mouse / Touch Dragging on lower door to simulate opening physical locker
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!interactive) return;
    setIsDragging(true);
    startXRef.current = e.clientX;
    startAngleRef.current = currentAngle;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const deltaX = startXRef.current - e.clientX; // dragging leftwards rotates door open
    const newAngle = Math.max(0, Math.min(80, startAngleRef.current + deltaX * 0.45));
    setInternalAngle(newAngle);
    if (onAngleChange) onAngleChange(newAngle);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    if (currentAngle > 10) {
      playLockerOpenSound();
    } else {
      playLockerCloseSound();
    }
  };

  // Quick toggle on click if not dragged much
  const handleClick = () => {
    if (!interactive) return;
    const targetAngle = currentAngle > 15 ? 0 : 50;
    setInternalAngle(targetAngle);
    if (targetAngle > 15) {
      playLockerOpenSound();
    } else {
      playLockerCloseSound();
    }
    if (onAngleChange) onAngleChange(targetAngle);
  };

  // Compute lower door transform style
  const is3DPureGlyph = viewMode === 'pure-glyph-3d';
  const isPureGlyph = viewMode === 'pure-glyph' || is3DPureGlyph;
  const is3D = viewMode === 'perspective3d' || is3DPureGlyph;
  const isBlueprint = viewMode === 'blueprint';
  const isWireframe = viewMode === 'wireframe';
  const showCabinetDetails = showLockerDetails && !isPureGlyph;
  const glyphTextColor = isPureGlyph
    ? theme === 'safety-yellow'
      ? 'text-amber-400'
      : theme === 'clean-white'
      ? 'text-zinc-100'
      : 'text-white'
    : themeStyles.textColor;

  // Transformation for the lower door:
  // "上层柜门不动。下层柜门左侧为铰链，从右边弹开并向左旋。下半字高度不变，只横向缩窄并偏向左侧。"
  // In 3D (both 3D cabinet and 3D pure-glyph): rotateY(-currentAngle deg) with transform-origin: left top
  // In 2D Orthographic pure-glyph: scaleX(cos(currentAngle)) with transform-origin: left center
  const lowerDoorTransform = is3D
    ? `perspective(650px) rotateY(-${currentAngle}deg)`
    : `scaleX(${cosValue})`;

  // In pure glyph mode, keep 100% pure vector sharpness with NO fuzzy text shadows or blur
  const upper3DShadow = !isPureGlyph && is3D
    ? theme === 'clean-white'
      ? '-1px 1px 0 #bbb, -2px 2px 0 #999'
      : '-1px 1px 0 #555, -2px 2px 0 #333'
    : undefined;

  const lower3DShadow = !isPureGlyph && is3D
    ? currentAngle > 0
      ? theme === 'clean-white'
        ? '-1px 1px 0 #bbb, -2px 2px 0 #999'
        : '-1px 1px 0 #666, -2px 2px 0 #444'
      : upper3DShadow
    : undefined;

  return (
    <div
      id={`locker-${char}-${boxNumber}`}
      className={`relative select-none inline-flex flex-col items-center group ${customClass}`}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        transform:
          (tiltX !== 0 || tiltY !== 0) && is3D
            ? `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`
            : undefined,
        transformStyle: 'preserve-3d',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Outer Locker Cabinet Box / Frame (Transparent in Pure-Glyph mode) */}
      <div
        className={`w-full h-full relative overflow-visible transition-all duration-200 ${
          isPureGlyph
            ? 'bg-transparent border-transparent shadow-none'
            : `rounded-md border ${themeStyles.bgLocker} ${themeStyles.borderLocker} shadow-xl`
        }`}
        style={{
          boxShadow: isPureGlyph
            ? 'none'
            : isHovered
            ? '0 12px 30px -4px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(245, 158, 11, 0.2)'
            : '0 8px 20px -4px rgba(0, 0, 0, 0.4)',
        }}
      >
        {/* =========================================
            UPPER COMPARTMENT (上层柜口 / 上半字形 - 未变形母体)
            ========================================= */}
        <div
          id={`locker-upper-${boxNumber}`}
          className={`w-full relative overflow-hidden ${
            isPureGlyph
              ? 'bg-transparent border-none'
              : `border-b ${themeStyles.doorTop} ${themeStyles.borderLocker} rounded-t-sm`
          }`}
          style={{ height: `${halfHeight}px` }}
        >
          {/* Locker Cabinet Details (Number & Vent Slits) */}
          {showCabinetDetails && (
            <div className="absolute top-1.5 left-2 right-2 flex items-center justify-between z-20 pointer-events-none opacity-70">
              <span className={`font-mono font-bold tracking-widest ${numSize} ${themeStyles.badgeBg} px-1 rounded`}>
                NO.{boxNumber}A
              </span>
              <div className="flex gap-0.5">
                <span className="w-2.5 h-0.5 bg-black/40 dark:bg-white/20 rounded-full" />
                <span className="w-2.5 h-0.5 bg-black/40 dark:bg-white/20 rounded-full" />
                <span className="w-2.5 h-0.5 bg-black/40 dark:bg-white/20 rounded-full" />
              </div>
            </div>
          )}

          {/* Top Half of the Sans-Serif Letter (Undistorted pure half) */}
          <div
            className="w-full flex items-center justify-center pointer-events-none"
            style={{
              height: `${height}px`,
              marginTop: 0, // Aligns upper half inside top compartment
            }}
          >
            <span
              className={`font-black tracking-tight leading-none ${glyphTextColor}`}
              style={{
                fontFamily,
                fontSize: `${fontSize}px`,
                lineHeight: 1,
                display: 'inline-block',
                transform: 'translateY(-1%)',
                textShadow: upper3DShadow,
                WebkitFontSmoothing: 'antialiased',
                MozOsxFontSmoothing: 'grayscale',
                textRendering: 'geometricPrecision',
              }}
            >
              {char}
            </span>
          </div>

          {/* Hinge Marker on top compartment (Static reference) */}
          {showCabinetDetails && (
            <div className="absolute left-0.5 top-2 bottom-2 w-1 flex flex-col justify-between pointer-events-none opacity-40">
              <div className="w-1 h-3 bg-zinc-400 dark:bg-zinc-600 rounded-sm" />
              <div className="w-1 h-3 bg-zinc-400 dark:bg-zinc-600 rounded-sm" />
            </div>
          )}
        </div>

        {/* =========================================
            SPLIT SEAM / GAP (上下柜口分割缝 - 纯字模式下完全消除无缝连接)
            ========================================= */}
        {!isPureGlyph && (
          <div
            className="w-full h-[2px] z-30 relative"
            style={{
              backgroundColor: isBlueprint ? '#38bdf8' : themeStyles.lineColor,
              opacity: isBlueprint ? 0.8 : 0.5,
            }}
          >
            {isBlueprint && (
              <span className="absolute -top-2 right-1 text-[8px] font-mono text-sky-400 font-bold">
                SPLIT Y=50%
              </span>
            )}
          </div>
        )}

        {/* =========================================
            LOWER COMPARTMENT (下层柜口 / 动力学下半字 - 左铰链弹开形变)
            ========================================= */}
        <div
          id={`locker-lower-box-${boxNumber}`}
          className={`w-full relative overflow-visible ${
            isPureGlyph ? 'bg-transparent' : `rounded-b-sm ${themeStyles.interior}`
          }`}
          style={{ height: isPureGlyph ? `${halfHeight}px` : `${halfHeight - 2}px` }}
        >
          {/* Locker Interior Cavity (Visible when lower door opens) */}
          {!isPureGlyph && (
            <div className="absolute inset-0 overflow-hidden bg-black rounded-b-sm">
              {/* Interior dot matrix texture - 保留点 */}
              <div
                className="absolute inset-0 opacity-25 pointer-events-none"
                style={{
                  backgroundImage:
                    'radial-gradient(circle, #ffffff 1.2px, transparent 1.2px)',
                  backgroundSize: '8px 8px',
                }}
              />
            </div>
          )}

          {/* LOWER DOOR / TRANSFORMING LOWER GLYPH */}
          <div
            id={`door-lower-${boxNumber}`}
            className={`absolute inset-0 cursor-ew-resize overflow-hidden z-20 origin-left transition-transform ${
              isDragging ? 'transition-none' : 'duration-300 ease-out'
            } ${
              isPureGlyph
                ? 'bg-transparent border-none shadow-none'
                : `${themeStyles.doorBottom} ${
                    is3D ? 'shadow-2xl border-r-2 border-zinc-700/50' : 'border-r border-zinc-600/30'
                  }`
            }`}
            style={{
              transformOrigin: 'left top', // 左侧铰链，接合线平齐
              transform: lowerDoorTransform,
              transformStyle: 'preserve-3d',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              // 纯字模式绝不使用任何模糊滤镜，保持如矢量般的极度锐利
              filter: !isPureGlyph && currentAngle > 0 && is3D
                ? `brightness(${0.85 + cosValue * 0.15}) drop-shadow(4px 0 12px rgba(0,0,0,0.8))`
                : undefined,
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onClick={handleClick}
            title={isPureGlyph ? '点击或左右拖拽形变下半段立体字母' : '点击或左右拖拽弹开下层柜门'}
          >
            {/* Lower Door Details (Number, Lock Latch, Vent Slits) */}
            {showCabinetDetails && (
              <div className="absolute top-1.5 left-2 right-2 flex items-center justify-between z-20 pointer-events-none opacity-70">
                <span className={`font-mono font-bold tracking-widest ${numSize} ${themeStyles.badgeBg} px-1 rounded`}>
                  NO.{boxNumber}B
                </span>
                {/* Latch handle on right side of door */}
                <div className="w-1.5 h-3 bg-zinc-400 dark:bg-zinc-600 rounded-sm border border-black/40" />
              </div>
            )}

            {/* Bottom Half of the Sans-Serif Letter */}
            {/* Shifted so only the bottom 50% appears in this half-height box */}
            <div
              className="w-full flex items-center justify-center pointer-events-none"
              style={{
                height: `${height}px`,
                marginTop: `-${halfHeight}px`, // Shifts glyph up so bottom half shows
              }}
            >
              <span
                className={`font-black tracking-tight leading-none ${glyphTextColor}`}
                style={{
                  fontFamily,
                  fontSize: `${fontSize}px`,
                  lineHeight: 1,
                  display: 'inline-block',
                  transform: 'translateY(-1%)',
                  textShadow: lower3DShadow,
                  WebkitFontSmoothing: 'antialiased',
                  MozOsxFontSmoothing: 'grayscale',
                  textRendering: 'geometricPrecision',
                }}
              >
                {char}
              </span>
            </div>

            {/* Left Hinge Mechanical Highlight */}
            {!isPureGlyph && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-r from-zinc-700 to-transparent pointer-events-none opacity-80" />
            )}

            {/* Door Thickness Bevel when swung open in 3D cabinet */}
            {!isPureGlyph && is3D && currentAngle > 5 && (
              <div className="absolute right-0 top-0 bottom-0 w-1 bg-zinc-500/80 pointer-events-none" />
            )}
          </div>

          {/* HINGE CYLINDERS (Physical Left Hinge Pivot) */}
          {!isPureGlyph && (
            <div className="absolute -left-1 top-2 bottom-2 w-1.5 flex flex-col justify-between pointer-events-none z-30">
              <div className="w-1.5 h-3.5 bg-zinc-300 dark:bg-zinc-500 border border-black/40 rounded-sm shadow-sm" />
              <div className="w-1.5 h-3.5 bg-zinc-300 dark:bg-zinc-500 border border-black/40 rounded-sm shadow-sm" />
            </div>
          )}
        </div>
      </div>

      {/* =========================================
          BLUEPRINT / PROJECTION RAYS & ANNOTATIONS
          ========================================= */}
      {!isPureGlyph && (isBlueprint || showRays) && (
        <svg
          className="absolute -inset-4 pointer-events-none z-40 overflow-visible"
          style={{ width: `${width + 32}px`, height: `${height + 32}px` }}
        >
          {/* Left Hinge Pivot Marker */}
          <circle cx="16" cy={16 + halfHeight} r="4" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
          <text x="24" y={20 + halfHeight} fill="#ef4444" fontSize="9" fontFamily="monospace" fontWeight="bold">
            HINGE (X=0)
          </text>

          {/* Original Right Boundary vs Projected Right Boundary */}
          {currentAngle > 2 && (
            <>
              {/* Original ghost right line */}
              <line
                x1={16 + width}
                y1={16 + halfHeight}
                x2={16 + width}
                y2={16 + height}
                stroke="#64748b"
                strokeWidth="1"
                strokeDasharray="3 3"
              />

              {/* Compressed right edge */}
              <line
                x1={16 + width * cosValue}
                y1={16 + halfHeight}
                x2={16 + width * cosValue}
                y2={16 + height}
                stroke="#f59e0b"
                strokeWidth="1.5"
              />

              {/* Contraction Ray from original right edge to transformed right edge */}
              <path
                d={`M ${16 + width} ${16 + height} Q ${16 + width * ((1 + cosValue) / 2)} ${16 + height + 10} ${
                  16 + width * cosValue
                } ${16 + height}`}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="1.5"
                markerEnd="url(#arrow)"
              />

              {/* Scale Label */}
              <text
                x={16 + (width * cosValue) / 2}
                y={16 + height + 16}
                fill="#f59e0b"
                fontSize="9"
                fontFamily="monospace"
                textAnchor="middle"
                fontWeight="bold"
              >
                W' = W × cos({Math.round(currentAngle)}°) = {(cosValue * 100).toFixed(0)}%
              </text>
            </>
          )}
        </svg>
      )}

      {/* Interactive Helper Hint on Hover */}
      {interactive && isHovered && (
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-zinc-900/90 text-zinc-300 text-[10px] font-mono px-2 py-0.5 rounded border border-zinc-700 pointer-events-none shadow-md z-40">
          {currentAngle === 0 ? '点击弹开 / 拖拽开门' : `开度 ${Math.round(currentAngle)}° (横缩 ${(cosValue * 100).toFixed(0)}%)`}
        </div>
      )}
    </div>
  );
};
