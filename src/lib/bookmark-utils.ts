// src/lib/bookmark-utils.ts
import { ExtractedContent } from '@/types/bookmark';

/**
 * 카테고리 자동 추론 함수
 */
export const inferCategory = (data: ExtractedContent): string => {
  const content = (data.title + ' ' + data.textContent).toLowerCase();

  const categoryMap = [
    {
      keywords: [
        '개발',
        '코딩',
        '프로그래밍',
        'development',
        'coding',
        'programming',
      ],
      category: '개발',
    },
    { keywords: ['디자인', 'ui', 'ux', 'design'], category: '디자인' },
    {
      keywords: ['비즈니스', '스타트업', 'business', 'startup'],
      category: '비즈니스',
    },
    {
      keywords: ['마케팅', '광고', 'marketing', 'advertising'],
      category: '마케팅',
    },
    { keywords: ['교육', '학습', 'education', 'learning'], category: '교육' },
    { keywords: ['뉴스', '기사', 'news', 'article'], category: '뉴스' },
    {
      keywords: ['튜토리얼', '가이드', 'tutorial', 'guide'],
      category: '튜토리얼',
    },
  ];

  for (const { keywords, category } of categoryMap) {
    if (keywords.some((keyword) => content.includes(keyword))) {
      return category;
    }
  }

  return '기타';
};

/**
 * 자동 태그 생성 함수
 */
export const generateAutoTags = (data: ExtractedContent): string[] => {
  const tags: string[] = [];
  const content = (data.title + ' ' + data.textContent).toLowerCase();

  // 기술 관련 태그
  const techKeywords = [
    'react',
    'vue',
    'angular',
    'javascript',
    'typescript',
    'python',
    'java',
    'go',
    'rust',
    'ai',
    'ml',
    'css',
    'html',
    'node',
    'docker',
  ];

  techKeywords.forEach((keyword) => {
    if (content.includes(keyword)) {
      tags.push(keyword);
    }
  });

  // 도메인 기반 태그
  if (data.domain) {
    const cleanDomain = data.domain.replace('www.', '').split('.')[0];
    if (cleanDomain.length > 2) {
      tags.push(cleanDomain);
    }
  }

  // 읽기 시간 기반 태그
  const readingTimeNum = parseInt(data.readingTime);
  if (!isNaN(readingTimeNum)) {
    if (readingTimeNum <= 3) tags.push('빠른읽기');
    else if (readingTimeNum >= 10) tags.push('심화읽기');
    else tags.push('보통읽기');
  }

  // 콘텐츠 길이 기반 태그
  if (data.wordCount) {
    if (data.wordCount < 500) tags.push('짧은글');
    else if (data.wordCount > 2000) tags.push('긴글');
  }

  return [...new Set(tags)].slice(0, 5); // 중복 제거 후 최대 5개까지
};

/**
 * 북마크 검증 함수
 */
export const validateBookmarkData = (
  formData: any
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!formData.url?.trim()) {
    errors.push('URL은 필수입니다.');
  } else if (!isValidUrl(formData.url)) {
    errors.push('올바른 URL 형식이 아닙니다.');
  }

  if (!formData.title?.trim()) {
    errors.push('제목은 필수입니다.');
  } else if (formData.title.length > 200) {
    errors.push('제목은 200자 이하여야 합니다.');
  }

  if (formData.description && formData.description.length > 1000) {
    errors.push('설명은 1000자 이하여야 합니다.');
  }

  if (formData.tags && formData.tags.length > 20) {
    errors.push('태그는 최대 20개까지 가능합니다.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * URL 유효성 검사 함수
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * 북마크 데이터 정규화 함수
 */
export const normalizeBookmarkData = (
  formData: any,
  extractionResult?: ExtractedContent,
  aiAnalysis?: any
) => {
  return {
    url: formData.url.trim(),
    title: formData.title.trim(),
    description: formData.description?.trim() || '',
    category: formData.category || '기타',
    tags: [
      ...new Set(formData.tags.map((tag: string) => tag.trim().toLowerCase())),
    ],
    isPublic: Boolean(formData.isPublic),
    image: extractionResult?.leadImageUrl || getDefaultImage(formData.category),
    author: extractionResult?.author || extractionResult?.domain || 'Unknown',
    readTime: extractionResult?.readingTime || '5분',
    createdAt: new Date().toISOString().split('T')[0],
    extractedData: extractionResult,
    aiAnalysis: aiAnalysis,
  };
};

/**
 * 기본 이미지 반환 함수
 */
export const getDefaultImage = (category: string): string => {
  const defaultImages = {
    기술: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400',
    개발: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400',
    디자인: 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=400',
    비즈니스:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    마케팅:
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400',
    교육: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400',
    뉴스: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400',
    튜토리얼:
      'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=400',
  };

  return (
    defaultImages[category as keyof typeof defaultImages] ||
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400'
  );
};
