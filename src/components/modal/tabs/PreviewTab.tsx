// src/components/modal/tabs/PreviewTab.tsx
"use client"

import { memo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  TrendingUp, Clock, BookOpen, Globe, Zap, ExternalLink, 
  Image, User, Calendar, Brain, Loader2 
} from "lucide-react";
import { ExtractedContent } from "@/types/bookmark";
import { AIAnalysisResult } from "@/types/ai-analyze";
import { AIModel } from "@/types/ai-model";

export const PreviewTab = memo(({
  extractionResult,
  hasAISetup,
  selectedModel,
  aiAnalysis,
  isAiAnalyzing,
  onManualAIAnalysis,
  onTabChange,
}: {
  extractionResult: ExtractedContent | null;
  hasAISetup: boolean;
  selectedModel: AIModel | null;
  aiAnalysis: AIAnalysisResult | null;
  isAiAnalyzing: boolean;
  onManualAIAnalysis: () => void;
  onTabChange: (tab: string) => void;
}) => {
  
  // 콜백 최적화
  const handleTabChange = useCallback(() => {
    onTabChange("basic");
  }, [onTabChange]);

  const handleOpenUrl = useCallback(() => {
    if (extractionResult?.url) {
      window.open(extractionResult.url, '_blank');
    }
  }, [extractionResult?.url]);

  if (!extractionResult) {
    return (
      <EmptyStateCard onTabChange={handleTabChange} />
    );
  }

  return (
    <PreviewCard
      extractionResult={extractionResult}
      hasAISetup={hasAISetup}
      selectedModel={selectedModel}
      aiAnalysis={aiAnalysis}
      isAiAnalyzing={isAiAnalyzing}
      onManualAIAnalysis={onManualAIAnalysis}
      onOpenUrl={handleOpenUrl}
    />
  );
});

PreviewTab.displayName = 'PreviewTab';

// 빈 상태 카드
const EmptyStateCard = memo(({ onTabChange }: { onTabChange: () => void }) => {
  return (
    <Card className="border-dashed">
      <CardContent className="p-12 text-center">
        <Brain className="h-16 w-16 mx-auto text-slate-300 mb-4" />
        <h3 className="text-lg font-semibold text-slate-600 mb-2">
          아직 분석된 콘텐츠가 없습니다
        </h3>
        <p className="text-muted-foreground mb-4">
          기본 정보 탭에서 URL을 입력하고 스마트 분석을 실행해보세요
        </p>
        <Button 
          variant="outline" 
          onClick={onTabChange}
          className="gap-2"
        >
          <Globe className="h-4 w-4" />
          기본 정보로 이동
        </Button>
      </CardContent>
    </Card>
  );
});

EmptyStateCard.displayName = 'EmptyStateCard';

// 미리보기 카드
const PreviewCard = memo(({
  extractionResult,
  hasAISetup,
  selectedModel,
  aiAnalysis,
  isAiAnalyzing,
  onManualAIAnalysis,
  onOpenUrl,
}: {
  extractionResult: ExtractedContent;
  hasAISetup: boolean;
  selectedModel: AIModel | null;
  aiAnalysis: AIAnalysisResult | null;
  isAiAnalyzing: boolean;
  onManualAIAnalysis: () => void;
  onOpenUrl: () => void;
}) => {
  return (
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
          <MainInfo 
            extractionResult={extractionResult}
          />
          
          {/* 사이드바 */}
          <Sidebar
            extractionResult={extractionResult}
            hasAISetup={hasAISetup}
            selectedModel={selectedModel}
            aiAnalysis={aiAnalysis}
            isAiAnalyzing={isAiAnalyzing}
            onManualAIAnalysis={onManualAIAnalysis}
            onOpenUrl={onOpenUrl}
          />
        </div>
      </CardContent>
    </Card>
  );
});

PreviewCard.displayName = 'PreviewCard';

// 메인 정보 섹션
const MainInfo = memo(({ extractionResult }: { extractionResult: ExtractedContent }) => {
  return (
    <div className="lg:col-span-2 space-y-4">
      <InfoSection label="제목">
        <h3 className="text-xl font-bold text-slate-900 mt-1">
          {extractionResult.title}
        </h3>
      </InfoSection>
      
      <InfoSection label="요약">
        <div className="mt-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm leading-relaxed text-blue-900">
            {extractionResult.excerpt}
          </p>
        </div>
      </InfoSection>

      {/* 메타 정보 그리드 */}
      <MetaInfoGrid extractionResult={extractionResult} />

      {/* 작성자 및 날짜 정보 */}
      {(extractionResult.author || extractionResult.datePublished) && (
        <AuthorDateInfo 
          author={extractionResult.author}
          datePublished={extractionResult.datePublished}
        />
      )}
    </div>
  );
});

MainInfo.displayName = 'MainInfo';

// 정보 섹션 컴포넌트
const InfoSection = memo(({ 
  label, 
  children 
}: { 
  label: string; 
  children: React.ReactNode;
}) => {
  return (
    <div>
      <Label className="text-sm font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
});

InfoSection.displayName = 'InfoSection';

// 메타 정보 그리드
const MetaInfoGrid = memo(({ extractionResult }: { extractionResult: ExtractedContent }) => {
  const metaItems = [
    { icon: Clock, value: extractionResult.readingTime, label: '읽기 시간' },
    { icon: BookOpen, value: extractionResult.wordCount.toLocaleString(), label: '단어 수' },
    { icon: Globe, value: extractionResult.domain, label: '도메인' },
    { icon: Zap, value: extractionResult.method, label: '추출 방법' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
      {metaItems.map((item, index) => (
        <MetaInfoCard key={index} {...item} />
      ))}
    </div>
  );
});

MetaInfoGrid.displayName = 'MetaInfoGrid';

// 메타 정보 카드
const MetaInfoCard = memo(({ 
  icon: Icon, 
  value, 
  label 
}: {
  icon: React.ElementType;
  value: string | undefined;
  label: string;
}) => {
  return (
    <div className="text-center p-3 bg-slate-50 rounded-lg">
      <Icon className="h-5 w-5 mx-auto text-slate-600 mb-1" />
      <div className="text-sm font-medium">{value || '-'}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
});

MetaInfoCard.displayName = 'MetaInfoCard';

// 작성자 및 날짜 정보
const AuthorDateInfo = memo(({ 
  author, 
  datePublished
}: { 
  author?: string | null; 
  datePublished?: string | null;
  
}) => {
  return (
    <div className="flex items-center gap-4 pt-4 border-t">
      {author && (
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="text-sm font-medium">{author}</div>
            <div className="text-xs text-muted-foreground">작성자</div>
          </div>
        </div>
      )}
      
      {datePublished && (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="text-sm font-medium">
              {new Date(datePublished).toLocaleDateString('ko-KR')}
            </div>
            <div className="text-xs text-muted-foreground">발행일</div>
          </div>
        </div>
      )}
    </div>
  );
});

AuthorDateInfo.displayName = 'AuthorDateInfo';

// 사이드바
const Sidebar = memo(({
  extractionResult,
  hasAISetup,
  selectedModel,
  aiAnalysis,
  isAiAnalyzing,
  onManualAIAnalysis,
  onOpenUrl,
}: {
  extractionResult: ExtractedContent;
  hasAISetup: boolean;
  selectedModel: AIModel | null;
  aiAnalysis: AIAnalysisResult | null;
  isAiAnalyzing: boolean;
  onManualAIAnalysis: () => void;
  onOpenUrl: () => void;
}) => {
  return (
    <div className="space-y-4">
      {/* 이미지 섹션 */}
      <ImageSection 
        imageUrl={extractionResult.leadImageUrl}
        title={extractionResult.title}
      />

      {/* 바로가기 버튼 */}
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={onOpenUrl}
      >
        <ExternalLink className="h-4 w-4 mr-2" />
        원본 페이지 열기
      </Button>

      {/* AI 분석 버튼 */}
      {hasAISetup && selectedModel && !aiAnalysis && (
        <Button
          onClick={onManualAIAnalysis}
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
  );
});

Sidebar.displayName = 'Sidebar';

// 이미지 섹션
const ImageSection = memo(({ 
  imageUrl, 
  title 
}: { 
  imageUrl?: string | null; 
  title: string;
}) => {
  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.style.display = 'none';
  }, []);

  return (
    <div>
      <Label className="text-sm font-medium text-muted-foreground">대표 이미지</Label>
      <div className="mt-2">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={title}
            className="w-full h-48 object-cover rounded-lg border shadow-sm"
            onError={handleImageError}
          />
        ) : (
          <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center">
            <Image className="h-12 w-12 mx-auto text-slate-400 mb-2" />
            <p className="text-sm text-muted-foreground">이미지를 찾을 수 없습니다</p>
          </div>
        )}
      </div>
    </div>
  );
});

ImageSection.displayName = 'ImageSection';