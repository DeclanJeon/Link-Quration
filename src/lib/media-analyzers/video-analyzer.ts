// src/lib/media-analyzers/video-analyzer.ts
import { YoutubeTranscript } from 'youtube-transcript';
import ytdl from '@distube/ytdl-core';
import {
  MediaAnalysisResult,
  MediaMetadata,
  TimelineSegment,
  Chapter,
  Quote,
  MediaType,
  MediaPlatform,
  TimeStamp,
} from '@/types/media-analysis';

export interface VideoAnalysisResult {
  title: string;
  description: string;
  duration: number;
  transcript: string;
  chapters: Array<{
    timestamp: string;
    title: string;
    description: string;
    startTime: number;
    endTime: number;
  }>;
  thumbnails: string[];
  author: string;
  publishedAt: string;
  viewCount: number;
  tags: string[];
  category: string;
}

export class VideoAnalyzer {
  async analyzeVideo(url: string): Promise<VideoAnalysisResult> {
    const platform = this.detectVideoPlatform(url);

    switch (platform) {
      case 'youtube':
        return await this.analyzeYouTubeVideo(url);
      case 'vimeo':
        return await this.analyzeVimeoVideo(url);
      default:
        throw new Error('지원하지 않는 동영상 플랫폼입니다.');
    }
  }

  // 🆕 새로운 메서드: 확장된 미디어 분석
  async analyzeMediaContent(url: string): Promise<MediaAnalysisResult> {
    const basicAnalysis = await this.analyzeVideo(url);
    const platform = this.detectVideoPlatform(url) as MediaPlatform;

    // 기본 분석을 새로운 타입으로 변환
    const metadata: MediaMetadata = {
      id: this.extractVideoId(url),
      title: basicAnalysis.title,
      description: basicAnalysis.description,
      duration: basicAnalysis.duration,
      durationFormatted: this.formatDuration(basicAnalysis.duration),
      thumbnailUrl: basicAnalysis.thumbnails[0],
      uploadDate: basicAnalysis.publishedAt,
      viewCount: basicAnalysis.viewCount,
      channelName: basicAnalysis.author,
      language: 'ko', // 기본값, 나중에 감지 로직 추가
      quality: {
        resolution: '1080p', // 기본값, 실제로는 ytdl에서 추출
        codec: 'h264',
      },
      platform: platform,
      mediaType: this.inferMediaType(basicAnalysis),
      category: basicAnalysis.category,
    };

    // 챕터를 새로운 형식으로 변환
    const chapters: Chapter[] = basicAnalysis.chapters.map((chapter, index) => ({
      id: `chapter-${index}`,
      title: chapter.title,
      startTime: this.secondsToTimeStamp(chapter.startTime),
      endTime: this.secondsToTimeStamp(
        chapter.endTime > 0 ? chapter.endTime : basicAnalysis.duration,
      ),
      description: chapter.description,
      keyPoints: [], // AI 분석에서 채워질 예정
    }));

    // 타임라인 세그먼트 생성 (기본적으로 5분 단위)
    const timeline: TimelineSegment[] = await this.generateTimelineSegments(basicAnalysis);

    return {
      metadata,
      timeline,
      overallSummary: '', // AI 분석에서 채워질 예정
      keyTopics: [],
      difficulty: 'intermediate',
      targetAudience: [],
      learningObjectives: [],
      relatedTopics: [],
      actionItems: [],
      notableQuotes: [],
      chapters,
      analysisTimestamp: new Date().toISOString(),
      aiModel: '', // AI 분석 시 설정
      confidence: 0.8,
    };
  }

  // 🆕 타임라인 세그먼트 자동 생성
  private async generateTimelineSegments(
    videoData: VideoAnalysisResult,
  ): Promise<TimelineSegment[]> {
    const segments: TimelineSegment[] = [];
    const segmentDuration = 300; // 5분 단위
    const totalSegments = Math.ceil(videoData.duration / segmentDuration);

    for (let i = 0; i < totalSegments; i++) {
      const startTime = i * segmentDuration;
      const endTime = Math.min((i + 1) * segmentDuration, videoData.duration);

      // 해당 구간의 트랜스크립트 추출
      const segmentTranscript = this.extractTranscriptSegment(
        videoData.transcript,
        startTime,
        endTime,
        videoData.duration,
      );

      if (segmentTranscript.trim().length < 50) continue;

      segments.push({
        id: `segment-${i}`,
        startTime: this.secondsToTimeStamp(startTime),
        endTime: this.secondsToTimeStamp(endTime),
        duration: endTime - startTime,
        title: `구간 ${i + 1}`, // 기본 제목, AI가 개선할 예정
        description: segmentTranscript.substring(0, 200) + '...',
        summary: '', // AI 분석에서 채워질 예정
        keyPoints: [],
        importance: 'medium',
        tags: [],
        transcript: segmentTranscript,
      });
    }

    return segments;
  }

  // 🆕 명언/인용구 추출
  async extractNotableQuotes(transcript: string, speakerName?: string): Promise<Quote[]> {
    const quotes: Quote[] = [];

    // 간단한 패턴 매칭으로 인용구 후보 찾기
    const quotePatterns = [
      /[""]([^""]{20,200})[""]/, // 따옴표로 둘러싸인 텍스트
      /말씀드리면[,\s]*([^.!?]{20,200})[.!?]/, // "말씀드리면" 패턴
      /핵심은[,\s]*([^.!?]{20,200})[.!?]/, // "핵심은" 패턴
    ];

    // 실제 구현에서는 AI를 사용해 더 정교하게 추출
    return quotes;
  }

  // 🆕 유틸리티 메서드들
  private secondsToTimeStamp(seconds: number): TimeStamp {
    const formatted = this.formatTime(seconds);
    return {
      seconds,
      formatted,
    };
  }

  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}시간 ${minutes}분`;
    } else {
      return `${minutes}분 ${secs}초`;
    }
  }

  private inferMediaType(videoData: VideoAnalysisResult): MediaType {
    const title = videoData.title.toLowerCase();
    const description = videoData.description.toLowerCase();

    if (videoData.duration < 60) return 'shorts';
    if (title.includes('podcast') || title.includes('팟캐스트')) return 'podcast';
    if (title.includes('music') || title.includes('음악')) return 'music';
    if (title.includes('live') || title.includes('라이브')) return 'livestream';

    return 'video';
  }

  private extractVideoId(url: string): string {
    const patterns = [/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/, /vimeo\.com\/(\d+)/];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }

    return url;
  }

  private extractTranscriptSegment(
    transcript: string,
    startTime: number,
    endTime: number,
    totalDuration: number,
  ): string {
    const totalLength = transcript.length;
    const startRatio = startTime / totalDuration;
    const endRatio = endTime / totalDuration;

    const startIndex = Math.floor(totalLength * startRatio);
    const endIndex = Math.floor(totalLength * endRatio);

    return transcript.substring(startIndex, endIndex);
  }

  private detectVideoPlatform(url: string): string {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return 'youtube';
    } else if (url.includes('vimeo.com')) {
      return 'vimeo';
    }
    return 'unknown';
  }

  private async analyzeYouTubeVideo(url: string): Promise<VideoAnalysisResult> {
    try {
      // 1. 기본 비디오 정보 가져오기
      const videoInfo = await ytdl.getInfo(url);
      const details = videoInfo.videoDetails;

      // 2. 자막/트랜스크립트 가져오기
      let transcript = '';
      try {
        const transcriptData = await YoutubeTranscript.fetchTranscript(details.videoId, {
          lang: 'ko',
        });
        transcript = transcriptData.map((item) => item.text).join(' ');
      } catch (error) {
        console.warn('한국어 자막 없음, 영어 자막 시도...');
        try {
          const transcriptData = await YoutubeTranscript.fetchTranscript(details.videoId, {
            lang: 'en',
          });
          transcript = transcriptData.map((item) => item.text).join(' ');
        } catch (englishError) {
          console.warn('자막을 가져올 수 없습니다:', englishError);
          transcript = details.description || '';
        }
      }

      // 3. 챕터 정보 추출
      const chapters = this.extractChaptersFromDescription(details.description || '');

      // 4. 썸네일 정보
      const thumbnails = details.thumbnails?.map((thumb) => thumb.url) || [];

      return {
        title: details.title || '',
        description: details.description || '',
        duration: parseInt(details.lengthSeconds || '0'),
        transcript: transcript,
        chapters: chapters,
        thumbnails: thumbnails,
        author: details.author?.name || '',
        publishedAt: details.publishDate || '',
        viewCount: parseInt(details.viewCount || '0'),
        tags: details.keywords || [],
        category: details.category || '',
      };
    } catch (error) {
      throw new Error(`YouTube 분석 실패: ${(error as Error).message || String(error)}`);
    }
  }

  private extractChaptersFromDescription(description: string): Array<{
    timestamp: string;
    title: string;
    description: string;
    startTime: number;
    endTime: number;
  }> {
    const chapters: any[] = [];

    // 타임스탬프 패턴 매칭
    const timestampRegex = /(\d{1,2}:)?(\d{1,2}):(\d{2})\s*[-–—]\s*(.+?)(?=\n|\d{1,2}:|$)/g;
    let match;

    while ((match = timestampRegex.exec(description)) !== null) {
      const [fullMatch, hours, minutes, seconds, title] = match;

      const startTime =
        parseInt(hours?.replace(':', '') || '0') * 3600 +
        parseInt(minutes) * 60 +
        parseInt(seconds);

      chapters.push({
        timestamp: `${hours || ''}${minutes}:${seconds}`,
        title: title.trim(),
        description: '',
        startTime: startTime,
        endTime: 0,
      });
    }

    // 각 챕터의 endTime 계산
    for (let i = 0; i < chapters.length - 1; i++) {
      chapters[i].endTime = chapters[i + 1].startTime;
    }

    if (chapters.length > 0) {
      chapters[chapters.length - 1].endTime = -1;
    }

    return chapters;
  }

  private async analyzeVimeoVideo(url: string): Promise<VideoAnalysisResult> {
    throw new Error('Vimeo 분석 기능은 아직 구현되지 않았습니다.');
  }

  formatTranscriptForAI(transcript: string, maxLength: number = 8000): string[] {
    const sentences = transcript.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const chunks: string[] = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > maxLength) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
          currentChunk = sentence;
        } else {
          chunks.push(sentence.substring(0, maxLength));
        }
      } else {
        currentChunk += sentence + '. ';
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  private formatTime(seconds: number): string {
    if (seconds < 0) return 'End';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  }
}
