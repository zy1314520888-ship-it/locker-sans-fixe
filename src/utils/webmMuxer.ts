/**
 * Minimal WebM muxer for WebCodecs VP8/VP9 output.
 *
 * The browser encoder gives us correctly timed compressed frames, but not a
 * downloadable container. This module wraps those frames in a standards-based
 * WebM file without relying on a network-loaded runtime dependency.
 */

export interface WebMEncodedFrame {
  data: Uint8Array;
  timestampUs: number;
  durationUs: number;
  keyFrame: boolean;
}

export interface WebMMuxOptions {
  width: number;
  height: number;
  fps: number;
  codecId: 'V_VP8' | 'V_VP9';
  durationMs: number;
}

const concatBytes = (...parts: Uint8Array[]): Uint8Array => {
  const length = parts.reduce((sum, part) => sum + part.byteLength, 0);
  const output = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.byteLength;
  }
  return output;
};

const encodeId = (value: number): Uint8Array => {
  const bytes: number[] = [];
  let cursor = value;
  while (cursor > 0) {
    bytes.unshift(cursor & 0xff);
    cursor = Math.floor(cursor / 256);
  }
  return new Uint8Array(bytes);
};

const encodeVint = (value: number): Uint8Array => {
  const n = BigInt(value);
  for (let length = 1; length <= 8; length += 1) {
    const max = (1n << BigInt(length * 7)) - 2n;
    if (n <= max) {
      const output = new Uint8Array(length);
      let cursor = n;
      for (let index = length - 1; index >= 0; index -= 1) {
        output[index] = Number(cursor & 0xffn);
        cursor >>= 8n;
      }
      output[0] |= 1 << (8 - length);
      return output;
    }
  }
  throw new Error('WebM 元素尺寸超出支持范围');
};

const encodeUnsigned = (value: number): Uint8Array => {
  let cursor = BigInt(Math.max(0, Math.round(value)));
  const bytes: number[] = [Number(cursor & 0xffn)];
  cursor >>= 8n;
  while (cursor > 0n) {
    bytes.unshift(Number(cursor & 0xffn));
    cursor >>= 8n;
  }
  return new Uint8Array(bytes);
};

const encodeFloat64 = (value: number): Uint8Array => {
  const output = new Uint8Array(8);
  new DataView(output.buffer).setFloat64(0, value, false);
  return output;
};

const encodeString = (value: string): Uint8Array => new TextEncoder().encode(value);

const element = (id: number, payload: Uint8Array): Uint8Array =>
  concatBytes(encodeId(id), encodeVint(payload.byteLength), payload);

const uintElement = (id: number, value: number): Uint8Array =>
  element(id, encodeUnsigned(value));

const stringElement = (id: number, value: string): Uint8Array =>
  element(id, encodeString(value));

const masterElement = (id: number, ...children: Uint8Array[]): Uint8Array =>
  element(id, concatBytes(...children));

const simpleBlock = (
  relativeTimeMs: number,
  frame: WebMEncodedFrame
): Uint8Array => {
  const header = new Uint8Array(4);
  header[0] = 0x81; // Track number 1 as an EBML variable integer.
  new DataView(header.buffer).setInt16(1, relativeTimeMs, false);
  header[3] = frame.keyFrame ? 0x80 : 0x00;
  return element(0xa3, concatBytes(header, frame.data));
};

/** Creates a seek-free WebM stream with one video track. */
export const muxWebM = (
  inputFrames: WebMEncodedFrame[],
  options: WebMMuxOptions
): Blob => {
  if (inputFrames.length === 0) {
    throw new Error('没有可写入视频的编码帧');
  }

  const frames = [...inputFrames].sort((a, b) => a.timestampUs - b.timestampUs);

  const ebmlHeader = masterElement(
    0x1a45dfa3,
    uintElement(0x4286, 1),
    uintElement(0x42f7, 1),
    uintElement(0x42f2, 4),
    uintElement(0x42f3, 8),
    stringElement(0x4282, 'webm'),
    uintElement(0x4287, 2),
    uintElement(0x4285, 2)
  );

  const info = masterElement(
    0x1549a966,
    uintElement(0x2ad7b1, 1_000_000), // One timecode unit = 1 ms.
    element(0x4489, encodeFloat64(options.durationMs)),
    stringElement(0x4d80, 'Locker Sans Deterministic Exporter'),
    stringElement(0x5741, 'Locker Sans WebCodecs')
  );

  const videoTrack = masterElement(
    0xae,
    uintElement(0xd7, 1),
    uintElement(0x73c5, 1),
    uintElement(0x83, 1),
    uintElement(0x9c, 0),
    uintElement(0x23e383, Math.round(1_000_000_000 / options.fps)),
    stringElement(0x86, options.codecId),
    masterElement(
      0xe0,
      uintElement(0xb0, options.width),
      uintElement(0xba, options.height),
      element(0x2383e3, encodeFloat64(options.fps))
    )
  );
  const tracks = masterElement(0x1654ae6b, videoTrack);

  const clusters: Uint8Array[] = [];
  let clusterStartMs = -1;
  let clusterBlocks: Uint8Array[] = [];

  const flushCluster = () => {
    if (clusterStartMs < 0 || clusterBlocks.length === 0) return;
    clusters.push(
      masterElement(
        0x1f43b675,
        uintElement(0xe7, clusterStartMs),
        ...clusterBlocks
      )
    );
    clusterBlocks = [];
  };

  for (const frame of frames) {
    const timeMs = Math.round(frame.timestampUs / 1000);
    if (clusterStartMs < 0 || timeMs - clusterStartMs > 30_000) {
      flushCluster();
      clusterStartMs = timeMs;
    }
    clusterBlocks.push(simpleBlock(timeMs - clusterStartMs, frame));
  }
  flushCluster();

  // An unknown-size Segment lets us emit a valid seek-free file in one pass.
  const segmentId = encodeId(0x18538067);
  const unknownSegmentSize = new Uint8Array([
    0x01, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
  ]);
  const file = concatBytes(
    ebmlHeader,
    segmentId,
    unknownSegmentSize,
    info,
    tracks,
    ...clusters
  );

  // Copy into a concrete ArrayBuffer so TypeScript does not widen the backing
  // store to SharedArrayBuffer under the ES2022 typed-array definitions.
  const blobBuffer = new ArrayBuffer(file.byteLength);
  new Uint8Array(blobBuffer).set(file);
  return new Blob([blobBuffer], { type: 'video/webm' });
};
