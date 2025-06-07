// src/app/api/ai-analyze/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { OpenRouterClient } from '@/lib/openrouter';
import { AnalysisRequest, AIAnalysisResult } from '@/types/ai-analyze';

export async function POST(request: NextRequest) {
  try {
    const { extractedData, apiKey, modelId, analysisType }: AnalysisRequest =
      await request.json();

    if (!extractedData || !apiKey || !modelId) {
      return NextResponse.json(
        { error: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      );
    }

    console.log(`AI 분석 시작: ${modelId}, 타입: ${analysisType}`);

    const openRouter = new OpenRouterClient(apiKey);

    let analysisResult: Partial<AIAnalysisResult>;

    switch (analysisType) {
      case 'summary':
        analysisResult = await generateSummary(
          openRouter,
          modelId,
          extractedData
        );
        break;
      case 'tags':
        analysisResult = await generateTags(openRouter, modelId, extractedData);
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

    return NextResponse.json({
      success: true,
      data: analysisResult,
      analyzedAt: new Date().toISOString(),
      model: modelId,
    });
  } catch (error) {
    console.error('AI 분석 오류:', error);

    return NextResponse.json(
      {
        error: 'AI 분석 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// 완전한 AI 분석
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
        {
          role: 'user',
          content: prompt,
        },
      ],
      modelId,
      {
        maxTokens: 2000,
        temperature: 0.3,
      }
    );

    // JSON 파싱 시도
    const cleanResponse = response.replace(/```json\n?|\n?```/g, '').trim();
    const parsedResult = JSON.parse(cleanResponse);

    return parsedResult;
  } catch (error) {
    console.error('AI 분석 파싱 오류:', error);

    // 파싱 실패 시 기본값 반환
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

// 요약만 생성
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

// 태그만 생성
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

// 타임라인만 생성
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
