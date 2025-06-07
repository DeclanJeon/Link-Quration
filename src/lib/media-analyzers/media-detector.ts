// src/lib/media-analyzers/media-detector.ts
import {
  MediaDetectionResult,
  MediaType,
  MediaPlatform,
  MediaFeature,
} from '@/types/media-analysis';

export class MediaDetector {
  private static platformPatterns = [
    {
      name: 'YouTube',
      platform: 'youtube' as MediaPlatform,
      mediaType: 'video' as MediaType,
      patterns: [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
        /youtube\.com\/embed\/([^&\n?#]+)/,
        /youtube\.com\/v\/([^&\n?#]+)/,
      ],
      features: [
        'transcript',
        'chapters',
        'thumbnails',
        'metadata',
        'timeline_analysis',
        'subtitles',
      ] as MediaFeature[],
      confidence: 0.95,
    },
    {
      name: 'YouTube Shorts',
      platform: 'youtube' as MediaPlatform,
      mediaType: 'shorts' as MediaType,
      patterns: [/youtube\.com\/shorts\/([^&\n?#]+)/],
      features: ['thumbnails', 'metadata'] as MediaFeature[],
      confidence: 0.9,
    },
    {
      name: 'Vimeo',
      platform: 'vimeo' as MediaPlatform,
      mediaType: 'video' as MediaType,
      patterns: [/vimeo\.com\/(\d+)/, /player\.vimeo\.com\/video\/(\d+)/],
      features: ['metadata', 'thumbnails'] as MediaFeature[],
      confidence: 0.85,
    },
    {
      name: 'Spotify',
      platform: 'spotify' as MediaPlatform,
      mediaType: 'music' as MediaType,
      patterns: [
        /open\.spotify\.com\/(track|album|playlist|episode|show)\/([^&\n?#]+)/,
      ],
      features: ['metadata'] as MediaFeature[],
      confidence: 0.8,
    },
    {
      name: 'SoundCloud',
      platform: 'soundcloud' as MediaPlatform,
      mediaType: 'audio' as MediaType,
      patterns: [/soundcloud\.com\/([^\/]+)\/([^&\n?#]+)/],
      features: ['metadata'] as MediaFeature[],
      confidence: 0.8,
    },
    {
      name: 'Twitch',
      platform: 'twitch' as MediaPlatform,
      mediaType: 'livestream' as MediaType,
      patterns: [/twitch\.tv\/([^\/\n?#]+)/, /twitch\.tv\/videos\/(\d+)/],
      features: ['metadata', 'live_stream'] as MediaFeature[],
      confidence: 0.8,
    },
    {
      name: 'TikTok',
      platform: 'tiktok' as MediaPlatform,
      mediaType: 'shorts' as MediaType,
      patterns: [
        /tiktok\.com\/@([^\/]+)\/video\/(\d+)/,
        /vm\.tiktok\.com\/([^\/\n?#]+)/,
      ],
      features: ['metadata'] as MediaFeature[],
      confidence: 0.7,
    },
    {
      name: 'Instagram',
      platform: 'instagram' as MediaPlatform,
      mediaType: 'video' as MediaType,
      patterns: [
        /instagram\.com\/p\/([^\/\n?#]+)/,
        /instagram\.com\/reel\/([^\/\n?#]+)/,
        /instagram\.com\/tv\/([^\/\n?#]+)/,
      ],
      features: ['metadata'] as MediaFeature[],
      confidence: 0.7,
    },
  ];

  static detectMedia(url: string): MediaDetectionResult {
    console.log('🔍 미디어 감지 시작:', url);

    // URL 정규화
    const normalizedUrl = this.normalizeUrl(url);

    // 각 플랫폼 패턴과 매칭
    for (const platformInfo of this.platformPatterns) {
      for (const pattern of platformInfo.patterns) {
        const match = normalizedUrl.match(pattern);
        if (match) {
          const mediaId = match[1] || match[2] || match[0];

          console.log(`✅ ${platformInfo.name} 감지됨:`, mediaId);

          return {
            isMedia: true,
            mediaType: platformInfo.mediaType,
            platform: platformInfo.platform,
            mediaId,
            embedUrl: this.generateEmbedUrl(platformInfo.platform, mediaId),
            directUrl: normalizedUrl,
            confidence: platformInfo.confidence,
            supportedFeatures: platformInfo.features,
          };
        }
      }
    }

    // 일반 비디오/오디오 파일 확장자 체크
    const mediaExtensions = this.checkMediaExtensions(normalizedUrl);
    if (mediaExtensions.isMedia) {
      console.log('📁 미디어 파일 확장자 감지됨:', mediaExtensions.mediaType);
      return mediaExtensions;
    }

    console.log('❌ 미디어 콘텐츠가 아님');
    return {
      isMedia: false,
      mediaType: 'unknown',
      platform: 'generic',
      confidence: 0,
      supportedFeatures: [],
    };
  }

  private static normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.href;
    } catch {
      return url;
    }
  }

  private static generateEmbedUrl(
    platform: MediaPlatform,
    mediaId: string
  ): string {
    const embedUrls = {
      youtube: `https://www.youtube.com/embed/${mediaId}`,
      vimeo: `https://player.vimeo.com/video/${mediaId}`,
      spotify: `https://open.spotify.com/embed/track/${mediaId}`,
      soundcloud: '', // SoundCloud는 복잡한 embed URL 구조
      twitch: `https://player.twitch.tv/?video=${mediaId}&parent=localhost`,
      tiktok: '', // TikTok은 embed 지원 제한적
      instagram: '', // Instagram은 embed 지원 제한적
      apple_podcasts: '',
      google_podcasts: '',
      generic: '',
    };

    return embedUrls[platform] || '';
  }

  private static checkMediaExtensions(url: string): MediaDetectionResult {
    const videoExtensions = [
      '.mp4',
      '.webm',
      '.avi',
      '.mov',
      '.wmv',
      '.flv',
      '.mkv',
    ];
    const audioExtensions = ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a'];

    const lowerUrl = url.toLowerCase();

    for (const ext of videoExtensions) {
      if (lowerUrl.includes(ext)) {
        return {
          isMedia: true,
          mediaType: 'video',
          platform: 'generic',
          directUrl: url,
          confidence: 0.6,
          supportedFeatures: ['metadata'],
        };
      }
    }

    for (const ext of audioExtensions) {
      if (lowerUrl.includes(ext)) {
        return {
          isMedia: true,
          mediaType: 'audio',
          platform: 'generic',
          directUrl: url,
          confidence: 0.6,
          supportedFeatures: ['metadata'],
        };
      }
    }

    return {
      isMedia: false,
      mediaType: 'unknown',
      platform: 'generic',
      confidence: 0,
      supportedFeatures: [],
    };
  }

  // 🆕 플랫폼별 특수 기능 체크
  static getPlatformCapabilities(platform: MediaPlatform): {
    canExtractTranscript: boolean;
    canExtractChapters: boolean;
    canExtractThumbnails: boolean;
    canAnalyzeTimeline: boolean;
    hasLiveSupport: boolean;
  } {
    const capabilities = {
      youtube: {
        canExtractTranscript: true,
        canExtractChapters: true,
        canExtractThumbnails: true,
        canAnalyzeTimeline: true,
        hasLiveSupport: true,
      },
      vimeo: {
        canExtractTranscript: false,
        canExtractChapters: true,
        canExtractThumbnails: true,
        canAnalyzeTimeline: true,
        hasLiveSupport: false,
      },
      spotify: {
        canExtractTranscript: false,
        canExtractChapters: true,
        canExtractThumbnails: false,
        canAnalyzeTimeline: false,
        hasLiveSupport: false,
      },
      soundcloud: {
        canExtractTranscript: false,
        canExtractChapters: false,
        canExtractThumbnails: true,
        canAnalyzeTimeline: false,
        hasLiveSupport: false,
      },
      twitch: {
        canExtractTranscript: false,
        canExtractChapters: false,
        canExtractThumbnails: true,
        canAnalyzeTimeline: false,
        hasLiveSupport: true,
      },
      apple_podcasts: {
        // 추가된 부분
        canExtractTranscript: false,
        canExtractChapters: false,
        canExtractThumbnails: false,
        canAnalyzeTimeline: false,
        hasLiveSupport: false,
      },
      google_podcasts: {
        // 추가된 부분
        canExtractTranscript: false,
        canExtractChapters: false,
        canExtractThumbnails: false,
        canAnalyzeTimeline: false,
        hasLiveSupport: false,
      },
      instagram: {
        // 추가된 부분
        canExtractTranscript: false,
        canExtractChapters: false,
        canExtractThumbnails: true,
        canAnalyzeTimeline: false,
        hasLiveSupport: false,
      },
      tiktok: {
        // 추가된 부분
        canExtractTranscript: false,
        canExtractChapters: false,
        canExtractThumbnails: true,
        canAnalyzeTimeline: false,
        hasLiveSupport: false,
      },
      generic: {
        canExtractTranscript: false,
        canExtractChapters: false,
        canExtractThumbnails: false,
        canAnalyzeTimeline: false,
        hasLiveSupport: false,
      },
    };

    // 타입 단언을 사용하여 TypeScript가 인식할 수 있도록 함
    return (
      (capabilities as Record<MediaPlatform, typeof capabilities.generic>)[
        platform
      ] || capabilities.generic
    );
  }

  // 🆕 미디어 품질 추정
  static estimateMediaQuality(url: string): {
    estimatedResolution?: string;
    estimatedDuration?: string;
    estimatedSize?: string;
  } {
    // URL 패턴으로 품질 추정 (실제로는 API 호출 필요)
    if (url.includes('youtube.com')) {
      return {
        estimatedResolution: '1080p',
        estimatedDuration: '5-15분',
        estimatedSize: '50-200MB',
      };
    }

    return {};
  }
}
