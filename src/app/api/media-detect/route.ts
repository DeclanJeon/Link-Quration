// src/app/api/media-detect/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { MediaDetector } from '@/lib/media-analyzers/media-detector';

interface MediaDetectRequest {
  url: string;
}

export async function POST(request: NextRequest) {
  try {
    const { url }: MediaDetectRequest = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL이 필요합니다.' }, { status: 400 });
    }

    console.log('🔍 미디어 감지 요청:', url);

    // 미디어 감지 실행
    const detection = MediaDetector.detectMedia(url);

    // 플랫폼 기능 정보 추가
    if (detection.isMedia) {
      const capabilities = MediaDetector.getPlatformCapabilities(
        detection.platform
      );
      const qualityEstimate = MediaDetector.estimateMediaQuality(url);

      return NextResponse.json({
        success: true,
        data: {
          ...detection,
          capabilities,
          qualityEstimate,
        },
        detectedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      data: detection,
      detectedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ 미디어 감지 오류:', error);
    return NextResponse.json(
      {
        error: '미디어 감지 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET 메서드로 지원되는 플랫폼 정보 제공
export async function GET() {
  return NextResponse.json({
    supportedPlatforms: [
      {
        name: 'YouTube',
        platform: 'youtube',
        mediaTypes: ['video', 'shorts', 'livestream'],
        features: [
          'transcript',
          'chapters',
          'thumbnails',
          'metadata',
          'timeline_analysis',
          'subtitles',
        ],
        patterns: ['youtube.com/watch', 'youtu.be/', 'youtube.com/shorts'],
        confidence: 0.95,
      },
      {
        name: 'Vimeo',
        platform: 'vimeo',
        mediaTypes: ['video'],
        features: ['metadata', 'thumbnails'],
        patterns: ['vimeo.com/'],
        confidence: 0.85,
      },
      {
        name: 'Spotify',
        platform: 'spotify',
        mediaTypes: ['music', 'podcast'],
        features: ['metadata'],
        patterns: ['open.spotify.com/'],
        confidence: 0.8,
      },
      {
        name: 'SoundCloud',
        platform: 'soundcloud',
        mediaTypes: ['audio', 'music'],
        features: ['metadata'],
        patterns: ['soundcloud.com/'],
        confidence: 0.8,
      },
      {
        name: 'Twitch',
        platform: 'twitch',
        mediaTypes: ['livestream', 'video'],
        features: ['metadata', 'live_stream'],
        patterns: ['twitch.tv/'],
        confidence: 0.8,
      },
    ],
    detectionCapabilities: {
      urlPatterns: true,
      fileExtensions: true,
      embedDetection: true,
      qualityEstimation: true,
      platformCapabilities: true,
    },
  });
}
