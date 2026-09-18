import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Download,
  Grid3X3,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Type,
  Video,
} from 'lucide-react';
import './styles.css';

type HingeSide = 'left' | 'right';
type ViewMode = 'word' | 'alphabet';
type FontStyle = 'black' | 'grotesk' | 'didone';

type Settings = {
  word: string;
  angle: number;
  cut: number;
  shadow: number;
  spacing: number;
  duration: number;
  side: HingeSide;
  font: FontStyle;
  view: ViewMode;
};

const INITIAL: Settings = {
  word: 'LOCKER',
  angle: 62,
  cut: 46,
  shadow: 36,
  spacing: 10,
  duration: 3.2,
  side: 'left',
  font: 'black',
  view: 'word',
};

const PRESETS = ['TOP', 'LOCKER', 'EXPRESS', 'PARCEL'];
const POSTER_W = 1600;
const POSTER_H = 900;

const fontMap: Record<FontStyle, string> = {
  black: '900 280px Arial Black, Arial, Helvetica, sans-serif',
  grotesk: '800 280px Arial, Helvetica Neue, Helvetica, sans-serif',
  didone: '600 280px Didot, Bodoni MT, Times New Roman, serif',
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const ease = (t: number) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);

function cleanWord(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9 ]/g, '').slice(0, 12);
}

function openProgress(time: number, duration: number, index: number, count: number) {
  const stagger = count > 1 ? index * 0.07 : 0;
  const active = clamp((time / duration - stagger) / Math.max(0.3, 1 - stagger), 0, 1);
  const breathe = 0.92 + Math.sin(time * Math.PI * 2 / duration + index * 0.5) * 0.08;
  return ease(active) * breathe;
}

function drawSplitGlyph(
  ctx: CanvasRenderingContext2D,
  letter: string,
  x: number,
  baseline: number,
  size: number,
  settings: Settings,
  progress: number,
  index: number,
  width: number,
) {
  if (letter === ' ') return;
  const top = baseline - size * 0.77;
  const bottom = baseline + size * 0.09;
  const glyphH = bottom - top;
  const microShift = ((index % 3) - 1) * 0.012;
  const cutY = top + glyphH * clamp(settings.cut / 100 + microShift, 0.28, 0.68);
  const gap = Math.max(4, size * 0.018) * progress;
  const radians = settings.angle * Math.PI / 180 * progress;
  const scaleX = Math.max(0.27, Math.cos(radians));
  const direction = settings.side === 'left' ? 1 : -1;
  const hingeX = settings.side === 'left' ? x : x + width;
  const shearY = direction * (1 - scaleX) * 0.42;
  const faceOffsetY = (1 - scaleX) * size * 0.045;
  const shadowOffset = (1 - scaleX) * size * 0.14;

  ctx.save();
  ctx.beginPath();
  ctx.rect(x - size * 0.08, top - size * 0.08, width + size * 0.16, cutY - top - gap * 0.5 + size * 0.08);
  ctx.clip();
  ctx.fillStyle = '#11110f';
  ctx.fillText(letter, x, baseline);
  ctx.restore();

  if (progress > 0.015 && settings.shadow > 0) {
    ctx.save();
    ctx.globalAlpha = (settings.shadow / 100) * 0.48 * progress;
    ctx.translate(hingeX, cutY);
    ctx.transform(Math.max(0.22, scaleX * 0.83), shearY * 0.52, 0, 1, 0, shadowOffset);
    ctx.translate(-hingeX, -cutY);
    ctx.beginPath();
    ctx.rect(x - size * 0.1, cutY + gap * 0.5, width + size * 0.2, bottom - cutY + size * 0.12);
    ctx.clip();
    ctx.fillStyle = '#11110f';
    ctx.fillText(letter, x, baseline);
    ctx.restore();
  }

  ctx.save();
  ctx.translate(hingeX, cutY);
  ctx.transform(scaleX, shearY, 0, 1, 0, faceOffsetY);
  ctx.translate(-hingeX, -cutY);
  ctx.beginPath();
  ctx.rect(x - size * 0.1, cutY + gap * 0.5, width + size * 0.2, bottom - cutY + size * 0.12);
  ctx.clip();
  ctx.fillStyle = '#11110f';
  ctx.fillText(letter, x, baseline);
  ctx.restore();

  if (progress > 0.04) {
    ctx.save();
    ctx.globalAlpha = 0.78 * progress;
    ctx.strokeStyle = '#11110f';
    ctx.lineWidth = Math.max(2, size * 0.008);
    ctx.beginPath();
    const lineLength = Math.max(size * 0.08, width * (0.18 + (1 - scaleX) * 0.22));
    if (settings.side === 'left') {
      ctx.moveTo(x, cutY);
      ctx.lineTo(x + lineLength, cutY + lineLength * shearY * 0.24);
    } else {
      ctx.moveTo(x + width, cutY);
      ctx.lineTo(x + width - lineLength, cutY - lineLength * shearY * 0.24);
    }
    ctx.stroke();
    ctx.restore();
  }
}

function drawWordPoster(
  ctx: CanvasRenderingContext2D,
  settings: Settings,
  time: number,
  animate: boolean,
) {
  ctx.fillStyle = '#f1f0e8';
  ctx.fillRect(0, 0, POSTER_W, POSTER_H);

  ctx.strokeStyle = '#c9c7bd';
  ctx.lineWidth = 2;
  ctx.strokeRect(56, 56, POSTER_W - 112, POSTER_H - 112);

  ctx.fillStyle = '#171714';
  ctx.font = '600 22px Arial, Helvetica, sans-serif';
  ctx.textBaseline = 'top';
  ctx.fillText('HINGE / TYPE STUDY', 84, 82);
  ctx.textAlign = 'right';
  ctx.fillText(`CUT ${settings.cut}%  ·  LIFT ${settings.angle}°`, POSTER_W - 84, 82);
  ctx.textAlign = 'left';

  const letters = (settings.word || 'TYPE').split('');
  const fontSize = clamp(1180 / Math.max(letters.length, 4), 125, 292);
  ctx.font = fontMap[settings.font].replace('280px', `${fontSize}px`);
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';

  const widths = letters.map((letter) => ctx.measureText(letter).width);
  const spacing = fontSize * (settings.spacing / 100);
  const total = widths.reduce((sum, w) => sum + w, 0) + spacing * Math.max(0, letters.length - 1);
  let x = (POSTER_W - total) / 2;
  const baseline = POSTER_H * 0.61;

  letters.forEach((letter, index) => {
    const p = animate
      ? openProgress(time, settings.duration, index, letters.length)
      : 0.9 + (index % 3) * 0.045;
    drawSplitGlyph(ctx, letter, x, baseline, fontSize, settings, p, index, widths[index]);
    x += widths[index] + spacing;
  });

  ctx.fillStyle = '#171714';
  ctx.font = '500 18px Arial, Helvetica, sans-serif';
  ctx.textBaseline = 'bottom';
  ctx.fillText('FIXED EDGE', 84, POSTER_H - 78);
  ctx.textAlign = 'right';
  ctx.fillText(settings.side === 'left' ? 'HINGE → LEFT' : 'RIGHT ← HINGE', POSTER_W - 84, POSTER_H - 78);
  ctx.textAlign = 'left';
}

function drawAlphabetPoster(
  ctx: CanvasRenderingContext2D,
  settings: Settings,
  time: number,
  animate: boolean,
) {
  ctx.fillStyle = '#f1f0e8';
  ctx.fillRect(0, 0, POSTER_W, POSTER_H);
  ctx.fillStyle = '#171714';
  ctx.font = '600 22px Arial, Helvetica, sans-serif';
  ctx.textBaseline = 'top';
  ctx.fillText('A–Z / HINGE SYSTEM', 60, 38);

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const cols = 7;
  const cellW = (POSTER_W - 120) / cols;
  const rows = 4;
  const cellH = (POSTER_H - 116) / rows;
  const fontSize = 124;
  ctx.font = fontMap[settings.font].replace('280px', `${fontSize}px`);
  ctx.textBaseline = 'alphabetic';

  chars.forEach((letter, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const cellX = 60 + col * cellW;
    const cellY = 84 + row * cellH;
    const width = ctx.measureText(letter).width;
    const x = cellX + (cellW - width) / 2;
    const baseline = cellY + cellH * 0.67;
    const p = animate
      ? openProgress(time, settings.duration, index % 7, 7)
      : 0.72 + (index % 4) * 0.075;
    drawSplitGlyph(ctx, letter, x, baseline, fontSize, settings, p, index, width);

    ctx.save();
    ctx.fillStyle = '#77766f';
    ctx.font = '500 14px Arial, Helvetica, sans-serif';
    ctx.textBaseline = 'bottom';
    ctx.fillText(String(index + 1).padStart(2, '0'), cellX + 8, cellY + cellH - 10);
    ctx.restore();
  });
}

function renderPoster(
  canvas: HTMLCanvasElement,
  settings: Settings,
  time: number,
  animate: boolean,
) {
  if (canvas.width !== POSTER_W || canvas.height !== POSTER_H) {
    canvas.width = POSTER_W;
    canvas.height = POSTER_H;
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, POSTER_W, POSTER_H);
  if (settings.view === 'alphabet') {
    drawAlphabetPoster(ctx, settings, time, animate);
  } else {
    drawWordPoster(ctx, settings, time, animate);
  }
}

type RangeProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (value: number) => void;
};

function Range({ label, value, min, max, step = 1, suffix = '', onChange }: RangeProps) {
  const fill = ((value - min) / (max - min)) * 100;
  return (
    <label className="range-row">
      <span className="range-meta">
        <span>{label}</span>
        <output>{Number.isInteger(value) ? value : value.toFixed(1)}{suffix}</output>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        style={{ '--fill': `${fill}%` } as React.CSSProperties}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function App() {
  const [settings, setSettings] = useState<Settings>(INITIAL);
  const [playing, setPlaying] = useState(true);
  const [recording, setRecording] = useState(false);
  const [toast, setToast] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const startedAt = useRef(performance.now());
  const rafRef = useRef<number | null>(null);

  const patch = useCallback((next: Partial<Settings>) => {
    setSettings((current) => ({ ...current, ...next }));
  }, []);

  const replay = useCallback(() => {
    startedAt.current = performance.now();
    setPlaying(true);
  }, []);

  useEffect(() => {
    const loop = (now: number) => {
      const canvas = canvasRef.current;
      if (canvas) {
        const elapsed = playing
          ? ((now - startedAt.current) / 1000) % settings.duration
          : settings.duration;
        renderPoster(canvas, settings, elapsed, playing);
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [playing, settings]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(''), 2600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const presetIndex = useMemo(
    () => Math.max(0, PRESETS.indexOf(settings.word)),
    [settings.word],
  );

  const nextPreset = () => {
    const next = PRESETS[(presetIndex + 1) % PRESETS.length];
    patch({ word: next, view: 'word' });
    replay();
  };

  const randomize = () => {
    patch({
      angle: Math.round(38 + Math.random() * 42),
      cut: Math.round(35 + Math.random() * 25),
      shadow: Math.round(18 + Math.random() * 50),
      spacing: Math.round(2 + Math.random() * 16),
      side: Math.random() > 0.5 ? 'left' : 'right',
    });
    replay();
  };

  const exportPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    renderPoster(canvas, settings, settings.duration, false);
    const link = document.createElement('a');
    link.download = `hinge-type-${(settings.word || 'alphabet').toLowerCase()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    setToast('PNG 已导出');
  };

  const recordWebm = async () => {
    const canvas = canvasRef.current;
    if (!canvas || recording) return;
    if (!('MediaRecorder' in window) || !canvas.captureStream) {
      setToast('当前浏览器不支持 WebM 录制');
      return;
    }
    setRecording(true);
    setPlaying(false);
    const stream = canvas.captureStream(60);
    const preferred = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
      .find((type) => MediaRecorder.isTypeSupported(type));
    const recorder = new MediaRecorder(stream, {
      mimeType: preferred,
      videoBitsPerSecond: 12_000_000,
    });
    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size) chunks.push(event.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: preferred || 'video/webm' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `hinge-type-${(settings.word || 'alphabet').toLowerCase()}.webm`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1500);
      setRecording(false);
      setToast('4 秒 WebM 已导出');
      replay();
    };
    recorder.start(250);
    const recordStart = performance.now();
    const renderFrame = (now: number) => {
      const elapsed = (now - recordStart) / 1000;
      renderPoster(canvas, settings, elapsed % settings.duration, true);
      if (elapsed < 4) requestAnimationFrame(renderFrame);
      else recorder.stop();
    };
    requestAnimationFrame(renderFrame);
  };

  return (
    <main className="app-shell">
      <aside className="control-panel">
        <header className="brand">
          <div className="brand-mark" aria-hidden="true"><span>H</span></div>
          <div>
            <p>HINGE TYPE</p>
            <span>掀起错视字体实验</span>
          </div>
        </header>

        <section className="input-section" aria-labelledby="input-heading">
          <div className="section-heading">
            <span id="input-heading">01 / 输入</span>
            <button className="icon-button" onClick={nextPreset} title="下一个示例" aria-label="下一个示例">
              <RefreshCw size={16} />
            </button>
          </div>
          <input
            className="word-input"
            aria-label="输入英文单词"
            value={settings.word}
            onChange={(event) => patch({ word: cleanWord(event.target.value), view: 'word' })}
            onFocus={() => patch({ view: 'word' })}
            placeholder="TYPE A WORD"
          />
          <div className="quick-words" aria-label="示例单词">
            {PRESETS.map((word) => (
              <button
                key={word}
                className={settings.word === word && settings.view === 'word' ? 'active' : ''}
                onClick={() => { patch({ word, view: 'word' }); replay(); }}
              >{word}</button>
            ))}
          </div>
        </section>

        <section aria-labelledby="structure-heading">
          <div className="section-heading"><span id="structure-heading">02 / 结构</span></div>
          <div className="segmented two">
            <button className={settings.side === 'left' ? 'active' : ''} onClick={() => patch({ side: 'left' })}>左侧黏连</button>
            <button className={settings.side === 'right' ? 'active' : ''} onClick={() => patch({ side: 'right' })}>右侧黏连</button>
          </div>
          <label className="select-row">
            <span>字体骨架</span>
            <select value={settings.font} onChange={(event) => patch({ font: event.target.value as FontStyle })}>
              <option value="black">BLACK / 黑体</option>
              <option value="grotesk">GROTESK / 粗体</option>
              <option value="didone">DIDONE / 参考细体</option>
            </select>
          </label>
          <Range label="掀起角度" value={settings.angle} min={18} max={82} suffix="°" onChange={(angle) => patch({ angle })} />
          <Range label="切口位置" value={settings.cut} min={28} max={68} suffix="%" onChange={(cut) => patch({ cut })} />
          <Range label="投影强度" value={settings.shadow} min={0} max={80} suffix="%" onChange={(shadow) => patch({ shadow })} />
          <Range label="字母间距" value={settings.spacing} min={0} max={24} suffix="%" onChange={(spacing) => patch({ spacing })} />
        </section>

        <section aria-labelledby="motion-heading">
          <div className="section-heading"><span id="motion-heading">03 / 动态</span></div>
          <Range label="循环时间" value={settings.duration} min={1.6} max={7} step={0.1} suffix="s" onChange={(duration) => patch({ duration })} />
          <div className="action-row">
            <button className="primary" onClick={() => { if (playing) setPlaying(false); else replay(); }}>
              {playing ? <Pause size={17} /> : <Play size={17} />}
              {playing ? '暂停' : '播放'}
            </button>
            <button onClick={replay}><RotateCcw size={17} />重播</button>
            <button onClick={randomize}>随机</button>
          </div>
        </section>

        <footer className="panel-footer">
          <span>MONOCHROME / NO GRADIENT</span>
          <span>V1.0</span>
        </footer>
      </aside>

      <section className="workspace">
        <header className="workspace-bar">
          <div className="view-tabs" role="tablist" aria-label="预览模式">
            <button role="tab" aria-selected={settings.view === 'word'} className={settings.view === 'word' ? 'active' : ''} onClick={() => patch({ view: 'word' })}>
              <Type size={16} />单词海报
            </button>
            <button role="tab" aria-selected={settings.view === 'alphabet'} className={settings.view === 'alphabet' ? 'active' : ''} onClick={() => patch({ view: 'alphabet' })}>
              <Grid3X3 size={16} />A–Z 矩阵
            </button>
          </div>
          <div className="export-actions">
            <button onClick={exportPng}><Download size={16} />导出 PNG</button>
            <button className="record" disabled={recording} onClick={recordWebm}>
              <Video size={16} />{recording ? '正在录制…' : '录制 4s WEBM'}
            </button>
          </div>
        </header>

        <div className="stage-wrap">
          <div className="stage-label left">FRONT / ORTHOGRAPHIC</div>
          <div className="stage-label right">1600 × 900</div>
          <canvas ref={canvasRef} aria-label="错视字体动态预览" />
          <div className={`record-light ${recording ? 'on' : ''}`}>{recording ? 'REC' : 'LIVE'}</div>
        </div>

        <div className="logic-strip">
          <div><span>1</span><p>完整字形</p></div>
          <i />
          <div><span>2</span><p>单一切口</p></div>
          <i />
          <div><span>3</span><p>单侧铰接</p></div>
          <i />
          <div><span>4</span><p>透视压缩 + 投影</p></div>
        </div>
      </section>

      {toast && <div className="toast" role="status">{toast}</div>}
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
