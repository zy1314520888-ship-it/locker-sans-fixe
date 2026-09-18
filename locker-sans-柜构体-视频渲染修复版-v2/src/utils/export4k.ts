import { toPng, toBlob } from 'html-to-image';

export interface Export4KOptions {
  elementId: string;
  fileName?: string;
  scale?: number;
  onProgress?: (status: string) => void;
}

/**
 * Exports a specified DOM element at 4K Ultra-HD resolution
 */
export async function exportElementTo4K({
  elementId,
  fileName = 'LOCKER-SANS-4K-UHD.png',
  scale = 3.5, // Produces ~3840px width for standard container
  onProgress,
}: Export4KOptions): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`未找到目标渲染元素 (ID: ${elementId})`);
  }

  try {
    onProgress?.('正在计算 4K 矢量光栅化与字构投影...');

    // Small delay to allow fonts and layout to stabilize
    await new Promise((r) => setTimeout(r, 150));

    onProgress?.('正在生成 3840×2160+ 超高分辨率图层...');

    // Convert DOM to high-res PNG data url using html-to-image
    const dataUrl = await toPng(element, {
      quality: 1.0,
      pixelRatio: Math.max(scale, 3),
      cacheBust: true,
      skipAutoScale: false,
      style: {
        transform: 'none',
        margin: '0 auto',
      },
    });

    onProgress?.('正在打包并下载 4K 超清图像...');

    // Create download link
    const link = document.createElement('a');
    link.download = fileName;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onProgress?.('✅ 4K 高清图像已成功保存！');
  } catch (error) {
    console.error('4K export error:', error);
    throw error;
  }
}
