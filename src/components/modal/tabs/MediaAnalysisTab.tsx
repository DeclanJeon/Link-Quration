// src/components/modal/tabs/MediaAnalysisTab.tsx
"use client"

import { useState, useEffect, memo, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Play, Pause, Clock, Brain, Sparkles, TrendingUp, BookOpen, 
  Quote, Target, Lightbulb, AlertCircle, CheckCircle, 
  BarChart3, Zap, MessageSquare, Star, ArrowRight,
  Youtube, Video, Music, Headphones, Radio
} from "lucide-react";
import { MediaAnalysisResult, TimelineSegment } from '@/types/media-analysis';
import { useMediaAnalysis } from '@/hooks/useMediaAnalysis';
import { AIModel } from '@/types/ai-model';
import { AnalysisOptions, MediaAnalysisTabProps } from '@/types/bookmark';



// 플랫폼 아이콘 맵
const PLATFORM_ICONS = {
  youtube: Youtube,
  vimeo: Video,
  spotify: Music,
  soundcloud: Headphones,
  podcast: Radio
} as const;

const PLATFORM_COLORS = {
  youtube: 'text-red-600',
  vimeo: 'text-blue-600',
  spotify: 'text-green-600',
  soundcloud: 'text-orange-600',
  podcast: 'text-purple-600'
} as const;

export const MediaAnalysisTab = memo(({
  mediaUrl,
  hasAISetup,
  selectedModel,
  apiKey,
  onAnalysisComplete
}: MediaAnalysisTabProps) => {
  const {
    isAnalyzing,
    progress,
    result,
    error,
    detection,
    autoDetectMedia,
    analyzeMedia,
    analyzeTimeline,
    resetAnalysis
  } = useMediaAnalysis();

  const [analysisOptions, setAnalysisOptions] = useState<AnalysisOptions>({
    includeTimeline: true,
    includeTranscript: true,
    analysisDepth: 'detailed',
    extractQuotes: true
  });

  const [selectedSegment, setSelectedSegment] = useState<number | null>(null);

  // 자동 미디어 감지
  useEffect(() => {
    if (mediaUrl && mediaUrl.trim().length > 0) {
      console.log('🔄 URL 변경 감지, 미디어 분석 시작:', mediaUrl);
      autoDetectMedia(mediaUrl);
    }
  }, [mediaUrl, autoDetectMedia]);

  // 분석 시작 핸들러
  const handleStartAnalysis = useCallback(async () => {
    // 유효성 검사
    if (!hasAISetup || !selectedModel || !apiKey || !mediaUrl) {
      console.error('❌ 필수 조건 미충족:', {
        hasAISetup,
        selectedModel: !!selectedModel,
        apiKey: !!apiKey,
        mediaUrl: !!mediaUrl
      });
      return;
    }

    console.log('🚀 미디어 분석 시작:', {
      url: mediaUrl,
      model: selectedModel.id,
      options: analysisOptions
    });

    try {
      const analysisResult = await analyzeMedia(
        mediaUrl,
        apiKey,
        selectedModel.id,
        analysisOptions
      );

      if (analysisResult && onAnalysisComplete) {
        onAnalysisComplete(analysisResult);
      }
    } catch (error) {
      console.error('💥 분석 중 에러:', error);
    }
  }, [
    hasAISetup,
    selectedModel,
    apiKey,
    mediaUrl,
    analysisOptions,
    analyzeMedia,
    onAnalysisComplete
  ]);

  // 타임라인만 재분석
  const handleTimelineReanalysis = useCallback(async () => {
    if (!selectedModel) return;
    
    await analyzeTimeline(mediaUrl, apiKey, selectedModel.id, {
      analysisDepth: analysisOptions.analysisDepth
    });
  }, [mediaUrl, apiKey, selectedModel, analysisOptions.analysisDepth, analyzeTimeline]);

  // 플랫폼 아이콘 가져오기
  const getPlatformIcon = useCallback((platform: string) => {
    const IconComponent = PLATFORM_ICONS[platform as keyof typeof PLATFORM_ICONS] || Video;
    const colorClass = PLATFORM_COLORS[platform as keyof typeof PLATFORM_COLORS] || 'text-gray-600';
    return <IconComponent className={`h-5 w-5 ${colorClass}`} />;
  }, []);

  // 옵션 변경 핸들러
  const updateOption = useCallback(<K extends keyof AnalysisOptions>(
    key: K,
    value: AnalysisOptions[K]
  ) => {
    setAnalysisOptions(prev => ({ ...prev, [key]: value }));
  }, []);

  // AI 설정이 없는 경우
  if (!hasAISetup) {
    return <NoAISetupCard />;
  }

  return (
    <div className="space-y-6">
      {/* 미디어 정보 헤더 */}
      {detection?.isMedia && (
        <MediaInfoHeader 
          detection={detection}
          getPlatformIcon={getPlatformIcon}
        />
      )}

      {/* 분석 옵션 */}
      {!result && (
        <AnalysisOptionsCard
          options={analysisOptions}
          isAnalyzing={isAnalyzing}
          onOptionChange={updateOption}
          onStartAnalysis={handleStartAnalysis}
        />
      )}

      {/* 분석 진행률 */}
      {isAnalyzing && progress && (
        <AnalysisProgressCard progress={progress} />
      )}

      {/* 에러 표시 */}
      {error && <ErrorCard error={error} />}

      {/* 분석 결과 */}
      {result && (
        <AnalysisResults
          result={result}
          selectedSegment={selectedSegment}
          onSegmentSelect={setSelectedSegment}
          onTimelineReanalysis={handleTimelineReanalysis}
          isAnalyzing={isAnalyzing}
        />
      )}
    </div>
  );
});

MediaAnalysisTab.displayName = 'MediaAnalysisTab';

// AI 설정 없음 카드
const NoAISetupCard = memo(() => {
  return (
    <Card className="border-dashed">
      <CardContent className="p-12 text-center">
        <Brain className="h-16 w-16 mx-auto text-slate-300 mb-4" />
        <h3 className="text-lg font-semibold text-slate-600 mb-2">
          AI 설정이 필요합니다
        </h3>
        <p className="text-muted-foreground mb-4">
          미디어 분석 기능을 사용하려면 OpenRouter API를 설정해주세요
        </p>
        <Button
          variant="outline"
          onClick={() => window.open('/settings', '_blank')}
          className="gap-2"
        >
          <Brain className="h-4 w-4" />
          AI 설정하러 가기
        </Button>
      </CardContent>
    </Card>
  );
});

NoAISetupCard.displayName = 'NoAISetupCard';

// 미디어 정보 헤더
const MediaInfoHeader = memo(({
  detection,
  getPlatformIcon,
}: {
  detection: any;
  getPlatformIcon: (platform: string) => React.ReactNode;
}) => {
  return (
    <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3">
          {getPlatformIcon(detection.platform)}
          <div>
            <span className="text-lg">미디어 콘텐츠 감지됨</span>
            <div className="text-sm text-muted-foreground font-normal">
              {detection.platform} • {detection.mediaType} • 신뢰도 {Math.round(detection.confidence * 100)}%
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-2">
          {detection.supportedFeatures.map((feature: string) => (
            <Badge key={feature} variant="secondary" className="text-xs">
              {feature}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});

MediaInfoHeader.displayName = 'MediaInfoHeader';

// 분석 옵션 카드
const AnalysisOptionsCard = memo(({
  options,
  isAnalyzing,
  onOptionChange,
  onStartAnalysis,
}: {
  options: AnalysisOptions;
  isAnalyzing: boolean;
  onOptionChange: <K extends keyof AnalysisOptions>(key: K, value: AnalysisOptions[K]) => void;
  onStartAnalysis: () => void;
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          분석 옵션
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnalysisOptionCheckbox
            id="timeline"
            icon={Clock}
            label="타임라인 분석"
            checked={options.includeTimeline}
            onChange={(checked) => onOptionChange('includeTimeline', checked)}
          />
          
          <AnalysisOptionCheckbox
            id="transcript"
            icon={MessageSquare}
            label="트랜스크립트 추출"
            checked={options.includeTranscript}
            onChange={(checked) => onOptionChange('includeTranscript', checked)}
          />

          <AnalysisOptionCheckbox
            id="quotes"
            icon={Quote}
            label="명언 추출"
            checked={options.extractQuotes}
            onChange={(checked) => onOptionChange('extractQuotes', checked)}
          />

          <div className="space-y-2">
            <label htmlFor="depth" className="text-sm font-medium">
              분석 깊이
            </label>
            <select
              id="depth"
              value={options.analysisDepth}
              onChange={(e) => onOptionChange('analysisDepth', e.target.value as AnalysisOptions['analysisDepth'])}
              className="w-full p-2 border rounded text-sm"
            >
              <option value="basic">기본</option>
              <option value="detailed">상세</option>
              <option value="comprehensive">종합</option>
            </select>
          </div>
        </div>

        <Button
          onClick={onStartAnalysis}
          disabled={isAnalyzing}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          size="lg"
        >
          {isAnalyzing ? (
            <>
              <Brain className="h-5 w-5 mr-2 animate-pulse" />
              분석 중...
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5 mr-2" />
              AI 미디어 분석 시작
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
});

AnalysisOptionsCard.displayName = 'AnalysisOptionsCard';

// 분석 옵션 체크박스
const AnalysisOptionCheckbox = memo(({
  id,
  icon: Icon,
  label,
  checked,
  onChange,
}: {
  id: string;
  icon: React.ElementType;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) => {
  return (
    <div className="space-y-3">
      <label htmlFor={id} className="flex items-center gap-2 cursor-pointer">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="rounded"
        />
        <Icon className="h-4 w-4" />
        <span className="text-sm font-medium">{label}</span>
      </label>
    </div>
  );
});

AnalysisOptionCheckbox.displayName = 'AnalysisOptionCheckbox';

// 분석 진행률 카드
const AnalysisProgressCard = memo(({ progress }: { progress: any }) => {
  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-600 animate-pulse" />
              <span className="font-medium text-blue-900">{progress.message}</span>
            </div>
            <span className="text-sm text-blue-700 font-medium">
              {progress.progress}%
            </span>
          </div>
          
          <Progress value={progress.progress} className="h-3 bg-blue-100" />
          
          {progress.estimatedTimeRemaining && (
            <div className="text-sm text-blue-600">
              예상 남은 시간: {Math.round(progress.estimatedTimeRemaining / 60)}분
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

AnalysisProgressCard.displayName = 'AnalysisProgressCard';

// 에러 카드
const ErrorCard = memo(({ error }: { error: any }) => {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        <strong>{error.code}:</strong> {error.message}
        {error.stage && <div className="text-xs mt-1">단계: {error.stage}</div>}
      </AlertDescription>
    </Alert>
  );
});

ErrorCard.displayName = 'ErrorCard';

// 분석 결과 컴포넌트
const AnalysisResults = memo(({
  result,
  selectedSegment,
  onSegmentSelect,
  onTimelineReanalysis,
  isAnalyzing,
}: {
  result: MediaAnalysisResult;
  selectedSegment: number | null;
  onSegmentSelect: (index: number | null) => void;
  onTimelineReanalysis: () => void;
  isAnalyzing: boolean;
}) => {
  return (
    <div className="space-y-6">
      {/* 전체 요약 */}
      <OverallSummaryCard result={result} />

      {/* 핵심 주제 */}
      {result.keyTopics.length > 0 && (
        <KeyTopicsCard topics={result.keyTopics} />
      )}

      {/* 타임라인 */}
      {result.timeline.length > 0 && (
        <TimelineCard
          timeline={result.timeline}
          selectedSegment={selectedSegment}
          onSegmentSelect={onSegmentSelect}
          onReanalyze={onTimelineReanalysis}
          isAnalyzing={isAnalyzing}
        />
      )}

      {/* 명언/인용구 */}
      {result.notableQuotes.length > 0 && (
        <QuotesCard 
          quotes={result.notableQuotes}
          channelName={result.metadata.channelName}
        />
      )}

      {/* 학습 목표 */}
      {result.learningObjectives.length > 0 && (
        <LearningObjectivesCard objectives={result.learningObjectives} />
      )}

      {/* 실행 가능한 액션 */}
      {result.actionItems.length > 0 && (
        <ActionItemsCard items={result.actionItems} />
      )}

      {/* 분석 메타데이터 */}
      <AnalysisMetadataCard result={result} />
    </div>
  );
});

AnalysisResults.displayName = 'AnalysisResults';

// 전체 요약 카드
const OverallSummaryCard = memo(({ result }: { result: MediaAnalysisResult }) => {
  return (
    <Card>
      <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          AI 분석 완료
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <SummaryMetric
            value={result.metadata.durationFormatted}
            label="총 길이"
            color="purple"
          />
          <SummaryMetric
            value={result.timeline.length.toString()}
            label="타임라인 구간"
            color="blue"
          />
          <SummaryMetric
            value={`${Math.round(result.confidence * 100)}%`}
            label="분석 신뢰도"
            color="green"
          />
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border">
          <h4 className="font-semibold text-purple-900 mb-2">📝 전체 요약</h4>
          <p className="text-purple-800 leading-relaxed">{result.overallSummary}</p>
        </div>
      </CardContent>
    </Card>
  );
});

OverallSummaryCard.displayName = 'OverallSummaryCard';

// 요약 메트릭 컴포넌트
const SummaryMetric = memo(({
  value,
  label,
  color,
}: {
  value: string;
  label: string;
  color: 'purple' | 'blue' | 'green';
}) => {
  const colorMap = {
    purple: 'bg-purple-50 text-purple-600',
    blue: 'bg-blue-50 text-blue-600',
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

SummaryMetric.displayName = 'SummaryMetric';

// 핵심 주제 카드
const KeyTopicsCard = memo(({ topics }: { topics: string[] }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          핵심 주제
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {topics.map((topic, index) => (
            <Badge key={index} variant="outline" className="text-blue-600 border-blue-300">
              {topic}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});

KeyTopicsCard.displayName = 'KeyTopicsCard';

// 타임라인 카드
const TimelineCard = memo(({
  timeline,
  selectedSegment,
  onSegmentSelect,
  onReanalyze,
  isAnalyzing,
}: {
  timeline: TimelineSegment[];
  selectedSegment: number | null;
  onSegmentSelect: (index: number | null) => void;
  onReanalyze: () => void;
  isAnalyzing: boolean;
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-amber-600" />
          상세 타임라인
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={onReanalyze}
          disabled={isAnalyzing}
        >
          <Brain className="h-4 w-4 mr-2" />
          재분석
        </Button>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-4">
            {timeline.map((segment, index) => (
              <TimelineSegmentItem
                key={segment.id}
                segment={segment}
                index={index}
                isSelected={selectedSegment === index}
                onSelect={() => onSegmentSelect(selectedSegment === index ? null : index)}
              />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
});

TimelineCard.displayName = 'TimelineCard';

// 타임라인 세그먼트 아이템
const TimelineSegmentItem = memo(({
  segment,
  index,
  isSelected,
  onSelect,
}: {
  segment: TimelineSegment;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
}) => {
  const importanceColors = {
    high: 'bg-red-500',
    medium: 'bg-yellow-500',
    low: 'bg-green-500'
  };

  return (
    <div
      className={`p-4 border rounded-lg cursor-pointer transition-all ${
        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      aria-expanded={isSelected}
      aria-label={`타임라인 세그먼트 ${index + 1}: ${segment.title}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${importanceColors[segment.importance]}`} />
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

      {segment.keyPoints.length > 0 && (
        <div className="mb-3">
          <div className="text-xs font-medium text-gray-500 mb-1">핵심 포인트:</div>
          <ul className="text-sm space-y-1">
            {segment.keyPoints.map((point, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <Star className="h-3 w-3 text-yellow-500 mt-0.5 shrink-0" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {segment.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {segment.tags.map((tag, idx) => (
            <Badge key={idx} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* 확장된 정보 (선택된 경우) */}
      {isSelected && <ExpandedSegmentInfo segment={segment} />}
    </div>
  );
});

TimelineSegmentItem.displayName = 'TimelineSegmentItem';

// 확장된 세그먼트 정보
const ExpandedSegmentInfo = memo(({ segment }: { segment: any }) => {
  return (
    <div className="mt-4 pt-4 border-t space-y-3">
      {segment.actionItems?.length > 0 && (
        <div>
          <div className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
            <Target className="h-3 w-3" />
            실행 가능한 액션:
          </div>
          <ul className="text-sm space-y-1">
            {segment.actionItems.map((action: string, idx: number) => (
              <li key={idx} className="flex items-start gap-2">
                <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {segment.noteWorthy && (
        <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
          <div className="text-xs font-medium text-yellow-700 mb-1 flex items-center gap-1">
            <Lightbulb className="h-3 w-3" />
            주목할 점:
          </div>
          <p className="text-sm text-yellow-800">{segment.noteWorthy}</p>
        </div>
      )}
    </div>
  );
});

ExpandedSegmentInfo.displayName = 'ExpandedSegmentInfo';

// 명언 카드
const QuotesCard = memo(({
  quotes,
  channelName,
}: {
  quotes: any[];
  channelName: string | undefined;
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Quote className="h-5 w-5 text-indigo-600" />
          명언 & 인용구
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {quotes.map((quote, index) => (
            <QuoteItem key={index} quote={quote} channelName={channelName} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
});

QuotesCard.displayName = 'QuotesCard';

// 명언 아이템
const QuoteItem = memo(({
  quote,
  channelName,
}: {
  quote: any;
  channelName: string | undefined;
}) => {
  return (
    <div className="border-l-4 border-indigo-500 pl-4 py-2 bg-indigo-50">
      <blockquote className="text-indigo-900 font-medium italic mb-2">
        "{quote.text}"
      </blockquote>
      <div className="flex items-center justify-between text-sm text-indigo-600">
        <span>— {quote.speaker || channelName}</span>
        <span>{quote.timestamp.formatted}</span>
      </div>
      {quote.context && (
        <p className="text-xs text-indigo-700 mt-2">{quote.context}</p>
      )}
    </div>
  );
});

QuoteItem.displayName = 'QuoteItem';

// 학습 목표 카드
const LearningObjectivesCard = memo(({
  objectives,
}: {
  objectives: string[];
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-green-600" />
          학습 목표
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {objectives.map((objective, index) => (
            <li key={index} className="flex items-start gap-2">
              <Target className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
              <span className="text-sm">{objective}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
});

LearningObjectivesCard.displayName = 'LearningObjectivesCard';

// 액션 아이템 카드
const ActionItemsCard = memo(({ items }: { items: string[] }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-orange-600" />
          실행 가능한 액션
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2">
          {items.map((action, index) => (
            <ActionItemRow key={index} action={action} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
});

ActionItemsCard.displayName = 'ActionItemsCard';

// 액션 아이템 행
const ActionItemRow = memo(({ action }: { action: string }) => {
  const [isChecked, setIsChecked] = useState(false);

  return (
    <div className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded">
      <input 
        type="checkbox" 
        className="rounded"
        checked={isChecked}
        onChange={(e) => setIsChecked(e.target.checked)}
        aria-label={`완료: ${action}`}
      />
      <span className={`text-sm ${isChecked ? 'line-through text-gray-500' : ''}`}>
        {action}
      </span>
    </div>
  );
});

ActionItemRow.displayName = 'ActionItemRow';

// 분석 메타데이터 카드
const AnalysisMetadataCard = memo(({ result }: { result: MediaAnalysisResult }) => {
  return (
    <Card className="bg-slate-50">
      <CardContent className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <MetadataItem label="AI 모델" value={result.aiModel} />
          <MetadataItem 
            label="분석 시간" 
            value={new Date(result.analysisTimestamp).toLocaleTimeString('ko-KR')} 
          />
          <MetadataItem 
            label="신뢰도" 
            value={`${Math.round(result.confidence * 100)}%`} 
          />
          <MetadataItem label="난이도" value={result.difficulty} />
        </div>
      </CardContent>
    </Card>
  );
});

AnalysisMetadataCard.displayName = 'AnalysisMetadataCard';

// 메타데이터 아이템
const MetadataItem = memo(({
  label,
  value,
}: {
  label: string;
  value: string;
}) => {
  return (
    <div>
      <div className="font-medium text-slate-600">{label}</div>
      <div className="text-slate-900">{value}</div>
    </div>
  );
});

MetadataItem.displayName = 'MetadataItem';