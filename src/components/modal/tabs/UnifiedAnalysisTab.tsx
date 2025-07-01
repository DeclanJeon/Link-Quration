"use client"

import { memo, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Brain, Sparkles, TrendingUp, Clock, BookOpen, CheckCircle, 
  Tag, Quote, Target, Video, Eye, FileText, Play, Plus,
  Loader2, AlertCircle, ArrowRight, Star, Zap
} from "lucide-react";
import { ExtractedContent, BookmarkFormData } from "@/types/bookmark";
import { AIAnalysisResult } from "@/types/ai-analyze";
import { AIModel } from "@/types/ai-model";

interface UnifiedAnalysisTabProps {
  formData: BookmarkFormData;
  extractionResult: ExtractedContent | null;
  aiAnalysis: AIAnalysisResult | null;
  mediaAnalysis: any;
  detection: any;
  analysisState: 'idle' | 'analyzing' | 'complete';
  onUnifiedAnalysis: () => void;
  hasAISetup: boolean;
  selectedModel: AIModel | null;
  isAnalyzing: boolean;
  onAddTag: (tag: string) => void;
}

export const UnifiedAnalysisTab = memo(({
  formData,
  extractionResult,
  aiAnalysis,
  mediaAnalysis,
  detection,
  analysisState,
  onUnifiedAnalysis,
  hasAISetup,
  selectedModel,
  isAnalyzing,
  onAddTag,
}: UnifiedAnalysisTabProps) => {
  const [selectedSegment, setSelectedSegment] = useState<number | null>(null);

  // 분석이 아직 시작되지 않은 경우
  if (analysisState === 'idle' && !extractionResult) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-12 text-center">
          <Brain className="h-16 w-16 mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-semibold text-slate-600 mb-2">
            아직 분석이 시작되지 않았습니다
          </h3>
          <p className="text-muted-foreground mb-4">
            스마트 입력 탭에서 URL을 입력하고 스마트 분석을 실행해보세요
          </p>
          <Button 
            onClick={onUnifiedAnalysis}
            disabled={!formData.url || isAnalyzing}
            className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Sparkles className="h-4 w-4" />
            스마트 분석 시작
          </Button>
        </CardContent>
      </Card>
    );
  }

  // 분석 중인 경우
  if (analysisState === 'analyzing') {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-12 text-center">
          <div className="space-y-4">
            <Loader2 className="h-16 w-16 mx-auto text-blue-600 animate-spin" />
            <h3 className="text-lg font-semibold text-blue-900">
              콘텐츠를 분석하고 있습니다...
            </h3>
            <p className="text-blue-700">
              AI 요약, 키워드 추출{detection?.isMedia && ', 미디어 타임라인'}을 생성 중입니다
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <ScrollArea className="h-[600px]">
      <div className="space-y-6">
        {/* 콘텐츠 미리보기 섹션 */}
        {extractionResult && (
          <ContentPreviewSection extractionResult={extractionResult} />
        )}

        {/* AI 인사이트 섹션 */}
        {aiAnalysis && (
          <AIInsightsSection 
            aiAnalysis={aiAnalysis}
            onAddTag={onAddTag}
          />
        )}

        {/* 미디어 타임라인 섹션 (미디어인 경우만) */}
        {detection?.isMedia && mediaAnalysis && (
          <MediaTimelineSection 
            mediaAnalysis={mediaAnalysis}
            selectedSegment={selectedSegment}
            onSegmentSelect={setSelectedSegment}
          />
        )}

        {/* AI 설정이 없는 경우 안내 */}
        {!hasAISetup && (
          <Alert className="border-amber-200 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-700">
              <div className="flex items-center justify-between">
                <span>AI 분석 기능을 사용하려면 OpenRouter API를 설정하세요</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('/settings', '_blank')}
                >
                  설정하기
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </ScrollArea>
  );
});

UnifiedAnalysisTab.displayName = 'UnifiedAnalysisTab';

// 콘텐츠 미리보기 섹션
const ContentPreviewSection = memo(({ 
  extractionResult 
}: { 
  extractionResult: ExtractedContent;
}) => {
  return (
    <Card>
      <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-blue-600" />
          콘텐츠 미리보기
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 메인 정보 */}
          <div className="lg:col-span-2 space-y-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {extractionResult.title}
              </h3>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm leading-relaxed text-blue-900">
                  {extractionResult.excerpt}
                </p>
              </div>
            </div>

            {/* 메타 정보 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetaInfoCard 
                icon={Clock} 
                value={extractionResult.readingTime} 
                label="읽기 시간" 
              />
              <MetaInfoCard 
                icon={BookOpen} 
                value={extractionResult.wordCount?.toLocaleString()} 
                label="단어 수" 
              />
              <MetaInfoCard 
                icon={FileText} 
                value={extractionResult.method} 
                label="추출 방법" 
              />
              <MetaInfoCard 
                icon={Brain} 
                value={extractionResult.domain} 
                label="도메인" 
              />
            </div>
          </div>

          {/* 이미지 */}
          <div>
            {extractionResult.leadImageUrl ? (
              <img 
                src={extractionResult.leadImageUrl} 
                alt={extractionResult.title}
                className="w-full h-48 object-cover rounded-lg border shadow-sm"
              />
            ) : (
              <div className="w-full h-48 bg-slate-100 rounded-lg flex items-center justify-center">
                <FileText className="h-12 w-12 text-slate-400" />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

ContentPreviewSection.displayName = 'ContentPreviewSection';

// AI 인사이트 섹션
const AIInsightsSection = memo(({ 
  aiAnalysis,
  onAddTag,
}: { 
  aiAnalysis: AIAnalysisResult;
  onAddTag: (tag: string) => void;
}) => {
  return (
    <>
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

      {/* 핵심 포인트 & 추천 태그 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 핵심 포인트 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              핵심 포인트
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
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

        {/* AI 추천 태그 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
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
                  onClick={() => onAddTag(tag)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 학습 목표 & 액션 아이템 */}
      {(aiAnalysis.readingGoals?.length > 0 || aiAnalysis.actionItems?.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {aiAnalysis.readingGoals?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="h-5 w-5 text-indigo-600" />
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

          {aiAnalysis.actionItems?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
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
        </div>
      )}
    </>
  );
});

AIInsightsSection.displayName = 'AIInsightsSection';

// 미디어 타임라인 섹션
const MediaTimelineSection = memo(({ 
  mediaAnalysis,
  selectedSegment,
  onSegmentSelect,
}: { 
  mediaAnalysis: any;
  selectedSegment: number | null;
  onSegmentSelect: (index: number | null) => void;
}) => {
  return (
    <>
      {/* 미디어 요약 */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-purple-600" />
            미디어 분석 결과
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border mb-4">
            <p className="text-purple-900 leading-relaxed">
              {mediaAnalysis.overallSummary}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              value={mediaAnalysis.metadata?.durationFormatted || "N/A"}
              label="총 길이"
              color="purple"
            />
            <MetricCard
              value={mediaAnalysis.timeline?.length.toString() || "0"}
              label="타임라인 구간"
              color="pink"
            />
            <MetricCard
              value={`${Math.round((mediaAnalysis.confidence || 0.85) * 100)}%`}
              label="분석 신뢰도"
              color="green"
            />
          </div>
        </CardContent>
      </Card>

      {/* 타임라인 */}
      {mediaAnalysis.timeline?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-600" />
              미디어 타임라인
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {mediaAnalysis.timeline.map((segment: any, index: number) => (
                <TimelineSegment
                  key={segment.id}
                  segment={segment}
                  index={index}
                  isSelected={selectedSegment === index}
                  onSelect={() => onSegmentSelect(selectedSegment === index ? null : index)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 명언/인용구 */}
      {mediaAnalysis.notableQuotes?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Quote className="h-5 w-5 text-indigo-600" />
              주요 인용구
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mediaAnalysis.notableQuotes.map((quote: any, index: number) => (
                <div key={index} className="border-l-4 border-indigo-500 pl-4 py-2 bg-indigo-50">
                  <blockquote className="text-indigo-900 font-medium italic mb-2">
                    "{quote.text}"
                  </blockquote>
                  <div className="flex items-center justify-between text-sm text-indigo-600">
                    <span>— {quote.speaker}</span>
                    <span>{quote.timestamp?.formatted}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
});

MediaTimelineSection.displayName = 'MediaTimelineSection';

// 유틸리티 컴포넌트들

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

const MetricCard = memo(({
  value,
  label,
  color,
}: {
  value: string;
  label: string;
  color: 'purple' | 'pink' | 'green';
}) => {
  const colorMap = {
    purple: 'bg-purple-50 text-purple-600',
    pink: 'bg-pink-50 text-pink-600',
    green: 'bg-green-50 text-green-600'
  };

  return (
    <div className={`text-center p-4 ${colorMap[color].split(' ')[0]} rounded-lg`}>
      <div className={`text-2xl font-bold ${colorMap[color].split(' ')[1]}`}>
        {value}
      </div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
});

MetricCard.displayName = 'MetricCard';

const TimelineSegment = memo(({
  segment,
  index,
  isSelected,
  onSelect,
}: {
  segment: any;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
}) => {
  // 중요도 레벨 타입 정의
  type ImportanceLevel = 'high' | 'medium' | 'low';
  
  // 중요도에 따른 색상 매핑
  const importanceColors: Record<ImportanceLevel, string> = {
    high: 'bg-red-500',
    medium: 'bg-yellow-500',
    low: 'bg-green-500'
  };
  
  // 안전하게 중요도 값 가져오기
  const getImportanceLevel = (level: string): ImportanceLevel => {
    return (['high', 'medium', 'low'].includes(level) ? level : 'medium') as ImportanceLevel;
  };
  
  const importance = getImportanceLevel(segment.importance);

  return (
    <div
      className={`p-4 border rounded-lg cursor-pointer transition-all ${
        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${importanceColors[importance]}`} />
            <span className="text-sm font-mono text-muted-foreground">
              {segment.startTime.formatted}
            </span>
          </div>
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm font-mono text-muted-foreground">
            {segment.endTime.formatted}
          </span>
        </div>
        
        <Badge variant={segment.importance === 'high' ? 'destructive' : 'secondary'}>
          {segment.importance}
        </Badge>
      </div>

      <h4 className="font-semibold text-gray-900 mb-2">{segment.title}</h4>
      
      {segment.summary && (
        <p className="text-sm text-gray-600 mb-3">{segment.summary}</p>
      )}

      {isSelected && segment.keyPoints?.length > 0 && (
        <div className="mt-3 pt-3 border-t">
          <div className="text-xs font-medium text-gray-500 mb-2">핵심 포인트:</div>
          <ul className="text-sm space-y-1">
            {segment.keyPoints.map((point: string, idx: number) => (
              <li key={idx} className="flex items-start gap-2">
                <Star className="h-3 w-3 text-yellow-500 mt-0.5 shrink-0" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
});

TimelineSegment.displayName = 'TimelineSegment';
