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
  // 새로운 필드 추가
  keywords?: string[];
  language?: string;
  favicon?: string;
  siteName?: string | null;
  jsonLd?: any;
  openGraph?: Record<string, string>;
  twitterCard?: Record<string, string>;
  screenshots?: string[];
  performance?: {
    loadTime: number;
    resourceCount: number;
    totalSize: number;
  };
  // 이미지 관련 추가 필드
  imageMetadata?: {
    width: number;
    height: number;
    format: string;
    quality: number;
    fileSize: number;
  };
  multiFormatImages?: {
    jpeg: string;
    webp?: string;
    avif?: string;
  };
  contentQuality?: ContentQuality;
}

export interface ScrapingOptions {
  screenshot?: boolean;
  waitForSelector?: string;
  scrollToBottom?: boolean;
  extractJsonLd?: boolean;
  blockResources?: string[];
  userAgent?: string;
  viewport?: { width: number; height: number };
  timeout?: number;
  retryCount?: number;
  proxy?: {
    server: string;
    username?: string;
    password?: string;
  };
  concurrency?: number;
  imageQuality?: 'thumbnail' | 'standard' | 'high' | 'ultra';
}

export interface ImageCandidate {
  url: string;
  width: number;
  height: number;
  format: string;
  score: number;
  type: 'meta' | 'content' | 'srcset' | 'figure' | 'link';
  alt?: string;
}

export interface EnhancedImageResult {
  originalUrl: string;
  enhancedUrl?: string;
  width: number;
  height: number;
  format: string;
  quality: number;
  fileSize: number;
}

export interface ContentQuality {
  score: number;
  factors: {
    textLength: number;
    structureQuality: number;
    metadataCompleteness: number;
    readability: number;
    uniqueness: number;
  };
  warnings: string[];
}

export interface ScrapingMetrics {
  totalRequests: number;
  successCount: number;
  failureCount: number;
  averageLoadTime: number;
  strategySuccess: Record<string, number>;
  domainStats: Record<
    string,
    {
      count: number;
      successRate: number;
      avgLoadTime: number;
    }
  >;
}
