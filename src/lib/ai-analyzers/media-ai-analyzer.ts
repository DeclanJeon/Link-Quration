// src/lib/ai-analyzers/media-ai-analyzer.ts
import { OpenRouterClient } from '@/lib/openrouter';
import { VideoAnalysisResult } from '@/lib/media-analyzers/video-analyzer';
import {
  MediaAnalysisResult,
  Quote,
  TimelineSegment,
} from '@/types/media-analysis';

export interface AIMediaAnalysis {
  summary: string;
  keyTopics?: string[];
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

  // 🆕 확장된 미디어 분석 메서드
  async analyzeMediaContentAdvanced(
    mediaData: MediaAnalysisResult
  ): Promise<MediaAnalysisResult> {
    console.log('🧠 고급 미디어 AI 분석 시작...');

    try {
      // 1. 전체 콘텐츠 요약
      const overallSummary = await this.generateAdvancedSummary(mediaData);

      // 2. 타임라인 세그먼트 AI 분석
      const enhancedTimeline = await this.enhanceTimelineWithAI(
        mediaData.timeline,
        mediaData.metadata
      );

      // 3. 핵심 주제 추출
      const keyTopics = await this.extractKeyTopics(mediaData);

      // 4. 학습 목표 생성
      const learningObjectives = await this.generateLearningObjectives(
        mediaData
      );

      // 5. 명언/인용구 추출
      const notableQuotes = await this.extractNotableQuotes(mediaData);

      // 6. 실행 가능한 액션 아이템
      const actionItems = await this.generateActionItems(mediaData);

      return {
        ...mediaData,
        overallSummary,
        timeline: enhancedTimeline,
        keyTopics,
        learningObjectives,
        notableQuotes,
        actionItems,
        aiModel: this.modelId,
        analysisTimestamp: new Date().toISOString(),
        confidence: 0.9,
      };
    } catch (error) {
      console.error('고급 미디어 분석 실패:', error);
      return {
        ...mediaData,
        overallSummary: '고급 분석을 완료할 수 없습니다.',
        aiModel: this.modelId,
        analysisTimestamp: new Date().toISOString(),
        confidence: 0.3,
      };
    }
  }

  // 🆕 고급 요약 생성
  private async generateAdvancedSummary(
    mediaData: MediaAnalysisResult
  ): Promise<string> {
    const prompt = `
다음 ${
      mediaData.metadata.mediaType
    } 콘텐츠를 종합적으로 분석해서 핵심 요약을 작성해주세요:

📹 제목: ${mediaData.metadata.title}
⏱️ 길이: ${mediaData.metadata.durationFormatted}
📝 설명: ${mediaData.metadata.description}
👤 채널: ${mediaData.metadata.channelName}
📊 조회수: ${mediaData.metadata.viewCount?.toLocaleString()}회

🎯 분석 요구사항:
1. 이 콘텐츠의 핵심 메시지와 가치
2. 시청자가 얻을 수 있는 주요 인사이트
3. 콘텐츠의 독특한 관점이나 접근법
4. 실용적 활용 방안

3-4문장으로 명확하고 매력적인 요약을 작성해주세요:`;

    const response = await this.openRouter.createChatCompletion(
      [
        {
          role: 'system',
          content:
            '당신은 미디어 콘텐츠 분석 전문가입니다. 시청자에게 가치 있는 인사이트를 제공하는 요약을 작성합니다.',
        },
        { role: 'user', content: prompt },
      ],
      this.modelId,
      { maxTokens: 600, temperature: 0.3 }
    );

    return response.trim();
  }

  // 🆕 타임라인 AI 강화
  private async enhanceTimelineWithAI(
    timeline: TimelineSegment[],
    metadata: any
  ): Promise<TimelineSegment[]> {
    const enhancedTimeline: TimelineSegment[] = [];

    for (const segment of timeline) {
      if (!segment.transcript || segment.transcript.length < 50) {
        enhancedTimeline.push(segment);
        continue;
      }

      const prompt = `
다음 ${metadata.mediaType} 구간을 분석해서 JSON으로 응답해주세요:

🎬 전체 제목: ${metadata.title}
⏰ 구간: ${segment.startTime.formatted} - ${segment.endTime.formatted}
📝 구간 내용: ${segment.transcript}

다음 JSON 형식으로 정확히 응답해주세요:
{
  "title": "이 구간의 핵심 주제 (간결하게)",
  "summary": "구간 내용 요약 (2-3문장)",
  "keyPoints": ["핵심 포인트1", "핵심 포인트2", "핵심 포인트3"],
  "importance": "high|medium|low",
  "tags": ["관련태그1", "관련태그2"]
}`;

      try {
        const response = await this.openRouter.createChatCompletion(
          [
            {
              role: 'system',
              content:
                '미디어 구간 분석 전문가로서 정확한 JSON 형식으로 응답합니다.',
            },
            { role: 'user', content: prompt },
          ],
          this.modelId,
          { maxTokens: 800, temperature: 0.3 }
        );

        const analysis = JSON.parse(response.trim());

        enhancedTimeline.push({
          ...segment,
          title: analysis.title || segment.title,
          summary: analysis.summary || '',
          keyPoints: analysis.keyPoints || [],
          importance: analysis.importance || 'medium',
          tags: analysis.tags || [],
        });
      } catch (error) {
        console.error(`구간 ${segment.id} 분석 실패:`, error);
        enhancedTimeline.push(segment);
      }
    }

    return enhancedTimeline;
  }

  // 🆕 핵심 주제 추출
  private async extractKeyTopics(
    mediaData: MediaAnalysisResult
  ): Promise<string[]> {
    const prompt = `
다음 ${mediaData.metadata.mediaType} 콘텐츠에서 핵심 주제들을 추출해주세요:

제목: ${mediaData.metadata.title}
설명: ${mediaData.metadata.description}
카테고리: ${mediaData.metadata.category}

5-7개의 핵심 주제를 쉼표로 구분해서 나열해주세요 (예: 인공지능, 머신러닝, 데이터분석):`;

    try {
      const response = await this.openRouter.createChatCompletion(
        [{ role: 'user', content: prompt }],
        this.modelId,
        { maxTokens: 200, temperature: 0.4 }
      );

      return response
        .split(',')
        .map((topic) => topic.trim())
        .filter((topic) => topic.length > 0);
    } catch (error) {
      console.error('핵심 주제 추출 실패:', error);
      return [];
    }
  }

  // 🆕 학습 목표 생성
  private async generateLearningObjectives(
    mediaData: MediaAnalysisResult
  ): Promise<string[]> {
    const prompt = `
다음 ${mediaData.metadata.mediaType} 콘텐츠를 시청한 후 달성할 수 있는 학습 목표를 3-5개 생성해주세요:

제목: ${mediaData.metadata.title}
길이: ${mediaData.metadata.durationFormatted}
설명: ${mediaData.metadata.description}

각 목표는 "~할 수 있다" 형태로 구체적이고 측정 가능하게 작성해주세요.
쉼표로 구분해서 나열해주세요:`;

    try {
      const response = await this.openRouter.createChatCompletion(
        [{ role: 'user', content: prompt }],
        this.modelId,
        { maxTokens: 400, temperature: 0.3 }
      );

      return response
        .split(',')
        .map((objective) => objective.trim())
        .filter((obj) => obj.length > 0);
    } catch (error) {
      console.error('학습 목표 생성 실패:', error);
      return [];
    }
  }

  // 🆕 명언/인용구 추출
  private async extractNotableQuotes(
    mediaData: MediaAnalysisResult
  ): Promise<Quote[]> {
    const quotes: Quote[] = [];

    // 타임라인에서 중요도가 높은 구간의 인용구 추출
    const highImportanceSegments = mediaData.timeline.filter(
      (segment) => segment.importance === 'high' && segment.transcript
    );

    for (const segment of highImportanceSegments.slice(0, 3)) {
      // 최대 3개 구간만
      const prompt = `
다음 구간에서 기억할 만한 명언이나 핵심 문장을 1-2개 추출해주세요:

구간: ${segment.startTime.formatted} - ${segment.endTime.formatted}
내용: ${segment.transcript}

JSON 형식으로 응답해주세요:
[
  {
    "text": "인용구 내용",
    "context": "인용구의 맥락 설명"
  }
]

명언이 없다면 빈 배열 []을 반환하세요.`;

      try {
        const response = await this.openRouter.createChatCompletion(
          [{ role: 'user', content: prompt }],
          this.modelId,
          { maxTokens: 400, temperature: 0.2 }
        );

        const extractedQuotes = JSON.parse(response.trim());

        if (Array.isArray(extractedQuotes)) {
          extractedQuotes.forEach((quote: any, index: number) => {
            quotes.push({
              text: quote.text,
              timestamp: segment.startTime,
              context: quote.context,
              importance: 'high',
              speaker: mediaData.metadata.channelName,
            });
          });
        }
      } catch (error) {
        console.error(`구간 ${segment.id} 인용구 추출 실패:`, error);
      }
    }

    return quotes;
  }

  // 🆕 실행 가능한 액션 아이템 생성
  private async generateActionItems(
    mediaData: MediaAnalysisResult
  ): Promise<string[]> {
    const prompt = `
다음 ${
      mediaData.metadata.mediaType
    } 콘텐츠를 바탕으로 시청자가 실제로 실행할 수 있는 액션 아이템을 3-5개 생성해주세요:

제목: ${mediaData.metadata.title}
설명: ${mediaData.metadata.description}
주요 주제: ${mediaData.keyTopics?.join(', ')}

각 액션은 구체적이고 실행 가능해야 합니다.
쉼표로 구분해서 나열해주세요:`;

    try {
      const response = await this.openRouter.createChatCompletion(
        [{ role: 'user', content: prompt }],
        this.modelId,
        { maxTokens: 400, temperature: 0.4 }
      );

      return response
        .split(',')
        .map((action) => action.trim())
        .filter((action) => action.length > 0);
    } catch (error) {
      console.error('액션 아이템 생성 실패:', error);
      return [];
    }
  }

  async analyzeVideoContent(
    videoData: VideoAnalysisResult
  ): Promise<AIMediaAnalysis> {
    const summary = await this.generateVideoSummary(videoData);
    const timeline = await this.generateVideoTimeline(videoData);
    const metadata = await this.analyzeVideoMetadata(videoData);

    return {
      summary: summary,
      timeline: timeline,
      keyTopics: [],
      mainTakeaways: [],
      targetAudience: '',
      difficulty: 'beginner',
      actionItems: [],
      relatedTopics: [],
      sentiment: 'neutral',
      contentType: 'educational',
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
      timeline = await this.analyzeChapterBasedTimeline(videoData);
    } else {
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
