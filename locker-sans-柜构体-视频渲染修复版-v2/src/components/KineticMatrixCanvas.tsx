import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ViewMode, VisualTheme } from '../types';
import { globalKineticRenderer } from '../utils/kineticCanvasRenderer';

interface KineticMatrixCanvasProps {
  characters: string[];
  viewMode: ViewMode;
  theme: VisualTheme;
  fontFamily: string;
  globalAngle: number;
  individualAngles: Record<string, number>;
  isAutonomousSwarm: boolean;
  isWaving: boolean;
  swarmTempo: 'gentle' | 'normal' | 'rapid';
  onSelectChar: (char: string) => void;
  onAngleChange: (char: string, angle: number) => void;
}

export const KineticMatrixCanvas: React.FC<KineticMatrixCanvasProps> = ({
  characters,
  viewMode,
  theme,
  fontFamily,
  globalAngle,
  individualAngles,
  isAutonomousSwarm,
  isWaving,
  swarmTempo,
  onSelectChar,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hoveredCharRef = useRef<string | null>(null);

  // Dynamic autonomous per-character state for pure 60FPS RAF loop
  const swarmRef = useRef<Record<string, { current: number; target: number; speed: number; pause: number }>>({});
  const waveTimeRef = useRef(0);

  // Initialize swarm states
  useEffect(() => {
    const states: Record<string, { current: number; target: number; speed: number; pause: number }> = {};
    const possibleAngles = [0, 15, 30, 45, 60, 75];
    characters.forEach((char) => {
      states[char] = {
        current: individualAngles[char] !== undefined ? individualAngles[char] : globalAngle,
        target: possibleAngles[Math.floor(Math.random() * possibleAngles.length)],
        speed: 1.2 + Math.random() * 1.5,
        pause: Math.floor(Math.random() * 30),
      };
    });
    swarmRef.current = states;
  }, [characters]);

  // Main 60FPS requestAnimationFrame Render Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    // In-memory offscreen cell canvas to avoid reallocating during grid draw
    const cellCanvas = document.createElement('canvas');

    const render = (now: number) => {
      const dt = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;

      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) {
        animId = requestAnimationFrame(render);
        return;
      }

      // Responsive canvas sizing
      const containerW = container.clientWidth || 900;
      const cols = containerW > 1200 ? 6 : containerW > 768 ? 4 : containerW > 480 ? 3 : 2;
      const cellW = Math.floor((containerW - (cols - 1) * 12) / cols);
      const cellH = Math.round(cellW * 1.4);
      const rows = Math.ceil(characters.length / cols);
      const totalH = rows * cellH + (rows - 1) * 12;

      const dpr = Math.min(2, window.devicePixelRatio || 2);
      const pixelW = Math.round(containerW * dpr);
      const pixelH = Math.round(totalH * dpr);

      if (canvas.width !== pixelW || canvas.height !== pixelH) {
        canvas.width = pixelW;
        canvas.height = pixelH;
      }

      const ctx = canvas.getContext('2d', { alpha: true });
      if (!ctx) {
        animId = requestAnimationFrame(render);
        return;
      }

      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, pixelW, pixelH);
      ctx.scale(dpr, dpr);

      // Advance Swarm / Wave physics
      if (isWaving) {
        waveTimeRef.current += dt * 3.5;
      }

      const speedMult = swarmTempo === 'gentle' ? 0.6 : swarmTempo === 'rapid' ? 2.2 : 1.2;
      const possibleAngles = [0, 10, 25, 45, 60, 75, 80];

      // Draw each locker unit
      characters.forEach((char, index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;
        const x = col * (cellW + 12);
        const y = row * (cellH + 12);

        // Determine angle
        let angle = globalAngle;
        if (isWaving) {
          const wave = Math.sin(waveTimeRef.current + col * 0.45 + row * 0.35);
          angle = Math.max(0, Math.min(80, Math.round(40 + wave * 36)));
        } else if (isAutonomousSwarm) {
          let node = swarmRef.current[char];
          if (!node) {
            node = { current: globalAngle, target: 45, speed: 1.5, pause: 0 };
            swarmRef.current[char] = node;
          }
          if (node.pause > 0) {
            node.pause -= 1;
          } else {
            const delta = node.target - node.current;
            if (Math.abs(delta) < 1.0) {
              node.current = node.target;
              node.target = possibleAngles[Math.floor(Math.random() * possibleAngles.length)];
              node.speed = (0.8 + Math.random() * 1.6) * speedMult;
              node.pause = Math.floor((15 + Math.random() * 45) / speedMult);
            } else {
              node.current += Math.sign(delta) * Math.min(Math.abs(delta) * 0.14 + 0.6, node.speed * 2.8);
            }
          }
          angle = node.current;
        } else if (individualAngles[char] !== undefined) {
          angle = individualAngles[char];
        }

        // Render cell to sub-canvas
        globalKineticRenderer.renderToCanvas(cellCanvas, {
          char,
          angle,
          viewMode,
          theme,
          fontFamily,
          boxNumber: (index + 1).toString().padStart(2, '0'),
          width: cellW,
          height: cellH,
          showDetails: true,
          showRays: false,
          dpr: 1.5,
        });

        // Blit to main matrix canvas
        ctx.drawImage(cellCanvas, x, y, cellW, cellH);

        // Highlight border if hovered
        if (hoveredCharRef.current === char) {
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, cellW, cellH);
        }
      });

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [
    characters,
    viewMode,
    theme,
    fontFamily,
    globalAngle,
    individualAngles,
    isAutonomousSwarm,
    isWaving,
    swarmTempo,
  ]);

  // Click & Hover interaction via coordinates
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const containerW = container.clientWidth || 900;
    const cols = containerW > 1200 ? 6 : containerW > 768 ? 4 : containerW > 480 ? 3 : 2;
    const cellW = Math.floor((containerW - (cols - 1) * 12) / cols);
    const cellH = Math.round(cellW * 1.4);

    const col = Math.floor(clickX / (cellW + 12));
    const row = Math.floor(clickY / (cellH + 12));

    if (col >= 0 && col < cols) {
      const idx = row * cols + col;
      if (idx >= 0 && idx < characters.length) {
        onSelectChar(characters[idx]);
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = canvas.getBoundingClientRect();
    const moveX = e.clientX - rect.left;
    const moveY = e.clientY - rect.top;

    const containerW = container.clientWidth || 900;
    const cols = containerW > 1200 ? 6 : containerW > 768 ? 4 : containerW > 480 ? 3 : 2;
    const cellW = Math.floor((containerW - (cols - 1) * 12) / cols);
    const cellH = Math.round(cellW * 1.4);

    const col = Math.floor(moveX / (cellW + 12));
    const row = Math.floor(moveY / (cellH + 12));

    if (col >= 0 && col < cols) {
      const idx = row * cols + col;
      if (idx >= 0 && idx < characters.length) {
        hoveredCharRef.current = characters[idx];
        return;
      }
    }
    hoveredCharRef.current = null;
  };

  return (
    <div ref={containerRef} className="w-full relative flex flex-col items-center">
      <canvas
        ref={canvasRef}
        id="alphabet-matrix-canvas"
        className="w-full cursor-pointer rounded-2xl shadow-xl"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => {
          hoveredCharRef.current = null;
        }}
        title="点击字母进入单字深度解剖；全矩阵由 requestAnimationFrame + OffscreenCanvas 驱动"
      />
    </div>
  );
};
