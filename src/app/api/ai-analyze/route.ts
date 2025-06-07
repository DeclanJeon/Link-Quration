// src/app/api/ai-analyze/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { OpenRouterClient } from '@/lib/openrouter';
import { AnalysisRequest, AIAnalysisResult } from '@/types/ai-analyze';
import { VideoAnalyzer } from '@/lib/media-analyzers/video-analyzer';
import { MediaAIAnalyzer } from '@/lib/ai-analyzers/media-ai-analyzer';
import {
  MediaAnalysisResult,
  MediaDetectionResult,
  MediaType,
  MediaPlatform,
} from '@/types/media-analysis';

// 🆕 확장된 요청 타입
interface ExtendedAnalysisRequest extends AnalysisRequest {
  isMediaContent?: boolean;
  mediaUrl?: string;
  mediaAnalysisOptions?: {
    includeTimeline?: boolean;
    includeTranscript?: boolean;
    analysisDepth?: 'basic' | 'detailed' | 'comprehensive';
    extractQuotes?: boolean;
    generateChapters?: boolean;
  };
}

export async function POST(request: NextRequest) {
  try {
    const {
      extractedData,
      apiKey,
      modelId,
      analysisType,
      isMediaContent,
      mediaUrl,
      mediaAnalysisOptions,
    }: ExtendedAnalysisRequest = await request.json();

    if (!extractedData || !apiKey || !modelId) {
      return NextResponse.json(
        { error: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      );
    }

    console.log(
      `🧠 AI 분석 시작: ${modelId}, 타입: ${analysisType}, 미디어: ${isMediaContent}`
    );

    const openRouter = new OpenRouterClient(apiKey);
    let analysisResult: any;

    // 🎬 미디어 콘텐츠 분석 분기
    if (isMediaContent && mediaUrl) {
      analysisResult = await analyzeMediaContent(
        openRouter,
        modelId,
        mediaUrl,
        extractedData,
        mediaAnalysisOptions
      );
    } else {
      // 기존 텍스트 분석 로직
      switch (analysisType) {
        case 'summary':
          analysisResult = await generateSummary(
            openRouter,
            modelId,
            extractedData
          );
          break;
        case 'tags':
          analysisResult = await generateTags(
            openRouter,
            modelId,
            extractedData
          );
          break;
        case 'timeline':
          analysisResult = await generateTimeline(
            openRouter,
            modelId,
            extractedData
          );
          break;
        case 'complete':
        default:
          analysisResult = await generateCompleteAnalysis(
            openRouter,
            modelId,
            extractedData
          );
          break;
      }
    }

    return NextResponse.json({
      success: true,
      data: analysisResult,
      analyzedAt: new Date().toISOString(),
      model: modelId,
      isMediaAnalysis: isMediaContent || false,
    });
  } catch (error) {
    console.error('❌ AI 분석 오류:', error);
    return NextResponse.json(
      {
        error: 'AI 분석 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// 🆕 미디어 콘텐츠 분석 함수
async function analyzeMediaContent(
  openRouter: OpenRouterClient,
  modelId: string,
  mediaUrl: string,
  extractedData: any,
  options?: any
): Promise<MediaAnalysisResult> {
  console.log('🎬 미디어 콘텐츠 분석 시작...');

  try {
    // 1. 미디어 플랫폼 감지
    const mediaDetection = detectMediaPlatform(mediaUrl);

    if (!mediaDetection.isMedia) {
      throw new Error('지원하지 않는 미디어 형식입니다.');
    }

    // 2. 미디어 기본 분석
    const videoAnalyzer = new VideoAnalyzer();
    let basicMediaAnalysis: MediaAnalysisResult;

    switch (mediaDetection.platform) {
      case 'youtube':
      case 'vimeo':
        basicMediaAnalysis = await videoAnalyzer.analyzeMediaContent(mediaUrl);
        break;
      default:
        throw new Error(
          `${mediaDetection.platform} 플랫폼은 아직 지원되지 않습니다.`
        );
    }

    // 3. AI 고급 분석 (옵션에 따라)
    const analysisDepth = options?.analysisDepth || 'detailed';

    if (analysisDepth === 'basic') {
      return basicMediaAnalysis;
    }

    // 4. AI 분석기로 고급 분석
    const mediaAIAnalyzer = new MediaAIAnalyzer(openRouter, modelId);
    const enhancedAnalysis = await mediaAIAnalyzer.analyzeMediaContentAdvanced(
      basicMediaAnalysis
    );

    // 5. 추가 분석 옵션 처리
    if (
      options?.includeTranscript &&
      !enhancedAnalysis.timeline.some((t) => t.transcript)
    ) {
      console.log('📝 트랜스크립트 포함 요청됨');
      // 트랜스크립트가 없는 경우 추가 처리
    }

    if (options?.extractQuotes && enhancedAnalysis.notableQuotes.length === 0) {
      console.log('💬 인용구 추출 시도...');
      // 추가 인용구 추출 로직
    }

    console.log(
      `✅ 미디어 분석 완료: ${enhancedAnalysis.timeline.length}개 구간, ${enhancedAnalysis.keyTopics.length}개 주제`
    );

    return enhancedAnalysis;
  } catch (error) {
    console.error('❌ 미디어 분석 실패:', error);

    // 실패 시 기본 분석 결과 반환
    return createFallbackMediaAnalysis(mediaUrl, extractedData, error as Error);
  }
}

// 🆕 미디어 플랫폼 감지 함수
function detectMediaPlatform(url: string): MediaDetectionResult {
  const patterns = [
    {
      regex: /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      platform: 'youtube' as MediaPlatform,
      mediaType: 'video' as MediaType,
      features: [
        'transcript',
        'chapters',
        'thumbnails',
        'metadata',
        'timeline_analysis',
      ],
    },
    {
      regex: /vimeo\.com\/(\d+)/,
      platform: 'vimeo' as MediaPlatform,
      mediaType: 'video' as MediaType,
      features: ['metadata', 'thumbnails'],
    },
    {
      regex: /(?:soundcloud\.com|spotify\.com)/,
      platform: 'soundcloud' as MediaPlatform,
      mediaType: 'audio' as MediaType,
      features: ['metadata'],
    },
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern.regex);
    if (match) {
      return {
        isMedia: true,
        mediaType: pattern.mediaType,
        platform: pattern.platform,
        mediaId: match[1],
        confidence: 0.9,
        supportedFeatures: pattern.features as any[],
      };
    }
  }

  return {
    isMedia: false,
    mediaType: 'unknown' as MediaType,
    platform: 'generic' as MediaPlatform,
    confidence: 0,
    supportedFeatures: [],
  };
}

// 🆕 실패 시 대체 분석 결과
function createFallbackMediaAnalysis(
  url: string,
  extractedData: any,
  error: Error
): MediaAnalysisResult {
  const detection = detectMediaPlatform(url);

  return {
    metadata: {
      id: 'fallback',
      title: extractedData.title || '미디어 분석 실패',
      description: extractedData.description || error.message,
      duration: 0,
      durationFormatted: '알 수 없음',
      platform: detection.platform,
      mediaType: detection.mediaType,
      quality: {},
      language: 'ko',
    },
    timeline: [],
    overallSummary: `미디어 분석 중 오류가 발생했습니다: ${error.message}`,
    keyTopics: [],
    difficulty: 'intermediate',
    targetAudience: [],
    learningObjectives: [],
    relatedTopics: [],
    actionItems: [],
    notableQuotes: [],
    chapters: [],
    analysisTimestamp: new Date().toISOString(),
    aiModel: 'fallback',
    confidence: 0.1,
  };
}

// 기존 텍스트 분석 함수들 (그대로 유지)
async function generateCompleteAnalysis(
  openRouter: OpenRouterClient,
  modelId: string,
  extractedData: any
): Promise<AIAnalysisResult> {
  const prompt = `
다음 웹 콘텐츠를 종합적으로 분석해서 JSON 형식으로 응답해주세요:

제목: ${extractedData.title}
URL: ${extractedData.url}
도메인: ${extractedData.domain}
내용: ${
    extractedData.textContent?.substring(0, 4000) ||
    extractedData.content?.substring(0, 4000)
  }

다음 형식으로 정확히 JSON만 응답해주세요:

{
  "summary": "3-4문장으로 핵심 내용 요약",
  "tags": ["관련태그1", "관련태그2", "관련태그3", "관련태그4", "관련태그5"],
  "category": "가장 적절한 카테고리 (기술/개발/디자인/비즈니스/마케팅/교육/뉴스/블로그/튜토리얼/리서치/기타 중 선택)",
  "timeline": [
    {
      "step": 1,
      "title": "단계 제목",
      "description": "단계별 설명",
      "timeEstimate": "예상 소요시간"
    }
  ],
  "keyPoints": ["핵심포인트1", "핵심포인트2", "핵심포인트3"],
  "difficulty": "beginner|intermediate|advanced",
  "contentType": "article|tutorial|video|news|research|blog|documentation",
  "readingGoals": ["이 콘텐츠를 읽고 얻을 수 있는 목표1", "목표2"],
  "relatedTopics": ["관련주제1", "관련주제2", "관련주제3"],
  "actionItems": ["실행할 수 있는 액션1", "액션2"]
}

참고사항:
- timeline은 튜토리얼이나 가이드 콘텐츠인 경우에만 생성하고, 일반 기사나 뉴스는 빈 배열로 설정
- YouTube 동영상인 경우 contentType을 "video"로 설정
- 태그는 구체적이고 검색 가능한 키워드로 생성
- 모든 텍스트는 한국어로 작성
`;

  try {
    const response = await openRouter.createChatCompletion(
      [
        {
          role: 'system',
          content:
            '당신은 웹 콘텐츠 분석 전문가입니다. 주어진 콘텐츠를 정확히 분석하고 구조화된 JSON 형식으로 응답합니다.',
        },
        { role: 'user', content: prompt },
      ],
      modelId,
      {
        maxTokens: 2000,
        temperature: 0.3,
      }
    );

    const cleanResponse = response.replace(/```json\n?|\n?```/g, '').trim();
    const parsedResult = JSON.parse(cleanResponse);

    return parsedResult;
  } catch (error) {
    console.error('AI 분석 파싱 오류:', error);

    return {
      summary: '콘텐츠 요약을 생성할 수 없습니다.',
      tags: [extractedData.domain || 'web'],
      category: '기타',
      timeline: [],
      keyPoints: ['콘텐츠 분석 실패'],
      difficulty: 'intermediate',
      contentType: 'article',
      readingGoals: ['콘텐츠 내용 파악'],
      relatedTopics: [],
      actionItems: [],
    };
  }
}

async function generateSummary(
  openRouter: OpenRouterClient,
  modelId: string,
  extractedData: any
): Promise<Partial<AIAnalysisResult>> {
  const prompt = `
다음 콘텐츠를 3-4문장으로 핵심만 요약해주세요:

제목: ${extractedData.title}
내용: ${extractedData.textContent?.substring(0, 2000)}

요약:`;

  const response = await openRouter.createChatCompletion(
    [{ role: 'user', content: prompt }],
    modelId,
    { maxTokens: 300, temperature: 0.3 }
  );

  return { summary: response.trim() };
}

async function generateTags(
  openRouter: OpenRouterClient,
  modelId: string,
  extractedData: any
): Promise<Partial<AIAnalysisResult>> {
  const prompt = `
다음 콘텐츠에 적합한 태그 5개를 생성해주세요. 쉼표로 구분해서 나열해주세요:

제목: ${extractedData.title}
내용: ${extractedData.textContent?.substring(0, 1000)}

태그:`;

  const response = await openRouter.createChatCompletion(
    [{ role: 'user', content: prompt }],
    modelId,
    { maxTokens: 100, temperature: 0.4 }
  );

  const tags = response
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);

  return { tags: tags.slice(0, 5) };
}

async function generateTimeline(
  openRouter: OpenRouterClient,
  modelId: string,
  extractedData: any
): Promise<Partial<AIAnalysisResult>> {
  const prompt = `
다음 콘텐츠가 튜토리얼이나 가이드인 경우, 학습 단계를 JSON 배열로 생성해주세요:

제목: ${extractedData.title}
내용: ${extractedData.textContent?.substring(0, 2000)}

JSON 형식:
[
  {
    "step": 1,
    "title": "단계 제목",
    "description": "단계 설명",
    "timeEstimate": "예상 시간"
  }
]

튜토리얼이 아닌 경우 빈 배열 []을 반환하세요.`;

  const response = await openRouter.createChatCompletion(
    [{ role: 'user', content: prompt }],
    modelId,
    { maxTokens: 800, temperature: 0.3 }
  );

  try {
    const timeline = JSON.parse(response.trim());
    return { timeline: Array.isArray(timeline) ? timeline : [] };
  } catch {
    return { timeline: [] };
  }
}
