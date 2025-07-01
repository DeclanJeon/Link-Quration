import { Browser, chromium } from 'playwright-core';

export class BrowserPool {
  private pool: Browser[] = [];
  private maxSize: number;
  private inUse: Set<Browser> = new Set();

  constructor(maxSize = 5) {
    this.maxSize = maxSize;
  }

  async acquire(): Promise<Browser> {
    const available = this.pool.find((b) => !this.inUse.has(b));

    if (available) {
      this.inUse.add(available);
      return available;
    }

    if (this.pool.length < this.maxSize) {
      const browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-web-security',
          '--disable-features=IsolateOrigins',
          '--disable-site-isolation-trials',
          '--disable-blink-features=AutomationControlled',
        ],
      });

      this.pool.push(browser);
      this.inUse.add(browser);
      return browser;
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
    return this.acquire();
  }

  release(browser: Browser): void {
    this.inUse.delete(browser);
  }

  async closeAll(): Promise<void> {
    await Promise.all(this.pool.map((b) => b.close()));
    this.pool = [];
    this.inUse.clear();
  }
}
