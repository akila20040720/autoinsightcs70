// src/services/scrapeStreamService.ts

const SSE_URL = `${import.meta.env.VITE_API_BASE_URL ?? ''}/api/stream`;

export type ScrapeEvent =
  | { type: 'scrape_started'; cycle: number; ts: number }
  | { type: 'scrape_done';    cycle: number; ts: number; duration: number; result: unknown }
  | { type: 'scrape_error';   cycle: number; ts: number; error: string }
  | { type: 'connected' };

export type ScrapeEventListener = (event: ScrapeEvent) => void;

class ScrapeStream {
  private es: EventSource | null = null;
  private listeners = new Set<ScrapeEventListener>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private stopped = false;

  /** Subscribe to scrape lifecycle events. Returns an unsubscribe fn. */
  subscribe(listener: ScrapeEventListener): () => void {
    this.listeners.add(listener);
    if (this.es === null) this.connect();
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) this.disconnect();
    };
  }

  private connect(): void {
    this.stopped = false;
    this.es = new EventSource(SSE_URL);

    const handle = (type: ScrapeEvent['type']) => (raw: MessageEvent) => {
      let data: unknown;
      try { data = JSON.parse(raw.data as string); } catch { data = {}; }
      this.emit({ type, ...(data as object) } as ScrapeEvent);
    };

    this.es.addEventListener('connected',      handle('connected'));
    this.es.addEventListener('scrape_started', handle('scrape_started'));
    this.es.addEventListener('scrape_done',    handle('scrape_done'));
    this.es.addEventListener('scrape_error',   handle('scrape_error'));

    this.es.onerror = () => {
      this.es?.close();
      this.es = null;
      if (!this.stopped && this.listeners.size > 0) {
        // Exponential-ish back-off capped at 10 s
        this.reconnectTimer = setTimeout(() => this.connect(), 3_000);
      }
    };
  }

  private disconnect(): void {
    this.stopped = true;
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.es?.close();
    this.es = null;
  }

  private emit(event: ScrapeEvent): void {
    for (const listener of this.listeners) {
      try { listener(event); } catch { /* never crash the stream */ }
    }
  }
}

// Singleton — one SSE connection shared across the whole app
export const scrapeStream = new ScrapeStream();