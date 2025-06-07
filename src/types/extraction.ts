// src/types/extraction.ts
import { MediaType, BaseMetadata } from './common';

// 통합된 추출 결과 인터페이스
export interface ExtractionResult extends BaseMetadata {
  // 기본 콘텐츠 정보
  title: string;
  content: string;
  textContent: string;
  excerpt: string;
  datePublished: string | null;
  leadImageUrl: string | null;
  url: string;

  // 추출 메타데이터
  success: boolean;
  method: string;
  mediaType: MediaType;
  error?: string;

  // 미디어별 특화 정보 (선택적)
  mediaMetadata?: VideoMetadata | AudioMetadata | ImageMetadata;

  // 추출 과정 에러들 (선택적)
  scrapingError?: string;
  mercuryError?: string;
  videoAnalysisError?: string;
}

// 동영상 메타데이터
export interface VideoMetadata {
  duration: number;
  viewCount: number;
  chapters: VideoChapter[];
  thumbnails: string[];
  tags: string[];
  category: string;
  transcript: string;
  hasTranscript: boolean;
}

export interface VideoChapter {
  timestamp: string;
  title: string;
  description: string;
  startTime: number;
  endTime: number;
}

// 오디오 메타데이터
export interface AudioMetadata {
  duration: number;
  bitrate?: number;
  format?: string;
  transcript?: string;
  hasTranscript: boolean;
}

// 이미지 메타데이터
export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  size: number;
  altText?: string;
}

// 레거시 호환성을 위한 타입 별칭들
export type BaseExtractionResult = ExtractionResult;
export type VideoExtractionResult = ExtractionResult & {
  mediaType: 'video';
  mediaMetadata: VideoMetadata;
};
export type WebExtractionResult = ExtractionResult & {
  mediaType: 'text' | 'audio' | 'image';
};
