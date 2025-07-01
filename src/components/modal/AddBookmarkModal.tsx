"use client"

import { useState, useEffect, useCallback, useRef, memo } from "react";
import { Plus, CheckCircle, Tag, Brain, Sparkles, Globe, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";

import { AddBookmarkModalProps, Bookmark, BookmarkFormData, ExtractedContent, AIAnalysisResult, toExtractionResult } from "@/types/bookmark";
import { useBookmarkForm } from "@/hooks/useBookmarkForm";
import { useContentExtraction } from "@/hooks/useContentExtraction";
import { useAIAnalysis } from "@/hooks/useAIAnalysis";
import { useMediaDetection } from "@/hooks/useMediaAnalysis";
import { ExtractionResult } from "@/types/extraction";
import { CategoryService } from "@/services/categoryService";

// 통합된 탭 컴포넌트들
import { SmartInputTab } from "./tabs/SmartInputTab";
import { UnifiedAnalysisTab } from "./tabs/UnifiedAnalysisTab";
import { AdvancedTab } from "./tabs/AdvancedTab";

const AddBookmarkModal = memo(({ isOpen, onClose, onAdd }: AddBookmarkModalProps) => {
  // UI 상태
  const [activeTab, setActiveTab] = useState<string>("smart-input");
  const [analysisState, setAnalysisState] = useState<'idle' | 'analyzing' | 'complete'>('idle');
  
  // 무한 루프 방지를 위한 ref
  const analyzedUrlRef = useRef<string>("");
  const isAnalyzingRef = useRef<boolean>(false);

  // 커스텀 훅 사용
  const {
    formData,
    newTag,
    setNewTag,
    handleInputChange,
    addTag,
    removeTag,
    resetForm,
    updateFormFromExtraction,
  } = useBookmarkForm();

  const {
    isAnalyzing,
    analysisProgress,
    extractionResult,
    extractionError,
    extractContent,
    resetExtraction,
  } = useContentExtraction();

  const {
    aiAnalysis,
    isAiAnalyzing,
    aiProgress,
    aiError,
    hasAISetup,
    selectedModel,
    performAIAnalysis,
    resetAIAnalysis,
  } = useAIAnalysis();

  const { detection, detectMedia, analyzeMedia } = useMediaDetection();

  // 자동 태그 생성
  const generateAutoTags = useCallback((data: ExtractionResult): string[] => {
    const tags: string[] = [];
    const content = (data.title + ' ' + (data.textContent || '')).toLowerCase();
    
    const categoryKeywords = [
      'javascript', 'python', 'react', 'vue', 'node', 'typescript', 'java',
      'design', 'ui', 'ux', 'figma', 'sketch',
      'ai', 'ml', 'machine learning', 'deep learning',
      'tutorial', 'guide', 'course',
      'startup', 'business', 'marketing'
    ];
    
    categoryKeywords.forEach(keyword => {
      if (content.includes(keyword)) {
        tags.push(keyword);
      }
    });
    
    if (data.domain) {
      const domainTag = data.domain.replace('www.', '').split('.')[0];
      if (domainTag && domainTag.length > 2) {
        tags.push(domainTag);
      }
    }
    
    const readingTimeNum = parseInt(data.readingTime || '0');
    if (readingTimeNum > 0) {
      if (readingTimeNum <= 3) tags.push('quick-read');
      else if (readingTimeNum >= 10) tags.push('long-read');
      else tags.push('medium-read');
    }
    
    return [...new Set(tags)].slice(0, 5);
  }, []);

  // API 키 가져오기
  const getApiKey = useCallback((): string => {
    if (typeof window !== 'undefined') {
      const storedKey = localStorage.getItem('openrouter_api_key');
      if (storedKey) return storedKey;
    }
    
    const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || '';
    if (!apiKey) {
      console.warn('OpenRouter API 키가 설정되지 않았습니다. 환경 변수를 확인해주세요.');
    }
    return apiKey;
  }, []);

  // 통합 분석 함수
  const handleUnifiedAnalysis = useCallback(async (): Promise<void> => {
    if (!formData.url.trim() || analysisState === 'analyzing') {
      return;
    }
    
    setAnalysisState('analyzing');
    analyzedUrlRef.current = formData.url;
    
    try {
      // 1단계: 콘텐츠 추출
      const extractResult = await extractContent(formData.url);
      
      if (extractResult) {
        // 폼 데이터 자동 채우기
        updateFormFromExtraction(extractResult);
        
        // 자동 태그 생성
        const autoTags = generateAutoTags(extractResult);
        if (autoTags.length > 0) {
          handleInputChange('tags', [...new Set([...formData.tags, ...autoTags])]);
        }

        // 카테고리 추론
        const bookmarkData = {
          title: extractResult.title || '',
          description: extractResult.excerpt || '',
          url: formData.url,
          tags: [...formData.tags, ...autoTags]
        };
        
        const inferredCategory = CategoryService.inferCategoryFromContent(bookmarkData);
        if (inferredCategory && inferredCategory !== '기타') {
          handleInputChange('category', inferredCategory);
        }

        // 2단계: 병렬 분석 실행
        const analysisPromises = [];

        // AI 분석
        if (hasAISetup && selectedModel) {
          analysisPromises.push(
            performAIAnalysis(extractResult).then(aiResult => {
              if (aiResult) {
                handleInputChange('description', aiResult.summary || formData.description);
                
                const recommendedCategories = CategoryService.recommendCategories({
                  title: extractResult.title || formData.title,
                  description: aiResult.summary || formData.description,
                  url: formData.url,
                  tags: [...formData.tags, ...(aiResult.tags || [])],
                  extractedData: extractResult,
                  aiAnalysis: aiResult
                }, aiResult);
                
                if (recommendedCategories.length > 0) {
                  handleInputChange('category', recommendedCategories[0]);
                }
                
                if (aiResult.tags && aiResult.tags.length > 0) {
                  handleInputChange('tags', [...new Set([...formData.tags, ...aiResult.tags])]);
                }
              }
              return aiResult;
            })
          );
        }

        // 미디어 분석
        if (detection?.isMedia && hasAISetup && selectedModel) {
          analysisPromises.push(
            analyzeMedia(formData.url, getApiKey(), selectedModel.id, {
              includeTimeline: true,
              includeTranscript: true,
              analysisDepth: 'detailed',
              extractQuotes: true
            })
          );
        }

        await Promise.allSettled(analysisPromises);
        
        // 분석 탭으로 자동 전환
        setActiveTab("analysis");
        setAnalysisState('complete');
      }
    } catch (error) {
      console.error('통합 분석 실패:', error);
      setAnalysisState('idle');
    } finally {
      isAnalyzingRef.current = false;
    }
  }, [
    formData.url,
    formData.tags,
    formData.title,
    formData.description,
    analysisState,
    extractContent,
    updateFormFromExtraction,
    handleInputChange,
    hasAISetup,
    selectedModel,
    performAIAnalysis,
    generateAutoTags,
    detection,
    analyzeMedia,
    getApiKey
  ]);

  // URL 변경 감지 및 미디어 감지
  useEffect(() => {
    if (!formData.url.trim()) return;
    
    detectMedia(formData.url);
    
    try {
      new URL(formData.url);
      analyzedUrlRef.current = "";
    } catch (e) {
      console.log('유효하지 않은 URL입니다.');
    }
  }, [formData.url, detectMedia]);
  
  // 폼 리셋 핸들러
  const handleReset = useCallback((): void => {
    resetForm();
    resetExtraction();
    resetAIAnalysis();
    setActiveTab("smart-input");
    setAnalysisState('idle');
    analyzedUrlRef.current = "";
    isAnalyzingRef.current = false;
  }, [resetForm, resetExtraction, resetAIAnalysis]);

  // 북마크 저장
  const handleSubmit = useCallback((): void => {
    if (!formData.url || !formData.title) return;
    
    const now = new Date().toISOString();
    const safeExtractionResult = extractionResult || undefined;
    const safeAiAnalysis = aiAnalysis || undefined;
    
    let finalCategory = formData.category;
    if (!finalCategory || finalCategory === '기타') {
      const recommendedCategories = CategoryService.recommendCategories({
        title: formData.title,
        description: formData.description,
        url: formData.url,
        tags: formData.tags,
        extractedData: safeExtractionResult,
        aiAnalysis: safeAiAnalysis
      }, safeAiAnalysis);
      
      if (recommendedCategories.length > 0) {
        finalCategory = recommendedCategories[0];
      } else {
        finalCategory = '기타';
      }
    }
    
    const newBookmark: Bookmark = {
      id: Date.now().toString(),
      title: formData.title,
      description: formData.description,
      url: formData.url,
      image: safeExtractionResult?.leadImageUrl || formData.image || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400",
      tags: formData.tags,
      category: finalCategory,
      createdAt: now.split('T')[0],
      updatedAt: now,
      author: safeExtractionResult?.author || safeExtractionResult?.domain || "Unknown",
      readTime: safeExtractionResult?.readingTime || "5분",
      isPublic: formData.isPublic,
      extractedData: safeExtractionResult,
      aiAnalysis: safeAiAnalysis,
      mediaAnalysis: detection?.isMedia ? {
        platform: detection.platform,
        mediaType: detection.mediaType || 'video',
        confidence: 0.9,
        supportedFeatures: ['playback', 'metadata']
      } : undefined,
    };
    
    onAdd(newBookmark);
    handleReset();
    onClose();
  }, [
    formData,
    extractionResult,
    aiAnalysis,
    detection,
    onAdd,
    onClose,
    handleReset
  ]);

  // Enter 키 핸들러
  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.currentTarget.id === 'url') {
        handleUnifiedAnalysis();
      } else if (e.currentTarget.id === 'newTag') {
        addTag();
      }
    }
  }, [handleUnifiedAnalysis, addTag]);

  // 탭 변경 핸들러
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

  // 태그 추가 핸들러
  const handleAddTagFromAI = useCallback((tag: string) => {
    if (!formData.tags.includes(tag)) {
      handleInputChange('tags', [...formData.tags, tag]);
      
      const recommendedCategories = CategoryService.recommendCategories({
        title: formData.title,
        description: formData.description,
        url: formData.url,
        tags: [...formData.tags, tag],
        extractedData: extractionResult || undefined,
        aiAnalysis: aiAnalysis || undefined
      }, aiAnalysis || undefined);
      
      if (recommendedCategories.length > 0 && formData.category === '기타') {
        handleInputChange('category', recommendedCategories[0]);
      }
    }
  }, [formData, extractionResult, aiAnalysis, handleInputChange]);

  return (
    <TooltipProvider>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
          {/* 헤더 */}
          <DialogHeader className="space-y-3 pb-4">
            <DialogTitle className="flex items-center gap-3 text-2xl">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <Plus className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-bold">
                  Link Quration
                </span>
                <div className="text-sm text-muted-foreground font-normal mt-1">
                  스마트 북마크로 지식을 큐레이션하세요
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>

          {/* 메인 콘텐츠 - 3개 탭으로 축소 */}
          <div className="flex-1 overflow-y-auto">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="smart-input" className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  스마트 입력
                </TabsTrigger>
                <TabsTrigger 
                  value="analysis" 
                  className="flex items-center gap-2"
                  disabled={!formData.url}
                >
                  <Brain className="h-4 w-4" />
                  콘텐츠 분석
                  {analysisState === 'complete' && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      완료
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="advanced" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  고급 설정
                </TabsTrigger>
              </TabsList>

              {/* 탭 콘텐츠 */}
              <TabsContent value="smart-input">
                <SmartInputTab
                  formData={formData}
                  newTag={newTag}
                  setNewTag={setNewTag}
                  onInputChange={handleInputChange}
                  onAddTag={addTag}
                  onRemoveTag={removeTag}
                  onUnifiedAnalysis={handleUnifiedAnalysis}
                  analysisState={analysisState}
                  extractionResult={extractionResult ? toExtractionResult(extractionResult) : null}
                  detection={detection}
                  onKeyPress={handleKeyPress}
                  hasAISetup={hasAISetup}
                />
              </TabsContent>

              <TabsContent value="analysis">
                <UnifiedAnalysisTab
                  formData={formData}
                  extractionResult={extractionResult ? toExtractionResult(extractionResult) : null}
                  aiAnalysis={aiAnalysis}
                  mediaAnalysis={detection ? {
                    platform: detection.platform,
                    mediaType: detection.mediaType,
                    confidence: detection.confidence,
                    supportedFeatures: detection.supportedFeatures
                  } : undefined}
                  detection={detection}
                  analysisState={analysisState}
                  onUnifiedAnalysis={handleUnifiedAnalysis}
                  hasAISetup={hasAISetup}
                  selectedModel={selectedModel}
                  isAnalyzing={isAnalyzing || isAiAnalyzing}
                  onAddTag={handleAddTagFromAI}
                />
              </TabsContent>

              <TabsContent value="advanced">
                <AdvancedTab
                  formData={formData}
                  onInputChange={handleInputChange}
                  hasAISetup={hasAISetup}
                  selectedModel={selectedModel}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* 푸터 */}
          <DialogFooter className="border-t pt-6 space-x-2">
            <FooterContent
              extractionResult={extractionResult}
              aiAnalysis={aiAnalysis}
              detection={detection} 
              selectedModel={selectedModel}
              formData={formData}
              analysisState={analysisState}
              onReset={handleReset}
              onClose={onClose}
              onSubmit={handleSubmit}
            />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
});

AddBookmarkModal.displayName = 'AddBookmarkModal';

// 푸터 콘텐츠 컴포넌트
const FooterContent = memo(({
  extractionResult,
  aiAnalysis,
  detection,
  selectedModel,
  formData,
  analysisState,
  onReset,
  onClose,
  onSubmit,
}: {
  extractionResult: any;
  aiAnalysis: any;
  detection: any;
  selectedModel: any;
  formData: BookmarkFormData;
  analysisState: 'idle' | 'analyzing' | 'complete';
  onReset: () => void;
  onClose: () => void;
  onSubmit: () => void;
}) => {
  const handleCancel = useCallback(() => {
    onReset();
    onClose();
  }, [onReset, onClose]);

  const isSubmitDisabled = !formData.url || !formData.title;

  return (
    <div className="flex items-center justify-between w-full">
      {/* 상태 배지 */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {extractionResult && (
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="outline" className="gap-1">
                <CheckCircle className="h-3 w-3" />
                추출 완료
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>{extractionResult.method}로 추출됨</p>
            </TooltipContent>
          </Tooltip>
        )}

        {analysisState === 'complete' && (
          <Badge variant="outline" className="gap-1">
            <Brain className="h-3 w-3" />
            통합 분석 완료
          </Badge>
        )}

        {detection?.isMedia && (
          <Badge variant="outline" className="gap-1">
            <Globe className="h-3 w-3" />
            {detection.platform} 미디어
          </Badge>
        )}
        
        {formData.tags.length > 0 && (
          <Badge variant="outline" className="gap-1">
            <Tag className="h-3 w-3" />
            {formData.tags.length}개 태그
          </Badge>
        )}
      </div>

      {/* 액션 버튼 */}
      <div className="flex gap-3">
        <Button 
          variant="outline" 
          onClick={handleCancel}
          className="px-6"
        >
          취소
        </Button>
        
        <Button 
          onClick={onSubmit}
          disabled={isSubmitDisabled}
          className="px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          북마크 저장
        </Button>
      </div>
    </div>
  );
});

FooterContent.displayName = 'FooterContent';

export default AddBookmarkModal;