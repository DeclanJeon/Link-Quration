// src/lib/media-analyzers/audio-analyzer.ts
import {
  MediaAnalysisResult,
  MediaMetadata,
  TimelineSegment,
  MediaType,
  MediaPlatform,
} from '@/types/media-analysis';

export interface AudioAnalysisResult {
  title: string;
  description: string;
  duration: number;
  artist?: string;
  album?: string;
  genre?: string;
  releaseDate?: string;
  playCount?: number;
  waveform?: number[];
  chapters?: Array<{
    timestamp: string;
    title: string;
    startTime: number;
    endTime: number;
  }>;
  thumbnails: string[];
  tags: string[];
}

export class AudioAnalyzer {
  async analyzeAudio(url: string): Promise<AudioAnalysisResult> {
    const platform = this.detectAudioPlatform(url);

    switch (platform) {
      case 'spotify':
        return await this.analyzeSpotifyAudio(url);
      case 'soundcloud':
        return await this.analyzeSoundCloudAudio(url);
      case 'apple_podcasts':
        return await this.analyzeApplePodcast(url);
      default:
        throw new Error('지원하지 않는 오디오 플랫폼입니다.');
    }
  }

  // 🆕 확장된 오디오 분석
  async analyzeAudioContent(url: string): Promise<MediaAnalysisResult> {
    const basicAnalysis = await this.analyzeAudio(url);
    const platform = this.detectAudioPlatform(url) as MediaPlatform;

    const metadata: MediaMetadata = {
      id: this.extractAudioId(url),
      title: basicAnalysis.title,
      description: basicAnalysis.description,
      duration: basicAnalysis.duration,
      durationFormatted: this.formatDuration(basicAnalysis.duration),
      thumbnailUrl: basicAnalysis.thumbnails[0],
      channelName: basicAnalysis.artist,
      language: 'ko',
      quality: {
        audioQuality: '320kbps', // 기본값
        codec: 'mp3',
      },
      platform: platform,
      mediaType: this.inferAudioType(basicAnalysis),
      category: basicAnalysis.genre || '음악',
    };

    // 오디오용 타임라인 생성 (음악의 경우 구조 분석)
    const timeline: TimelineSegment[] = await this.generateAudioTimeline(
      basicAnalysis
    );

    return {
      metadata,
      timeline,
      overallSummary: '', // AI 분석에서 채워질 예정
      keyTopics: [],
      difficulty: 'beginner',
      targetAudience: [],
      learningObjectives: [],
      relatedTopics: [],
      actionItems: [],
      notableQuotes: [],
      chapters: [],
      analysisTimestamp: new Date().toISOString(),
      aiModel: '',
      confidence: 0.7,
    };
  }

  private detectAudioPlatform(url: string): string {
    if (url.includes('spotify.com')) {
      return 'spotify';
    } else if (url.includes('soundcloud.com')) {
      return 'soundcloud';
    } else if (url.includes('podcasts.apple.com')) {
      return 'apple_podcasts';
    }
    return 'unknown';
  }

  private async analyzeSpotifyAudio(url: string): Promise<AudioAnalysisResult> {
    // Spotify Web API 또는 스크래핑으로 구현
    // 실제 구현에서는 Spotify Web API 사용
    throw new Error('Spotify 분석 기능은 아직 구현되지 않았습니다.');
  }

  private async analyzeSoundCloudAudio(
    url: string
  ): Promise<AudioAnalysisResult> {
    // SoundCloud API 또는 스크래핑으로 구현
    throw new Error('SoundCloud 분석 기능은 아직 구현되지 않았습니다.');
  }

  private async analyzeApplePodcast(url: string): Promise<AudioAnalysisResult> {
    // Apple Podcasts API 또는 RSS 피드 분석
    throw new Error('Apple Podcasts 분석 기능은 아직 구현되지 않았습니다.');
  }

  private async generateAudioTimeline(
    audioData: AudioAnalysisResult
  ): Promise<TimelineSegment[]> {
    const segments: TimelineSegment[] = [];

    // 음악의 경우 구조적 분석 (인트로, 벌스, 코러스, 브릿지, 아웃트로)
    if (audioData.genre && this.isMusicGenre(audioData.genre)) {
      return this.generateMusicStructureTimeline(audioData);
    }

    // 팟캐스트의 경우 시간 구간별 분할
    if (this.isPodcast(audioData)) {
      return this.generatePodcastTimeline(audioData);
    }

    return segments;
  }

  private generateMusicStructureTimeline(
    audioData: AudioAnalysisResult
  ): TimelineSegment[] {
    // 음악 구조 분석 (대략적)
    const duration = audioData.duration;
    const segments: TimelineSegment[] = [];

    // 일반적인 팝송 구조 가정
    const structure = [
      { name: 'Intro', ratio: 0.1 },
      { name: 'Verse 1', ratio: 0.2 },
      { name: 'Chorus', ratio: 0.15 },
      { name: 'Verse 2', ratio: 0.2 },
      { name: 'Chorus', ratio: 0.15 },
      { name: 'Bridge', ratio: 0.1 },
      { name: 'Final Chorus', ratio: 0.1 },
    ];

    let currentTime = 0;
    structure.forEach((part, index) => {
      const segmentDuration = duration * part.ratio;
      const endTime = currentTime + segmentDuration;

      segments.push({
        id: `music-${index}`,
        startTime: {
          seconds: currentTime,
          formatted: this.formatTime(currentTime),
        },
        endTime: { seconds: endTime, formatted: this.formatTime(endTime) },
        duration: segmentDuration,
        title: part.name,
        description: `${part.name} 구간`,
        summary: '',
        keyPoints: [],
        importance: part.name.includes('Chorus') ? 'high' : 'medium',
        tags: [part.name.toLowerCase()],
      });

      currentTime = endTime;
    });

    return segments;
  }

  private generatePodcastTimeline(
    audioData: AudioAnalysisResult
  ): TimelineSegment[] {
    // 팟캐스트 타임라인 (10분 단위로 분할)
    const segments: TimelineSegment[] = [];
    const segmentDuration = 600; // 10분
    const totalSegments = Math.ceil(audioData.duration / segmentDuration);

    for (let i = 0; i < totalSegments; i++) {
      const startTime = i * segmentDuration;
      const endTime = Math.min((i + 1) * segmentDuration, audioData.duration);

      segments.push({
        id: `podcast-${i}`,
        startTime: {
          seconds: startTime,
          formatted: this.formatTime(startTime),
        },
        endTime: { seconds: endTime, formatted: this.formatTime(endTime) },
        duration: endTime - startTime,
        title: `구간 ${i + 1}`,
        description: `${this.formatTime(startTime)} - ${this.formatTime(
          endTime
        )}`,
        summary: '',
        keyPoints: [],
        importance: 'medium',
        tags: ['podcast'],
      });
    }

    return segments;
  }

  private inferAudioType(audioData: AudioAnalysisResult): MediaType {
    if (audioData.genre) {
      if (this.isMusicGenre(audioData.genre)) {
        return 'music';
      }
    }

    if (
      audioData.title.toLowerCase().includes('podcast') ||
      audioData.title.toLowerCase().includes('팟캐스트')
    ) {
      return 'podcast';
    }

    return 'audio';
  }

  private isMusicGenre(genre: string): boolean {
    const musicGenres = [
      'pop',
      'rock',
      'jazz',
      'classical',
      'electronic',
      'hip-hop',
      'rap',
      'country',
      'folk',
      'blues',
      'reggae',
      'metal',
    ];
    return musicGenres.some((g) => genre.toLowerCase().includes(g));
  }

  private isPodcast(audioData: AudioAnalysisResult): boolean {
    return (
      audioData.title.toLowerCase().includes('podcast') ||
      audioData.description.toLowerCase().includes('podcast') ||
      audioData.duration > 600
    ); // 10분 이상이면 팟캐스트로 가정
  }

  private extractAudioId(url: string): string {
    const patterns = [
      /spotify\.com\/track\/([^?&]+)/,
      /spotify\.com\/episode\/([^?&]+)/,
      /soundcloud\.com\/([^\/]+)\/([^?&]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1] || match[2];
    }

    return url;
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

  private formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}
