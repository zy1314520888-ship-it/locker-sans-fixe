export type ViewMode =
  | 'orthographic'
  | 'perspective3d'
  | 'pure-glyph'
  | 'pure-glyph-3d'
  | 'blueprint'
  | 'wireframe';

export type VisualTheme = 'dark-industrial' | 'brutalist-mono' | 'safety-yellow' | 'clean-white';

export interface GlyphAnatomy {
  char: string;
  name: string;
  upperFeature: string;
  lowerFeature: string;
  kineticEffect: string;
  symmetryChange: string;
}

export interface LockerDoorState {
  id: string;
  char: string;
  angle: number; // 0 to 80 degrees
  isOpen: boolean;
  boxNumber?: string;
  hasItem?: boolean;
}

export interface PosterConfig {
  headline: string;
  subheadline: string;
  pickupCode: string;
  lockerRows: number;
  lockerCols: number;
  theme: VisualTheme;
  showGridLines: boolean;
  showLockerNumbers: boolean;
  showDotMatrixTexture: boolean;
}

export interface KineticVertexPacket {
  id: string;
  char: string;
  angle: number;
  viewMode: ViewMode;
  width: number;
  height: number;
  doorQuad: [number, number, number, number, number, number, number, number];
  bevelQuad: [number, number, number, number, number, number, number, number];
  shadowQuad: [number, number, number, number, number, number, number, number];
  affineMatrix: [number, number, number, number, number, number];
  lighting: [number, number, number, number, number];
  metrics: {
    cosAngle: number;
    sinAngle: number;
    projectedWidth: number;
    compressionRatio: number;
    foreshorteningDeltaY: number;
  };
}

export interface WorkerComputeRequest {
  id: string;
  char: string;
  angle: number;
  viewMode: ViewMode;
  width: number;
  height: number;
  tiltX?: number;
  tiltY?: number;
  thickness?: number;
  fov?: number;
}
