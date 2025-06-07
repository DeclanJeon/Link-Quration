// src/constants/bookmark.ts
export const BOOKMARK_CATEGORIES = [
  '기술',
  '개발',
  '디자인',
  '비즈니스',
  '마케팅',
  '교육',
  '뉴스',
  '블로그',
  '튜토리얼',
  '리서치',
  '기타',
] as const;

export const BOOKMARK_LIMITS = {
  MAX_TITLE_LENGTH: 200,
  MAX_DESCRIPTION_LENGTH: 1000,
  MAX_TAGS_COUNT: 20,
  MAX_TAG_LENGTH: 30,
} as const;

export const DEFAULT_FORM_DATA = {
  url: '',
  title: '',
  description: '',
  category: '',
  isPublic: true,
  tags: [],
} as const;

export const ANALYSIS_PROGRESS_STEPS = {
  CONTENT_EXTRACTION: 60,
  AI_ANALYSIS: 100,
} as const;

export const UI_MESSAGES = {
  EXTRACTION_SUCCESS: '✨ 콘텐츠 추출 완료!',
  EXTRACTION_PARTIAL: '⚠️ 일부 정보만 추출되었습니다',
  AI_ANALYSIS_SUCCESS: '🧠 AI 분석 완료!',
  AI_SETUP_REQUIRED:
    '💡 팁: AI 분석 기능을 사용하려면 설정에서 OpenRouter API를 연결해보세요!',
  NO_CONTENT_EXTRACTED: '아직 분석된 콘텐츠가 없습니다',
  NO_AI_ANALYSIS: 'AI 분석 결과가 없습니다',
} as const;
