// src/types/common.ts
export type MediaType = 'text' | 'video' | 'audio' | 'image';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';
export type ContentType =
  | 'article'
  | 'tutorial'
  | 'video'
  | 'news'
  | 'research'
  | 'blog'
  | 'documentation';
export type AnalysisType = 'summary' | 'tags' | 'timeline' | 'complete';

// 카테고리 관련
export const CATEGORIES = [
  '전체',
  '개발',
  '디자인',
  '기술',
  '비즈니스',
  '마케팅',
  '교육',
  '뉴스',
  '튜토리얼',
  '리서치',
  '기타',
] as const;

export type Category = (typeof CATEGORIES)[number];

// 공통 메타데이터
export interface BaseMetadata {
  createdAt: string;
  updatedAt?: string;
  author: string | null;
  domain: string;
  wordCount: number;
  readingTime: string;
}

// 에러 관련
export interface ErrorInfo {
  message: string;
  code?: string;
  details?: any;
}
