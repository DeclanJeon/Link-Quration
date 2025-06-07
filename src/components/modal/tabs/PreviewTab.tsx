// src/components/modal/tabs/PreviewTab.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  TrendingUp, Clock, BookOpen, Globe, Zap, ExternalLink, 
  Image, User, Calendar, Brain, Loader2 
} from "lucide-react";

interface PreviewTabProps {
  extractionResult: any;
  hasAISetup: boolean;
  selectedModel: any;
  aiAnalysis: any;
  isAiAnalyzing: boolean;
  onManualAIAnalysis: () => void;
  onTabChange: (tab: string) => void;
}

export const PreviewTab = ({
  extractionResult,
  hasAISetup,
  selectedModel,
  aiAnalysis,
  isAiAnalyzing,
  onManualAIAnalysis,
  onTabChange,
}: PreviewTabProps) => {
  if (!extractionResult) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-12 text-center">
          <Brain className="h-16 w-16 mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-semibold text-slate-600 mb-2">아직 분석된 콘텐츠가 없습니다</h3>
          <p className="text-muted-foreground mb-4">
            기본 정보 탭에서 URL을 입력하고 스마트 분석을 실행해보세요
          </p>
          <Button 
            variant="outline" 
            onClick={() => onTabChange("basic")}
            className="gap-2"
          >
            <Globe className="h-4 w-4" />
            기본 정보로 이동
          </Button>
        </CardContent>
      </Card>
    );
  }

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
        </div>
      </CardContent>
    </Card>
  );
};