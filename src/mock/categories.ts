// src/mock/categories.ts
import { CATEGORIES, Category } from '@/types/common';

// 기존 상수 re-export
export { CATEGORIES };
export type { Category };

// 카테고리별 메타데이터
export const CATEGORY_METADATA: Record<
  Category,
  {
    icon: string;
    color: string;
    description: string;
  }
> = {
  전체: { icon: '📚', color: 'slate', description: '모든 카테고리' },
  개발: { icon: '💻', color: 'blue', description: '프로그래밍 및 개발' },
  디자인: { icon: '🎨', color: 'purple', description: 'UI/UX 및 디자인' },
  기술: { icon: '⚡', color: 'yellow', description: '최신 기술 트렌드' },
  비즈니스: { icon: '💼', color: 'green', description: '비즈니스 및 경영' },
  마케팅: { icon: '📈', color: 'red', description: '마케팅 및 광고' },
  교육: { icon: '🎓', color: 'indigo', description: '교육 및 학습' },
  뉴스: { icon: '📰', color: 'gray', description: '뉴스 및 시사' },
  튜토리얼: { icon: '📖', color: 'orange', description: '튜토리얼 및 가이드' },
  리서치: { icon: '🔬', color: 'teal', description: '연구 및 논문' },
  기타: { icon: '📋', color: 'slate', description: '기타 분류' },
};
