// src/lib/media-analyzers/video-analyzer.ts
import { YoutubeTranscript } from 'youtube-transcript';
import ytdl from 'ytdl-core';

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
        const transcriptData = await YoutubeTranscript.fetchTranscript(
          details.videoId,
          {
            lang: 'ko', // 한국어 우선
          }
        );

        transcript = transcriptData.map((item) => item.text).join(' ');
      } catch (error) {
        console.warn('한국어 자막 없음, 영어 자막 시도...');
        try {
          const transcriptData = await YoutubeTranscript.fetchTranscript(
            details.videoId,
            {
              lang: 'en',
            }
          );
          transcript = transcriptData.map((item) => item.text).join(' ');
        } catch (englishError) {
          console.warn('자막을 가져올 수 없습니다:', englishError);
          transcript = details.description || '';
        }
      }

      // 3. 챕터 정보 추출 (설명에서)
      const chapters = this.extractChaptersFromDescription(
        details.description || ''
      );

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
      throw new Error(
        `YouTube 분석 실패: ${(error as Error).message || String(error)}`
      );
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

    // 타임스탬프 패턴 매칭 (00:00, 0:00, 1:23:45 등)
    const timestampRegex =
      /(\d{1,2}:)?(\d{1,2}):(\d{2})\s*[-–—]\s*(.+?)(?=\n|\d{1,2}:|$)/g;
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
        endTime: 0, // 다음 챕터에서 계산
      });
    }

    // 각 챕터의 endTime 계산
    for (let i = 0; i < chapters.length - 1; i++) {
      chapters[i].endTime = chapters[i + 1].startTime;
    }

    // 마지막 챕터의 endTime은 비디오 길이로 설정 (나중에 업데이트)
    if (chapters.length > 0) {
      chapters[chapters.length - 1].endTime = -1; // 비디오 끝까지
    }

    return chapters;
  }

  private async analyzeVimeoVideo(url: string): Promise<VideoAnalysisResult> {
    // Vimeo API 또는 스크래핑으로 구현
    throw new Error('Vimeo 분석 기능은 아직 구현되지 않았습니다.');
  }

  // 비디오 요약을 위한 트랜스크립트 청킹
  formatTranscriptForAI(
    transcript: string,
    maxLength: number = 8000
  ): string[] {
    const sentences = transcript
      .split(/[.!?]+/)
      .filter((s) => s.trim().length > 0);
    const chunks: string[] = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > maxLength) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
          currentChunk = sentence;
        } else {
          // 문장이 너무 긴 경우 강제로 자르기
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
}
