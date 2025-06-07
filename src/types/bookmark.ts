/**
 * 북마크 데이터 타입 정의
 */
export interface Bookmark {
  id: number;
  title: string;
  description: string;
  url: string;
  image: string;
  tags: string[];
  category: string;
  createdAt: string;
  author: string;
  readTime: string;
  isPublic: boolean;
  extractedData?: ExtractedContent;
  aiAnalysis?: AIAnalysisResult;
  relatedBookmarks?: Bookmark[];
}

// 폼 데이터 타입 (Bookmark 타입에서 선택적 필드 제거)
export type BookmarkFormType = Omit<
  Bookmark,
  'id' | 'image' | 'createdAt' | 'author' | 'readTime'
> & {
  id?: number;
};

// 타입 정의
export interface ExtractedContent {
  title: string;
  content: string;
  textContent: string;
  excerpt: string;
  author: string | null;
  datePublished: string | null;
  leadImageUrl: string | null;
  url: string;
  domain: string;
  wordCount: number;
  readingTime: string;
  success: boolean;
  method: string;
  error?: string;
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
}

export interface BookmarkFormData {
  url: string;
  title: string;
  description: string;
  category: string;
  isPublic: boolean;
  tags: string[];
}

export interface AddBookmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (bookmark: Bookmark) => void;
}
