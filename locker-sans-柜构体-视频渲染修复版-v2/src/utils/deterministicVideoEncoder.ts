import { getFontEmbedCSS, toCanvas } from 'html-to-image';
import { muxWebM, WebMEncodedFrame } from './webmMuxer';

export interface DeterministicVideoOptions {
  targetElement: HTMLElement;
  durationSeconds: number;
  fps: number;
  onFrameStep: (
    frameIndex: number,
    totalFrames: number,
    timeSeconds: number
  ) => void | Promise<void>;
  onFrame?: (frameIndex: number, totalFrames: number, timeSeconds: number) => void;
  onProgress?: (status: string, percent: number) => void;
  shouldStop?: () => boolean;
  shouldCancel?: () => boolean;
}

interface CodecChoice {
  config: Record<string, unknown>;
  codecId: 'V_VP8' | 'V_VP9';
}

interface VideoEncoderLike {
  encodeQueueSize: number;
  configure(config: Record<string, unknown>): void;
  encode(frame: unknown, options?: { keyFrame?: boolean }): void;
  flush(): Promise<void>;
  close(): void;
}

type VideoEncoderConstructor = {
  new (init: {
    output: (chunk: {
      byteLength: number;
      timestamp: number;
      duration?: number | null;
      type: 'key' | 'delta';
      copyTo(destination: Uint8Array): void;
    }) => void;
    error: (error: DOMException) => void;
  }): VideoEncoderLike;
  isConfigSupported(
    config: Record<string, unknown>
  ): Promise<{ supported?: boolean; config?: Record<string, unknown> }>;
};

type VideoFrameConstructor = new (
  source: CanvasImageSource,
  init: { timestamp: number; duration: number }
) => { close(): void };

const nextPaint = async (count = 2): Promise<void> => {
  for (let index = 0; index < count; index += 1) {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }
};

const waitForEncoder = async (encoder: VideoEncoderLike): Promise<void> => {
  while (encoder.encodeQueueSize > 6) {
    await new Promise<void>((resolve) => setTimeout(resolve, 2));
  }
};

const even = (value: number): number => {
  const rounded = Math.max(2, Math.round(value));
  return rounded % 2 === 0 ? rounded : rounded + 1;
};

const chooseCodec = async (
  Encoder: VideoEncoderConstructor,
  width: number,
  height: number,
  fps: number
): Promise<CodecChoice> => {
  const bitrate = Math.max(
    8_000_000,
    Math.min(24_000_000, Math.round(width * height * fps * 0.2))
  );
  const candidates: CodecChoice[] = [
    {
      codecId: 'V_VP9',
      config: {
        codec: 'vp09.00.10.08',
        width,
        height,
        bitrate,
        framerate: fps,
        latencyMode: 'quality',
      },
    },
    {
      codecId: 'V_VP8',
      config: {
        codec: 'vp8',
        width,
        height,
        bitrate,
        framerate: fps,
        latencyMode: 'quality',
      },
    },
  ];

  for (const candidate of candidates) {
    try {
      const result = await Encoder.isConfigSupported(candidate.config);
      if (result.supported) {
        return { ...candidate, config: result.config || candidate.config };
      }
    } catch {
      // Try the next codec.
    }
  }
  throw new Error('当前浏览器的 WebCodecs 不支持 VP8/VP9 视频编码');
};

export const supportsDeterministicVideo = (): boolean => {
  const scope = window as unknown as {
    VideoEncoder?: VideoEncoderConstructor;
    VideoFrame?: VideoFrameConstructor;
  };
  return Boolean(scope.VideoEncoder && scope.VideoFrame);
};

/**
 * Renders every frame off-line and assigns fixed media timestamps. Rendering
 * may take longer than the video duration, but the downloaded video still
 * plays at an exact, smooth frame cadence.
 */
export const renderDeterministicWebM = async (
  options: DeterministicVideoOptions
): Promise<Blob> => {
  const scope = window as unknown as {
    VideoEncoder?: VideoEncoderConstructor;
    VideoFrame?: VideoFrameConstructor;
  };
  const Encoder = scope.VideoEncoder;
  const Frame = scope.VideoFrame;
  if (!Encoder || !Frame) {
    throw new Error('当前浏览器不支持离线逐帧编码，请使用最新版 Chrome 或 Edge');
  }

  const {
    targetElement,
    durationSeconds,
    fps,
    onFrameStep,
    onFrame,
    onProgress,
    shouldStop,
    shouldCancel,
  } = options;

  const rect = targetElement.getBoundingClientRect();
  if (rect.width < 2 || rect.height < 2) {
    throw new Error('导出画板当前不可见或尺寸为零');
  }

  // Keep the long edge at or below 1920 px to avoid exhausting browser GPU
  // memory while retaining more detail than the on-screen preview.
  const renderScale = Math.max(
    1,
    Math.min(2, 1920 / Math.max(rect.width, rect.height))
  );
  const width = even(rect.width * renderScale);
  const height = even(rect.height * renderScale);
  const totalFrames = Math.max(1, Math.round(durationSeconds * fps));
  const frameDurationUs = Math.round(1_000_000 / fps);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', {
    alpha: false,
    desynchronized: false,
  });
  if (!context) throw new Error('无法初始化离线视频画布');
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';

  if ('fonts' in document) {
    await document.fonts.ready;
  }
  let fontEmbedCSS = '';
  try {
    fontEmbedCSS = await getFontEmbedCSS(targetElement);
  } catch {
    // System fonts remain available even if a remote font stylesheet is blocked.
  }

  const codec = await chooseCodec(Encoder, width, height, fps);
  const encodedFrames: WebMEncodedFrame[] = [];
  let encoderFailure: Error | null = null;
  const encoder = new Encoder({
    output: (chunk) => {
      const data = new Uint8Array(chunk.byteLength);
      chunk.copyTo(data);
      encodedFrames.push({
        data,
        timestampUs: chunk.timestamp,
        durationUs: chunk.duration || frameDurationUs,
        keyFrame: chunk.type === 'key',
      });
    },
    error: (error) => {
      encoderFailure = error instanceof Error ? error : new Error(String(error));
    },
  });

  const previousCaptureFlag = targetElement.getAttribute('data-video-export');
  targetElement.setAttribute('data-video-export', 'true');

  let renderedFrames = 0;
  try {
    encoder.configure(codec.config);
    await nextPaint(2);

    for (let frameIndex = 0; frameIndex < totalFrames; frameIndex += 1) {
      if (shouldCancel?.()) throw new DOMException('视频导出已取消', 'AbortError');
      if (frameIndex > 0 && shouldStop?.()) break;

      const timeSeconds = frameIndex / fps;
      await onFrameStep(frameIndex, totalFrames, timeSeconds);

      // React state commit + CSS/layout paint. CSS transitions are suppressed
      // by [data-video-export="true"] in index.css during this wait.
      await nextPaint(2);

      const captured = await toCanvas(targetElement, {
        pixelRatio: renderScale,
        skipAutoScale: true,
        cacheBust: false,
        backgroundColor: '#000000',
        fontEmbedCSS: fontEmbedCSS || undefined,
      });

      context.fillStyle = '#000000';
      context.fillRect(0, 0, width, height);
      context.drawImage(captured, 0, 0, width, height);

      const timestampUs = Math.round((frameIndex * 1_000_000) / fps);
      const videoFrame = new Frame(canvas, {
        timestamp: timestampUs,
        duration: frameDurationUs,
      });
      encoder.encode(videoFrame, {
        keyFrame: frameIndex === 0 || frameIndex % (fps * 2) === 0,
      });
      videoFrame.close();
      renderedFrames += 1;

      await waitForEncoder(encoder);
      if (encoderFailure) throw encoderFailure;

      const percent = Math.round(((frameIndex + 1) / totalFrames) * 100);
      onFrame?.(frameIndex, totalFrames, timeSeconds);
      onProgress?.(
        `离线逐帧编码 ${percent}% (${frameIndex + 1}/${totalFrames}) · ${width}×${height} · ${fps}FPS`,
        percent
      );
    }

    await encoder.flush();
    if (encoderFailure) throw encoderFailure;
  } finally {
    try {
      encoder.close();
    } catch {
      // Encoder may already be closed after a codec failure.
    }
    if (previousCaptureFlag === null) {
      targetElement.removeAttribute('data-video-export');
    } else {
      targetElement.setAttribute('data-video-export', previousCaptureFlag);
    }
  }

  if (renderedFrames === 0 || encodedFrames.length === 0) {
    throw new Error('视频导出没有生成有效帧');
  }

  const actualDurationMs = Math.round((renderedFrames * 1000) / fps);
  return muxWebM(encodedFrames, {
    width,
    height,
    fps,
    codecId: codec.codecId,
    durationMs: actualDurationMs,
  });
};
