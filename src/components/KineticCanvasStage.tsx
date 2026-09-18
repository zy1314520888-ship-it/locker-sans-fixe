import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ViewMode, VisualTheme } from '../types';
import { globalKineticRenderer } from '../utils/kineticCanvasRenderer';
import { Play, Pause, RotateCcw, Cpu } from 'lucide-react';

interface KineticCanvasStageProps {
  char: string;
  angle: number;
  viewMode: ViewMode;
  theme: VisualTheme;
  fontFamily: string;
  tiltX: number;
  tiltY: number;
  showMidlineGuide: boolean;
  showWireframe: boolean;
  onAngleChange: (angle: number) => void;
  onOrbitChange: (tiltX: number, tiltY: number) => void;
}

export const KineticCanvasStage: React.FC<KineticCanvasStageProps> = ({
  char,
  angle,
  viewMode,
  theme,
  fontFamily,
  tiltX,
  tiltY,
  showMidlineGuide,
  showWireframe,
  onAngleChange,
  onOrbitChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDraggingRef = useRef(false);
  const dragModeRef = useRef<'angle' | 'orbit'>('angle');
  const dragStartRef = useRef({ x: 0, y: 0, startAngle: angle, startTiltX: tiltX, startTiltY: tiltY });

  // Pure RAF animation state decoupled from React render loops
  const [isPlaying60Fps, setIsPlaying60Fps] = useState(false);
  const animTimeRef = useRef(0);
  const currentAngleRef = useRef(angle);

  // Sync prop angle to ref when not in continuous RAF loop
  useEffect(() => {
    currentAngleRef.current = angle;
  }, [angle]);

  // Direct High-Performance RAF Render Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const renderTick = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      if (isPlaying60Fps) {
        animTimeRef.current += dt * 3.2;
        // Smooth kinematic oscillation between 2° and 76° (NetEase typography style)
        const wave = Math.sin(animTimeRef.current);
        const dynamicAngle = Math.round(38 + wave * 36);
        currentAngleRef.current = dynamicAngle;
        onAngleChange(dynamicAngle);
      }

      const canvas = canvasRef.current;
      if (canvas) {
        globalKineticRenderer.renderToCanvas(canvas, {
          char,
          angle: currentAngleRef.current,
          viewMode,
          theme,
          fontFamily,
          boxNumber: '08',
          width: 320,
          height: 440,
          showDetails: true,
          showRays: showWireframe,
          showMidline: showMidlineGuide,
          tiltX,
          tiltY,
          dpr: Math.min(2.5, window.devicePixelRatio || 2),
        });
      }

      animId = requestAnimationFrame(renderTick);
    };

    animId = requestAnimationFrame(renderTick);
    return () => cancelAnimationFrame(animId);
  }, [
    isPlaying60Fps,
    char,
    viewMode,
    theme,
    fontFamily,
    tiltX,
    tiltY,
    showMidlineGuide,
    showWireframe,
    onAngleChange,
  ]);

  // Pointer interactions for dragging angle or 3D orbit
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    isDraggingRef.current = true;

    // Shift or Right Click = 3D Orbit camera; Normal Drag = Open/Close Locker Door
    dragModeRef.current = e.shiftKey || e.button === 2 ? 'orbit' : 'angle';
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startAngle: currentAngleRef.current,
      startTiltX: tiltX,
      startTiltY: tiltY,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    if (dragModeRef.current === 'angle') {
      const deltaAngle = (dx / 2.2);
      const newAngle = Math.max(0, Math.min(80, Math.round(dragStartRef.current.startAngle + deltaAngle)));
      currentAngleRef.current = newAngle;
      onAngleChange(newAngle);
    } else {
      const newTiltX = Math.max(-45, Math.min(45, Math.round(dragStartRef.current.startTiltX - dy * 0.35)));
      const newTiltY = Math.max(-60, Math.min(60, Math.round(dragStartRef.current.startTiltY + dx * 0.4)));
      onOrbitChange(newTiltX, newTiltY);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) {}
  };

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      {/* 60FPS Hardware Acceleration & Quick Control Bar */}
      <div className="flex items-center justify-between w-full max-w-[340px] px-2 py-1 bg-black/40 border border-zinc-800 rounded-lg text-xs font-mono">
        <div className="flex items-center gap-1.5 text-emerald-400">
          <Cpu className="w-3.5 h-3.5 animate-pulse" />
          <span className="text-[11px] font-bold">RAF + 离屏双缓冲 60FPS</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-toggle-60fps-continuous"
            onClick={() => setIsPlaying60Fps(!isPlaying60Fps)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded transition-all ${
              isPlaying60Fps
                ? 'bg-amber-400 text-black font-bold shadow-[0_0_10px_rgba(251,191,36,0.5)]'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
            }`}
            title="像网易动效一样连续极速 60FPS 运动"
          >
            {isPlaying60Fps ? (
              <>
                <Pause className="w-3 h-3" />
                <span>暂停动效</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3" />
                <span>60FPS 极速动效</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              setIsPlaying60Fps(false);
              currentAngleRef.current = 45;
              onAngleChange(45);
              onOrbitChange(0, 0);
            }}
            className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-800"
            title="复位 45°"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Main High-Performance Canvas */}
      <div className="relative p-2 bg-[#0c0d10] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex items-center justify-center">
        <canvas
          ref={canvasRef}
          id="single-letter-canvas"
          className="cursor-ew-resize rounded-xl"
          style={{ width: '320px', height: '440px', touchAction: 'none' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          title="左右拖拽旋转开门角度；按住 Shift 拖拽旋转 3D 视角"
        />

        {/* Drag Hint overlay */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-black/70 backdrop-blur border border-zinc-700/60 text-[10px] font-mono text-zinc-400 pointer-events-none whitespace-nowrap">
          左右拖拽开合 · Shift+拖拽旋转3D
        </div>
      </div>
    </div>
  );
};
