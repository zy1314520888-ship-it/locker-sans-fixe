/**
 * Utility for exporting Locker Sans pure glyphs as sharp, standard SVG vector graphics.
 */

export interface SvgGlyphOptions {
  char: string;
  angle: number;
  is3D?: boolean;
  fontFamily?: string;
  color?: string;
  backgroundColor?: string;
}

export function generateLetterSvg({
  char,
  angle,
  is3D = false,
  fontFamily = 'Impact, sans-serif',
  color = '#ffffff',
  backgroundColor = 'transparent',
}: SvgGlyphOptions): string {
  const rad = (angle * Math.PI) / 180;
  const cosVal = Math.cos(rad);
  const transformStyle = is3D
    ? `transform-origin: 0px 120px; transform: perspective(650px) rotateY(-${angle}deg);`
    : `transform-origin: 0px 120px; transform: scaleX(${cosVal.toFixed(4)});`;

  const bgRect = backgroundColor !== 'transparent'
    ? `<rect width="200" height="240" fill="${backgroundColor}" />`
    : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 240" width="200" height="240" shape-rendering="geometricPrecision" text-rendering="geometricPrecision">
  <defs>
    <clipPath id="upper-cut-${char}">
      <rect x="0" y="0" width="200" height="120" />
    </clipPath>
    <clipPath id="lower-cut-${char}">
      <rect x="0" y="120" width="200" height="120" />
    </clipPath>
  </defs>
  ${bgRect}
  <!-- Static Upper Half -->
  <g clip-path="url(#upper-cut-${char})">
    <text
      x="100"
      y="180"
      text-anchor="middle"
      fill="${color}"
      font-family="${fontFamily}"
      font-size="180"
      font-weight="900"
      letter-spacing="-0.03em"
    >${char}</text>
  </g>
  <!-- Kinetic Lower Half (Hinged at x=0) -->
  <g clip-path="url(#lower-cut-${char})" style="${transformStyle}">
    <text
      x="100"
      y="180"
      text-anchor="middle"
      fill="${color}"
      font-family="${fontFamily}"
      font-size="180"
      font-weight="900"
      letter-spacing="-0.03em"
    >${char}</text>
  </g>
</svg>`;
}

export function downloadSvgFile(filename: string, svgContent: string) {
  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.svg') ? filename : `${filename}.svg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function generateAlphabetSvgSheet({
  characters,
  angles,
  is3D = false,
  fontFamily = 'Impact, sans-serif',
  color = '#ffffff',
  backgroundColor = '#0b0c0e',
}: {
  characters: string[];
  angles: Record<string, number>;
  is3D?: boolean;
  fontFamily?: string;
  color?: string;
  backgroundColor?: string;
}): string {
  const cols = 9;
  const rows = Math.ceil(characters.length / cols);
  const cellW = 120;
  const cellH = 150;
  const padX = 24;
  const padY = 32;
  const totalW = padX * 2 + cols * cellW;
  const totalH = padY * 2 + rows * cellH + 60; // Extra room for header

  let content = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalW} ${totalH}" width="${totalW}" height="${totalH}" shape-rendering="geometricPrecision" text-rendering="geometricPrecision">
  <rect width="${totalW}" height="${totalH}" fill="${backgroundColor}" />
  <text x="${padX}" y="${padY + 16}" fill="#f59e0b" font-family="monospace" font-size="14" font-weight="bold">LOCKER SANS - PURE VECTOR GLYPH SPECIMEN (${is3D ? '3D FRONT PERSPECTIVE' : '2D ORTHOGRAPHIC'})</text>
  <defs>`;

  characters.forEach((char) => {
    content += `
    <clipPath id="sheet-upper-${char}">
      <rect x="0" y="0" width="${cellW}" height="${cellH / 2}" />
    </clipPath>
    <clipPath id="sheet-lower-${char}">
      <rect x="0" y="${cellH / 2}" width="${cellW}" height="${cellH / 2}" />
    </clipPath>`;
  });

  content += `\n  </defs>\n  <g transform="translate(${padX}, ${padY + 40})">`;

  characters.forEach((char, idx) => {
    const c = idx % cols;
    const r = Math.floor(idx / cols);
    const x = c * cellW;
    const y = r * cellH;
    const angle = angles[char] ?? 45;
    const rad = (angle * Math.PI) / 180;
    const cosVal = Math.cos(rad);
    const transformStyle = is3D
      ? `transform-origin: 0px ${cellH / 2}px; transform: perspective(650px) rotateY(-${angle}deg);`
      : `transform-origin: 0px ${cellH / 2}px; transform: scaleX(${cosVal.toFixed(4)});`;

    content += `
    <g transform="translate(${x}, ${y})">
      <!-- Upper -->
      <g clip-path="url(#sheet-upper-${char})">
        <text x="${cellW / 2}" y="${cellH * 0.78}" text-anchor="middle" fill="${color}" font-family="${fontFamily}" font-size="100" font-weight="900">${char}</text>
      </g>
      <!-- Lower -->
      <g clip-path="url(#sheet-lower-${char})" style="${transformStyle}">
        <text x="${cellW / 2}" y="${cellH * 0.78}" text-anchor="middle" fill="${color}" font-family="${fontFamily}" font-size="100" font-weight="900">${char}</text>
      </g>
      <!-- Info tag -->
      <text x="${cellW / 2}" y="${cellH - 4}" text-anchor="middle" fill="#71717a" font-family="monospace" font-size="10">${Math.round(angle)}° (${Math.round(cosVal * 100)}%)</text>
    </g>`;
  });

  content += `\n  </g>\n</svg>`;
  return content;
}
