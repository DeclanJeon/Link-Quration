import { AIModel } from './ai-model';
import { MediaAnalysisResult } from './media-analysis';
import { ExtractionResult } from './extraction';
import { MediaType } from './common';

/**
 * 북마크 데이터 타입 정의
 */
export interface Bookmark {
  id: string;
  title: string;
  description: string;
  url: string;
  image: string;
  tags: string[];
  category: string;
  createdAt: string;
  updatedAt: string;
  author: string;
  readTime: string;
  isPublic: boolean;
  extractedData?: ExtractedContent;
  aiAnalysis?: AIAnalysisResult;
  relatedBookmarks?: Bookmark[];
  mediaAnalysis?: MediaAnalysisData;
}

// 폼 데이터 타입 (Bookmark 타입에서 선택적 필드 제거)
export type BookmarkFormType = Omit<
  Bookmark,
  'id' | 'image' | 'createdAt' | 'author' | 'readTime'
> & {
  id?: string;
};

// Base type for extracted content
export interface BaseExtractedContent {
  domain: string;
  wordCount: number;
  readingTime: string;
  analysisType?: string;
  mediaType?: string;
  createdAt?: string;
  title: string;
  content: string;
  textContent: string;
  excerpt: string;
  author: string | null;
  datePublished: string | null;
  leadImageUrl: string | null;
  url: string;
  success: boolean;
  method: string;
}

// ExtractedContent is either a full ExtractionResult or a BaseExtractedContent
export type ExtractedContent = ExtractionResult | BaseExtractedContent;

// Type guard to check if an object is an ExtractedContent
export const isExtractedContent = (obj: any): obj is ExtractedContent => {
  return (
    obj && typeof obj === 'object' && 'domain' in obj && 'wordCount' in obj && 'readingTime' in obj
  );
};

// Function to convert ExtractedContent to ExtractionResult
export const toExtractionResult = (content: ExtractedContent | null): ExtractionResult | null => {
  if (!content) return null;

  // If it's already an ExtractionResult, return it as is
  if ('mediaType' in content && 'success' in content && 'method' in content) {
    return content as ExtractionResult;
  }

  // Otherwise, convert from BaseExtractedContent to ExtractionResult
  const baseContent = content as BaseExtractedContent;
  return {
    // BaseMetadata fields
    domain: baseContent.domain || '',
    wordCount: baseContent.wordCount || 0,
    readingTime: baseContent.readingTime || '1 min',
    author: baseContent.author,
    createdAt: baseContent.createdAt || new Date().toISOString(),

    // ExtractionResult required fields
    title: baseContent.title || '',
    content: baseContent.content || '',
    textContent: baseContent.textContent || '',
    excerpt: baseContent.excerpt || '',
    datePublished: baseContent.datePublished,
    leadImageUrl: baseContent.leadImageUrl,
    url: baseContent.url || '',

    // Extraction metadata
    success: baseContent.success ?? true,
    method: baseContent.method || 'unknown',
    mediaType: (baseContent.mediaType || 'text') as MediaType,
  };
};

export interface BookmarkDetailModalProps {
  bookmark: Bookmark | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface AIAnalysisResult {
  summary: string;
  tags: string[];
  category: string;
  timeline: Array<{
    step: number;
    title: string;
    description: string;
    timeEstimate: string;
  }>;
  keyPoints: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  contentType: 'article' | 'tutorial' | 'video' | 'news' | 'research' | 'blog' | 'documentation';
  readingGoals: string[];
  relatedTopics: string[];
  actionItems: string[];
  mediaTimeline?: MediaTimelineSegment[];
  analysisType?: string;
  learningObjectives?: string[];
  notableQuotes?: Array<{
    text: string;
    speaker?: string;
    timestamp?: string;
    context?: string;
  }>;
  aiModel?: string;
  analysisTimestamp?: string | number | Date;
  confidence?: number;
}

export interface BookmarkFormData {
  url: string;
  title: string;
  description: string;
  category: string;
  isPublic: boolean;
  tags: string[];
  image?: string;
}

export interface AddBookmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (bookmark: Bookmark) => void;
}

export interface Quote {
  text: string;
  speaker?: string;
  timestamp?: string;
  context?: string;
}

export interface MediaAnalysisData {
  platform: string;
  mediaType: string;
  confidence: number;
  supportedFeatures: string[];
  timeline?: Array<{
    id: string;
    startTime: { seconds: number; formatted: string };
    endTime: { seconds: number; formatted: string };
    duration: number;
    title: string;
    description: string;
    summary: string;
    keyPoints: string[];
    importance: 'high' | 'medium' | 'low';
    tags: string[];
    thumbnailUrl?: string;
    transcript?: string;
    concepts?: string[];
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    actionItems?: string[];
    emotions?: string[];
    speakingStyle?: string;
    noteWorthy?: string;
  }>;
  notableQuotes?: Array<{
    text: string;
    timestamp?: { seconds: number; formatted: string };
    speaker?: string;
    context?: string;
    importance?: 'high' | 'medium' | 'low';
  }>;
}

export interface MediaTimelineSegment {
  timestamp: string;
  title: string;
  summary: string;
  importance: 'low' | 'medium' | 'high';
  keyPoints?: string[];
}

export interface AnalysisOptions {
  includeTimeline: boolean;
  includeTranscript: boolean;
  analysisDepth: 'basic' | 'detailed' | 'comprehensive';
  extractQuotes: boolean;
}

export interface MediaAnalysisTabProps {
  mediaUrl: string;
  hasAISetup: boolean;
  selectedModel: AIModel | null;
  apiKey: string;
  onAnalysisComplete?: (result: MediaAnalysisResult) => void;
}
