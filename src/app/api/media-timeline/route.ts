// src/app/api/media-timeline/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { OpenRouterClient } from '@/lib/openrouter';
import { VideoAnalyzer } from '@/lib/media-analyzers/video-analyzer';
import { MediaAIAnalyzer } from '@/lib/ai-analyzers/media-ai-analyzer';

interface MediaTimelineRequest {
  mediaUrl: string;
  apiKey: string;
  modelId: string;
  options?: {
    segmentDuration?: number; // seconds
    includeTranscript?: boolean;
    analysisDepth?: 'basic' | 'detailed' | 'comprehensive';
    language?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const { mediaUrl, apiKey, modelId, options }: MediaTimelineRequest =
      await request.json();

    if (!mediaUrl || !apiKey || !modelId) {
      return NextResponse.json(
        { error: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      );
    }

    console.log('🎬 미디어 타임라인 분석 시작:', mediaUrl);

    // 1. 미디어 기본 분석
    const videoAnalyzer = new VideoAnalyzer();
    const mediaAnalysis = await videoAnalyzer.analyzeMediaContent(mediaUrl);

    // 2. AI 타임라인 강화
    const openRouter = new OpenRouterClient(apiKey);
    const mediaAIAnalyzer = new MediaAIAnalyzer(openRouter, modelId);

    const enhancedAnalysis = await mediaAIAnalyzer.analyzeMediaContentAdvanced(
      mediaAnalysis
    );

    // 3. 타임라인 세부 정보 추가
    const detailedTimeline = await generateDetailedTimeline(
      enhancedAnalysis.timeline,
      openRouter,
      modelId,
      options
    );

    return NextResponse.json({
      success: true,
      data: {
        metadata: enhancedAnalysis.metadata,
        timeline: detailedTimeline,
        overallSummary: enhancedAnalysis.overallSummary,
        keyTopics: enhancedAnalysis.keyTopics,
        notableQuotes: enhancedAnalysis.notableQuotes,
        chapters: enhancedAnalysis.chapters,
      },
      analyzedAt: new Date().toISOString(),
      model: modelId,
    });
  } catch (error) {
    console.error('❌ 미디어 타임라인 분석 오류:', error);
    return NextResponse.json(
      {
        error: '미디어 타임라인 분석 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// 상세 타임라인 생성
async function generateDetailedTimeline(
  timeline: any[],
  openRouter: OpenRouterClient,
  modelId: string,
  options?: any
): Promise<any[]> {
  const detailedTimeline = [];

  for (const segment of timeline) {
    if (!segment.transcript || segment.transcript.length < 50) {
      detailedTimeline.push(segment);
      continue;
    }

    const prompt = `
다음 미디어 구간을 상세히 분석해서 JSON으로 응답해주세요:

⏰ 시간: ${segment.startTime.formatted} - ${segment.endTime.formatted}
📝 내용: ${segment.transcript}

다음 JSON 형식으로 응답해주세요:
{
  "title": "구간 제목 (간결하고 명확하게)",
  "summary": "구간 요약 (2-3문장)",
  "keyPoints": ["핵심 포인트1", "핵심 포인트2", "핵심 포인트3"],
  "importance": "high|medium|low",
  "tags": ["태그1", "태그2"],
  "actionItems": ["실행 가능한 액션1", "액션2"],
  "concepts": ["핵심 개념1", "핵심 개념2"],
  "difficulty": "beginner|intermediate|advanced",
  "noteWorthy": "이 구간에서 특별히 주목할 점"
}`;

    try {
      const response = await openRouter.createChatCompletion(
        [
          {
            role: 'system',
            content:
              '미디어 구간 분석 전문가로서 상세하고 정확한 분석을 JSON 형식으로 제공합니다.',
          },
          { role: 'user', content: prompt },
        ],
        modelId,
        { maxTokens: 1000, temperature: 0.3 }
      );

      const analysis = JSON.parse(response.trim());

      detailedTimeline.push({
        ...segment,
        title: analysis.title || segment.title,
        summary: analysis.summary || segment.summary,
        keyPoints: analysis.keyPoints || segment.keyPoints,
        importance: analysis.importance || segment.importance,
        tags: [...(segment.tags || []), ...(analysis.tags || [])],
        actionItems: analysis.actionItems || [],
        concepts: analysis.concepts || [],
        difficulty: analysis.difficulty || 'intermediate',
        noteWorthy: analysis.noteWorthy || '',
      });
    } catch (error) {
      console.error(`구간 ${segment.id} 상세 분석 실패:`, error);
      detailedTimeline.push(segment);
    }
  }

  return detailedTimeline;
}

// GET 메서드로 지원되는 미디어 플랫폼 정보 제공
export async function GET() {
  return NextResponse.json({
    supportedPlatforms: [
      {
        name: 'YouTube',
        platform: 'youtube',
        features: [
          'transcript',
          'chapters',
          'thumbnails',
          'metadata',
          'timeline_analysis',
        ],
        patterns: ['youtube.com/watch', 'youtu.be/'],
      },
      {
        name: 'Vimeo',
        platform: 'vimeo',
        features: ['metadata', 'thumbnails'],
        patterns: ['vimeo.com/'],
      },
    ],
    analysisOptions: {
      segmentDuration: {
        min: 60,
        max: 600,
        default: 300,
        description: '타임라인 구간 길이 (초)',
      },
      analysisDepth: {
        options: ['basic', 'detailed', 'comprehensive'],
        default: 'detailed',
        description: '분석 깊이',
      },
    },
  });
}
