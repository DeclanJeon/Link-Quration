// src/lib/ai-analyzers/media-ai-analyzer.ts
import { OpenRouterClient } from '@/lib/openrouter';
import { VideoAnalysisResult } from '@/lib/media-analyzers/video-analyzer';

export interface AIMediaAnalysis {
  summary: string;
  keyTopics?: string[]; // 선택적 필드로 변경
  timeline: Array<{
    timeRange: string;
    topic: string;
    summary: string;
    keyPoints: string[];
    importance: 'high' | 'medium' | 'low';
  }>;
  mainTakeaways: string[];
  targetAudience: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  actionItems: string[];
  relatedTopics: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  contentType:
    | 'educational'
    | 'entertainment'
    | 'news'
    | 'review'
    | 'tutorial'
    | 'discussion';
}

export class MediaAIAnalyzer {
  constructor(private openRouter: OpenRouterClient, private modelId: string) {}

  async analyzeVideoContent(
    videoData: VideoAnalysisResult
  ): Promise<AIMediaAnalysis> {
    const summary = await this.generateVideoSummary(videoData);
    const timeline = await this.generateVideoTimeline(videoData);
    const metadata = await this.analyzeVideoMetadata(videoData);

    return {
      summary: summary,
      timeline: timeline,
      keyTopics: [], // 기본값으로 빈 배열 제공
      mainTakeaways: [], // 기본값으로 빈 배열 제공
      targetAudience: '', // 기본값으로 빈 문자열 제공
      difficulty: 'beginner', // 기본값으로 'beginner' 제공
      actionItems: [], // 기본값으로 빈 배열 제공
      relatedTopics: [], // 기본값으로 빈 배열 제공
      sentiment: 'neutral', // 기본값으로 'neutral' 제공
      contentType: 'educational', // 기본값으로 'educational' 제공
      ...metadata,
    };
  }

  private async generateVideoSummary(
    videoData: VideoAnalysisResult
  ): Promise<string> {
    const prompt = `
다음 YouTube 동영상을 분석해서 핵심 내용을 3-4문장으로 요약해주세요:

제목: ${videoData.title}
설명: ${videoData.description}
길이: ${Math.floor(videoData.duration / 60)}분 ${videoData.duration % 60}초
작성자: ${videoData.author}
트랜스크립트: ${videoData.transcript.substring(0, 4000)}

이 동영상의 핵심 내용과 시청자가 얻을 수 있는 주요 가치를 요약해주세요:`;

    const response = await this.openRouter.createChatCompletion(
      [
        {
          role: 'system',
          content:
            '당신은 동영상 콘텐츠 분석 전문가입니다. 주어진 정보를 바탕으로 명확하고 유용한 요약을 제공합니다.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      this.modelId,
      { maxTokens: 500, temperature: 0.3 }
    );

    return response.trim();
  }

  private async generateVideoTimeline(videoData: VideoAnalysisResult): Promise<
    Array<{
      timeRange: string;
      topic: string;
      summary: string;
      keyPoints: string[];
      importance: 'high' | 'medium' | 'low';
    }>
  > {
    let timeline: any[] = [];

    if (videoData.chapters && videoData.chapters.length > 0) {
      // 챕터 기반 타임라인 분석
      timeline = await this.analyzeChapterBasedTimeline(videoData);
    } else {
      // 트랜스크립트 기반 타임라인 분석
      timeline = await this.analyzeTranscriptBasedTimeline(videoData);
    }

    return timeline;
  }

  private async analyzeChapterBasedTimeline(
    videoData: VideoAnalysisResult
  ): Promise<any[]> {
    const timeline: any[] = [];

    for (const chapter of videoData.chapters) {
      const prompt = `
다음 동영상 챕터를 분석해주세요:

동영상 제목: ${videoData.title}
챕터 제목: ${chapter.title}
시간: ${chapter.timestamp}
전체 트랜스크립트에서 해당 부분: ${this.extractChapterTranscript(
        videoData.transcript,
        chapter
      )}

다음 JSON 형식으로 응답해주세요:
{
  "topic": "이 챕터의 주요 주제",
  "summary": "이 챕터 내용 요약 (2-3문장)",
  "keyPoints": ["핵심 포인트1", "핵심 포인트2", "핵심 포인트3"],
  "importance": "high|medium|low"
}`;

      try {
        const response = await this.openRouter.createChatCompletion(
          [
            {
              role: 'system',
              content:
                '당신은 동영상 챕터 분석 전문가입니다. 주어진 챕터의 내용을 정확히 분석하고 JSON 형식으로 응답합니다.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          this.modelId,
          { maxTokens: 800, temperature: 0.3 }
        );

        const analysis = JSON.parse(response.trim());

        timeline.push({
          timeRange: `${chapter.timestamp} - ${this.formatTime(
            chapter.endTime
          )}`,
          topic: analysis.topic,
          summary: analysis.summary,
          keyPoints: analysis.keyPoints || [],
          importance: analysis.importance || 'medium',
        });
      } catch (error) {
        console.error('챕터 분석 실패:', error);
        // 기본값으로 추가
        timeline.push({
          timeRange: `${chapter.timestamp}`,
          topic: chapter.title,
          summary: '챕터 분석을 완료할 수 없습니다.',
          keyPoints: [],
          importance: 'medium' as const,
        });
      }
    }

    return timeline;
  }

  private async analyzeTranscriptBasedTimeline(
    videoData: VideoAnalysisResult
  ): Promise<any[]> {
    // 트랜스크립트를 시간 구간별로 나누어 분석
    const duration = videoData.duration;
    const segmentDuration = Math.min(300, Math.max(60, duration / 8)); // 1-5분 구간
    const segments = Math.ceil(duration / segmentDuration);

    const timeline: any[] = [];

    for (let i = 0; i < segments; i++) {
      const startTime = i * segmentDuration;
      const endTime = Math.min((i + 1) * segmentDuration, duration);

      // 해당 시간대의 트랜스크립트 추출 (근사치)
      const transcriptSegment = this.extractTranscriptSegment(
        videoData.transcript,
        startTime,
        endTime,
        duration
      );

      if (transcriptSegment.trim().length < 50) continue; // 너무 짧은 구간 스킵

      const prompt = `
다음 동영상 구간을 분석해주세요:

동영상 제목: ${videoData.title}
시간 구간: ${this.formatTime(startTime)} - ${this.formatTime(endTime)}
해당 구간 내용: ${transcriptSegment}

다음 JSON 형식으로 응답해주세요:
{
  "topic": "이 구간의 주요 주제",
  "summary": "이 구간 내용 요약 (2-3문장)",
  "keyPoints": ["핵심 포인트1", "핵심 포인트2"],
  "importance": "high|medium|low"
}`;

      try {
        const response = await this.openRouter.createChatCompletion(
          [
            {
              role: 'system',
              content:
                '당신은 동영상 구간 분석 전문가입니다. 주어진 구간의 내용을 정확히 분석하고 JSON 형식으로 응답합니다.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          this.modelId,
          { maxTokens: 600, temperature: 0.3 }
        );

        const analysis = JSON.parse(response.trim());

        timeline.push({
          timeRange: `${this.formatTime(startTime)} - ${this.formatTime(
            endTime
          )}`,
          topic: analysis.topic,
          summary: analysis.summary,
          keyPoints: analysis.keyPoints || [],
          importance: analysis.importance || 'medium',
        });
      } catch (error) {
        console.error('구간 분석 실패:', error);
      }
    }

    return timeline;
  }

  private async analyzeVideoMetadata(
    videoData: VideoAnalysisResult
  ): Promise<Partial<AIMediaAnalysis>> {
    const prompt = `
다음 동영상을 종합적으로 분석해주세요:

제목: ${videoData.title}
설명: ${videoData.description}
작성자: ${videoData.author}
카테고리: ${videoData.category}
태그: ${videoData.tags.join(', ')}
트랜스크립트 샘플: ${videoData.transcript.substring(0, 2000)}

다음 JSON 형식으로 응답해주세요:
{
  "keyTopics": ["주요 주제1", "주요 주제2", "주요 주제3"],
  "mainTakeaways": ["핵심 메시지1", "핵심 메시지2", "핵심 메시지3"],
  "targetAudience": "대상 시청자층 설명",
  "difficulty": "beginner|intermediate|advanced",
  "actionItems": ["실행 가능한 액션1", "실행 가능한 액션2"],
  "relatedTopics": ["관련 주제1", "관련 주제2"],
  "sentiment": "positive|neutral|negative",
  "contentType": "educational|entertainment|news|review|tutorial|discussion"
}`;

    try {
      const response = await this.openRouter.createChatCompletion(
        [
          {
            role: 'system',
            content:
              '당신은 동영상 메타데이터 분석 전문가입니다. 주어진 정보를 바탕으로 정확한 분석을 JSON 형식으로 제공합니다.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        this.modelId,
        { maxTokens: 1000, temperature: 0.3 }
      );

      return JSON.parse(response.trim());
    } catch (error) {
      console.error('메타데이터 분석 실패:', error);

      // 기본값 반환
      return {
        keyTopics: [],
        mainTakeaways: ['동영상 분석을 완료할 수 없습니다.'],
        targetAudience: '일반 시청자',
        difficulty: 'intermediate' as const,
        actionItems: [],
        relatedTopics: [],
        sentiment: 'neutral' as const,
        contentType: 'educational' as const,
      };
    }
  }

  // 유틸리티 메서드들
  private extractChapterTranscript(
    fullTranscript: string,
    chapter: any
  ): string {
    // 간단한 근사치로 챕터에 해당하는 트랜스크립트 부분 추출
    const totalLength = fullTranscript.length;
    const startRatio = chapter.startTime / 3600; // 대략적인 비율
    const endRatio = chapter.endTime > 0 ? chapter.endTime / 3600 : 1;

    const startIndex = Math.floor(totalLength * startRatio);
    const endIndex = Math.floor(totalLength * endRatio);

    return fullTranscript.substring(startIndex, endIndex);
  }

  private extractTranscriptSegment(
    transcript: string,
    startTime: number,
    endTime: number,
    totalDuration: number
  ): string {
    const totalLength = transcript.length;
    const startRatio = startTime / totalDuration;
    const endRatio = endTime / totalDuration;

    const startIndex = Math.floor(totalLength * startRatio);
    const endIndex = Math.floor(totalLength * endRatio);

    return transcript.substring(startIndex, endIndex);
  }

  private formatTime(seconds: number): string {
    if (seconds < 0) return 'End';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs
        .toString()
        .padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  }
}
