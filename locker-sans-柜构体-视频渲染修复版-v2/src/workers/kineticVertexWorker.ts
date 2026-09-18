/**
 * Web Worker: Kinetic Vertex & Path Mesh Compute Engine
 * Handles all geometric vertex calculations, 3D affine matrix decompositions,
 * trapezoid perspective projections, dynamic lighting normals, and 4K scaling
 * off the main thread at 60 FPS.
 */

import { KineticVertexPacket, WorkerComputeRequest } from '../types';

export function computeSingleVertexPacket(req: WorkerComputeRequest): KineticVertexPacket {
  const {
    id,
    char,
    angle,
    viewMode,
    width,
    height,
    tiltX = 0,
    tiltY = 0,
    thickness = 14,
    fov = 650,
  } = req;

  const clampedAngle = Math.max(0, Math.min(85, angle));
  const rad = (clampedAngle * Math.PI) / 180;
  const cosA = Math.cos(rad);
  const sinA = Math.sin(rad);

  const halfH = height / 2;
  const is3D = viewMode === 'perspective3d' || viewMode === 'pure-glyph-3d';

  // Light source position vector (normalized, top-left-front)
  const lx = -0.42;
  const ly = -0.58;
  const lz = 0.69;

  let doorQuad: [number, number, number, number, number, number, number, number];
  let bevelQuad: [number, number, number, number, number, number, number, number];
  let shadowQuad: [number, number, number, number, number, number, number, number];
  let affineMatrix: [number, number, number, number, number, number];
  let lighting: [number, number, number, number, number];
  let projectedW = Math.max(2, width * cosA);
  let foreshorteningDeltaY = 0;

  if (is3D) {
    // 3D Perspective Trapezoid Projection
    const zDepth = width * sinA;
    // Perspective convergence delta
    foreshorteningDeltaY = (zDepth / fov) * (halfH * 0.42);

    // Apply 3D Camera Orbit Skew (tiltX, tiltY)
    const pitchRad = (tiltX * Math.PI) / 180;
    const yawRad = (tiltY * Math.PI) / 180;
    const pitchOffset = Math.sin(pitchRad) * (halfH * 0.2);
    const yawScale = Math.cos(yawRad);

    const p0x = 0;
    const p0y = halfH + pitchOffset;

    const p1x = projectedW * yawScale;
    const p1y = halfH - foreshorteningDeltaY + pitchOffset;

    const p2x = projectedW * yawScale;
    const p2y = height + foreshorteningDeltaY - pitchOffset;

    const p3x = 0;
    const p3y = height - pitchOffset;

    doorQuad = [p0x, p0y, p1x, p1y, p2x, p2y, p3x, p3y];

    // 3D Extrusion Bevel (Door Thickness)
    const edgeT = Math.max(1, thickness * sinA);
    bevelQuad = [
      p1x,
      p1y,
      p1x + edgeT,
      p1y + pitchOffset * 0.3,
      p2x + edgeT,
      p2y - pitchOffset * 0.3,
      p2x,
      p2y,
    ];

    // Interior Occlusion Drop Shadow
    shadowQuad = [p1x, halfH, width, halfH, width, height, p2x, height];

    // Affine Transform matrix [a, b, c, d, e, f]
    // Maps [0, 0, width, halfH] to the trapezoid quad
    const scaleFactorX = Math.max(0.01, (projectedW * yawScale) / width);
    const shearY = -foreshorteningDeltaY / width;
    const scaleFactorY = (halfH + 2 * foreshorteningDeltaY) / halfH;
    affineMatrix = [
      scaleFactorX,
      shearY,
      0,
      scaleFactorY,
      p0x,
      p0y,
    ];

    // Compute Face Normal for Lighting: cross product of door vectors
    const v1x = p1x - p0x;
    const v1y = p1y - p0y;
    const v1z = zDepth;

    const v2x = p3x - p0x;
    const v2y = p3y - p0y;
    const v2z = 0;

    // Normal = V1 x V2
    let nx = v1y * v2z - v1z * v2y;
    let ny = v1z * v2x - v1x * v2z;
    let nz = v1x * v2y - v1y * v2x;
    const len = Math.hypot(nx, ny, nz) || 1;
    nx /= len;
    ny /= len;
    nz /= len;

    // Diffuse & Specular (Phong model)
    const dotNL = Math.max(0, nx * lx + ny * ly + nz * lz);
    const diffuse = 0.45 + 0.55 * dotNL;
    const specular = Math.pow(dotNL, 16) * 0.4;

    lighting = [nx, ny, nz, diffuse, specular];
  } else {
    // 2D Orthographic Kinetic Projection
    doorQuad = [
      0,
      halfH,
      projectedW,
      halfH,
      projectedW,
      height,
      0,
      height,
    ];

    const edgeT = Math.max(1, 5 * sinA);
    bevelQuad = [
      projectedW,
      halfH,
      projectedW + edgeT,
      halfH,
      projectedW + edgeT,
      height,
      projectedW,
      height,
    ];

    shadowQuad = [
      projectedW,
      halfH,
      width,
      halfH,
      width,
      height,
      projectedW,
      height,
    ];

    const scaleFactorX = Math.max(0.015, cosA);
    affineMatrix = [scaleFactorX, 0, 0, 1, 0, halfH];

    const diffuse = 0.7 + 0.3 * cosA;
    lighting = [0, 0, 1, diffuse, 0.1];
  }

  return {
    id,
    char,
    angle: clampedAngle,
    viewMode,
    width,
    height,
    doorQuad,
    bevelQuad,
    shadowQuad,
    affineMatrix,
    lighting,
    metrics: {
      cosAngle: cosA,
      sinAngle: sinA,
      projectedWidth: projectedW,
      compressionRatio: cosA,
      foreshorteningDeltaY,
    },
  };
}

// Web Worker message listener (self)
if (typeof self !== 'undefined' && 'onmessage' in self) {
  self.onmessage = (e: MessageEvent) => {
    const { type, payload } = e.data || {};

    if (type === 'COMPUTE_VERTEX') {
      const packet = computeSingleVertexPacket(payload as WorkerComputeRequest);
      self.postMessage({ type: 'VERTEX_COMPUTED', packet });
    } else if (type === 'COMPUTE_BATCH') {
      const requests = payload as WorkerComputeRequest[];
      const packets = requests.map(computeSingleVertexPacket);
      self.postMessage({ type: 'BATCH_COMPUTED', packets });
    }
  };
}
