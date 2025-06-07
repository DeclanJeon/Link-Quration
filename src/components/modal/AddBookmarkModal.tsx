"use client"

import { useState, useEffect } from "react";
import { Plus, CheckCircle, Tag, Brain, Eye, Sparkles, Globe, Video } from "lucide-react";
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

import { AddBookmarkModalProps, Bookmark } from "@/types/bookmark";
import { useBookmarkForm } from "@/hooks/useBookmarkForm";
import { useContentExtraction } from "@/hooks/useContentExtraction";
import { useAIAnalysis } from "@/hooks/useAIAnalysis";
import { BasicInfoTab } from "./tabs/BasicInfoTab";
import { PreviewTab } from "./tabs/PreviewTab";
import { AIAnalysisTab } from "./tabs/AIAnalysisTab";
import { AdvancedTab } from "./tabs/AdvancedTab";

import { MediaAnalysisTab } from "./tabs/MediaAnalysisTab";
import { useMediaDetection } from "@/hooks/useMediaAnalysis";


const AddBookmarkModal = ({ isOpen, onClose, onAdd }: AddBookmarkModalProps) => {
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

  const { detection, detectMedia } = useMediaDetection();

  // URL 변경 시 미디어 감지
  useEffect(() => {
    if (formData.url.trim()) {
      detectMedia(formData.url);
    }
  }, [formData.url, detectMedia]);


  // UI 상태
  const [activeTab, setActiveTab] = useState<string>("basic");

  // URL 분석 함수
  const handleUrlAnalysis = async (): Promise<void> => {
    if (!formData.url.trim()) return;
    
    try {
      const result = await extractContent(formData.url);
      
      if (result) {
        // 폼 데이터 자동 채우기
        updateFormFromExtraction(result);
        
        // 자동 태그 생성
        const autoTags = generateAutoTags(result);
        if (autoTags.length > 0) {
          handleInputChange('tags', [...new Set([...formData.tags, ...autoTags])]);
        }

        // 카테고리 자동 추론
        const inferredCategory = inferCategory(result);
        if (inferredCategory) {
          handleInputChange('category', inferredCategory);
        }

        // 미리보기 탭으로 전환
        setActiveTab("preview");

        // AI 분석 (설정이 되어 있는 경우)
        if (hasAISetup && selectedModel) {
          try {
            const aiResult = await performAIAnalysis(result);
            if (aiResult) {
              // AI 분석 결과로 폼 데이터 업데이트
              handleInputChange('description', aiResult.summary || formData.description);
              handleInputChange('category', aiResult.category || formData.category);
              handleInputChange('tags', [...new Set([...formData.tags, ...(aiResult.tags || [])])]);
              
              // AI 분석 탭으로 전환
              setActiveTab("ai-analysis");
            }
          } catch (aiError) {
            console.error('AI 분석 실패:', aiError);
          }
        }
      }
    } catch (error) {
      console.error('URL 분석 실패:', error);
    }
  };

  // 수동 AI 분석
  const handleManualAIAnalysis = async () => {
    if (extractionResult && hasAISetup && selectedModel) {
      try {
        const aiResult = await performAIAnalysis(extractionResult);
        if (aiResult) {
          handleInputChange('description', aiResult.summary || formData.description);
          handleInputChange('category', aiResult.category || formData.category);
          handleInputChange('tags', [...new Set([...formData.tags, ...(aiResult.tags || [])])]);
          setActiveTab("ai-analysis");
        }
      } catch (error) {
        console.error('AI 분석 실패:', error);
      }
    }
  };

  // 카테고리 자동 추론
  const inferCategory = (data: any): string => {
    const content = (data.title + ' ' + data.textContent).toLowerCase();
    
    if (content.includes('개발') || content.includes('코딩') || content.includes('프로그래밍')) return '개발';
    if (content.includes('디자인') || content.includes('ui') || content.includes('ux')) return '디자인';
    if (content.includes('비즈니스') || content.includes('스타트업')) return '비즈니스';
    if (content.includes('마케팅') || content.includes('광고')) return '마케팅';
    if (content.includes('교육') || content.includes('학습')) return '교육';
    if (content.includes('뉴스') || content.includes('기사')) return '뉴스';
    if (content.includes('튜토리얼') || content.includes('가이드')) return '튜토리얼';
    
    return '기타';
  };

  // 자동 태그 생성
  const generateAutoTags = (data: any): string[] => {
    const tags: string[] = [];
    const content = (data.title + ' ' + data.textContent).toLowerCase();
    
    // 기술 관련 태그
    const techKeywords = ['react', 'javascript', 'python', 'ai', 'ml', 'css', 'html', 'node'];
    techKeywords.forEach(keyword => {
      if (content.includes(keyword)) tags.push(keyword);
    });
    
    // 도메인 기반 태그
    if (data.domain) {
      tags.push(data.domain.replace('www.', ''));
    }
    
    // 읽기 시간 기반 태그
    const readingTimeNum = parseInt(data.readingTime);
    if (readingTimeNum <= 3) tags.push('빠른읽기');
    else if (readingTimeNum >= 10) tags.push('심화읽기');
    
    return tags.slice(0, 3); // 최대 3개까지
  };

  // 북마크 저장
  const handleSubmit = (): void => {
    if (!formData.url || !formData.title) return;
    
    const newBookmark: Bookmark = {
      id: Date.now(),
      title: formData.title,
      description: formData.description,
      url: formData.url,
      image: extractionResult?.leadImageUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400",
      tags: formData.tags,
      category: formData.category || "기타",
      createdAt: new Date().toISOString().split('T')[0],
      author: extractionResult?.author || extractionResult?.domain || "Unknown",
      readTime: extractionResult?.readingTime || "5분",
      isPublic: formData.isPublic,
      extractedData: extractionResult || undefined,
      aiAnalysis: aiAnalysis || undefined,
    };
    
    onAdd(newBookmark);
    handleReset();
    onClose();
  };

  // 폼 리셋
  const handleReset = (): void => {
    resetForm();
    resetExtraction();
    resetAIAnalysis();
    setActiveTab("basic");
  };

  // Enter 키 핸들러
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.currentTarget.id === 'url') {
        handleUrlAnalysis();
      } else if (e.currentTarget.id === 'newTag') {
        addTag();
      }
    }
  };

  // 🆕 API 키를 제대로 가져오기
  const getApiKey = () => {
    // 1. 로컬 스토리지에서 먼저 확인
    if (typeof window !== 'undefined') {
      const storedKey = localStorage.getItem('openrouter_api_key');
      if (storedKey) return storedKey;
    }
    
    // 2. 환경 변수에서 확인
    return process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || '';
  };


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

          {/* 메인 콘텐츠 */}
          <div className="flex-1 overflow-y-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="basic" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  기본 정보
                </TabsTrigger>
                <TabsTrigger 
                  value="preview" 
                  className="flex items-center gap-2"
                  disabled={!extractionResult}
                >
                  <Eye className="h-4 w-4" />
                  미리보기
                </TabsTrigger>
                  {/* 🆕 미디어 분석 탭 */}
                <TabsTrigger 
                  value="media-analysis" 
                  className="flex items-center gap-2"
                  disabled={!detection?.isMedia}
                >
                  <Video className="h-4 w-4" />
                  미디어 분석
                  {detection?.isMedia && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {detection.platform}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger 
                  value="ai-analysis" 
                  className="flex items-center gap-2"
                  disabled={!aiAnalysis}
                >
                  <Brain className="h-4 w-4" />
                  AI 분석
                </TabsTrigger>
                <TabsTrigger value="advanced" className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  고급 설정
                </TabsTrigger>
              </TabsList>

              {/* 탭 콘텐츠 */}
              <TabsContent value="basic">
                <BasicInfoTab
                  formData={formData}
                  newTag={newTag}
                  setNewTag={setNewTag}
                  onInputChange={handleInputChange}
                  onAddTag={addTag}
                  onRemoveTag={removeTag}
                  onUrlAnalysis={handleUrlAnalysis}
                  isAnalyzing={isAnalyzing}
                  analysisProgress={analysisProgress}
                  extractionResult={extractionResult}
                  extractionError={extractionError}
                  aiAnalysis={aiAnalysis}
                  aiError={aiError}
                  hasAISetup={hasAISetup}
                  selectedModel={selectedModel}
                  onKeyPress={handleKeyPress}
                />
              </TabsContent>

              <TabsContent value="preview">
                <PreviewTab
                  extractionResult={extractionResult}
                  hasAISetup={hasAISetup}
                  selectedModel={selectedModel}
                  aiAnalysis={aiAnalysis}
                  isAiAnalyzing={isAiAnalyzing}
                  onManualAIAnalysis={handleManualAIAnalysis}
                  onTabChange={setActiveTab}
                />
              </TabsContent>

              <TabsContent value="ai-analysis">
                <AIAnalysisTab
                  aiAnalysis={aiAnalysis}
                  selectedModel={selectedModel}
                  extractionResult={extractionResult}
                  hasAISetup={hasAISetup}
                  isAiAnalyzing={isAiAnalyzing}
                  onManualAIAnalysis={handleManualAIAnalysis}
                  onTabChange={setActiveTab}
                  onAddTag={(tag: string) => {
                    if (!formData.tags.includes(tag)) {
                      handleInputChange('tags', [...formData.tags, tag]);
                    }
                  }}
                />
              </TabsContent>

              {/* 🆕 미디어 분석 탭 콘텐츠 */}
              <TabsContent value="media-analysis">
                <MediaAnalysisTab
                  mediaUrl={formData.url}
                  hasAISetup={hasAISetup}
                  selectedModel={selectedModel}
                  apiKey={getApiKey()}
                  onAnalysisComplete={(result) => {
                    // 미디어 분석 결과를 폼 데이터에 반영
                    handleInputChange('title', result.metadata.title || formData.title);
                    handleInputChange('description', result.overallSummary || formData.description);
                    
                    // 키워드를 태그로 추가
                    if (result.keyTopics.length > 0) {
                      const newTags = [...new Set([...formData.tags, ...result.keyTopics])];
                      handleInputChange('tags', newTags);
                    }
                    
                    // 카테고리 설정
                    if (result.metadata.category) {
                      handleInputChange('category', result.metadata.category);
                    }
                  }}
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
            <div className="flex items-center justify-between w-full">
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

                {aiAnalysis && (
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="outline" className="gap-1">
                        <Brain className="h-3 w-3" />
                        AI 분석 완료
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{selectedModel?.name}로 분석됨</p>
                    </TooltipContent>
                  </Tooltip>
                )}

                {detection?.isMedia && (
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="outline" className="gap-1">
                        <Video className="h-3 w-3" />
                        미디어 분석 완료
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{detection.platform}로 분석됨</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                
                {formData.tags.length > 0 && (
                  <Badge variant="outline" className="gap-1">
                    <Tag className="h-3 w-3" />
                    {formData.tags.length}개 태그
                  </Badge>
                )}
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => { handleReset(); onClose(); }}
                  className="px-6"
                >
                  취소
                </Button>
                
                <Button 
                  onClick={handleSubmit}
                  disabled={!formData.url || !formData.title}
                  className="px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  북마크 저장
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};

export default AddBookmarkModal;