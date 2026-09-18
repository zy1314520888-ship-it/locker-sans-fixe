/**
 * Kinetic Worker Bridge
 * Coordinates Web Worker lifecycle, message dispatch, and zero-overhead fallback.
 * Allows font path and geometry vertex computations to run at 60 FPS in background threads.
 */

import { KineticVertexPacket, WorkerComputeRequest } from '../types';
import { computeSingleVertexPacket } from '../workers/kineticVertexWorker';

class KineticWorkerBridge {
  private worker: Worker | null = null;
  private isWorkerSupported = false;
  private pendingRequests = new Map<string, (packet: KineticVertexPacket) => void>();
  private pendingBatchRequests = new Map<string, (packets: KineticVertexPacket[]) => void>();
  private cache = new Map<string, KineticVertexPacket>();

  constructor() {
    this.initWorker();
  }

  private initWorker(): void {
    if (typeof window === 'undefined' || typeof Worker === 'undefined') {
      return;
    }

    try {
      this.worker = new Worker(
        new URL('../workers/kineticVertexWorker.ts', import.meta.url),
        { type: 'module' }
      );

      this.worker.onmessage = (e: MessageEvent) => {
        const { type, packet, packets } = e.data || {};

        if (type === 'VERTEX_COMPUTED' && packet) {
          const resolve = this.pendingRequests.get(packet.id);
          if (resolve) {
            this.pendingRequests.delete(packet.id);
            this.cache.set(packet.id, packet);
            resolve(packet);
          }
        } else if (type === 'BATCH_COMPUTED' && Array.isArray(packets)) {
          const firstId = packets[0]?.id || '';
          const resolve = this.pendingBatchRequests.get(firstId);
          if (resolve) {
            this.pendingBatchRequests.delete(firstId);
            for (const p of packets) {
              this.cache.set(p.id, p);
            }
            resolve(packets);
          }
        }
      };

      this.worker.onerror = (err) => {
        console.warn('Kinetic vertex worker notice (using zero-latency fallback):', err);
        this.isWorkerSupported = false;
      };

      this.isWorkerSupported = true;
    } catch (e) {
      console.warn('Web Worker instantiation notice, continuing with fallback:', e);
      this.isWorkerSupported = false;
    }
  }

  /**
   * Async Worker compute: offloads vertex calculations to background thread
   */
  public computeVertices(req: WorkerComputeRequest): Promise<KineticVertexPacket> {
    const cacheKey = `${req.char}_${req.angle}_${req.viewMode}_${req.width}_${req.height}_${req.tiltX || 0}_${req.tiltY || 0}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return Promise.resolve(cached);
    }

    if (!this.isWorkerSupported || !this.worker) {
      const packet = computeSingleVertexPacket(req);
      this.cache.set(cacheKey, packet);
      return Promise.resolve(packet);
    }

    return new Promise<KineticVertexPacket>((resolve) => {
      const id = `${cacheKey}_${Math.random().toString(36).slice(2, 7)}`;
      this.pendingRequests.set(id, (p) => {
        this.cache.set(cacheKey, p);
        resolve(p);
      });

      this.worker!.postMessage({
        type: 'COMPUTE_VERTEX',
        payload: { ...req, id },
      });

      // Safety timeout in case worker message is dropped
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          const fallbackPacket = computeSingleVertexPacket(req);
          this.cache.set(cacheKey, fallbackPacket);
          resolve(fallbackPacket);
        }
      }, 100);
    });
  }

  /**
   * Batch Worker compute: for whole alphabet matrices or multi-cell posters
   */
  public computeBatchVertices(requests: WorkerComputeRequest[]): Promise<KineticVertexPacket[]> {
    if (requests.length === 0) return Promise.resolve([]);

    if (!this.isWorkerSupported || !this.worker) {
      return Promise.resolve(requests.map(computeSingleVertexPacket));
    }

    return new Promise<KineticVertexPacket[]>((resolve) => {
      const batchId = requests[0].id;
      this.pendingBatchRequests.set(batchId, resolve);

      this.worker!.postMessage({
        type: 'COMPUTE_BATCH',
        payload: requests,
      });

      setTimeout(() => {
        if (this.pendingBatchRequests.has(batchId)) {
          this.pendingBatchRequests.delete(batchId);
          resolve(requests.map(computeSingleVertexPacket));
        }
      }, 200);
    });
  }

  /**
   * Instant Synchronous execution (used when RAF requires immediate 0ms frame response)
   */
  public computeVerticesSync(req: WorkerComputeRequest): KineticVertexPacket {
    return computeSingleVertexPacket(req);
  }
}

export const kineticWorkerBridge = new KineticWorkerBridge();
