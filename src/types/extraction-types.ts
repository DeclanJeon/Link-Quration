import { BaseExtractionResult } from './extraction';

export interface VideoExtractionResult extends BaseExtractionResult {
  mediaType: 'video';
  mediaMetadata: {
    duration: number;
    viewCount: number;
    chapters: Array<{
      timestamp: string;
      title: string;
      description: string;
      startTime: number;
      endTime: number;
    }>;
    thumbnails: string[];
    tags: string[];
    category: string;
    transcript: string;
    hasTranscript: boolean;
  };
  aiAnalysis?: any;
  aiAnalysisError?: string;
  videoAnalysisError?: string;
}

export interface WebExtractionResult extends BaseExtractionResult {
  mediaType: 'text' | 'audio' | 'image';
  scrapingError?: string;
  mercuryError?: string;
  videoAnalysisError?: string;
}
