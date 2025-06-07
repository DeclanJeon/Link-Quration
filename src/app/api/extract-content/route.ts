// src/app/api/extract-content/route.ts
import { BaseExtractionResult, ExtractionResult } from '@/types/extraction';
import {
  VideoExtractionResult,
  WebExtractionResult,
} from '@/types/extraction-types';

import { NextRequest, NextResponse } from 'next/server';

// 동적 import로 서버사이드에서만 로드
async function getMercuryParser() {
  const Mercury = await import('@postlight/mercury-parser');
  return Mercury.default;
}

async function getMultiStrategyScraper() {
  const { MultiStrategyScraper } = await import(
    '@/lib/scrapers/multi-strategy-scraper'
  );
  return MultiStrategyScraper;
}

async function getVideoAnalyzer() {
  const { VideoAnalyzer } = await import(
    '@/lib/media-analyzers/video-analyzer'
  );
  return VideoAnalyzer;
}

async function getMediaAIAnalyzer() {
  const { MediaAIAnalyzer } = await import(
    '@/lib/ai-analyzers/media-ai-analyzer'
  );
  return MediaAIAnalyzer;
}

async function getOpenRouterClient() {
  const { OpenRouterClient } = await import('@/lib/openrouter');
  return OpenRouterClient;
}

export async function POST(request: NextRequest) {
  try {
    const { url, enableAI, apiKey, modelId } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL이 필요합니다.' }, { status: 400 });
    }

    // URL 형식 검증
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: '유효하지 않은 URL 형식입니다.' },
        { status: 400 }
      );
    }

    console.log(`고급 콘텐츠 추출 시작: ${url}`);

    // 미디어 타입 사전 감지
    const mediaType = detectMediaType(url);
    console.log(`감지된 미디어 타입: ${mediaType}`);

    let extractionResult: ExtractionResult;

    try {
      if (mediaType === 'video') {
        // 동영상 전용 분석 파이프라인
        extractionResult = await processVideoContent(
          url,
          enableAI,
          apiKey,
          modelId
        );
      } else {
        // 일반 웹 콘텐츠 분석 파이프라인
        extractionResult = await processWebContent(
          url,
          enableAI,
          apiKey,
          modelId
        );
      }

      return NextResponse.json({
        success: extractionResult.success,
        data: extractionResult,
        extractedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('콘텐츠 처리 중 오류:', error);

      // 실패 시 기본 메타데이터라도 추출 시도
      try {
        const fallbackResult = await extractBasicMetadata(url);
        return NextResponse.json({
          success: false,
          data: fallbackResult,
          extractedAt: new Date().toISOString(),
        });
      } catch (fallbackError) {
        throw error; // 원본 에러를 다시 던짐
      }
    }
  } catch (error) {
    console.error('콘텐츠 추출 API 오류:', error);

    return NextResponse.json(
      {
        error: '콘텐츠 추출 중 서버 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET 요청도 지원 (쿼리 파라미터 방식)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  const enableAI = searchParams.get('enableAI') === 'true';
  const apiKey = searchParams.get('apiKey');
  const modelId = searchParams.get('modelId');

  if (!url) {
    return NextResponse.json(
      { error: 'URL 파라미터가 필요합니다.' },
      { status: 400 }
    );
  }

  // POST와 동일한 로직 재사용
  return POST(
    new NextRequest(request.url, {
      method: 'POST',
      body: JSON.stringify({ url, enableAI, apiKey, modelId }),
      headers: { 'Content-Type': 'application/json' },
    })
  );
}

// 미디어 타입 감지 함수
function detectMediaType(url: string): 'text' | 'video' | 'audio' | 'image' {
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
      domain.includes('tiktok.com') ||
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

// 동영상 콘텐츠 처리 파이프라인
async function processVideoContent(
  url: string,
  enableAI: boolean,
  apiKey?: string,
  modelId?: string
): Promise<VideoExtractionResult> {
  console.log('동영상 분석 파이프라인 시작...');

  try {
    // 1. 동영상 메타데이터 및 트랜스크립트 추출
    const VideoAnalyzer = await getVideoAnalyzer();
    const videoAnalyzer = new VideoAnalyzer();
    const videoData = await videoAnalyzer.analyzeVideo(url);

    console.log('동영상 기본 분석 완료:', {
      title: videoData.title,
      duration: videoData.duration,
      hasTranscript: !!videoData.transcript,
      chaptersCount: videoData.chapters?.length || 0,
    });

    // 2. 기본 추출 결과 구성
    const extractionResult: VideoExtractionResult = {
      title: videoData.title || 'Untitled Video',
      content: videoData.transcript || videoData.description || '',
      textContent: videoData.transcript || videoData.description || '',
      excerpt: videoData.description?.substring(0, 300) + '...' || '',
      author: videoData.author || null,
      datePublished: videoData.publishedAt || null,
      leadImageUrl: videoData.thumbnails?.[0] || null,
      url: url,
      domain: extractDomain(url),
      wordCount: videoData.transcript
        ? videoData.transcript.split(/\s+/).length
        : 0,
      createdAt: new Date().toISOString(),
      readingTime: `${Math.floor(videoData.duration / 60)}분`,
      success: true,
      method: 'Video Analysis',
      mediaType: 'video',
      mediaMetadata: {
        duration: videoData.duration,
        viewCount: videoData.viewCount,
        chapters: videoData.chapters || [],
        thumbnails: videoData.thumbnails || [],
        tags: videoData.tags || [],
        category: videoData.category || '',
        transcript: videoData.transcript || '',
        hasTranscript: !!videoData.transcript,
      },
    };

    // 3. AI 분석 (요청된 경우)
    if (enableAI && apiKey && modelId && videoData.transcript) {
      console.log('동영상 AI 분석 시작...');

      try {
        const OpenRouterClient = await getOpenRouterClient();
        const MediaAIAnalyzer = await getMediaAIAnalyzer();

        const openRouter = new OpenRouterClient(apiKey);
        const mediaAIAnalyzer = new MediaAIAnalyzer(openRouter, modelId);
        const aiAnalysis = await mediaAIAnalyzer.analyzeVideoContent(videoData);

        extractionResult.aiAnalysis = aiAnalysis;
        console.log('동영상 AI 분석 완료');
      } catch (aiError) {
        console.error('동영상 AI 분석 실패:', aiError);
        extractionResult.aiAnalysisError =
          aiError instanceof Error ? aiError.message : 'AI 분석 실패';
      }
    }

    return extractionResult;
  } catch (videoError) {
    console.error('동영상 분석 실패, 일반 스크래핑으로 fallback:', videoError);

    // 동영상 분석 실패 시 일반 웹 스크래핑으로 fallback
    const fallbackResult = await processWebContent(
      url,
      enableAI,
      apiKey,
      modelId
    );

    // fallbackResult에 videoAnalysisError 추가
    const resultWithError: VideoExtractionResult = {
      ...fallbackResult,
      mediaType: 'video',
      videoAnalysisError:
        videoError instanceof Error ? videoError.message : '동영상 분석 실패',
      // VideoExtractionResult에 필요한 필드 추가
      mediaMetadata: {
        duration: 0,
        viewCount: 0,
        chapters: [],
        thumbnails: [],
        tags: [],
        category: '',
        transcript: '',
        hasTranscript: false,
      },
    };
    return resultWithError;
  }
}

// 일반 웹 콘텐츠 처리 파이프라인
async function processWebContent(
  url: string,
  enableAI: boolean,
  apiKey?: string,
  modelId?: string
): Promise<WebExtractionResult> {
  console.log('웹 콘텐츠 분석 파이프라인 시작...');

  try {
    // 1. 다중 전략 스크래핑 시도
    const MultiStrategyScraper = await getMultiStrategyScraper();
    const scraper = new MultiStrategyScraper();
    const scrapingResult = await scraper.scrapeContent(url);

    console.log('다중 전략 스크래핑 완료:', {
      method: scrapingResult.method,
      success: scrapingResult.success,
      titleLength: scrapingResult.title?.length || 0,
      contentLength: scrapingResult.content?.length || 0,
    });

    // 타입 안전성을 위해 명시적으로 변환
    return scrapingResult as WebExtractionResult;
  } catch (scrapingError) {
    console.error(
      '다중 전략 스크래핑 실패, Mercury Parser로 fallback:',
      scrapingError
    );

    try {
      // 2. Mercury Parser fallback
      const mercuryResult = await tryMercuryParser(url);
      const resultWithError: WebExtractionResult = {
        ...mercuryResult,
        scrapingError:
          scrapingError instanceof Error
            ? scrapingError.message
            : '스크래핑 실패',
        mediaType: mercuryResult.mediaType as 'text' | 'audio' | 'image',
      };
      return resultWithError;
    } catch (mercuryError) {
      console.error(
        'Mercury Parser도 실패, 기본 메타데이터 추출:',
        mercuryError
      );

      // 3. 최후의 수단: 기본 메타데이터 추출
      const basicResult = await extractBasicMetadata(url);
      const resultWithErrors: WebExtractionResult = {
        ...basicResult,
        scrapingError:
          scrapingError instanceof Error
            ? scrapingError.message
            : '스크래핑 실패',
        mercuryError:
          mercuryError instanceof Error
            ? mercuryError.message
            : 'Mercury 파싱 실패',
        mediaType: basicResult.mediaType as 'text' | 'audio' | 'image',
      };

      return resultWithErrors;
    }
  }
}

// Mercury Parser 시도
async function tryMercuryParser(url: string): Promise<BaseExtractionResult> {
  const Mercury = await getMercuryParser();

  const result = await Mercury.parse(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  });

  if (!result) {
    throw new Error('Mercury Parser가 콘텐츠를 추출하지 못했습니다.');
  }

  return {
    title: result.title || 'Untitled',
    content: result.content || '',
    textContent: stripHtml(result.content || ''),
    excerpt:
      result.excerpt ||
      stripHtml(result.content || '').substring(0, 300) + '...',
    author: result.author || null,
    datePublished: result.date_published || null,
    leadImageUrl: result.lead_image_url || null,
    url: result.url || url,
    domain: extractDomain(result.url || url),
    wordCount: stripHtml(result.content || '').split(/\s+/).length,
    readingTime: calculateReadingTime(
      stripHtml(result.content || '').split(/\s+/).length
    ),
    success: true,
    method: 'mercury',
    mediaType: 'text',
    // Add the missing createdAt field
    createdAt: result.date_published
      ? new Date(result.date_published).toISOString()
      : new Date().toISOString(),
  };
}

// 기본 메타데이터 추출 (최후의 수단)
async function extractBasicMetadata(
  url: string
): Promise<BaseExtractionResult> {
  const axios = await import('axios');
  const cheerio = await import('cheerio');

  try {
    const response = await axios.default.get(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
      },
      timeout: 15000,
      maxRedirects: 5,
    });

    const $ = cheerio.load(response.data);

    const getMetaContent = (selectors: string[]) => {
      for (const selector of selectors) {
        const content = $(selector).attr('content');
        if (content) return content;
      }
      return null;
    };

    const title = (
      getMetaContent([
        'meta[property="og:title"]',
        'meta[name="twitter:title"]',
      ]) ||
      $('title').text() ||
      $('h1').first().text() ||
      'Untitled'
    ).trim();

    const description = (
      getMetaContent([
        'meta[property="og:description"]',
        'meta[name="twitter:description"]',
        'meta[name="description"]',
      ]) || ''
    ).trim();

    const image = getMetaContent([
      'meta[property="og:image"]',
      'meta[name="twitter:image"]',
    ]);

    // 본문 내용 추출 시도
    let content = '';
    const contentSelectors = [
      'article',
      'main',
      '.content',
      '.post-content',
      '.entry-content',
    ];
    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        element.find('script, style, nav, header, footer').remove();
        const text = element.text().trim();
        if (text.length > 100) {
          content = text.substring(0, 3000);
          break;
        }
      }
    }

    if (!content) {
      $('script, style, nav, header, footer').remove();
      content = $('body').text().trim().substring(0, 3000);
    }

    const wordCount = content
      .split(/\s+/)
      .filter((word) => word.length > 0).length;

    return {
      title,
      content: description || content,
      textContent: content,
      excerpt: description || content.substring(0, 300) + '...',
      author: getMetaContent([
        'meta[name="author"]',
        'meta[property="article:author"]',
      ]),
      datePublished: getMetaContent([
        'meta[property="article:published_time"]',
      ]),
      leadImageUrl: image,
      url,
      domain: extractDomain(url),
      wordCount,
      readingTime: calculateReadingTime(wordCount),
      createdAt: new Date().toISOString(),
      success: false,
      method: 'Basic Meta Extraction',
      mediaType: detectMediaType(url),
      error: '고급 추출 방법들이 실패하여 기본 메타데이터만 추출됨',
    };
  } catch (error) {
    // 완전 실패 시 최소한의 정보라도 반환
    return {
      title: extractDomain(url),
      content: '',
      textContent: '',
      excerpt: '',
      author: null,
      datePublished: null,
      leadImageUrl: null,
      url: url,
      domain: extractDomain(url),
      wordCount: 0,
      createdAt: new Date().toISOString(),
      readingTime: '0분',
      success: false,
      method: 'Failed',
      mediaType: detectMediaType(url),
      error: `모든 추출 방법 실패: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    };
  }
}

// 유틸리티 함수들
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return 'unknown';
  }
}

function calculateReadingTime(wordCount: number): string {
  const wordsPerMinute = 200;
  const minutes = Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  return `${minutes}분`;
}

// 에러 로깅 및 모니터링을 위한 헬퍼
function logError(context: string, error: any, metadata?: any) {
  console.error(`[${context}] 오류 발생:`, {
    error:
      error instanceof Error
        ? {
            message: error.message,
            stack: error.stack,
            name: error.name,
          }
        : error,
    metadata,
    timestamp: new Date().toISOString(),
  });
}

// 성능 모니터링을 위한 헬퍼
function createPerformanceTimer(label: string) {
  const start = Date.now();
  return {
    end: () => {
      const duration = Date.now() - start;
      console.log(`[Performance] ${label}: ${duration}ms`);
      return duration;
    },
  };
}
