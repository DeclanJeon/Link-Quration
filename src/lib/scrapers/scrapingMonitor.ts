import { ScrapingMetrics, ScrapingResult } from '@/types/scraping';

export class ScrapingMonitor {
  private metrics: ScrapingMetrics = {
    totalRequests: 0,
    successCount: 0,
    failureCount: 0,
    averageLoadTime: 0,
    strategySuccess: {},
    domainStats: {},
  };

  recordRequest(result: ScrapingResult, loadTime: number): void {
    this.metrics.totalRequests++;

    if (result.success) {
      this.metrics.successCount++;
      this.metrics.strategySuccess[result.method] =
        (this.metrics.strategySuccess[result.method] || 0) + 1;
    } else {
      this.metrics.failureCount++;
    }

    this.metrics.averageLoadTime =
      (this.metrics.averageLoadTime * (this.metrics.totalRequests - 1) + loadTime) /
      this.metrics.totalRequests;

    if (!this.metrics.domainStats[result.domain]) {
      this.metrics.domainStats[result.domain] = {
        count: 0,
        successRate: 0,
        avgLoadTime: 0,
      };
    }

    const domainStat = this.metrics.domainStats[result.domain];
    domainStat.count++;
    domainStat.avgLoadTime =
      (domainStat.avgLoadTime * (domainStat.count - 1) + loadTime) / domainStat.count;
    domainStat.successRate = result.success
      ? (domainStat.successRate * (domainStat.count - 1) + 1) / domainStat.count
      : (domainStat.successRate * (domainStat.count - 1)) / domainStat.count;
  }

  getMetrics(): ScrapingMetrics {
    return { ...this.metrics };
  }

  recommendStrategy(domain: string): string {
    const domainStats = this.metrics.domainStats[domain];
    if (!domainStats) return 'Playwright Advanced';

    const strategies = Object.entries(this.metrics.strategySuccess)
      .filter(([strategy]) => strategy.includes(domain))
      .sort(([, a], [, b]) => b - a);

    return strategies[0]?.[0] || 'Playwright Advanced';
  }
}
