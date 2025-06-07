// src/components/modal/tabs/AIAnalysisTab.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Brain, Sparkles, TrendingUp, Clock, BookOpen, CheckCircle, 
  Tag, Hash, Plus, Loader2 
} from "lucide-react";

interface AIAnalysisTabProps {
  aiAnalysis: any;
  selectedModel: any;
  extractionResult: any;
  hasAISetup: boolean;
  isAiAnalyzing: boolean;
  onManualAIAnalysis: () => void;
  onTabChange: (tab: string) => void;
  onAddTag: (tag: string) => void;
}

export const AIAnalysisTab = ({
  aiAnalysis,
  selectedModel,
  extractionResult,
  hasAISetup,
  isAiAnalyzing,
  onManualAIAnalysis,
  onTabChange,
  onAddTag,
}: AIAnalysisTabProps) => {
  if (!aiAnalysis) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-12 text-center">
          <Brain className="h-16 w-16 mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-semibold text-slate-600 mb-2">AI 분석 결과가 없습니다</h3>
          <p className="text-muted-foreground mb-4">
            콘텐츠를 먼저 추출하고 AI 분석을 실행해보세요
          </p>
          {extractionResult && hasAISetup && (
            <Button 
              onClick={onManualAIAnalysis}
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
    );
  }

  return (
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
                onClick={() => onAddTag(tag)}
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
  );
};