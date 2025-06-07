// src/components/modal/tabs/MediaAnalysisTab.tsx
"use client"

import { useState, useEffect } from 'react';
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

interface MediaAnalysisTabProps {
  mediaUrl: string;
  hasAISetup: boolean;
  selectedModel: any;
  apiKey: string;
  onAnalysisComplete?: (result: MediaAnalysisResult) => void;
}

export const MediaAnalysisTab = ({
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
    autoDetectMedia, // 🆕 자동 감지 함수 사용
    analyzeMedia,
    analyzeTimeline,
    resetAnalysis
  } = useMediaAnalysis();

  const [analysisOptions, setAnalysisOptions] = useState({
    includeTimeline: true,
    includeTranscript: true,
    analysisDepth: 'detailed' as 'basic' | 'detailed' | 'comprehensive',
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
    

  // 분석 시작
  const handleStartAnalysis = async () => {
    console.log('🔘 버튼 클릭됨!');
    console.log('📋 현재 상태:', {
        hasAISetup,
        selectedModel,
        apiKey: apiKey ? '있음' : '없음',
        mediaUrl,
        isAnalyzing
    });

    if (!hasAISetup) {
        console.error('❌ AI 설정 없음');
        alert('AI 설정이 필요합니다!');
        return;
    }

    if (!selectedModel) {
        console.error('❌ 모델 선택 안됨');
        alert('AI 모델을 선택해주세요!');
        return;
    }

    if (!apiKey) {
        console.error('❌ API 키 없음');
        alert('API 키가 필요합니다!');
        return;
    }

    if (!mediaUrl) {
        console.error('❌ 미디어 URL 없음');
        alert('분석할 URL이 없습니다!');
        return;
    }

      console.log('✅ 모든 조건 만족, 분석 시작...');
      
    try {
        const analysisResult = await analyzeMedia(
            mediaUrl,
            apiKey,
            selectedModel.id,
            analysisOptions
        );

        console.log('📊 분석 결과:', analysisResult);

        if (analysisResult && onAnalysisComplete) {
            onAnalysisComplete(analysisResult);
        }
    } catch (error) {
        console.error('💥 분석 중 에러:', error);
        alert(`분석 실패: ${error}`);
    }
      
    console.log('🚀 미디어 분석 시작:', {
      url: mediaUrl,
      model: selectedModel.id,
      options: analysisOptions
    });

    const analysisResult = await analyzeMedia(
      mediaUrl,
      apiKey,
      selectedModel.id,
      analysisOptions
    );

    if (analysisResult && onAnalysisComplete) {
      onAnalysisComplete(analysisResult);
    }
  };

  // 타임라인만 재분석
  const handleTimelineReanalysis = async () => {
    await analyzeTimeline(mediaUrl, apiKey, selectedModel.id, {
      analysisDepth: analysisOptions.analysisDepth
    });
  };

  // 미디어 플랫폼 아이콘
  const getPlatformIcon = (platform: string) => {
    const icons = {
      youtube: <Youtube className="h-5 w-5 text-red-600" />,
      vimeo: <Video className="h-5 w-5 text-blue-600" />,
      spotify: <Music className="h-5 w-5 text-green-600" />,
      soundcloud: <Headphones className="h-5 w-5 text-orange-600" />,
      podcast: <Radio className="h-5 w-5 text-purple-600" />
    };
    return icons[platform as keyof typeof icons] || <Video className="h-5 w-5 text-gray-600" />;
  };

  // AI 설정이 없는 경우
  if (!hasAISetup) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-12 text-center">
          <Brain className="h-16 w-16 mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-semibold text-slate-600 mb-2">AI 설정이 필요합니다</h3>
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
  }

  return (
    <div className="space-y-6">
      {/* 미디어 정보 헤더 */}
      {detection?.isMedia && (
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
              {detection.supportedFeatures.map((feature) => (
                <Badge key={feature} variant="secondary" className="text-xs">
                  {feature}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 분석 옵션 */}
      {!result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              분석 옵션
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={analysisOptions.includeTimeline}
                    onChange={(e) => setAnalysisOptions(prev => ({
                      ...prev,
                      includeTimeline: e.target.checked
                    }))}
                    className="rounded"
                  />
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">타임라인 분석</span>
                </label>
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={analysisOptions.includeTranscript}
                    onChange={(e) => setAnalysisOptions(prev => ({
                      ...prev,
                      includeTranscript: e.target.checked
                    }))}
                    className="rounded"
                  />
                  <MessageSquare className="h-4 w-4" />
                  <span className="text-sm font-medium">트랜스크립트 추출</span>
                </label>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={analysisOptions.extractQuotes}
                    onChange={(e) => setAnalysisOptions(prev => ({
                      ...prev,
                      extractQuotes: e.target.checked
                    }))}
                    className="rounded"
                  />
                  <Quote className="h-4 w-4" />
                  <span className="text-sm font-medium">명언 추출</span>
                </label>

                <div className="space-y-2">
                  <span className="text-sm font-medium">분석 깊이</span>
                  <select
                    value={analysisOptions.analysisDepth}
                    onChange={(e) => setAnalysisOptions(prev => ({
                      ...prev,
                      analysisDepth: e.target.value as any
                    }))}
                    className="w-full p-2 border rounded text-sm"
                  >
                    <option value="basic">기본</option>
                    <option value="detailed">상세</option>
                    <option value="comprehensive">종합</option>
                  </select>
                </div>
              </div>
            </div>

            <Button
              onClick={handleStartAnalysis}
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
      )}

      {/* 분석 진행률 */}
      {isAnalyzing && progress && (
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
      )}

      {/* 에러 표시 */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>{error.code}:</strong> {error.message}
            {error.stage && <div className="text-xs mt-1">단계: {error.stage}</div>}
          </AlertDescription>
        </Alert>
      )}

      {/* 분석 결과 */}
      {result && (
        <div className="space-y-6">
          {/* 전체 요약 */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                AI 분석 완료
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {result.metadata.durationFormatted}
                  </div>
                  <div className="text-sm text-muted-foreground">총 길이</div>
                </div>
                
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {result.timeline.length}
                  </div>
                  <div className="text-sm text-muted-foreground">타임라인 구간</div>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round(result.confidence * 100)}%
                  </div>
                  <div className="text-sm text-muted-foreground">분석 신뢰도</div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border">
                <h4 className="font-semibold text-purple-900 mb-2">📝 전체 요약</h4>
                <p className="text-purple-800 leading-relaxed">{result.overallSummary}</p>
              </div>
            </CardContent>
          </Card>

          {/* 핵심 주제 */}
          {result.keyTopics.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  핵심 주제
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {result.keyTopics.map((topic, index) => (
                    <Badge key={index} variant="outline" className="text-blue-600 border-blue-300">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 타임라인 */}
          {result.timeline.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-600" />
                  상세 타임라인
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTimelineReanalysis}
                  disabled={isAnalyzing}
                >
                  <Brain className="h-4 w-4 mr-2" />
                  재분석
                </Button>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {result.timeline.map((segment, index) => (
                      <div
                        key={segment.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedSegment === index
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedSegment(selectedSegment === index ? null : index)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${
                                segment.importance === 'high' ? 'bg-red-500' :
                                segment.importance === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                              }`} />
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
                        {selectedSegment === index && (
                          <div className="mt-4 pt-4 border-t space-y-3">
                            {(segment as any).actionItems?.length > 0 && (
                              <div>
                                <div className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                                  <Target className="h-3 w-3" />
                                  실행 가능한 액션:
                                </div>
                                <ul className="text-sm space-y-1">
                                  {(segment as any).actionItems.map((action: string, idx: number) => (
                                    <li key={idx} className="flex items-start gap-2">
                                      <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                                      <span>{action}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {(segment as any).noteWorthy && (
                              <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                                <div className="text-xs font-medium text-yellow-700 mb-1 flex items-center gap-1">
                                  <Lightbulb className="h-3 w-3" />
                                  주목할 점:
                                </div>
                                <p className="text-sm text-yellow-800">{(segment as any).noteWorthy}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* 명언/인용구 */}
          {result.notableQuotes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Quote className="h-5 w-5 text-indigo-600" />
                  명언 & 인용구
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {result.notableQuotes.map((quote, index) => (
                    <div key={index} className="border-l-4 border-indigo-500 pl-4 py-2 bg-indigo-50">
                      <blockquote className="text-indigo-900 font-medium italic mb-2">
                        "{quote.text}"
                      </blockquote>
                      <div className="flex items-center justify-between text-sm text-indigo-600">
                        <span>— {quote.speaker || result.metadata.channelName}</span>
                        <span>{quote.timestamp.formatted}</span>
                      </div>
                      {quote.context && (
                        <p className="text-xs text-indigo-700 mt-2">{quote.context}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 학습 목표 */}
          {result.learningObjectives.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-green-600" />
                  학습 목표
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.learningObjectives.map((objective, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Target className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                      <span className="text-sm">{objective}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* 실행 가능한 액션 */}
          {result.actionItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-orange-600" />
                  실행 가능한 액션
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {result.actionItems.map((action, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">{action}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 분석 메타데이터 */}
          <Card className="bg-slate-50">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="font-medium text-slate-600">AI 모델</div>
                  <div className="text-slate-900">{result.aiModel}</div>
                </div>
                <div>
                  <div className="font-medium text-slate-600">분석 시간</div>
                  <div className="text-slate-900">
                    {new Date(result.analysisTimestamp).toLocaleTimeString('ko-KR')}
                  </div>
                </div>
                <div>
                  <div className="font-medium text-slate-600">신뢰도</div>
                  <div className="text-slate-900">{Math.round(result.confidence * 100)}%</div>
                </div>
                <div>
                  <div className="font-medium text-slate-600">난이도</div>
                  <div className="text-slate-900">{result.difficulty}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};