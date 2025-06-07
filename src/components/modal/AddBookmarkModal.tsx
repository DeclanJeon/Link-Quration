// src/components/modal/AddBookmarkModal.tsx
"use client"

import { useState, useEffect } from "react";
import { 
  Plus, Globe, Lock, Tag, Brain, Clock, TrendingUp, AlertCircle, 
  CheckCircle, ExternalLink, Loader2, Image, User, Calendar,
  Sparkles, Zap, BookOpen, Hash, Eye, EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { AddBookmarkModalProps, BookmarkFormData, ExtractedContent, AIAnalysisResult, Bookmark } from "@/types/bookmark";



const CATEGORIES = [
  "기술", "개발", "디자인", "비즈니스", "마케팅", 
  "교육", "뉴스", "블로그", "튜토리얼", "리서치", "기타"
];

const AddBookmarkModal = ({ isOpen, onClose, onAdd }: AddBookmarkModalProps) => {
  // 기본 상태
  const [formData, setFormData] = useState<BookmarkFormData>({
    url: "",
    title: "",
    description: "",
    category: "",
    isPublic: true,
    tags: [],
  });

  // 추출 관련 상태
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisProgress, setAnalysisProgress] = useState<number>(0);
  const [extractionResult, setExtractionResult] = useState<ExtractedContent | null>(null);
  const [extractionError, setExtractionError] = useState<string>("");
  
  // AI 분석 관련 상태
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState<boolean>(false);
  const [aiProgress, setAiProgress] = useState<number>(0);
  const [aiError, setAiError] = useState<string>("");
  
  // UI 상태
  const [newTag, setNewTag] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("basic");
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  
  // AI 설정 상태
  const [hasAISetup, setHasAISetup] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<any>(null);

  // 컴포넌트 마운트 시 AI 설정 확인
  useEffect(() => {
    const apiKey = localStorage.getItem('openrouter_api_key');
    const model = localStorage.getItem('selected_model');
    
    setHasAISetup(!!apiKey);
    if (model) {
      try {
        setSelectedModel(JSON.parse(model));
      } catch (error) {
        console.error('저장된 모델 정보 파싱 실패:', error);
      }
    }
  }, [isOpen]);

  // URL 분석 함수 (Mercury Parser + AI 분석)
  const handleUrlAnalysis = async (): Promise<void> => {
    if (!formData.url.trim()) return;
    
    setIsAnalyzing(true);
    setExtractionResult(null);
    setExtractionError("");
    setAiAnalysis(null);
    setAiError("");
    setAnalysisProgress(0);
    
    try {
      // 1단계: 콘텐츠 추출
      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => Math.min(prev + 8, 50));
      }, 300);

      console.log('콘텐츠 추출 시작:', formData.url);

      const response = await fetch('/api/extract-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: formData.url.trim() }),
      });

      clearInterval(progressInterval);
      setAnalysisProgress(60);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '콘텐츠 추출에 실패했습니다.');
      }

      const result = await response.json();
      setExtractionResult(result.data);

      // 폼 데이터 자동 채우기
      if (result.data) {
        setFormData(prev => ({
          ...prev,
          title: result.data.title || prev.title,
          description: result.data.excerpt || prev.description,
          category: inferCategory(result.data) || prev.category,
        }));

        // 자동 태그 생성
        const autoTags = generateAutoTags(result.data);
        if (autoTags.length > 0) {
          setFormData(prev => ({
            ...prev,
            tags: [...new Set([...prev.tags, ...autoTags])]
          }));
        }

        // 미리보기 탭으로 전환
        setActiveTab("preview");
      }

      setAnalysisProgress(70);

      // 2단계: AI 분석 (설정이 되어 있는 경우)
      if (result.success && hasAISetup && selectedModel) {
        await performAIAnalysis(result.data);
      }

      setAnalysisProgress(100);

      if (!result.success) {
        setExtractionError(result.data.error || '일부 정보만 추출되었습니다.');
      }
      
    } catch (err) {
      setExtractionError(err instanceof Error ? err.message : '콘텐츠 추출 중 오류가 발생했습니다.');
    } finally {
      setIsAnalyzing(false);
      setTimeout(() => setAnalysisProgress(0), 2000);
    }
  };

  // AI 분석 실행
  const performAIAnalysis = async (extractedData: ExtractedContent) => {
    setIsAiAnalyzing(true);
    setAiError("");
    
    try {
      const apiKey = localStorage.getItem('openrouter_api_key');
      if (!apiKey || !selectedModel) {
        throw new Error('AI 설정이 필요합니다.');
      }

      setAiProgress(0);
      const aiProgressInterval = setInterval(() => {
        setAiProgress(prev => Math.min(prev + 12, 90));
      }, 400);

      console.log('AI 분석 시작:', selectedModel.name);

      const aiResponse = await fetch('/api/ai-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          extractedData,
          apiKey,
          modelId: selectedModel.id,
          analysisType: 'complete'
        }),
      });

      clearInterval(aiProgressInterval);
      setAiProgress(100);

      if (!aiResponse.ok) {
        const errorData = await aiResponse.json();
        throw new Error(errorData.error || 'AI 분석에 실패했습니다.');
      }

      const aiResult = await aiResponse.json();
      setAiAnalysis(aiResult.data);

      // AI 분석 결과로 폼 데이터 업데이트
      if (aiResult.data) {
        setFormData(prev => ({
          ...prev,
          description: aiResult.data.summary || prev.description,
          category: aiResult.data.category || prev.category,
          tags: [...new Set([...prev.tags, ...(aiResult.data.tags || [])])],
        }));

        // AI 분석 탭으로 전환
        setActiveTab("ai-analysis");
      }

    } catch (error) {
      setAiError(error instanceof Error ? error.message : 'AI 분석 중 오류가 발생했습니다.');
    } finally {
      setIsAiAnalyzing(false);
      setTimeout(() => setAiProgress(0), 1000);
    }
  };

  // 수동 AI 분석 버튼
  const handleManualAIAnalysis = async () => {
    if (extractionResult && hasAISetup && selectedModel) {
      await performAIAnalysis(extractionResult);
    }
  };

  // 카테고리 자동 추론
  const inferCategory = (data: ExtractedContent): string => {
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
  const generateAutoTags = (data: ExtractedContent): string[] => {
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

  // 태그 추가
  const addTag = (): void => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag("");
    }
  };

  // 태그 제거
  const removeTag = (tagToRemove: string): void => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
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
    setFormData({
      url: "",
      title: "",
      description: "",
      category: "",
      isPublic: true,
      tags: [],
    });
    setNewTag("");
    setExtractionResult(null);
    setExtractionError("");
    setAiAnalysis(null);
    setAiError("");
    setActiveTab("basic");
    setShowAdvanced(false);
  };

  // 입력 핸들러
  const handleInputChange = (field: keyof BookmarkFormData, value: string | boolean | string[]): void => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
              <TabsList className="grid w-full grid-cols-4">
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

              {/* 기본 정보 탭 */}
              <TabsContent value="basic" className="space-y-6">
                {/* URL 입력 섹션 */}
                <Card className="border-dashed border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <Brain className="h-5 w-5 text-blue-600" />
                        <Label className="text-lg font-semibold text-blue-900">
                          URL로 스마트 분석 시작하기
                        </Label>
                      </div>
                      
                      <div className="flex gap-3">
                        <Input
                          id="url"
                          type="url"
                          placeholder="https://example.com - 분석할 URL을 입력하세요"
                          value={formData.url}
                          onChange={(e) => handleInputChange('url', e.target.value)}
                          onKeyPress={handleKeyPress}
                          className="flex-1 h-12 text-lg border-blue-200 focus:border-blue-400 bg-white"
                        />
                        <Button 
                          onClick={handleUrlAnalysis}
                          disabled={!formData.url.trim() || isAnalyzing}
                          size="lg"
                          className="px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        >
                          {isAnalyzing ? (
                            <>
                              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                              분석 중...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-5 w-5 mr-2" />
                              스마트 분석
                            </>
                          )}
                        </Button>
                      </div>

                      {/* 진행률 표시 */}
                      {(isAnalyzing || isAiAnalyzing) && (
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm text-blue-700">
                            <span className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              {isAnalyzing && !isAiAnalyzing && "Mercury Parser로 콘텐츠 추출 중..."}
                              {isAiAnalyzing && "AI로 콘텐츠 분석 중..."}
                            </span>
                            <span className="font-medium">
                              {isAnalyzing ? Math.round(analysisProgress) : Math.round(aiProgress)}%
                            </span>
                          </div>
                          <Progress 
                            value={isAnalyzing ? analysisProgress : aiProgress} 
                            className="h-3 bg-blue-100" 
                          />
                          {isAiAnalyzing && (
                            <div className="text-xs text-purple-600 flex items-center gap-1">
                              <Brain className="h-3 w-3" />
                              {selectedModel?.name}로 스마트 분석 중...
                            </div>
                          )}
                        </div>
                      )}

                      {/* 분석 결과 상태 */}
                      {extractionResult && (
                        <Alert className={extractionResult.success ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"}>
                          {extractionResult.success ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-amber-600" />
                          )}
                          <AlertDescription className={extractionResult.success ? "text-green-700" : "text-amber-700"}>
                            {extractionResult.success 
                              ? `✨ 콘텐츠 추출 완료! (${extractionResult.method})` 
                              : `⚠️ ${extractionError}`}
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* AI 분석 결과 상태 */}
                      {aiAnalysis && (
                        <Alert className="border-purple-200 bg-purple-50">
                          <Brain className="h-4 w-4 text-purple-600" />
                          <AlertDescription className="text-purple-700">
                            🧠 AI 분석 완료! {selectedModel?.name}가 콘텐츠를 분석했습니다.
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* AI 에러 표시 */}
                      {aiError && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{aiError}</AlertDescription>
                        </Alert>
                      )}

                      {/* AI 설정 안내 */}
                      {!hasAISetup && (
                        <Alert className="border-purple-200 bg-purple-50">
                          <Brain className="h-4 w-4 text-purple-600" />
                          <AlertDescription className="text-purple-700">
                            💡 <strong>팁:</strong> AI 분석 기능을 사용하려면 설정에서 OpenRouter API를 연결해보세요!
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* 기본 정보 입력 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 제목 */}
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-medium flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      제목 *
                    </Label>
                    <Input
                      id="title"
                      placeholder="북마크 제목을 입력하세요"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className="h-11"
                      required
                    />
                  </div>

                  {/* 카테고리 */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Hash className="h-4 w-4" />
                      카테고리
                    </Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value: string) => handleInputChange('category', value)}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="카테고리를 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* 설명 */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">
                    설명
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="이 북마크에 대한 간단한 설명을 입력하세요"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                </div>

                {/* 태그 */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    태그
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="newTag"
                      placeholder="태그를 입력하세요"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="flex-1"
                    />
                    <Button 
                      onClick={addTag} 
                      variant="outline" 
                      size="sm"
                      disabled={!newTag.trim()}
                      className="px-4"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="cursor-pointer hover:bg-red-100 hover:text-red-700 transition-colors px-3 py-1"
                          onClick={() => removeTag(tag)}
                        >
                          {tag} ×
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* 미리보기 탭 */}
              <TabsContent value="preview" className="space-y-6">
                {extractionResult ? (
                  <Card className="overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                        추출된 콘텐츠 미리보기
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* 메인 정보 */}
                        <div className="lg:col-span-2 space-y-4">
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">제목</Label>
                            <h3 className="text-xl font-bold text-slate-900 mt-1">{extractionResult.title}</h3>
                          </div>
                          
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">요약</Label>
                            <div className="mt-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                              <p className="text-sm leading-relaxed text-blue-900">
                                {extractionResult.excerpt}
                              </p>
                            </div>
                          </div>

                          {/* 메타 정보 */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                            <div className="text-center p-3 bg-slate-50 rounded-lg">
                              <Clock className="h-5 w-5 mx-auto text-slate-600 mb-1" />
                              <div className="text-sm font-medium">{extractionResult.readingTime}</div>
                              <div className="text-xs text-muted-foreground">읽기 시간</div>
                            </div>
                            
                            <div className="text-center p-3 bg-slate-50 rounded-lg">
                              <BookOpen className="h-5 w-5 mx-auto text-slate-600 mb-1" />
                              <div className="text-sm font-medium">{extractionResult.wordCount.toLocaleString()}</div>
                              <div className="text-xs text-muted-foreground">단어 수</div>
                            </div>
                            
                            <div className="text-center p-3 bg-slate-50 rounded-lg">
                              <Globe className="h-5 w-5 mx-auto text-slate-600 mb-1" />
                              <div className="text-sm font-medium">{extractionResult.domain}</div>
                              <div className="text-xs text-muted-foreground">도메인</div>
                            </div>
                            
                            <div className="text-center p-3 bg-slate-50 rounded-lg">
                              <Zap className="h-5 w-5 mx-auto text-slate-600 mb-1" />
                              <div className="text-sm font-medium">{extractionResult.method}</div>
                              <div className="text-xs text-muted-foreground">추출 방법</div>
                            </div>
                          </div>

                          {/* 작성자 및 날짜 정보 */}
                          {(extractionResult.author || extractionResult.datePublished) && (
                            <div className="flex items-center gap-4 pt-4 border-t">
                              {extractionResult.author && (
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback>
                                      <User className="h-4 w-4" />
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="text-sm font-medium">{extractionResult.author}</div>
                                    <div className="text-xs text-muted-foreground">작성자</div>
                                  </div>
                                </div>
                              )}
                              
                              {extractionResult.datePublished && (
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <div className="text-sm font-medium">
                                      {new Date(extractionResult.datePublished).toLocaleDateString('ko-KR')}
                                    </div>
                                    <div className="text-xs text-muted-foreground">발행일</div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* 이미지 */}
                        <div className="space-y-4">
                          {extractionResult.leadImageUrl ? (
                            <div>
                              <Label className="text-sm font-medium text-muted-foreground">대표 이미지</Label>
                              <div className="mt-2">
                                <img 
                                  src={extractionResult.leadImageUrl} 
                                  alt={extractionResult.title}
                                  className="w-full h-48 object-cover rounded-lg border shadow-sm"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center">
                              <Image className="h-12 w-12 mx-auto text-slate-400 mb-2" />
                              <p className="text-sm text-muted-foreground">이미지를 찾을 수 없습니다</p>
                            </div>
                          )}

                          {/* 바로가기 버튼 */}
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => window.open(extractionResult.url, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            원본 페이지 열기
                          </Button>

                          {/* AI 분석 버튼 */}
                          {hasAISetup && selectedModel && !aiAnalysis && (
                            <Button
                              onClick={handleManualAIAnalysis}
                              disabled={isAiAnalyzing}
                              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                            >
                              {isAiAnalyzing ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  AI 분석 중...
                                </>
                              ) : (
                                <>
                                  <Brain className="h-4 w-4 mr-2" />
                                  AI 분석 시작
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-dashed">
                    <CardContent className="p-12 text-center">
                      <Brain className="h-16 w-16 mx-auto text-slate-300 mb-4" />
                      <h3 className="text-lg font-semibold text-slate-600 mb-2">아직 분석된 콘텐츠가 없습니다</h3>
                      <p className="text-muted-foreground mb-4">
                        기본 정보 탭에서 URL을 입력하고 스마트 분석을 실행해보세요
                      </p>
                      <Button 
                        variant="outline" 
                        onClick={() => setActiveTab("basic")}
                        className="gap-2"
                      >
                        <Globe className="h-4 w-4" />
                        기본 정보로 이동
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* AI 분석 탭 */}
              <TabsContent value="ai-analysis" className="space-y-6">
                {aiAnalysis ? (
                  <div className="space-y-6">
                    {/* AI 요약 */}
                    <Card>
                      <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50">
                        <CardTitle className="flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-purple-600" />
                          AI 스마트 요약
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border">
                          <p className="text-purple-900 leading-relaxed">{aiAnalysis.summary}</p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* 핵심 포인트 */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-blue-600" />
                          핵심 포인트
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {aiAnalysis.keyPoints?.map((point: string, index: number) => (
                            <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                                {index + 1}
                              </div>
                              <span className="text-blue-900 text-sm">{point}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* 학습 타임라인 */}
                    {aiAnalysis.timeline && aiAnalysis.timeline.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-green-600" />
                            학습 타임라인
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {aiAnalysis.timeline.map((step: any, index: number) => (
                              <div key={index} className="flex gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
                                <div className="flex items-center justify-center w-10 h-10 bg-green-600 text-white rounded-full font-bold shrink-0">
                                  {step.step}
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold text-green-900">{step.title}</h4>
                                  <p className="text-green-700 text-sm mt-1">{step.description}</p>
                                  <Badge variant="outline" className="mt-2 text-green-600 border-green-300">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {step.timeEstimate}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* 메타 정보 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-amber-600">{aiAnalysis.difficulty}</div>
                          <div className="text-sm text-muted-foreground">난이도</div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-blue-600">{aiAnalysis.contentType}</div>
                          <div className="text-sm text-muted-foreground">콘텐츠 유형</div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-purple-600">{aiAnalysis.tags?.length || 0}</div>
                          <div className="text-sm text-muted-foreground">생성된 태그</div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* 추천 태그 */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Tag className="h-5 w-5 text-amber-600" />
                          AI 추천 태그
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {aiAnalysis.tags?.map((tag: string) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="cursor-pointer hover:bg-blue-100 hover:text-blue-700 transition-colors"
                              onClick={() => {
                                if (!formData.tags.includes(tag)) {
                                  setFormData(prev => ({
                                    ...prev,
                                    tags: [...prev.tags, tag]
                                  }));
                                }
                              }}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* 학습 목표 */}
                    {aiAnalysis.readingGoals && aiAnalysis.readingGoals.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-indigo-600" />
                            학습 목표
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {aiAnalysis.readingGoals.map((goal: string, index: number) => (
                              <div key={index} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded">
                                <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                                <span className="text-sm">{goal}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* 액션 아이템 */}
                    {aiAnalysis.actionItems && aiAnalysis.actionItems.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            실행 가능한 액션
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {aiAnalysis.actionItems.map((action: string, index: number) => (
                              <div key={index} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded">
                                <input type="checkbox" className="rounded" />
                                <span className="text-sm">{action}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* 관련 주제 */}
                    {aiAnalysis.relatedTopics && aiAnalysis.relatedTopics.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Hash className="h-5 w-5 text-orange-600" />
                            관련 주제
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {aiAnalysis.relatedTopics.map((topic: string) => (
                              <Badge key={topic} variant="outline" className="text-orange-600 border-orange-300">
                                {topic}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ) : (
                  <Card className="border-dashed">
                    <CardContent className="p-12 text-center">
                      <Brain className="h-16 w-16 mx-auto text-slate-300 mb-4" />
                      <h3 className="text-lg font-semibold text-slate-600 mb-2">AI 분석 결과가 없습니다</h3>
                      <p className="text-muted-foreground mb-4">
                        콘텐츠를 먼저 추출하고 AI 분석을 실행해보세요
                      </p>
                      {extractionResult && hasAISetup && (
                        <Button 
                          onClick={handleManualAIAnalysis}
                          disabled={isAiAnalyzing}
                          className="gap-2"
                        >
                          {isAiAnalyzing ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              AI 분석 중...
                            </>
                          ) : (
                            <>
                              <Brain className="h-4 w-4" />
                              AI 분석 시작
                            </>
                          )}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* 고급 설정 탭 */}
              <TabsContent value="advanced" className="space-y-6">
                {/* 공개 설정 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      {formData.isPublic ? (
                        <Globe className="h-5 w-5 text-green-600" />
                      ) : (
                        <Lock className="h-5 w-5 text-gray-600" />
                      )}
                      공개 설정
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border">
                      <div className="flex items-center gap-3">
                        {formData.isPublic ? (
                          <div className="p-2 bg-green-100 rounded-full">
                            <Globe className="h-5 w-5 text-green-600" />
                          </div>
                        ) : (
                          <div className="p-2 bg-gray-100 rounded-full">
                            <Lock className="h-5 w-5 text-gray-600" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium">
                            {formData.isPublic ? "공개 북마크" : "비공개 북마크"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formData.isPublic 
                              ? "다른 사용자들이 이 북마크를 볼 수 있고, 검색 결과에도 포함됩니다" 
                              : "나만 볼 수 있는 비공개 북마크입니다"}
                          </div>
                        </div>
                      </div>
                      <Switch
                        checked={formData.isPublic}
                        onCheckedChange={(checked: boolean) => handleInputChange('isPublic', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* AI 분석 설정 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Brain className="h-5 w-5 text-purple-600" />
                      AI 분석 설정
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {hasAISetup ? (
                      <div className="space-y-4">
                        <Alert className="border-green-200 bg-green-50">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <AlertDescription className="text-green-700">
                            <div className="flex items-center justify-between">
                              <span>✅ AI 모델이 연결되었습니다!</span>
                              {selectedModel && (
                                <Badge variant="outline" className="text-green-700 border-green-300">
                                  {selectedModel.name}
                                </Badge>
                              )}
                            </div>
                          </AlertDescription>
                        </Alert>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 border rounded-lg bg-purple-50 border-purple-200">
                            <div className="flex items-center gap-2 mb-2">
                              <Sparkles className="h-4 w-4 text-purple-600" />
                              <span className="font-medium text-purple-900">자동 요약</span>
                            </div>
                            <p className="text-sm text-purple-700">
                              AI가 콘텐츠를 분석하여 핵심 내용을 요약합니다
                            </p>
                          </div>

                          <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
                            <div className="flex items-center gap-2 mb-2">
                              <TrendingUp className="h-4 w-4 text-blue-600" />
                              <span className="font-medium text-blue-900">키워드 추출</span>
                            </div>
                            <p className="text-sm text-blue-700">
                              중요한 키워드와 태그를 자동으로 생성합니다
                            </p>
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open('/settings', '_blank')}
                          className="w-full"
                        >
                          AI 설정 관리하기
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Brain className="h-16 w-16 mx-auto text-slate-300 mb-4" />
                        <h3 className="text-lg font-semibold text-slate-600 mb-2">AI 기능을 활성화하세요</h3>
                        <p className="text-muted-foreground mb-4">
                          OpenRouter API를 연결하면 더욱 스마트한 분석 기능을 사용할 수 있습니다
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => window.open('/settings', '_blank')}
                          className="gap-2"
                        >
                          <Brain className="h-4 w-4" />
                          AI 설정하러 가기
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 고급 옵션 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Sparkles className="h-5 w-5 text-amber-600" />
                      고급 옵션
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">자동 태그 생성</Label>
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="text-sm font-medium">콘텐츠 기반 태그</div>
                            <div className="text-xs text-muted-foreground">AI가 콘텐츠를 분석하여 관련 태그를 제안합니다</div>
                          </div>
                          <Switch defaultChecked />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-sm font-medium">자동 카테고리</Label>
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="text-sm font-medium">스마트 분류</div>
                            <div className="text-xs text-muted-foreground">콘텐츠 유형에 따라 자동으로 카테고리를 설정합니다</div>
                          </div>
                          <Switch defaultChecked />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <Label className="text-sm font-medium">북마크 만료 설정</Label>
                      <Select defaultValue="never">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="never">만료되지 않음</SelectItem>
                          <SelectItem value="1month">1개월 후</SelectItem>
                          <SelectItem value="3months">3개월 후</SelectItem>
                          <SelectItem value="6months">6개월 후</SelectItem>
                          <SelectItem value="1year">1년 후</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-sm font-medium">알림 설정</Label>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm">새로운 댓글 알림</span>
                          <Switch />
                        </div>
                        <div className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm">주간 리포트 받기</span>
                          <Switch defaultChecked />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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