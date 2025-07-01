// src/lib/scrapers/multi-strategy-scraper.ts
import { chromium, Browser, Page, BrowserContext } from 'playwright';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { createHash } from 'crypto';
import { ContentQuality, ScrapingMetrics, ScrapingOptions, ScrapingResult } from '@/types/scraping';
import { ScrapingError } from './scrapingError';
import { BrowserPool } from './browserPool';
import { ScrapingMonitor } from './scrapingMonitor';
import { ImageEnhancementStrategy } from './imageEnhancementStrategy';

// ===== 메인 스크래퍼 클래스 =====
export class MultiStrategyScraper {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private browserPool = new BrowserPool(5);
  private monitor = new ScrapingMonitor();
  private imageEnhancer = new ImageEnhancementStrategy();

  // 캐시 시스템
  private cache = new Map<string, ScrapingResult>();
  private cacheTimeout = 1000 * 60 * 30; // 30분

  // User Agent 풀
  private userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14.1.2) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
  ];

  // 프록시 풀 (실제 사용시 유효한 프록시로 교체 필요)
  private proxyServers = [
    // 'http://proxy1.example.com:8080',
    // 'http://proxy2.example.com:8080',
  ];

  constructor() {
    process.on('SIGINT', () => this.cleanup());
    process.on('SIGTERM', () => this.cleanup());
  }

  async scrapeContent(url: string, options: ScrapingOptions = {}): Promise<ScrapingResult> {
    console.log(`🔍 다중 전략 스크래핑 시작: ${url}`);

    // 캐시 확인
    const cacheKey = this.getCacheKey(url, options);
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      console.log('✅ 캐시에서 결과 반환');
      return cached;
    }

    // 도메인별 추천 전략 확인
    const domain = this.extractDomain(url);
    const recommendedStrategy = this.monitor.recommendStrategy(domain);
    console.log(`📊 추천 전략: ${recommendedStrategy}`);

    // 미디어 타입 감지
    const mediaType = this.detectMediaType(url);

    // 전략 리스트 (우선순위 순)
    const strategies = [
      () => this.aiContentExtractionStrategy(url, options),
      () => this.playwrightAdvancedStrategy(url, options),
      () => this.playwrightStealthStrategy(url, options),
      () => this.cheerioEnhancedStrategy(url),
      () => this.proxyRotationStrategy(url, options),
      () => this.cloudflareBypassStrategy(url, options),
      () => this.apiEndpointStrategy(url),
    ];

    let lastError: Error | null = null;
    let result: ScrapingResult | null = null;

    const maxRetries = options.retryCount || 1;

    for (let retry = 0; retry < maxRetries; retry++) {
      for (const [index, strategy] of strategies.entries()) {
        try {
          console.log(
            `🔧 전략 ${index + 1}/${strategies.length} 시도 중... (재시도: ${retry + 1}/${maxRetries})`,
          );

          const strategyStartTime = Date.now();
          result = await strategy();

          if (result && result.title && result.content) {
            const loadTime = Date.now() - strategyStartTime;
            console.log(`✅ 성공! 소요시간: ${loadTime}ms`);

            // 콘텐츠 품질 평가
            result.contentQuality = this.evaluateContentQuality(result);

            // 모니터링 기록
            this.monitor.recordRequest(result, loadTime);

            // 캐시 저장
            this.saveToCache(cacheKey, result);

            return result;
          }
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          console.warn(`❌ 전략 실패:`, lastError.message);

          // 에러 처리 및 복구 시도
          const recoveryResult = await this.handleScrapingError(lastError, url);
          if (recoveryResult) {
            return recoveryResult;
          }

          await this.delay(1000 * (retry + 1));
        }
      }
    }

    throw new Error(
      `모든 스크래핑 전략이 실패했습니다. 마지막 오류: ${lastError?.message || 'Unknown error'}`,
    );
  }

  // 병렬 스크래핑 지원
  async scrapeMultiple(urls: string[], options: ScrapingOptions = {}): Promise<ScrapingResult[]> {
    const concurrency = options.concurrency || 3;
    const results: ScrapingResult[] = [];

    const queue = [...urls];
    const workers = Array(concurrency)
      .fill(null)
      .map(async () => {
        while (queue.length > 0) {
          const url = queue.shift();
          if (!url) break;

          try {
            const result = await this.scrapeContent(url, options);
            results.push(result);
          } catch (error) {
            results.push({
              url,
              title: 'Error',
              content: '',
              textContent: '',
              excerpt: '',
              author: null,
              datePublished: null,
              leadImageUrl: null,
              domain: this.extractDomain(url),
              wordCount: 0,
              readingTime: '0분',
              success: false,
              method: 'Failed',
              mediaType: 'text',
              error: error instanceof Error ? error.message : 'Unknown error',
            } as ScrapingResult);
          }
        }
      });

    await Promise.all(workers);
    return results;
  }

  // 전략 1: AI 기반 콘텐츠 추출
  private async aiContentExtractionStrategy(
    url: string,
    options: ScrapingOptions,
  ): Promise<ScrapingResult> {
    const page = await this.getPage(options);

    try {
      await page.goto(url, { waitUntil: 'networkidle' });

      const screenshot = await page.screenshot({ fullPage: true });

      const domStructure = await page.evaluate(() => {
        const analyzeElement = (el: Element, depth = 0): any => {
          if (depth > 5) return null;

          const rect = el.getBoundingClientRect();
          const styles = window.getComputedStyle(el);

          return {
            tag: el.tagName.toLowerCase(),
            className: el.className,
            textLength: el.textContent?.length || 0,
            childCount: el.children.length,
            position: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
            fontSize: parseInt(styles.fontSize),
            fontWeight: styles.fontWeight,
            display: styles.display,
            children: Array.from(el.children)
              .map((child) => analyzeElement(child, depth + 1))
              .filter(Boolean),
          };
        };

        return analyzeElement(document.body);
      });

      const contentArea = this.predictContentArea(domStructure);

      const extractedData = await page.evaluate((selector) => {
        const element = document.querySelector(selector);
        return {
          content: element?.textContent || '',
          html: element?.innerHTML || '',
        };
      }, contentArea.selector);

      // 향상된 이미지 추출
      const enhancedImage = await this.imageEnhancer.extractHighQualityImage(
        page,
        url,
        options.imageQuality || 'high',
      );

      // 다중 포맷 이미지 생성
      let multiFormatImages;
      if (enhancedImage?.enhancedUrl) {
        const imageBuffer = Buffer.from(enhancedImage.enhancedUrl.split(',')[1], 'base64');
        multiFormatImages = await this.imageEnhancer.generateMultipleFormats(imageBuffer);
      }

      return {
        title: await page.title(),
        content: extractedData.html,
        textContent: extractedData.content,
        excerpt: extractedData.content.substring(0, 300) + '...',
        author: null,
        datePublished: null,
        leadImageUrl: enhancedImage?.enhancedUrl || null,
        url,
        domain: this.extractDomain(url),
        wordCount: extractedData.content.split(/\s+/).filter(Boolean).length,
        readingTime: this.calculateReadingTime(
          extractedData.content.split(/\s+/).filter(Boolean).length,
        ),
        success: true,
        method: 'AI Content Extraction',
        mediaType: this.detectMediaType(url),
        imageMetadata: enhancedImage
          ? {
              width: enhancedImage.width,
              height: enhancedImage.height,
              format: enhancedImage.format,
              quality: enhancedImage.quality,
              fileSize: enhancedImage.fileSize,
            }
          : undefined,
        multiFormatImages,
      };
    } catch (error) {
      throw new Error(`AI 콘텐츠 추출 실패: ${error}`);
    } finally {
      await page.goto('about:blank');
    }
  }

  // [추론] ML 모델 기반 콘텐츠 영역 예측
  private predictContentArea(domStructure: any): { selector: string; confidence: number } {
    const candidates: Array<{ selector: string; score: number }> = [];

    const analyze = (node: any, path: string = '') => {
      if (!node) return;

      const currentPath = path ? `${path} > ${node.tag}` : node.tag;

      let score = 0;

      if (node.textLength > 500) score += 30;
      if (node.textLength > 1000) score += 20;

      if (node.position.x > 100 && node.position.x < 500) score += 10;

      if (node.fontSize >= 14 && node.fontSize <= 18) score += 15;

      if (node.childCount > 3 && node.childCount < 20) score += 10;

      candidates.push({ selector: currentPath, score });

      node.children?.forEach((child: any) => analyze(child, currentPath));
    };

    analyze(domStructure);

    const best = candidates.sort((a, b) => b.score - a.score)[0];

    return {
      selector: best?.selector || 'body',
      confidence: (best?.score || 0) / 100,
    };
  }

  // 전략 2: Playwright 고급 전략
  private async playwrightAdvancedStrategy(
    url: string,
    options: ScrapingOptions,
  ): Promise<ScrapingResult> {
    const page = await this.getPage(options);

    try {
      if (options.blockResources?.length) {
        await page.route('**/*', (route) => {
          const resourceType = route.request().resourceType();
          if (options.blockResources?.includes(resourceType)) {
            route.abort();
          } else {
            route.continue();
          }
        });
      }

      const startTime = Date.now();
      let resourceCount = 0;
      let totalSize = 0;

      page.on('response', (response) => {
        resourceCount++;
        const headers = response.headers();
        if (headers['content-length']) {
          totalSize += parseInt(headers['content-length'], 10);
        }
      });

      const response = await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: options.timeout || 30000,
      });

      if (!response) {
        throw new Error('페이지 로드 실패');
      }

      if (options.waitForSelector) {
        await page
          .waitForSelector(options.waitForSelector, {
            timeout: 10000,
          })
          .catch(() => console.warn('선택자 대기 시간 초과'));
      }

      if (options.scrollToBottom) {
        await this.autoScroll(page);
      }

      await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

      // 향상된 이미지 추출
      const enhancedImage = await this.imageEnhancer.extractHighQualityImage(
        page,
        url,
        options.imageQuality || 'high',
      );

      // 다중 포맷 이미지 생성
      let multiFormatImages;
      if (enhancedImage?.enhancedUrl) {
        const imageBuffer = Buffer.from(enhancedImage.enhancedUrl.split(',')[1], 'base64');
        multiFormatImages = await this.imageEnhancer.generateMultipleFormats(imageBuffer);
      }

      const extractedData = await page.evaluate(() => {
        const getMetaContent = (selectors: string[]): string | null => {
          for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
              const content = element.getAttribute('content') || element.getAttribute('value');
              if (content?.trim()) return content.trim();
            }
          }
          return null;
        };

        const openGraph: Record<string, string> = {};
        document.querySelectorAll('meta[property^="og:"]').forEach((meta) => {
          const property = meta.getAttribute('property');
          const content = meta.getAttribute('content');
          if (property && content) {
            openGraph[property.replace('og:', '')] = content;
          }
        });

        const twitterCard: Record<string, string> = {};
        document.querySelectorAll('meta[name^="twitter:"]').forEach((meta) => {
          const name = meta.getAttribute('name');
          const content = meta.getAttribute('content');
          if (name && content) {
            twitterCard[name.replace('twitter:', '')] = content;
          }
        });

        const jsonLdScripts = Array.from(
          document.querySelectorAll('script[type="application/ld+json"]'),
        );
        const jsonLd = jsonLdScripts
          .map((script) => {
            try {
              return JSON.parse(script.textContent || '{}');
            } catch {
              return null;
            }
          })
          .filter(Boolean);

        const language =
          document.documentElement.lang ||
          getMetaContent(['meta[property="og:locale"]', 'meta[name="language"]']) ||
          'en';

        const keywordsContent = getMetaContent(['meta[name="keywords"]']);
        const keywords = keywordsContent
          ? keywordsContent
              .split(',')
              .map((k) => k.trim())
              .filter(Boolean)
          : [];

        const favicon =
          document.querySelector<HTMLLinkElement>('link[rel="icon"]')?.href ||
          document.querySelector<HTMLLinkElement>('link[rel="shortcut icon"]')?.href ||
          '/favicon.ico';

        const siteName =
          getMetaContent(['meta[property="og:site_name"]']) ||
          document.querySelector<HTMLMetaElement>('meta[name="application-name"]')?.content ||
          null;

        const contentSelectors = [
          'article[role="main"]',
          'main article',
          'article',
          '[role="main"]',
          'main',
          '.article-content',
          '.post-content',
          '.entry-content',
          '.content-body',
          '.story-body',
          '#main-content',
          '.main-content',
          '[itemprop="articleBody"]',
        ];

        let mainContent = '';
        for (const selector of contentSelectors) {
          const element = document.querySelector(selector);
          if (element) {
            const clone = element.cloneNode(true) as HTMLElement;
            clone
              .querySelectorAll(
                'script, style, nav, header, footer, aside, .ad, .advertisement, .sidebar, .related-posts, .comments',
              )
              .forEach((el) => el.remove());

            mainContent = clone.textContent?.trim() || '';
            if (mainContent.length > 100) break;
          }
        }

        if (!mainContent || mainContent.length < 100) {
          const bodyClone = document.body.cloneNode(true) as HTMLElement;
          bodyClone
            .querySelectorAll('script, style, nav, header, footer, aside')
            .forEach((el) => el.remove());
          mainContent = bodyClone.textContent?.trim() || '';
        }

        const title =
          openGraph.title ||
          twitterCard.title ||
          document.title ||
          document.querySelector('h1')?.textContent?.trim() ||
          'Untitled';

        const description =
          openGraph.description ||
          twitterCard.description ||
          getMetaContent(['meta[name="description"]']) ||
          '';

        const author =
          getMetaContent([
            'meta[name="author"]',
            'meta[property="article:author"]',
            'meta[name="article:author"]',
          ]) ||
          jsonLd.find((item: any) => item.author)?.author?.name ||
          null;

        const datePublished =
          getMetaContent([
            'meta[property="article:published_time"]',
            'meta[name="publish_date"]',
            'meta[name="date"]',
          ]) ||
          jsonLd.find((item: any) => item.datePublished)?.datePublished ||
          null;

        return {
          title,
          description,
          content: mainContent.substring(0, 10000),
          textContent: mainContent.substring(0, 10000),
          author,
          datePublished,
          leadImageUrl: openGraph.image || twitterCard.image || null,
          language,
          keywords,
          favicon,
          siteName,
          jsonLd,
          openGraph,
          twitterCard,
        };
      });

      const screenshots: string[] = [];
      if (options.screenshot) {
        const screenshot = await page.screenshot({
          fullPage: false,
          type: 'jpeg',
          quality: 80,
        });
        screenshots.push(`data:image/jpeg;base64,${screenshot.toString('base64')}`);
      }

      const loadTime = Date.now() - startTime;

      return {
        title: extractedData.title || 'Untitled',
        content: extractedData.content || '',
        textContent: extractedData.textContent || '',
        excerpt:
          extractedData.description || (extractedData.textContent || '').substring(0, 300) + '...',
        author: extractedData.author,
        datePublished: extractedData.datePublished,
        leadImageUrl: enhancedImage?.enhancedUrl || extractedData.leadImageUrl,
        url,
        domain: new URL(url).hostname,
        wordCount: (extractedData.textContent || '').split(/\s+/).filter(Boolean).length,
        readingTime: this.calculateReadingTime(
          (extractedData.textContent || '').split(/\s+/).filter(Boolean).length,
        ),
        success: true,
        method: 'Playwright Advanced',
        mediaType: this.detectMediaType(url),
        language: extractedData.language,
        keywords: extractedData.keywords,
        favicon: extractedData.favicon,
        siteName: extractedData.siteName,
        jsonLd: extractedData.jsonLd,
        openGraph: extractedData.openGraph,
        twitterCard: extractedData.twitterCard,
        screenshots,
        performance: {
          loadTime,
          resourceCount,
          totalSize,
        },
        imageMetadata: enhancedImage
          ? {
              width: enhancedImage.width,
              height: enhancedImage.height,
              format: enhancedImage.format,
              quality: enhancedImage.quality,
              fileSize: enhancedImage.fileSize,
            }
          : undefined,
        multiFormatImages,
      };
    } finally {
      await page.goto('about:blank');
    }
  }

  // 전략 3: Playwright Stealth 모드
  private async playwrightStealthStrategy(
    url: string,
    options: ScrapingOptions,
  ): Promise<ScrapingResult> {
    const page = await this.getPage({
      ...options,
      userAgent: this.getRandomUserAgent(),
    });

    try {
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', {
          get: () => undefined,
        });

        // @ts-ignore
        window.chrome = {
          runtime: {},
        };

        const originalQuery = window.navigator.permissions.query;
        window.navigator.permissions.query = (parameters: any) => {
          return parameters.name === 'notifications'
            ? Promise.resolve({ state: Notification.permission } as any)
            : originalQuery(parameters);
        };

        Object.defineProperty(navigator, 'plugins', {
          get: () => [1, 2, 3, 4, 5],
        });

        Object.defineProperty(navigator, 'languages', {
          get: () => ['ko-KR', 'ko', 'en-US', 'en'],
        });
      });

      await page.mouse.move(100, 100);
      await page.mouse.move(200, 200);

      return await this.playwrightAdvancedStrategy(url, options);
    } catch (error) {
      throw new Error(`Stealth 전략 실패: ${error}`);
    }
  }

  // 전략 4: Cheerio 강화 전략
  private async cheerioEnhancedStrategy(url: string): Promise<ScrapingResult> {
    try {
      const headers = {
        'User-Agent': this.getRandomUserAgent(),
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        DNT: '1',
        Connection: 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0',
      };

      const response = await axios.get(url, {
        headers,
        timeout: 15000,
        maxRedirects: 5,
        validateStatus: (status) => status < 500,
        decompress: true,
        responseType: 'text',
      });

      const $ = cheerio.load(response.data);

      const result = this.extractEnhancedMetadata($, url);

      return {
        title: result.title || 'Untitled',
        content: result.content || '',
        textContent: result.textContent || '',
        excerpt: result.excerpt || '',
        author: result.author || null,
        datePublished: result.datePublished || null,
        leadImageUrl: result.leadImageUrl || null,
        url: result.url || url,
        domain: result.domain || this.extractDomain(url),
        wordCount: result.wordCount || 0,
        readingTime: result.readingTime || '1분',
        success: true,
        method: 'Cheerio Enhanced',
        mediaType: result.mediaType || 'text',
        ...result,
      };
    } catch (error) {
      throw new Error(
        `Cheerio 전략 실패: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  // 전략 5: 프록시 로테이션 전략
  private async proxyRotationStrategy(
    url: string,
    options: ScrapingOptions,
  ): Promise<ScrapingResult> {
    if (this.proxyServers.length === 0) {
      throw new Error('프록시 서버가 설정되지 않았습니다');
    }

    for (const proxyServer of this.proxyServers) {
      try {
        const proxyOptions: ScrapingOptions = {
          ...options,
          proxy: {
            server: proxyServer,
          },
          timeout: 20000,
        };

        return await this.playwrightAdvancedStrategy(url, proxyOptions);
      } catch (error) {
        console.warn(`프록시 ${proxyServer} 실패:`, error);
        continue;
      }
    }

    throw new Error('모든 프록시 서버 실패');
  }

  // 전략 6: Cloudflare 우회 전략
  private async cloudflareBypassStrategy(
    url: string,
    options: ScrapingOptions,
  ): Promise<ScrapingResult> {
    const page = await this.getPage(options);

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded' });

      const hasCloudflare = await page.evaluate(() => {
        return (
          document.title.includes('Just a moment') ||
          document.querySelector('.cf-browser-verification') !== null
        );
      });

      if (hasCloudflare) {
        console.log('Cloudflare 감지됨, 우회 시도 중...');

        await page.waitForFunction(() => !document.title.includes('Just a moment'), {
          timeout: 20000,
        });

        await this.delay(2000);
      }

      return await this.playwrightAdvancedStrategy(url, options);
    } catch (error) {
      throw new Error(`Cloudflare 우회 실패: ${error}`);
    }
  }

  // 전략 7: API 엔드포인트 직접 호출
  private async apiEndpointStrategy(url: string): Promise<ScrapingResult> {
    const domain = new URL(url).hostname;

    if (domain.includes('reddit.com')) {
      const jsonUrl = url.endsWith('.json') ? url : `${url}.json`;
      try {
        const response = await axios.get(jsonUrl, {
          headers: { 'User-Agent': 'Link-Quration/1.0' },
        });

        return this.parseRedditJson(response.data, url);
      } catch (error) {
        throw new Error('Reddit API 호출 실패');
      }
    }

    throw new Error('API 엔드포인트 전략 미지원 사이트');
  }

  // === 유틸리티 메서드들 ===

  private async getPage(options: Partial<ScrapingOptions> = {}): Promise<Page> {
    if (!this.browser) {
      this.browser = await chromium.launch({
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
    }

    if (!this.context) {
      const viewport = options.viewport || {
        width: 1920,
        height: 1080,
      };

      this.context = await this.browser.newContext({
        viewport,
        userAgent: options.userAgent || this.getRandomUserAgent(),
        locale: 'ko-KR',
        timezoneId: 'Asia/Seoul',
        deviceScaleFactor: 1,
        hasTouch: false,
        javaScriptEnabled: true,
        ...(options.proxy ? { proxy: options.proxy } : {}),
      });
    }

    return await this.context.newPage();
  }

  private async autoScroll(page: Page): Promise<void> {
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let totalHeight = 0;
        const distance = 100;
        const maxScrolls = 50;
        let scrollCount = 0;

        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;
          scrollCount++;

          if (totalHeight >= scrollHeight || scrollCount >= maxScrolls) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });
  }

  private extractEnhancedMetadata($: cheerio.CheerioAPI, url: string): Partial<ScrapingResult> {
    const getMeta = (selectors: string[]): string | null => {
      for (const selector of selectors) {
        const content = $(selector).attr('content') || $(selector).attr('value');
        if (content?.trim()) return content.trim();
      }
      return null;
    };

    const openGraph: Record<string, string> = {};
    $('meta[property^="og:"]').each((_, el) => {
      const property = $(el).attr('property');
      const content = $(el).attr('content');
      if (property && content) {
        openGraph[property.replace('og:', '')] = content;
      }
    });

    const twitterCard: Record<string, string> = {};
    $('meta[name^="twitter:"]').each((_, el) => {
      const name = $(el).attr('name');
      const content = $(el).attr('content');
      if (name && content) {
        twitterCard[name.replace('twitter:', '')] = content;
      }
    });

    const jsonLd: any[] = [];
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const json = JSON.parse($(el).html() || '{}');
        jsonLd.push(json);
      } catch {
        // 파싱 실패 무시
      }
    });

    const content = this.extractMainContent($);
    const textContent = this.stripHtml(content);

    const title =
      openGraph.title ||
      getMeta(['meta[property="og:title"]', 'meta[name="twitter:title"]']) ||
      $('title').text().trim() ||
      $('h1').first().text().trim() ||
      'Untitled';

    return {
      title,
      content,
      textContent,
      excerpt: getMeta(['meta[name="description"]']) || textContent.substring(0, 300) + '...',
      author: getMeta(['meta[name="author"]', 'meta[property="article:author"]']),
      datePublished: getMeta(['meta[property="article:published_time"]']),
      leadImageUrl: openGraph.image || getMeta(['meta[property="og:image"]']),
      url,
      domain: this.extractDomain(url),
      wordCount: textContent.split(/\s+/).filter(Boolean).length,
      readingTime: this.calculateReadingTime(textContent.split(/\s+/).filter(Boolean).length),
      language: $('html').attr('lang') || getMeta(['meta[property="og:locale"]']) || 'en',
      keywords:
        getMeta(['meta[name="keywords"]'])
          ?.split(',')
          .map((k) => k.trim()) || [],
      favicon: $('link[rel="icon"]').attr('href') || '/favicon.ico',
      siteName: getMeta(['meta[property="og:site_name"]']),
      jsonLd,
      openGraph,
      twitterCard,
      mediaType: this.detectMediaType(url),
    };
  }

  private extractMainContent($: cheerio.CheerioAPI): string {
    $(
      'script, style, nav, header, footer, aside, .advertisement, .ads, .sidebar, .menu, .navigation, .comments, .related',
    ).remove();

    const contentSelectors = [
      'article[role="main"]',
      'main article',
      'article',
      '[role="main"]',
      'main',
      '.article-content',
      '.post-content',
      '.entry-content',
      '.content-body',
      '.story-body',
      '#main-content',
      '.main-content',
      '[itemprop="articleBody"]',
      '.markdown-body',
      '.prose',
    ];

    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        const text = element.text().trim();
        if (text.length > 100) {
          return text.substring(0, 10000);
        }
      }
    }

    const bodyText = $('body').text().trim();
    return bodyText.substring(0, 10000);
  }

  private detectMediaType(url: string): 'text' | 'video' | 'audio' | 'image' {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.toLowerCase();
      const pathname = urlObj.pathname.toLowerCase();

      const videoDomains = [
        'youtube.com',
        'youtu.be',
        'vimeo.com',
        'twitch.tv',
        'dailymotion.com',
        'facebook.com/watch',
        'tiktok.com',
        'instagram.com/tv',
        'netflix.com',
        'viki.com',
      ];

      if (
        videoDomains.some((d) => domain.includes(d)) ||
        pathname.match(/\.(mp4|avi|mov|wmv|flv|webm|mkv|m3u8)$/i)
      ) {
        return 'video';
      }

      const audioDomains = [
        'spotify.com',
        'soundcloud.com',
        'anchor.fm',
        'podcasts.apple.com',
        'music.youtube.com',
        'deezer.com',
      ];

      if (
        audioDomains.some((d) => domain.includes(d)) ||
        domain.includes('podcast') ||
        pathname.match(/\.(mp3|wav|ogg|aac|flac|m4a)$/i)
      ) {
        return 'audio';
      }

      if (pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff|ico)$/i)) {
        return 'image';
      }

      return 'text';
    } catch {
      return 'text';
    }
  }

  private stripHtml(html: string): string {
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return 'unknown';
    }
  }

  private calculateReadingTime(wordCount: number): string {
    const wordsPerMinute = 200;
    const minutes = Math.max(1, Math.ceil(wordCount / wordsPerMinute));
    return `${minutes}분`;
  }

  private getRandomUserAgent(): string {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  private getCacheKey(url: string, options: ScrapingOptions): string {
    const optionsString = JSON.stringify(options);
    return createHash('md5').update(`${url}:${optionsString}`).digest('hex');
  }

  private getFromCache(key: string): ScrapingResult | null {
    const cached = this.cache.get(key);
    if (cached) {
      const age = Date.now() - (cached as any).timestamp;
      if (age < this.cacheTimeout) {
        return cached;
      }
      this.cache.delete(key);
    }
    return null;
  }

  private saveToCache(key: string | undefined, result: ScrapingResult): void {
    if (!key) {
      console.warn('캐시 키가 유효하지 않아 캐시에 저장하지 않습니다.');
      return;
    }

    this.cache.set(key, {
      ...result,
      timestamp: Date.now(),
    } as any);

    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private parseRedditJson(data: any, url: string): ScrapingResult {
    const post = data[0]?.data?.children[0]?.data;
    if (!post) throw new Error('Reddit 데이터 파싱 실패');

    return {
      title: post.title,
      content: post.selftext || post.url,
      textContent: post.selftext || '',
      excerpt: post.selftext?.substring(0, 300) || '',
      author: post.author,
      datePublished: new Date(post.created_utc * 1000).toISOString(),
      leadImageUrl: post.thumbnail !== 'self' ? post.thumbnail : null,
      url,
      domain: 'reddit.com',
      wordCount: post.selftext?.split(/\s+/).length || 0,
      readingTime: '1분',
      success: true,
      method: 'Reddit API',
      mediaType: 'text',
    };
  }

  // 에러 처리 및 복구
  private async handleScrapingError(error: Error, url: string): Promise<ScrapingResult | null> {
    if (error.message.includes('timeout')) {
      throw new ScrapingError('Request timeout', 'TIMEOUT', true);
    }

    if (error.message.includes('blocked') || error.message.includes('403')) {
      console.log('차단 감지, 프록시 전략으로 전환...');
      return await this.proxyRotationStrategy(url, {});
    }

    if (error.message.includes('CAPTCHA')) {
      throw new ScrapingError('CAPTCHA detected', 'CAPTCHA', false);
    }

    if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
      throw new ScrapingError('Network error', 'NETWORK', true);
    }

    return null;
  }

  // 콘텐츠 품질 평가
  private evaluateContentQuality(result: ScrapingResult): ContentQuality {
    const factors = {
      textLength: 0,
      structureQuality: 0,
      metadataCompleteness: 0,
      readability: 0,
      uniqueness: 0,
    };

    const warnings: string[] = [];

    if (result.wordCount > 300) factors.textLength = 100;
    else if (result.wordCount > 100) factors.textLength = 70;
    else factors.textLength = 30;

    if (result.title && result.excerpt && result.content) {
      factors.structureQuality = 100;
    } else {
      factors.structureQuality = 50;
      warnings.push('일부 필수 필드가 누락되었습니다');
    }

    let metadataCount = 0;
    if (result.author) metadataCount++;
    if (result.datePublished) metadataCount++;
    if (result.leadImageUrl) metadataCount++;
    if (result.keywords?.length) metadataCount++;
    if (result.openGraph) metadataCount++;

    factors.metadataCompleteness = (metadataCount / 5) * 100;

    const avgWordLength = result.textContent.length / result.wordCount;
    const estimatedSentences = result.wordCount / 15;
    const readingEase =
      206.835 - 1.015 * (result.wordCount / estimatedSentences) - 84.6 * avgWordLength;

    factors.readability = Math.max(0, Math.min(100, readingEase));

    const contentHash = createHash('md5').update(result.textContent).digest('hex');
    factors.uniqueness = 100;

    const score = Object.values(factors).reduce((a, b) => a + b, 0) / Object.keys(factors).length;

    return { score, factors, warnings };
  }

  async cleanup(): Promise<void> {
    if (this.context) {
      await this.context.close();
      this.context = null;
    }
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
    await this.browserPool.closeAll();
  }

  // 미디어 스크래핑 메서드
  async scrapeVideoContent(url: string): Promise<ScrapingResult> {
    console.log('🎥 비디오 콘텐츠 스크래핑...');

    const domain = new URL(url).hostname;

    if (domain.includes('youtube.com') || domain.includes('youtu.be')) {
      return await this.scrapeYouTubeContent(url);
    }

    return await this.scrapeContent(url, {
      waitForSelector: 'video',
      screenshot: true,
    });
  }

  private async scrapeYouTubeContent(url: string): Promise<ScrapingResult> {
    const page = await this.getPage({});

    try {
      await page.goto(url, { waitUntil: 'networkidle' });

      const data = await page.evaluate(() => {
        const getMetaContent = (name: string) => {
          const meta = document.querySelector(`meta[property="${name}"], meta[name="${name}"]`);
          return meta?.getAttribute('content') || null;
        };

        return {
          title: getMetaContent('og:title') || document.title,
          description: getMetaContent('og:description') || '',
          author: document.querySelector('.ytd-channel-name a')?.textContent || null,
          views: document.querySelector('.view-count')?.textContent || null,
          likes:
            document.querySelector('.like-button-renderer-like-button-clicked')?.textContent ||
            null,
          duration: getMetaContent('og:video:duration') || null,
          publishedDate:
            document.querySelector('#info-strings yt-formatted-string')?.textContent || null,
          thumbnail: getMetaContent('og:image') || null,
        };
      });

      return {
        title: data.title || 'Untitled',
        content: data.description || '',
        textContent: data.description || '',
        excerpt: (data.description || '').substring(0, 1000) || '',
        author: data.author,
        datePublished: data.publishedDate,
        leadImageUrl: data.thumbnail,
        url,
        domain: 'youtube.com',
        wordCount: (data.description || '').split(/\s+/).length || 0,
        readingTime: '동영상',
        success: true,
        method: 'YouTube Specialized',
        mediaType: 'video',
        mediaMetadata: {
          views: data.views,
          likes: data.likes,
          duration: data.duration,
        },
      };
    } catch (error) {
      throw new Error(`YouTube 스크래핑 실패: ${error}`);
    }
  }

  async scrapeAudioContent(url: string): Promise<ScrapingResult> {
    console.log('🎵 오디오 콘텐츠 스크래핑...');

    return await this.scrapeContent(url, {
      waitForSelector: 'audio',
    });
  }

  // 메트릭스 조회
  getMetrics(): ScrapingMetrics {
    return this.monitor.getMetrics();
  }
}

// 싱글톤 인스턴스 export
export const multiStrategyScraper = new MultiStrategyScraper();
