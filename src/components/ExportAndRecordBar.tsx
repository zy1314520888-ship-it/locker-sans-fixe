import React, { useState } from 'react';
import { exportElementTo4K } from '../utils/export4k';
import { globalVideoRecorder } from '../utils/videoRecorder';
import {
  Download,
  Video,
  StopCircle,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Settings2,
  Film,
} from 'lucide-react';

interface ExportAndRecordBarProps {
  targetElementId: string;
  defaultFileNamePrefix?: string;
  onRecordStarted?: () => void;
  onRecordStopped?: () => void;
  onFrameStep?: (
    frameIndex: number,
    totalFrames: number,
    timeSeconds: number
  ) => void | Promise<void>;
  className?: string;
}

export const ExportAndRecordBar: React.FC<ExportAndRecordBarProps> = ({
  targetElementId,
  defaultFileNamePrefix = 'LOCKER-SANS',
  onRecordStarted,
  onRecordStopped,
  onFrameStep,
  className = '',
}) => {
  // 4K Export State
  const [isExporting4K, setIsExporting4K] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  // Video Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [isEncoding, setIsEncoding] = useState(false);
  const [secondsRecorded, setSecondsRecorded] = useState(0);
  const [framesRecorded, setFramesRecorded] = useState(0);
  const [progressPercent, setProgressPercent] = useState<number | null>(null);
  const [recordPreset, setRecordPreset] = useState<number | null>(5); // 5s default for fast silky smooth export
  const [recordFeedback, setRecordFeedback] = useState<string | null>(null);
  const [lastVideoUrl, setLastVideoUrl] = useState<string | null>(null);

  // Trigger 4K Ultra-HD Export
  const handleExport4K = async () => {
    if (isExporting4K) return;
    setIsExporting4K(true);
    setExportMessage('初始化 4K 超高清渲染管线...');

    try {
      await exportElementTo4K({
        elementId: targetElementId,
        fileName: `${defaultFileNamePrefix}-4K-UHD-${Date.now()}.png`,
        scale: 3.5, // 3840px+
        onProgress: (status) => setExportMessage(status),
      });

      setTimeout(() => {
        setIsExporting4K(false);
        setExportMessage(null);
      }, 2500);
    } catch (err) {
      console.error(err);
      setExportMessage('导出失败，请重试');
      setTimeout(() => {
        setIsExporting4K(false);
        setExportMessage(null);
      }, 3000);
    }
  };

  // Start Video Recording
  const handleStartRecording = async () => {
    if (isRecording) {
      handleStopRecording();
      return;
    }

    try {
      setRecordFeedback(null);
      setSecondsRecorded(0);
      setFramesRecorded(0);
      setProgressPercent(null);
      setIsEncoding(false);
      setIsRecording(true);

      onRecordStarted?.();

      await globalVideoRecorder.startRecording({
        targetElementId,
        autoStopSeconds: recordPreset ?? undefined,
        fileName: `${defaultFileNamePrefix}-1080P-HD-${Date.now()}.webm`,
        fps: 30, // 30 FPS standard cinema/animation framerate
        onFrameStep,
        onTick: (sec, frames) => {
          setSecondsRecorded(sec);
          if (frames !== undefined) {
            setFramesRecorded(frames);
          }
        },
        onProgress: (status, percent) => {
          setRecordFeedback(status);
          if (percent !== undefined) {
            setProgressPercent(percent);
          }
        },
        onStop: (_blob, url) => {
          setIsRecording(false);
          setIsEncoding(false);
          setSecondsRecorded(0);
          setFramesRecorded(0);
          setProgressPercent(null);
          setLastVideoUrl(url);
          setRecordFeedback('✅ 1080P 丝滑无损动效视频已成功生成并下载！');
          onRecordStopped?.();
          setTimeout(() => setRecordFeedback(null), 6000);
        },
        onError: (err) => {
          setIsRecording(false);
          setIsEncoding(false);
          setSecondsRecorded(0);
          setFramesRecorded(0);
          setProgressPercent(null);
          setRecordFeedback(`录制提示: ${err.message}`);
          onRecordStopped?.();
          setTimeout(() => setRecordFeedback(null), 5000);
        },
      });
    } catch (err) {
      console.warn('Video recorder initialization error:', err);
      setIsRecording(false);
      setIsEncoding(false);
      setProgressPercent(null);
      onRecordStopped?.();
      const msg = err instanceof Error ? err.message : String(err);
      setRecordFeedback(`录制启动异常: ${msg}`);
      setTimeout(() => setRecordFeedback(null), 5000);
    }
  };

  // Stop Recording manually
  const handleStopRecording = () => {
    setIsEncoding(true);
    setRecordFeedback('正在完成 1080P 视频打包合成...');
    globalVideoRecorder.stopRecording();
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {/* 4K Ultra-HD Export Button */}
      <button
        onClick={handleExport4K}
        disabled={isExporting4K || isRecording}
        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all shadow-md ${
          isExporting4K
            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 cursor-wait'
            : 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black border border-amber-300 active:scale-95 disabled:opacity-50'
        }`}
        title="生成 3840×2160+ 4K 印刷级超高清 PNG 图像"
      >
        {isExporting4K ? (
          <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
        ) : (
          <Sparkles className="w-4 h-4 text-black" />
        )}
        <span>{isExporting4K ? '4K 渲染中...' : '4K 高清保存'}</span>
        <span className="text-[10px] px-1 py-0.2 bg-black/20 text-black rounded font-mono">
          UHD
        </span>
      </button>

      {/* Video Recording Control */}
      {!isRecording ? (
        <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 shadow-md">
          <button
            onClick={handleStartRecording}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono bg-red-600 hover:bg-red-500 text-white font-bold transition-all active:scale-95"
            title="1080P 超清丝滑无损动效视频导出（免系统授权，零掉帧）"
          >
            <Film className="w-4 h-4" />
            <span>导出动效视频</span>
          </button>

          {/* Preset Selector */}
          <div className="flex items-center px-1.5 gap-1 text-[10px] font-mono text-zinc-400">
            <button
              onClick={() => setRecordPreset(5)}
              className={`px-1.5 py-0.5 rounded transition-colors ${
                recordPreset === 5
                  ? 'bg-zinc-800 text-amber-400 font-bold'
                  : 'hover:text-zinc-200'
              }`}
              title="导出 5 秒丝滑循环 (推荐 / 150帧 1080P)"
            >
              5s
            </button>
            <button
              onClick={() => setRecordPreset(10)}
              className={`px-1.5 py-0.5 rounded transition-colors ${
                recordPreset === 10
                  ? 'bg-zinc-800 text-amber-400 font-bold'
                  : 'hover:text-zinc-200'
              }`}
              title="导出 10 秒完整循环 (300帧 1080P)"
            >
              10s
            </button>
            <button
              onClick={() => setRecordPreset(null)}
              className={`px-1.5 py-0.5 rounded transition-colors ${
                recordPreset === null
                  ? 'bg-zinc-800 text-amber-400 font-bold'
                  : 'hover:text-zinc-200'
              }`}
              title="手动随时启停"
            >
              手动
            </button>
          </div>
        </div>
      ) : (
        /* Active Recording & Rendering HUD */
        <div className="flex items-center gap-2.5 bg-zinc-900/95 border border-red-500/80 px-3 py-1.5 rounded-lg shadow-xl animate-fade-in">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-red-300">
                {isEncoding
                  ? '正在打包生成 1080P 视频...'
                  : progressPercent !== null
                  ? `逐帧渲染 ${progressPercent}%`
                  : `REC ${formatTimer(secondsRecorded)}${recordPreset ? ` / ${recordPreset}s` : ''}`}
              </span>
              <span className="text-[9px] px-1 py-0.2 bg-red-500/20 text-red-300 font-mono rounded">
                1080P · 30FPS
              </span>
              {framesRecorded > 0 && !isEncoding && (
                <span className="text-[10px] text-zinc-400 font-mono">
                  {framesRecorded} 帧
                </span>
              )}
            </div>
            {progressPercent !== null && !isEncoding && (
              <div className="w-32 bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-1">
                <div
                  className="bg-gradient-to-r from-red-500 to-amber-400 h-full transition-all duration-100"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            )}
          </div>
          <button
            onClick={handleStopRecording}
            disabled={isEncoding}
            className="flex items-center gap-1 px-2.5 py-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-mono font-bold rounded transition-colors"
          >
            {isEncoding ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <StopCircle className="w-3.5 h-3.5" />
            )}
            <span>{isEncoding ? '合成中...' : '完成导出'}</span>
          </button>
        </div>
      )}

      {/* Status Toasts */}
      {exportMessage && (
        <div className="text-xs font-mono bg-zinc-900 border border-amber-500/50 text-amber-300 px-2.5 py-1 rounded-md flex items-center gap-1.5 animate-fade-in shadow">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>{exportMessage}</span>
        </div>
      )}

      {recordFeedback && !isRecording && (
        <div className="text-xs font-mono bg-zinc-900 border border-zinc-700 text-zinc-200 px-2.5 py-1 rounded-md flex items-center gap-1.5 animate-fade-in shadow">
          <span>{recordFeedback}</span>
          {lastVideoUrl && (
            <a
              href={lastVideoUrl}
              download={`${defaultFileNamePrefix}-1080P.webm`}
              className="ml-1 underline text-amber-400 hover:text-amber-300 font-bold"
            >
              再次下载
            </a>
          )}
        </div>
      )}
    </div>
  );
};
