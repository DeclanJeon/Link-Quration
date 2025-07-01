export interface AnalysisRequest {
  extractedData: any;
  apiKey: string;
  modelId: string;
  analysisType: 'summary' | 'tags' | 'timeline' | 'complete';
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
