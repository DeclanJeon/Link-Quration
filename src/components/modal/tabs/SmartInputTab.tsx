"use client"

import { memo, useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Globe, Brain, BookOpen, Hash, Tag, Plus, Sparkles, 
  Loader2, CheckCircle, AlertCircle, Video, Youtube,
  Clock, Image, ExternalLink
} from "lucide-react";
import { BookmarkFormData } from "@/types/bookmark";
import { ExtractionResult } from "@/types/extraction";

const CATEGORIES = [
  "기술", "개발", "디자인", "비즈니스", "마케팅", 
  "교육", "뉴스", "블로그", "튜토리얼", "리서치", "미디어", "기타"
] as const;

interface SmartInputTabProps {
  formData: BookmarkFormData;
  newTag: string;
  setNewTag: (tag: string) => void;
  onInputChange: (field: keyof BookmarkFormData, value: string | boolean | string[]) => void;
  onAddTag: () => void;
  onRemoveTag: (tag: string) => void;
  onUnifiedAnalysis: () => void;
  analysisState: 'idle' | 'analyzing' | 'complete';
  extractionResult: ExtractionResult | null;
  detection: any;
  onKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  hasAISetup: boolean;
}

export const SmartInputTab = memo(({
  formData,
  newTag,
  setNewTag,
  onInputChange,
  onAddTag,
  onRemoveTag,
  onUnifiedAnalysis,
  analysisState,
  extractionResult,
  detection,
  onKeyPress,
  hasAISetup,
}: SmartInputTabProps) => {
  
  const isUrlValid = useMemo(() => {
    try {
      new URL(formData.url);
      return true;
    } catch {
      return false;
    }
  }, [formData.url]);

  const canAnalyze = useMemo(() => 
    formData.url.trim() !== '' && isUrlValid && analysisState === 'idle',
    [formData.url, isUrlValid, analysisState]
  );

  return (
    <div className="space-y-6">
      {/* URL 입력 및 스마트 분석 */}
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
                value={formData.url}
                onChange={(e) => onInputChange('url', e.target.value)}
                onKeyPress={onKeyPress}
                className="flex-1 h-12 text-lg border-blue-200 focus:border-blue-400 bg-white"
              />
              <Button 
                onClick={onUnifiedAnalysis}
                disabled={!canAnalyze}
                size="lg"
                className="px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {analysisState === 'analyzing' ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    분석 중...
                  </>
                ) : analysisState === 'complete' ? (
                  <>
                    <CheckCircle className="h-5 w-5 mr-2" />
                    재분석
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    스마트 분석
                  </>
                )}
              </Button>
            </div>

            {/* 분석 상태 표시 */}
            {analysisState === 'complete' && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700">
                  ✨ 스마트 분석 완료! 콘텐츠 분석 탭에서 상세 결과를 확인하세요.
                </AlertDescription>
              </Alert>
            )}

            {detection?.isMedia && (
              <Alert className="border-purple-200 bg-purple-50">
                <Video className="h-4 w-4 text-purple-600" />
                <AlertDescription className="text-purple-700">
                  <strong>미디어 콘텐츠 감지!</strong> {detection.platform} • {detection.mediaType}
                </AlertDescription>
              </Alert>
            )}

            {!hasAISetup && (
              <Alert className="border-amber-200 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-700">
                  💡 AI 분석을 사용하려면 설정에서 OpenRouter API를 연결하세요
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 미리보기 카드 (추출 결과가 있을 때) */}
      {extractionResult && (
        <Card className="bg-gradient-to-r from-slate-50 to-blue-50 border-slate-200">
          <CardContent className="p-4">
            <div className="flex gap-4">
              {/* 썸네일 */}
              <div className="relative w-24 h-24 flex-shrink-0">
                {extractionResult.leadImageUrl ? (
                  <img 
                    src={extractionResult.leadImageUrl} 
                    alt={extractionResult.title}
                    className="w-full h-full object-cover rounded-lg border"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-100 rounded-lg flex items-center justify-center">
                    <Image className="h-6 w-6 text-slate-400" />
                  </div>
                )}
              </div>

              {/* 콘텐츠 정보 */}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-slate-900 truncate">
                  {extractionResult.title || '제목 없음'}
                </h4>
                <p className="text-sm text-slate-600 line-clamp-2 mt-1">
                  {extractionResult.excerpt || '설명이 없습니다.'}
                </p>
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    {extractionResult.domain}
                  </span>
                  {extractionResult.readingTime && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {extractionResult.readingTime}
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => window.open(formData.url, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    원문
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 기본 정보 입력 */}
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

      {/* 설명 */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium">설명</Label>
        <Textarea
          id="description"
          placeholder="이 북마크에 대한 간단한 설명을 입력하세요"
          value={formData.description}
          onChange={(e) => onInputChange('description', e.target.value)}
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
            onKeyPress={onKeyPress}
            className="flex-1"
          />
          <Button 
            onClick={onAddTag} 
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
                onClick={() => onRemoveTag(tag)}
              >
                {tag} ×
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

SmartInputTab.displayName = 'SmartInputTab';
