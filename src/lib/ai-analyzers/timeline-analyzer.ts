// src/lib/ai-analyzers/timeline-analyzer.ts
import { OpenRouterClient } from '@/lib/openrouter';
import {
  TimelineSegment,
  MediaMetadata,
  Quote,
  Chapter,
} from '@/types/media-analysis';

export class TimelineAnalyzer {
  constructor(private openRouter: OpenRouterClient, private modelId: string) {}

  // 🎯 타임라인 세그먼트 지능형 분석
  async analyzeTimelineSegments(
    segments: TimelineSegment[],
    metadata: MediaMetadata
  ): Promise<TimelineSegment[]> {
    console.log(`🔬 ${segments.length}개 타임라인 세그먼트 분석 시작...`);

    const analyzedSegments: TimelineSegment[] = [];

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];

      if (!segment.transcript || segment.transcript.length < 30) {
        analyzedSegments.push(segment);
        continue;
      }

      try {
        const analysis = await this.analyzeIndividualSegment(
          segment,
          metadata,
          i,
          segments.length
        );
        analyzedSegments.push({
          ...segment,
          ...analysis,
        });

        // API 호출 제한을 위한 딜레이
        if (i < segments.length - 1) {
          await this.delay(500);
        }
      } catch (error) {
        console.error(`세그먼트 ${segment.id} 분석 실패:`, error);
        analyzedSegments.push(segment);
      }
    }

    // 세그먼트 간 연관성 분석
    const connectedSegments = await this.analyzeSegmentConnections(
      analyzedSegments,
      metadata
    );

    console.log('✅ 타임라인 분석 완료!');
    return connectedSegments;
  }

  // 개별 세그먼트 분석
  private async analyzeIndividualSegment(
    segment: TimelineSegment,
    metadata: MediaMetadata,
    index: number,
    totalSegments: number
  ): Promise<Partial<TimelineSegment>> {
    const contextInfo = this.buildContextInfo(metadata, index, totalSegments);

    const prompt = `
${contextInfo}

다음 구간을 상세히 분석해주세요:

⏰ 시간: ${segment.startTime.formatted} - ${segment.endTime.formatted} (${segment.duration}초)
📝 내용: ${segment.transcript}

다음 JSON 형식으로 정확히 응답해주세요:
{
  "title": "이 구간의 핵심 주제 (간결하고 명확하게)",
  "summary": "구간 내용 요약 (2-3문장으로 핵심만)",
  "keyPoints": ["핵심 포인트1", "핵심 포인트2", "핵심 포인트3"],
  "importance": "high|medium|low",
  "tags": ["관련태그1", "관련태그2", "관련태그3"],
  "concepts": ["핵심개념1", "핵심개념2"],
  "difficulty": "beginner|intermediate|advanced",
  "actionItems": ["실행가능한액션1", "실행가능한액션2"],
  "emotions": ["감정톤1", "감정톤2"],
  "speakingStyle": "설명적|대화형|강의형|토론형|스토리텔링",
  "noteWorthy": "이 구간에서 특별히 주목할 점이나 인사이트"
}

중요도 판단 기준:
- high: 핵심 메시지, 결론, 중요한 개념 설명
- medium: 부연 설명, 예시, 일반적 내용
- low: 인사말, 잡담, 반복적 내용`;

    const response = await this.openRouter.createChatCompletion(
      [
        {
          role: 'system',
          content:
            '당신은 미디어 콘텐츠 타임라인 분석 전문가입니다. 각 구간의 내용을 정확히 파악하고 구조화된 분석을 제공합니다.',
        },
        { role: 'user', content: prompt },
      ],
      this.modelId,
      { maxTokens: 1200, temperature: 0.3 }
    );

    try {
      const analysis = JSON.parse(response.trim());
      return {
        title: analysis.title || segment.title,
        summary: analysis.summary || '',
        keyPoints: analysis.keyPoints || [],
        importance: analysis.importance || 'medium',
        tags: [...(segment.tags || []), ...(analysis.tags || [])],
        // 새로운 필드들 추가
        concepts: analysis.concepts || [],
        difficulty: analysis.difficulty || 'intermediate',
        actionItems: analysis.actionItems || [],
        emotions: analysis.emotions || [],
        speakingStyle: analysis.speakingStyle || '설명적',
        noteWorthy: analysis.noteWorthy || '',
      };
    } catch (parseError) {
      console.error('JSON 파싱 실패:', parseError);
      return {};
    }
  }

  // 세그먼트 간 연관성 분석
  private async analyzeSegmentConnections(
    segments: TimelineSegment[],
    metadata: MediaMetadata
  ): Promise<TimelineSegment[]> {
    if (segments.length < 2) return segments;

    console.log('🔗 세그먼트 간 연관성 분석...');

    const prompt = `
다음 ${metadata.mediaType} 콘텐츠의 타임라인 구조를 분석해주세요:

제목: ${metadata.title}
총 길이: ${metadata.durationFormatted}

타임라인 구간들:
${segments
  .map(
    (seg, i) =>
      `${i + 1}. ${seg.startTime.formatted}-${seg.endTime.formatted}: ${
        seg.title
      } (중요도: ${seg.importance})`
  )
  .join('\n')}

다음 JSON 형식으로 응답해주세요:
{
  "overallFlow": "전체적인 콘텐츠 흐름 설명 (3-4문장)",
  "keyTransitions": [
    {
      "fromSegment": 1,
      "toSegment": 2,
      "transitionType": "주제전환|심화설명|예시제시|결론도출|새로운관점",
      "description": "전환 설명"
    }
  ],
  "climaxSegments": [2, 5],
  "supportingSegments": [1, 3, 4],
  "conclusionSegments": [6]
}`;

    try {
      const response = await this.openRouter.createChatCompletion(
        [
          {
            role: 'system',
            content: '미디어 콘텐츠의 구조와 흐름을 분석하는 전문가입니다.',
          },
          { role: 'user', content: prompt },
        ],
        this.modelId,
        { maxTokens: 1000, temperature: 0.3 }
      );

      const flowAnalysis = JSON.parse(response.trim());

      // 분석 결과를 세그먼트에 반영
      return segments.map((segment, index) => ({
        ...segment,
        flowContext: {
          overallFlow: flowAnalysis.overallFlow,
          isClimax: flowAnalysis.climaxSegments?.includes(index + 1) || false,
          isSupporting:
            flowAnalysis.supportingSegments?.includes(index + 1) || false,
          isConclusion:
            flowAnalysis.conclusionSegments?.includes(index + 1) || false,
          transitions:
            flowAnalysis.keyTransitions?.filter(
              (t: any) =>
                t.fromSegment === index + 1 || t.toSegment === index + 1
            ) || [],
        },
      }));
    } catch (error) {
      console.error('흐름 분석 실패:', error);
      return segments;
    }
  }

  // 🎯 핵심 구간 자동 추출
  async extractKeyMoments(
    segments: TimelineSegment[]
  ): Promise<TimelineSegment[]> {
    const keyMoments = segments.filter((segment) => {
      // 중요도가 높거나 특별한 인사이트가 있는 구간
      return (
        segment.importance === 'high' ||
        (segment as any).noteWorthy?.length > 10 ||
        (segment as any).flowContext?.isClimax
      );
    });

    return keyMoments.slice(0, 5); // 최대 5개의 핵심 구간
  }

  // 🎯 학습용 타임라인 생성
  async generateLearningTimeline(segments: TimelineSegment[]): Promise<{
    prerequisites: string[];
    learningPath: Array<{
      phase: string;
      segments: number[];
      description: string;
      estimatedTime: string;
    }>;
    practicePoints: Array<{
      segmentIndex: number;
      practiceType: string;
      description: string;
    }>;
  }> {
    const prompt = `
다음 타임라인 구간들을 바탕으로 학습 경로를 설계해주세요:

${segments
  .map(
    (seg, i) =>
      `${i + 1}. ${seg.title} (${seg.duration}초, 난이도: ${
        (seg as any).difficulty || 'intermediate'
      })`
  )
  .join('\n')}

JSON 형식으로 응답해주세요:
{
  "prerequisites": ["사전지식1", "사전지식2"],
  "learningPath": [
    {
      "phase": "기초 이해",
      "segments": [1, 2],
      "description": "단계 설명",
      "estimatedTime": "예상 소요시간"
    }
  ],
  "practicePoints": [
    {
      "segmentIndex": 3,
      "practiceType": "실습|퀴즈|토론|정리",
      "description": "실습 내용"
    }
  ]
}`;

    try {
      const response = await this.openRouter.createChatCompletion(
        [{ role: 'user', content: prompt }],
        this.modelId,
        { maxTokens: 800, temperature: 0.3 }
      );

      return JSON.parse(response.trim());
    } catch (error) {
      console.error('학습 타임라인 생성 실패:', error);
      return {
        prerequisites: [],
        learningPath: [],
        practicePoints: [],
      };
    }
  }

  // 유틸리티 메서드들
  private buildContextInfo(
    metadata: MediaMetadata,
    index: number,
    total: number
  ): string {
    return `
📹 콘텐츠 정보:
- 제목: ${metadata.title}
- 총 길이: ${metadata.durationFormatted}
- 플랫폼: ${metadata.platform}
- 카테고리: ${metadata.category || '일반'}

📊 구간 위치: ${index + 1}/${total} (${Math.round(
      ((index + 1) / total) * 100
    )}% 지점)`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
