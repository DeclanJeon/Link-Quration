"use client"

import { memo, useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Globe, Brain, BookOpen, Hash, Tag, Plus, Sparkles, 
  Loader2, CheckCircle, AlertCircle, Video, Youtube, Music,
  Headphones, Radio, Clock, Podcast
} from "lucide-react";
import { BookmarkFormData, AIAnalysisResult } from "@/types/bookmark";
import { ExtractionResult } from "@/types/extraction";
import { AIModel } from "@/types/ai-model";

// 상수 분리
const CATEGORIES = [
  "기술", "개발", "디자인", "비즈니스", "마케팅", 
  "교육", "뉴스", "블로그", "튜토리얼", "리서치", "미디어", "기타"
] as const;

const PLATFORM_ICONS = {
  youtube: Youtube,
  vimeo: Video,
  spotify: Music,
  soundcloud: Headphones,
  podcast: Radio,
  apple_podcasts: Podcast,
  google_podcasts: Podcast,
  twitch: Video,
  instagram: Video,
  tiktok: Video,
  generic: Globe
} as const;

const PLATFORM_COLORS = {
  youtube: 'text-red-600',
  vimeo: 'text-blue-600',
  spotify: 'text-green-600',
  soundcloud: 'text-orange-600',
  podcast: 'text-purple-600',
  apple_podcasts: 'text-pink-600',
  google_podcasts: 'text-blue-400',
  twitch: 'text-purple-500',
  instagram: 'text-pink-500',
  tiktok: 'text-black',
  generic: 'text-gray-600'
} as const;

type MediaPlatform = keyof typeof PLATFORM_ICONS;

interface MediaDetection {
  isMedia: boolean;
  platform: MediaPlatform;
  mediaType: string;
  supportedFeatures: string[];
}

interface BasicInfoTabProps {
  formData: BookmarkFormData;
  newTag: string;
  setNewTag: (tag: string) => void;
  onInputChange: (field: keyof BookmarkFormData, value: string | boolean | string[]) => void;
  onAddTag: () => void;
  onRemoveTag: (tag: string) => void;
  onUrlAnalysis: () => void;
  onSmartAnalysis: () => void;
  isAnalyzing: boolean;
  analysisProgress: number;
  extractionResult: ExtractionResult | null;
  extractionError: string;
  aiAnalysis: AIAnalysisResult | null;
  aiError: string;
  hasAISetup: boolean;
  selectedModel: AIModel | null;
  onKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  detection: MediaDetection | null;
  isDescriptionEnhancing?: boolean;
}

export const BasicInfoTab = memo(({
  formData,
  newTag,
  setNewTag,
  onInputChange,
  onAddTag,
  onRemoveTag,
  onSmartAnalysis,
  isAnalyzing,
  analysisProgress,
  extractionResult,
  extractionError,
  aiAnalysis,
  aiError,
  hasAISetup,
  selectedModel,
  onKeyPress,
  detection,
}: BasicInfoTabProps) => {
  
  // 플랫폼 아이콘 가져오기
  const getPlatformIcon = useCallback((platform: string) => {
    const IconComponent = PLATFORM_ICONS[platform as keyof typeof PLATFORM_ICONS] || Video;
    const colorClass = PLATFORM_COLORS[platform as keyof typeof PLATFORM_COLORS] || 'text-gray-600';
    return <IconComponent className={`h-5 w-5 ${colorClass}`} />;
  }, []);

  // URL 유효성 검사
  const isUrlValid = useMemo(() => {
    try {
      new URL(formData.url);
      return true;
    } catch {
      return false;
    }
  }, [formData.url]);

  // 분석 가능 여부
  const canAnalyze = useMemo(() => 
    formData.url.trim() !== '' && isUrlValid && !isAnalyzing,
    [formData.url, isUrlValid, isAnalyzing]
  );

  return (
    <div className="space-y-6">
      {/* URL 입력 섹션 */}
      <UrlInputSection
        url={formData.url}
        isAnalyzing={isAnalyzing}
        canAnalyze={canAnalyze}
        analysisProgress={analysisProgress}
        detection={detection}
        extractionResult={extractionResult}
        aiAnalysis={aiAnalysis}
        extractionError={extractionError}
        aiError={aiError}
        hasAISetup={hasAISetup}
        selectedModel={selectedModel}
        onUrlChange={(value) => onInputChange('url', value)}
        onSmartAnalysis={onSmartAnalysis}
        onKeyPress={onKeyPress}
        getPlatformIcon={getPlatformIcon}
      />

      {/* 기본 정보 입력 */}
      <BasicInfoFields
        formData={formData}
        onInputChange={onInputChange}
      />

      {/* 설명 */}
      <DescriptionField
        description={formData.description}
        onChange={(value) => onInputChange('description', value)}
      />

      {/* 태그 */}
      <TagsSection
        tags={formData.tags}
        newTag={newTag}
        setNewTag={setNewTag}
        onAddTag={onAddTag}
        onRemoveTag={onRemoveTag}
        onKeyPress={onKeyPress}
      />

      {/* 미리보기 카드 */}
      {extractionResult && (
        <PreviewCard
          extractionResult={extractionResult}
          isAnalyzing={isAnalyzing}
        />
      )}
    </div>
  );
});

BasicInfoTab.displayName = 'BasicInfoTab';

// URL 입력 섹션 컴포넌트
const UrlInputSection = memo(({
  url,
  isAnalyzing,
  canAnalyze,
  analysisProgress,
  detection,
  extractionResult,
  aiAnalysis,
  extractionError,
  aiError,
  hasAISetup,
  selectedModel,
  onUrlChange,
  onSmartAnalysis,
  onKeyPress,
  getPlatformIcon,
}: {
  url: string;
  isAnalyzing: boolean;
  canAnalyze: boolean;
  analysisProgress: number;
  detection: MediaDetection | null;
  extractionResult: ExtractionResult | null;
  aiAnalysis: AIAnalysisResult | null;
  extractionError: string;
  aiError: string;
  hasAISetup: boolean;
  selectedModel: AIModel | null;
  onUrlChange: (value: string) => void;
  onSmartAnalysis: () => void;
  onKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  getPlatformIcon: (platform: string) => React.ReactNode;
}) => {
  // URL 유효성 검사를 여기서 수행
  const isUrlValid = useMemo(() => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }, [url]);

  return (
    <Card className="border-dashed border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="h-5 w-5 text-blue-600" />
            <Label className="text-lg font-semibold text-blue-900">
              스마트 큐레이션 시작하기 🚀
            </Label>
          </div>
          
          <div className="flex gap-3">
            <Input
              id="url"
              type="url"
              placeholder="https://example.com - 웹페이지, 유튜브, 팟캐스트 등 모든 URL 가능!"
              value={url}
              onChange={(e) => onUrlChange(e.target.value)}
              onKeyPress={onKeyPress}
              className="flex-1 h-12 text-lg border-blue-200 focus:border-blue-400 bg-white"
              aria-label="URL 입력"
              aria-invalid={!url || !isUrlValid ? 'true' : 'false'}
            />
            <Button 
              onClick={onSmartAnalysis}
              disabled={!canAnalyze}
              size="lg"
              className="px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              aria-label="스마트 분석 시작"
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

          {/* 상태 표시 영역 */}
          <StatusIndicators
            detection={detection}
            isAnalyzing={isAnalyzing}
            analysisProgress={analysisProgress}
            extractionResult={extractionResult}
            aiAnalysis={aiAnalysis}
            extractionError={extractionError}
            aiError={aiError}
            hasAISetup={hasAISetup}
            selectedModel={selectedModel}
            getPlatformIcon={getPlatformIcon}
          />
        </div>
      </CardContent>
    </Card>
  );
});

UrlInputSection.displayName = 'UrlInputSection';

// 상태 표시 컴포넌트
const StatusIndicators = memo(({
  detection,
  isAnalyzing,
  analysisProgress,
  extractionResult,
  aiAnalysis,
  extractionError,
  aiError,
  hasAISetup,
  selectedModel,
  getPlatformIcon,
}: {
  detection: MediaDetection | null;
  isAnalyzing: boolean;
  analysisProgress: number;
  extractionResult: ExtractionResult | null;
  aiAnalysis: AIAnalysisResult | null;
  extractionError: string;
  aiError: string;
  hasAISetup: boolean;
  selectedModel: AIModel | null;
  getPlatformIcon: (platform: string) => React.ReactNode;
}) => {
  return (
    <>
      {/* 미디어 감지 정보 */}
      {detection?.isMedia && (
        <Alert className="border-purple-200 bg-purple-50">
          <div className="flex items-center gap-2">
            {getPlatformIcon(detection.platform)}
            <AlertDescription className="text-purple-700">
              <div className="flex items-center justify-between w-full">
                <div>
                  <strong>미디어 콘텐츠 감지!</strong> {detection.platform} • {detection.mediaType}
                </div>
                <div className="flex gap-1">
                  {detection.supportedFeatures.map((feature) => (
                    <Badge key={feature} variant="secondary" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* 진행률 표시 */}
      {isAnalyzing && (
        <AnalysisProgress 
          progress={analysisProgress}
          isMedia={detection?.isMedia || false}
        />
      )}

      {/* 분석 결과 상태 */}
      {extractionResult && (
        <ExtractionSuccessAlert 
          extractionResult={extractionResult}
        />
      )}

      {/* AI 분석 결과 상태 */}
      {aiAnalysis && (
        <AIAnalysisSuccessAlert 
          selectedModel={selectedModel}
        />
      )}

      {/* 에러 표시 */}
      {extractionError && (
        <ErrorAlert message={extractionError} />
      )}

      {aiError && (
        <ErrorAlert message={aiError} />
      )}

      {/* AI 설정 안내 */}
      {!hasAISetup && (
        <AISetupPrompt />
      )}
    </>
  );
});

StatusIndicators.displayName = 'StatusIndicators';

// 분석 진행률 컴포넌트
const AnalysisProgress = memo(({ 
  progress, 
  isMedia 
}: { 
  progress: number; 
  isMedia: boolean;
}) => {
  return (
    <div className="space-y-3">
      <div className="flex justify-between text-sm text-blue-700">
        <span className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          {isMedia ? '미디어 콘텐츠 분석 중...' : '웹 콘텐츠 추출 중...'}
        </span>
        <span className="font-medium">{Math.round(progress)}%</span>
      </div>
      <Progress value={progress} className="h-3 bg-blue-100" />
    </div>
  );
});

AnalysisProgress.displayName = 'AnalysisProgress';

// 추출 성공 알림 컴포넌트
const ExtractionSuccessAlert = memo(({ 
  extractionResult 
}: { 
  extractionResult: ExtractionResult;
}) => {
  return (
    <Alert className="border-green-200 bg-green-50">
      <CheckCircle className="h-4 w-4 text-green-600" />
      <AlertDescription className="text-green-700">
        <div className="flex items-center justify-between">
          <span>✨ 콘텐츠 추출 완료! ({extractionResult.method})</span>
          {extractionResult.readingTime && (
            <Badge variant="outline" className="text-green-700 border-green-300">
              <Clock className="h-3 w-3 mr-1" />
              {extractionResult.readingTime}
            </Badge>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
});

ExtractionSuccessAlert.displayName = 'ExtractionSuccessAlert';

// AI 분석 성공 알림 컴포넌트
const AIAnalysisSuccessAlert = memo(({ 
  selectedModel 
}: { 
  selectedModel: AIModel | null;
}) => {
  return (
    <Alert className="border-purple-200 bg-purple-50">
      <Brain className="h-4 w-4 text-purple-600" />
      <AlertDescription className="text-purple-700">
        <div className="flex items-center justify-between">
          <span>🧠 AI 빠른 분석 완료! {selectedModel?.name}</span>
          <Badge variant="outline" className="text-purple-700 border-purple-300">
            상세분석 가능
          </Badge>
        </div>
      </AlertDescription>
    </Alert>
  );
});

AIAnalysisSuccessAlert.displayName = 'AIAnalysisSuccessAlert';

// 에러 알림 컴포넌트
const ErrorAlert = memo(({ message }: { message: string }) => {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
});

ErrorAlert.displayName = 'ErrorAlert';

// AI 설정 프롬프트 컴포넌트
const AISetupPrompt = memo(() => {
  return (
    <Alert className="border-purple-200 bg-purple-50">
      <Brain className="h-4 w-4 text-purple-600" />
      <AlertDescription className="text-purple-700">
        💡 <strong>팁:</strong> AI 분석 기능을 사용하려면 설정에서 OpenRouter API를 연결해보세요!
      </AlertDescription>
    </Alert>
  );
});

AISetupPrompt.displayName = 'AISetupPrompt';

// 기본 정보 필드 컴포넌트
const BasicInfoFields = memo(({
  formData,
  onInputChange,
}: {
  formData: BookmarkFormData;
  onInputChange: (field: keyof BookmarkFormData, value: string | boolean | string[]) => void;
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <Label htmlFor="title" className="text-sm font-medium flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          제목 *
        </Label>
        <Input
          id="title"
          placeholder="북마크 제목을 입력하세요"
          value={formData.title}
          onChange={(e) => onInputChange('title', e.target.value)}
          className="h-11"
          required
          aria-required="true"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category" className="text-sm font-medium flex items-center gap-2">
          <Hash className="h-4 w-4" />
          카테고리
        </Label>
        <Select
          value={formData.category}
          onValueChange={(value: string) => onInputChange('category', value)}
        >
          <SelectTrigger id="category" className="h-11">
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
  );
});

BasicInfoFields.displayName = 'BasicInfoFields';

// 설명 필드 컴포넌트
const DescriptionField = memo(({
  description,
  onChange,
}: {
  description: string;
  onChange: (value: string) => void;
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="description" className="text-sm font-medium">설명</Label>
      <Textarea
        id="description"
        placeholder="이 북마크에 대한 간단한 설명을 입력하세요"
        value={description}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="resize-none"
        aria-label="북마크 설명"
      />
    </div>
  );
});

DescriptionField.displayName = 'DescriptionField';

// 태그 섹션 컴포넌트
const TagsSection = memo(({
  tags,
  newTag,
  setNewTag,
  onAddTag,
  onRemoveTag,
  onKeyPress,
}: {
  tags: string[];
  newTag: string;
  setNewTag: (tag: string) => void;
  onAddTag: () => void;
  onRemoveTag: (tag: string) => void;
  onKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}) => {
  const handleRemoveTag = useCallback((tag: string) => {
    onRemoveTag(tag);
  }, [onRemoveTag]);

  return (
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
          onKeyPress={onKeyPress}
          className="flex-1"
          aria-label="새 태그 입력"
        />
        <Button 
          onClick={onAddTag} 
          variant="outline" 
          size="sm"
          disabled={!newTag.trim()}
          className="px-4"
          aria-label="태그 추가"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2" role="list" aria-label="태그 목록">
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="cursor-pointer hover:bg-red-100 hover:text-red-700 transition-colors px-3 py-1"
              onClick={() => handleRemoveTag(tag)}
              role="listitem"
              tabIndex={0}
              onKeyPress={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleRemoveTag(tag);
                }
              }}
              aria-label={`태그 "${tag}" 제거하려면 클릭`}
            >
              {tag} ×
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
});

TagsSection.displayName = 'TagsSection';

// 미리보기 카드 컴포넌트
const PreviewCard = memo(({
  extractionResult,
  isAnalyzing,
}: {
  extractionResult: ExtractionResult;
  isAnalyzing: boolean;
}) => {
  return (
    <Card className="bg-gradient-to-r from-slate-50 to-blue-50 border-slate-200">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <PreviewImage 
            imageUrl={extractionResult.leadImageUrl}
            title={extractionResult.title}
            isAnalyzing={isAnalyzing}
          />
          <PreviewContent 
            extractionResult={extractionResult}
          />
        </div>
      </CardContent>
    </Card>
  );
});

PreviewCard.displayName = 'PreviewCard';

// 미리보기 이미지 컴포넌트
const PreviewImage = memo(({
  imageUrl,
  title,
  isAnalyzing,
}: {
  imageUrl?: string | null;
  title: string;
  isAnalyzing: boolean;
}) => {
  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    img.style.display = 'none';
    
    // 플레이스홀더 생성
    const placeholder = document.createElement('div');
    placeholder.className = 'w-full h-full bg-slate-100 rounded-lg flex items-center justify-center';
    placeholder.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6 text-slate-400">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="2" y1="12" x2="22" y2="12"></line>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
      </svg>
    `;
    img.parentNode?.insertBefore(placeholder, img.nextSibling);
  }, []);

  return (
    <div className="relative w-24 h-24 flex-shrink-0">
      {imageUrl ? (
        <div className="w-full h-full rounded-lg border overflow-hidden">
          <img 
            src={imageUrl} 
            alt={title}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              isAnalyzing ? 'opacity-50' : 'opacity-100'
            }`}
            onError={handleImageError}
          />
        </div>
      ) : (
        <div className="w-full h-full bg-slate-100 rounded-lg flex items-center justify-center">
          <Globe className="h-6 w-6 text-slate-400" />
        </div>
      )}
      {isAnalyzing && (
        <div className="absolute inset-0 bg-black bg-opacity-20 rounded-lg flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      )}
    </div>
  );
});

PreviewImage.displayName = 'PreviewImage';

// 미리보기 콘텐츠 컴포넌트
const PreviewContent = memo(({
  extractionResult,
}: {
  extractionResult: ExtractionResult;
}) => {
  return (
    <div className="flex-1 min-w-0">
      <h4 className="font-semibold text-slate-900 truncate">
        {extractionResult.title || '제목 없음'}
      </h4>
      <p className="text-sm text-slate-600 line-clamp-2 mt-1">
        {extractionResult.excerpt || '설명이 없습니다.'}
      </p>
      <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
        <span>{extractionResult.domain || '도메인 정보 없음'}</span>
        {extractionResult.readingTime && (
          <>
            <span>•</span>
            <span>{extractionResult.readingTime}</span>
          </>
        )}
        {extractionResult.author && (
          <>
            <span>•</span>
            <span>{extractionResult.author}</span>
          </>
        )}
      </div>
    </div>
  );
});

PreviewContent.displayName = 'PreviewContent';
