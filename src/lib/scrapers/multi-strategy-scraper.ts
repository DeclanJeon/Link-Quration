// src/lib/scrapers/multi-strategy-scraper.ts
import puppeteer from 'puppeteer';
import axios from 'axios';
import * as cheerio from 'cheerio';

export interface ScrapingResult {
  title: string;
  content: string;
  textContent: string;
  excerpt: string;
  author: string | null;
  datePublished: string | null;
  leadImageUrl: string | null;
  url: string;
  domain: string;
  wordCount: number;
  readingTime: string;
  success: boolean;
  method: string;
  mediaType: 'text' | 'video' | 'audio' | 'image';
  mediaMetadata?: any;
  error?: string;
}

export class MultiStrategyScraper {
  private strategies = [
    this.cheerioStrategy, // 가장 빠른 방법부터
    this.puppeteerWithRotation, // 강력한 방법
    this.playwrightStrategy, // 더 강력한 방법
    this.proxyStrategy, // 프록시 우회
    this.mercuryFallback, // 마지막 수단
  ];

  async scrapeContent(url: string): Promise<ScrapingResult> {
    console.log(`다중 전략 스크래핑 시작: ${url}`);

    // 미디어 타입 사전 감지
    const mediaType = this.detectMediaType(url);

    // 미디어별 특화 전략 적용
    if (mediaType === 'video') {
      return await this.scrapeVideoContent(url);
    } else if (mediaType === 'audio') {
      return await this.scrapeAudioContent(url);
    }

    // 일반 웹 콘텐츠 스크래핑
    let lastError: Error | null = null;

    for (const strategy of this.strategies) {
      try {
        console.log(`시도 중: ${strategy.name}`);
        const result = await strategy.call(this, url);

        if (result && result.title && result.content) {
          console.log(`성공: ${strategy.name}`);
          return {
            ...result,
            mediaType,
            success: true,
          } as ScrapingResult;
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`${strategy.name} 실패:`, lastError.message);
        continue;
      }
    }

    throw new Error(
      `모든 스크래핑 전략이 실패했습니다. 마지막 오류: ${
        lastError?.message || 'Unknown error'
      }`
    );
  }

  // 미디어 타입 감지
  private detectMediaType(url: string): 'text' | 'video' | 'audio' | 'image' {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.toLowerCase();
      const pathname = urlObj.pathname.toLowerCase();

      // 동영상 플랫폼
      if (
        domain.includes('youtube.com') ||
        domain.includes('youtu.be') ||
        domain.includes('vimeo.com') ||
        domain.includes('twitch.tv') ||
        domain.includes('dailymotion.com') ||
        pathname.match(/\.(mp4|avi|mov|wmv|flv|webm|mkv)$/i)
      ) {
        return 'video';
      }

      // 오디오 플랫폼
      if (
        domain.includes('spotify.com') ||
        domain.includes('soundcloud.com') ||
        domain.includes('anchor.fm') ||
        domain.includes('podcast') ||
        pathname.match(/\.(mp3|wav|ogg|aac|flac|m4a)$/i)
      ) {
        return 'audio';
      }

      // 이미지
      if (pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff)$/i)) {
        return 'image';
      }

      return 'text';
    } catch {
      return 'text';
    }
  }

  // 전략 1: Cheerio (가장 빠르고 안정적)
  async cheerioStrategy(url: string): Promise<Partial<ScrapingResult>> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate',
          Connection: 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
        timeout: 15000,
        maxRedirects: 5,
        validateStatus: (status) => status < 500, // 4xx 에러도 허용
      });

      const $ = cheerio.load(response.data);
      const result = this.extractMetaData($, url);

      return { ...result, method: 'Cheerio Parser' };
    } catch (error) {
      throw new Error(
        `Cheerio 전략 실패: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  // 전략 2: Puppeteer + User-Agent 로테이션
  async puppeteerWithRotation(url: string): Promise<Partial<ScrapingResult>> {
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
    ];

    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true, // 🔧 수정: 'new' 대신 true 사용
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-web-security',
          '--disable-blink-features=AutomationControlled',
          '--disable-features=VizDisplayCompositor',
          '--user-agent=' +
            userAgents[Math.floor(Math.random() * userAgents.length)],
        ],
      });

      const page = await browser.newPage();

      // 자동화 감지 우회
      await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        Object.defineProperty(navigator, 'plugins', {
          get: () => [1, 2, 3, 4, 5],
        });
        Object.defineProperty(navigator, 'languages', {
          get: () => ['ko-KR', 'ko', 'en-US', 'en'],
        });
      });

      // 랜덤 뷰포트 설정
      const viewports = [
        { width: 1920, height: 1080 },
        { width: 1366, height: 768 },
        { width: 1440, height: 900 },
        { width: 1536, height: 864 },
      ];
      const randomViewport =
        viewports[Math.floor(Math.random() * viewports.length)];
      await page.setViewport(randomViewport);

      // 추가 헤더 설정
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        DNT: '1',
        Connection: 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      });

      // 페이지 로드
      await page.goto(url, {
        waitUntil: 'networkidle0',
        timeout: 30000,
      });

      // 🔧 수정: waitForTimeout 대신 page.waitForTimeout 사용
      await new Promise((resolve) =>
        setTimeout(resolve, Math.random() * 2000 + 1000)
      );

      // 스크롤 시뮬레이션 (동적 콘텐츠 로드)
      await page.evaluate(() => {
        return new Promise<void>((resolve) => {
          let totalHeight = 0;
          const distance = 100;
          const timer = setInterval(() => {
            const scrollHeight = document.body.scrollHeight;
            window.scrollBy(0, distance);
            totalHeight += distance;

            if (totalHeight >= scrollHeight) {
              clearInterval(timer);
              resolve();
            }
          }, 100);

          // 최대 5초 후 강제 종료
          setTimeout(() => {
            clearInterval(timer);
            resolve();
          }, 5000);
        });
      });

      const result = await this.extractContentFromPage(page);
      return result;
    } catch (error) {
      throw new Error(
        `Puppeteer 전략 실패: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  // 전략 3: Playwright (더 강력한 브라우저 자동화)
  async playwrightStrategy(url: string): Promise<Partial<ScrapingResult>> {
    let browser;
    try {
      // 동적 import로 Playwright 로드
      const playwright = await import('playwright');

      browser = await playwright.chromium.launch({
        headless: true,
        args: ['--disable-blink-features=AutomationControlled'],
      });

      const context = await browser.newContext({
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1920, height: 1080 },
        locale: 'ko-KR',
        timezoneId: 'Asia/Seoul',
        geolocation: { longitude: 126.978, latitude: 37.5665 }, // 서울
        permissions: ['geolocation'],
      });

      const page = await context.newPage();

      // 자동화 감지 우회 스크립트
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        Object.defineProperty(navigator, 'plugins', {
          get: () => [1, 2, 3, 4, 5],
        });
        // @ts-ignore
        delete navigator.__proto__.webdriver;
      });

      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

      // 페이지 완전 로드 대기
      await page.waitForLoadState('networkidle');

      const result = await this.extractContentFromPlaywrightPage(page);
      return result;
    } catch (error) {
      throw new Error(
        `Playwright 전략 실패: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  // 전략 4: 프록시 서비스 활용
  async proxyStrategy(url: string): Promise<Partial<ScrapingResult>> {
    const proxyServices = [
      `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
      `https://corsproxy.io/?${encodeURIComponent(url)}`,
      `https://thingproxy.freeboard.io/fetch/${url}`,
    ];

    let lastError: Error | null = null;

    for (const proxyUrl of proxyServices) {
      try {
        const response = await fetch(proxyUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          signal: AbortSignal.timeout(10000), // 10초 타임아웃
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const html = data.contents || data.content || data;

        if (!html || typeof html !== 'string') {
          throw new Error('유효하지 않은 HTML 응답');
        }

        const $ = cheerio.load(html);
        const result = this.extractMetaData($, url);

        if (result.title && result.content) {
          return { ...result, method: 'Proxy Service' };
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        continue;
      }
    }

    throw new Error(
      `모든 프록시 서비스 실패. 마지막 오류: ${
        lastError?.message || 'Unknown error'
      }`
    );
  }

  // 전략 5: Mercury Parser (fallback)
  async mercuryFallback(url: string): Promise<Partial<ScrapingResult>> {
    try {
      const Mercury = await import('@postlight/mercury-parser');

      const result = await Mercury.default.parse(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (!result) {
        throw new Error('Mercury Parser가 결과를 반환하지 않음');
      }

      return {
        title: result.title || '',
        content: result.content || '',
        textContent: this.stripHtml(result.content || ''),
        excerpt:
          result.excerpt ||
          this.stripHtml(result.content || '').substring(0, 300) + '...',
        author: result.author,
        datePublished: result.date_published,
        leadImageUrl: result.lead_image_url,
        url: result.url || url,
        domain: this.extractDomain(url),
        wordCount: result.word_count || 0,
        readingTime: this.calculateReadingTime(result.word_count || 0),
        method: 'Mercury Parser',
      };
    } catch (error) {
      throw new Error(
        `Mercury Parser 실패: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  // 공통 유틸리티 메서드들
  private extractMetaData($: cheerio.CheerioAPI, url: string) {
    const getMetaContent = (selectors: string[]) => {
      for (const selector of selectors) {
        const content = $(selector).attr('content');
        if (content && content.trim()) return content.trim();
      }
      return null;
    };

    const title =
      getMetaContent([
        'meta[property="og:title"]',
        'meta[name="twitter:title"]',
      ]) ||
      $('title').text().trim() ||
      $('h1').first().text().trim() ||
      'Untitled';

    const description =
      getMetaContent([
        'meta[property="og:description"]',
        'meta[name="twitter:description"]',
        'meta[name="description"]',
      ]) || '';

    const image = getMetaContent([
      'meta[property="og:image"]',
      'meta[name="twitter:image"]',
    ]);

    const content = this.extractMainContent($);
    const textContent = this.stripHtml(content);

    return {
      title,
      description,
      content,
      textContent,
      excerpt: description || textContent.substring(0, 300) + '...',
      author: getMetaContent([
        'meta[name="author"]',
        'meta[property="article:author"]',
      ]),
      datePublished: getMetaContent([
        'meta[property="article:published_time"]',
      ]),
      leadImageUrl: image,
      url,
      domain: this.extractDomain(url),
      wordCount: textContent.split(/\s+/).filter((word) => word.length > 0)
        .length,
      readingTime: this.calculateReadingTime(
        textContent.split(/\s+/).filter((word) => word.length > 0).length
      ),
    };
  }

  private extractMainContent($: cheerio.CheerioAPI): string {
    // 불필요한 요소 제거
    $(
      'script, style, nav, header, footer, aside, .advertisement, .ads, .sidebar, .menu, .navigation'
    ).remove();

    // 본문 콘텐츠 선택자들 (우선순위별)
    const contentSelectors = [
      'article',
      '[role="main"]',
      'main',
      '.content',
      '.post-content',
      '.entry-content',
      '.article-content',
      '.post-body',
      '.main-content',
      '#content',
      '.story-body',
      '.article-body',
      '.text-content',
    ];

    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        const text = element.text().trim();
        if (text.length > 100) {
          return text.substring(0, 5000);
        }
      }
    }

    // fallback: body 전체에서 추출
    const bodyText = $('body').text().trim();
    return bodyText.substring(0, 5000);
  }

  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return 'unknown';
    }
  }

  private calculateReadingTime(wordCount: number): string {
    const wordsPerMinute = 200;
    const minutes = Math.max(1, Math.ceil(wordCount / wordsPerMinute));
    return `${minutes}분`;
  }

  private async extractContentFromPage(page: any) {
    return await page.evaluate(() => {
      // 페이지에서 직접 데이터 추출
      const getMetaContent = (name: string) => {
        const meta = document.querySelector(
          `meta[property="${name}"], meta[name="${name}"]`
        );
        return meta ? meta.getAttribute('content') : null;
      };

      // 불필요한 요소 제거
      const elementsToRemove = [
        'script',
        'style',
        'nav',
        'header',
        'footer',
        'aside',
        '.advertisement',
      ];
      elementsToRemove.forEach((selector) => {
        document.querySelectorAll(selector).forEach((el) => el.remove());
      });

      const mainContent =
        document.querySelector(
          'article, main, .content, .post-content, .entry-content'
        ) || document.body;

      // 🔧 수정: HTMLElement로 타입 캐스팅하여 innerText 접근
      const textContent = (
        (mainContent as HTMLElement).innerText ||
        (mainContent as HTMLElement).textContent ||
        ''
      ).trim();

      return {
        title:
          getMetaContent('og:title') ||
          getMetaContent('twitter:title') ||
          document.title ||
          'Untitled',
        description:
          getMetaContent('og:description') ||
          getMetaContent('twitter:description') ||
          getMetaContent('description') ||
          '',
        content: textContent.substring(0, 5000),
        textContent: textContent.substring(0, 5000),
        excerpt: textContent.substring(0, 300) + '...',
        author: getMetaContent('article:author') || getMetaContent('author'),
        datePublished: getMetaContent('article:published_time'),
        leadImageUrl: getMetaContent('og:image'),
        url: window.location.href,
        domain: window.location.hostname,
        wordCount: textContent
          .split(/\s+/)
          .filter((word: string) => word.length > 0).length,
        method: 'Puppeteer Advanced',
      };
    });
  }

  private async extractContentFromPlaywrightPage(page: any) {
    return await page.evaluate(() => {
      // 페이지에서 직접 데이터 추출
      const getMetaContent = (name: string) => {
        const meta = document.querySelector(
          `meta[property="${name}"], meta[name="${name}"]`
        );
        return meta ? meta.getAttribute('content') : null;
      };

      // 불필요한 요소 제거
      const elementsToRemove = [
        'script',
        'style',
        'nav',
        'header',
        'footer',
        'aside',
        '.advertisement',
      ];
      elementsToRemove.forEach((selector) => {
        document.querySelectorAll(selector).forEach((el) => el.remove());
      });

      const mainContent =
        document.querySelector(
          'article, main, .content, .post-content, .entry-content'
        ) || document.body;

      // 🔧 수정: HTMLElement로 타입 캐스팅하여 innerText 접근
      const textContent = (
        (mainContent as HTMLElement).innerText ||
        (mainContent as HTMLElement).textContent ||
        ''
      ).trim();

      return {
        title:
          getMetaContent('og:title') ||
          getMetaContent('twitter:title') ||
          document.title ||
          'Untitled',
        description:
          getMetaContent('og:description') ||
          getMetaContent('twitter:description') ||
          getMetaContent('description') ||
          '',
        content: textContent.substring(0, 5000),
        textContent: textContent.substring(0, 5000),
        excerpt: textContent.substring(0, 300) + '...',
        author: getMetaContent('article:author') || getMetaContent('author'),
        datePublished: getMetaContent('article:published_time'),
        leadImageUrl: getMetaContent('og:image'),
        url: window.location.href,
        domain: window.location.hostname,
        wordCount: textContent
          .split(/\s+/)
          .filter((word: string) => word.length > 0).length,
        method: 'Playwright Advanced',
      };
    });
  }

  // 미디어 전용 메서드들 (기본 구현)
  async scrapeVideoContent(url: string): Promise<ScrapingResult> {
    // 동영상은 별도 VideoAnalyzer에서 처리하므로 기본 웹 스크래핑 수행
    console.log('동영상 URL 감지, 기본 메타데이터 추출 수행...');

    try {
      const result = await this.cheerioStrategy(url);
      return {
        ...result,
        mediaType: 'video',
        success: true,
        method: 'Video Fallback Scraping',
      } as ScrapingResult;
    } catch (error) {
      throw new Error(
        `동영상 스크래핑 실패: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  async scrapeAudioContent(url: string): Promise<ScrapingResult> {
    // 오디오는 기본 웹 스크래핑 수행
    console.log('오디오 URL 감지, 기본 메타데이터 추출 수행...');

    try {
      const result = await this.cheerioStrategy(url);
      return {
        ...result,
        mediaType: 'audio',
        success: true,
        method: 'Audio Fallback Scraping',
      } as ScrapingResult;
    } catch (error) {
      throw new Error(
        `오디오 스크래핑 실패: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }
}
