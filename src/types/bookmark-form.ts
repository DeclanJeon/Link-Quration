// src/types/bookmark-form.ts
import {
  BookmarkFormData,
  ExtractedContent,
  AIAnalysisResult,
} from './bookmark';

export interface UseBookmarkFormReturn {
  formData: BookmarkFormData;
  newTag: string;
  setNewTag: (tag: string) => void;
  handleInputChange: (
    field: keyof BookmarkFormData,
    value: string | boolean | string[]
  ) => void;
  addTag: () => void;
  removeTag: (tagToRemove: string) => void;
  resetForm: () => void;
  updateFormFromExtraction: (extractionResult: ExtractedContent) => void;
}

export interface UseContentExtractionReturn {
  isAnalyzing: boolean;
  analysisProgress: number;
  extractionResult: ExtractedContent | null;
  extractionError: string;
  extractContent: (url: string) => Promise<ExtractedContent>;
  resetExtraction: () => void;
}

export interface UseAIAnalysisReturn {
  aiAnalysis: AIAnalysisResult | null;
  isAiAnalyzing: boolean;
  aiProgress: number;
  aiError: string;
  hasAISetup: boolean;
  selectedModel: any;
  performAIAnalysis: (
    extractedData: ExtractedContent,
    mode?: 'quick' | 'full'
  ) => Promise<AIAnalysisResult>;
  resetAIAnalysis: () => void;
}

export interface TabComponentProps {
  formData: BookmarkFormData;
  onInputChange: (field: keyof BookmarkFormData, value: any) => void;
  extractionResult?: ExtractedContent | null;
  aiAnalysis?: AIAnalysisResult | null;
  hasAISetup?: boolean;
  selectedModel?: any;
}
