// src/services/categoryService.ts
import { Bookmark } from '@/types/bookmark';
import { CategoryRule, DynamicCategory } from '@/types/category';
import { useCallback, useState } from 'react';

export class CategoryService {
  // 기본 카테고리 목록을 가져오는 정적 메서드
  public static getBaseCategories(): CategoryRule[] {
    return [...this.baseCategories];
  }

  // 기본 카테고리 규칙
  private static baseCategories: CategoryRule[] = [
    {
      name: '개발',
      keywords: [
        'javascript',
        'python',
        'react',
        'vue',
        'node',
        'programming',
        'coding',
        'github',
        'git',
        'api',
        'frontend',
        'backend',
        'database',
        'sql',
        'typescript',
        'java',
        'c++',
        'rust',
        'go',
        'docker',
        'kubernetes',
      ],
      patterns: [/dev(elop)?/i, /code/i, /program/i],
      priority: 10,
    },
    {
      name: '디자인',
      keywords: [
        'design',
        'ui',
        'ux',
        'figma',
        'sketch',
        'adobe',
        'photoshop',
        'illustrator',
        'css',
        'animation',
        'prototype',
        'wireframe',
        'color',
        'typography',
        'layout',
      ],
      patterns: [/design/i, /\bui\b/i, /\bux\b/i],
      priority: 9,
    },
    {
      name: 'AI/머신러닝',
      keywords: [
        'ai',
        'ml',
        'machine learning',
        'deep learning',
        'neural',
        'tensorflow',
        'pytorch',
        'nlp',
        'computer vision',
        'data science',
        'artificial intelligence',
        'chatgpt',
        'llm',
        'gpt',
        'bert',
      ],
      patterns: [/\bai\b/i, /machine\s*learning/i, /deep\s*learning/i],
      priority: 11,
    },
    {
      name: '비즈니스',
      keywords: [
        'business',
        'startup',
        'entrepreneur',
        'marketing',
        'sales',
        'strategy',
        'management',
        'leadership',
        'finance',
        'investment',
        'growth',
        'revenue',
        'b2b',
        'saas',
      ],
      patterns: [/business/i, /startup/i, /entrepreneur/i],
      priority: 8,
    },
    {
      name: '교육',
      keywords: [
        'tutorial',
        'course',
        'learn',
        'education',
        'study',
        'guide',
        'howto',
        'lesson',
        'training',
        'workshop',
        'bootcamp',
        'mooc',
        'lecture',
      ],
      patterns: [/tutorial/i, /course/i, /learn/i, /how\s*to/i],
      priority: 7,
    },
    {
      name: '뉴스',
      keywords: [
        'news',
        'article',
        'breaking',
        'update',
        'report',
        'journalism',
        'press',
        'media',
        'headline',
        'current',
      ],
      patterns: [/news/i, /article/i, /report/i],
      priority: 6,
    },
    {
      name: '도구/생산성',
      keywords: [
        'tool',
        'productivity',
        'app',
        'software',
        'utility',
        'extension',
        'plugin',
        'workflow',
        'automation',
        'efficiency',
        'organize',
      ],
      patterns: [/tool/i, /productivity/i, /app/i],
      priority: 8,
    },
    {
      name: '미디어',
      keywords: [
        'video',
        'youtube',
        'podcast',
        'audio',
        'music',
        'streaming',
        'vimeo',
        'twitch',
        'spotify',
        'soundcloud',
      ],
      patterns: [/video/i, /youtube/i, /podcast/i],
      priority: 7,
    },
  ];

  // 동적으로 생성된 카테고리 저장소
  private static dynamicCategories: Map<string, DynamicCategory> = new Map();

  // 태그 기반 카테고리 추론
  static inferCategoryFromTags(tags: string[], existingCategory?: string): string {
    if (existingCategory && existingCategory !== '기타') {
      return existingCategory;
    }

    const scores = new Map<string, number>();

    // 각 태그에 대해 카테고리 점수 계산
    tags.forEach((tag) => {
      const lowerTag = tag.toLowerCase();

      this.baseCategories.forEach((category) => {
        let score = 0;

        // 키워드 매칭
        category.keywords.forEach((keyword) => {
          if (lowerTag.includes(keyword) || keyword.includes(lowerTag)) {
            score += category.priority;
          }
        });

        // 패턴 매칭
        category.patterns?.forEach((pattern) => {
          if (pattern.test(lowerTag)) {
            score += category.priority * 1.5;
          }
        });

        if (score > 0) {
          scores.set(category.name, (scores.get(category.name) || 0) + score);
        }
      });
    });

    // 가장 높은 점수의 카테고리 선택
    let maxScore = 0;
    let selectedCategory = '기타';

    scores.forEach((score, category) => {
      if (score > maxScore) {
        maxScore = score;
        selectedCategory = category;
      }
    });

    return selectedCategory;
  }

  // 컨텐츠 기반 카테고리 추론 (제목, 설명, URL 포함)
  static inferCategoryFromContent(bookmark: {
    title: string;
    description?: string;
    url: string;
    tags: string[];
  }): string {
    const contentText =
      `${bookmark.title} ${bookmark.description || ''} ${bookmark.url}`.toLowerCase();
    const scores = new Map<string, number>();

    // URL 도메인 분석
    try {
      const domain = new URL(bookmark.url).hostname.toLowerCase();

      // 도메인별 특별 규칙
      const domainRules: Record<string, string> = {
        'github.com': '개발',
        'gitlab.com': '개발',
        'stackoverflow.com': '개발',
        'medium.com': '블로그',
        'dev.to': '개발',
        'dribbble.com': '디자인',
        'behance.net': '디자인',
        'youtube.com': '미디어',
        'vimeo.com': '미디어',
        'coursera.org': '교육',
        'udemy.com': '교육',
        'arxiv.org': 'AI/머신러닝',
        'papers.nips.cc': 'AI/머신러닝',
      };

      if (domainRules[domain]) {
        return domainRules[domain];
      }
    } catch (e) {
      // URL 파싱 실패 시 무시
    }

    // 컨텐츠 분석
    this.baseCategories.forEach((category) => {
      let score = 0;

      category.keywords.forEach((keyword) => {
        // Escape special regex characters in the keyword
        const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escapedKeyword}\\b`, 'i');
        const matches = contentText.match(regex);
        if (matches) {
          score += category.priority * matches.length;
        }
      });

      category.patterns?.forEach((pattern) => {
        const matches = contentText.match(pattern);
        if (matches) {
          score += category.priority * 2 * matches.length;
        }
      });

      if (score > 0) {
        scores.set(category.name, score);
      }
    });

    // 태그 기반 추론 점수 추가
    const tagCategory = this.inferCategoryFromTags(bookmark.tags);
    if (tagCategory !== '기타') {
      scores.set(tagCategory, (scores.get(tagCategory) || 0) + 50);
    }

    // 최종 카테고리 선택
    let maxScore = 0;
    let selectedCategory = '기타';

    scores.forEach((score, category) => {
      if (score > maxScore) {
        maxScore = score;
        selectedCategory = category;
      }
    });

    return selectedCategory;
  }

  // 동적 카테고리 생성 (태그 클러스터링 기반)
  static analyzeDynamicCategories(bookmarks: Bookmark[]): DynamicCategory[] {
    const tagClusters = new Map<string, Set<string>>();
    const tagCooccurrence = new Map<string, Map<string, number>>();

    // 태그 동시 출현 빈도 계산
    bookmarks.forEach((bookmark) => {
      bookmark.tags.forEach((tag1, i) => {
        bookmark.tags.forEach((tag2, j) => {
          if (i < j) {
            const key1 = `${tag1}-${tag2}`;
            const key2 = `${tag2}-${tag1}`;

            if (!tagCooccurrence.has(tag1)) {
              tagCooccurrence.set(tag1, new Map());
            }
            if (!tagCooccurrence.has(tag2)) {
              tagCooccurrence.set(tag2, new Map());
            }

            tagCooccurrence.get(tag1)!.set(tag2, (tagCooccurrence.get(tag1)!.get(tag2) || 0) + 1);
            tagCooccurrence.get(tag2)!.set(tag1, (tagCooccurrence.get(tag2)!.get(tag1) || 0) + 1);
          }
        });
      });
    });

    // 태그 클러스터 생성 (간단한 그리디 알고리즘)
    const processedTags = new Set<string>();
    const clusters: Array<{ tags: string[]; count: number }> = [];

    tagCooccurrence.forEach((connections, tag) => {
      if (processedTags.has(tag)) return;

      const cluster = [tag];
      processedTags.add(tag);

      // 가장 연관성 높은 태그들 찾기
      const sortedConnections = Array.from(connections.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      sortedConnections.forEach(([connectedTag, count]) => {
        if (!processedTags.has(connectedTag) && count >= 3) {
          cluster.push(connectedTag);
          processedTags.add(connectedTag);
        }
      });

      if (cluster.length >= 3) {
        clusters.push({
          tags: cluster,
          count: cluster.reduce((sum, t) => {
            return sum + bookmarks.filter((b) => b.tags.includes(t)).length;
          }, 0),
        });
      }
    });

    // 클러스터를 동적 카테고리로 변환
    return clusters
      .filter((cluster) => cluster.count >= 5) // 최소 5개 이상의 북마크
      .map((cluster) => {
        const categoryName = this.generateCategoryName(cluster.tags);
        return {
          name: categoryName,
          count: cluster.count,
          tags: cluster.tags,
          createdAt: new Date(),
          isAuto: true,
        };
      });
  }

  // 카테고리 이름 생성
  private static generateCategoryName(tags: string[]): string {
    // 태그 기반으로 의미있는 카테고리 이름 생성
    const commonPatterns = [
      { pattern: ['react', 'vue', 'angular'], name: '프론트엔드 프레임워크' },
      { pattern: ['docker', 'kubernetes', 'devops'], name: 'DevOps' },
      { pattern: ['design', 'ui', 'ux'], name: 'UI/UX 디자인' },
      { pattern: ['python', 'data', 'analysis'], name: '데이터 분석' },
      { pattern: ['security', 'cyber', 'hack'], name: '보안' },
      { pattern: ['blockchain', 'crypto', 'web3'], name: '블록체인' },
      { pattern: ['game', 'unity', 'unreal'], name: '게임 개발' },
      { pattern: ['mobile', 'ios', 'android'], name: '모바일 개발' },
    ];

    for (const { pattern, name } of commonPatterns) {
      const matchCount = pattern.filter((p) =>
        tags.some((tag) => tag.toLowerCase().includes(p)),
      ).length;

      if (matchCount >= 2) {
        return name;
      }
    }

    // 가장 빈도가 높은 태그 기반 이름
    return `${tags[0]} 관련`;
  }

  // 카테고리 추천 (AI 분석 결과 포함)
  static recommendCategories(bookmark: Partial<Bookmark>, aiAnalysis?: any): string[] {
    const recommendations = new Set<string>();

    // 1. 기본 추론
    if (bookmark.tags && bookmark.tags.length > 0) {
      const basicCategory = this.inferCategoryFromContent({
        title: bookmark.title || '',
        description: bookmark.description,
        url: bookmark.url || '',
        tags: bookmark.tags,
      });
      recommendations.add(basicCategory);
    }

    // 2. AI 분석 결과 활용
    if (aiAnalysis?.category) {
      recommendations.add(aiAnalysis.category);
    }

    // 3. AI 태그 기반 추가 추론
    if (aiAnalysis?.tags && aiAnalysis.tags.length > 0) {
      const aiCategory = this.inferCategoryFromTags(aiAnalysis.tags);
      if (aiCategory !== '기타') {
        recommendations.add(aiCategory);
      }
    }

    // 4. 미디어 타입 기반
    if (bookmark.mediaAnalysis) {
      recommendations.add('미디어');
    }

    return Array.from(recommendations).filter((cat) => cat !== '기타');
  }

  // 전체 북마크 카테고리 재분류
  static reclassifyAllBookmarks(bookmarks: Bookmark[]): Map<string, string> {
    const updates = new Map<string, string>();

    bookmarks.forEach((bookmark) => {
      const currentCategory = bookmark.category;
      const recommendedCategories = this.recommendCategories(bookmark, bookmark.aiAnalysis);

      if (recommendedCategories.length > 0 && recommendedCategories[0] !== currentCategory) {
        updates.set(bookmark.id, recommendedCategories[0]);
      }
    });

    return updates;
  }

  // 카테고리 통계
  static getCategoryStats(bookmarks: Bookmark[]): Map<string, number> {
    const stats = new Map<string, number>();

    bookmarks.forEach((bookmark) => {
      const category = bookmark.category || '기타';
      stats.set(category, (stats.get(category) || 0) + 1);
    });

    return stats;
  }
}

// 카테고리 관리를 위한 React Hook
export const useCategoryManagement = () => {
  const [categories, setCategories] = useState<string[]>([]);
  const [dynamicCategories, setDynamicCategories] = useState<DynamicCategory[]>([]);

  const updateCategories = useCallback((bookmarks: Bookmark[]) => {
    // 기본 카테고리
    const baseCategories = CategoryService.getBaseCategories().map((c) => c.name);

    // 동적 카테고리 분석
    const dynamic = CategoryService.analyzeDynamicCategories(bookmarks);
    setDynamicCategories(dynamic);

    // 전체 카테고리 목록
    const allCategories = ['전체', ...baseCategories, ...dynamic.map((d) => d.name), '기타'];

    setCategories([...new Set(allCategories)]);
  }, []);

  const suggestCategory = useCallback((bookmark: Partial<Bookmark>) => {
    return CategoryService.recommendCategories(bookmark);
  }, []);

  const reclassifyBookmarks = useCallback((bookmarks: Bookmark[]) => {
    return CategoryService.reclassifyAllBookmarks(bookmarks);
  }, []);

  return {
    categories,
    dynamicCategories,
    updateCategories,
    suggestCategory,
    reclassifyBookmarks,
  };
};
