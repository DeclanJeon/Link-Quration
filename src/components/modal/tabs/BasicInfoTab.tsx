// src/components/modal/tabs/BasicInfoTab.tsx
"use client"

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
  Loader2, CheckCircle, AlertCircle 
} from "lucide-react";
import { BookmarkFormData } from "@/types/bookmark";

const CATEGORIES = [
  "기술", "개발", "디자인", "비즈니스", "마케팅", 
  "교육", "뉴스", "블로그", "튜토리얼", "리서치", "기타"
];

interface BasicInfoTabProps {
  formData: BookmarkFormData;
  newTag: string;
  setNewTag: (tag: string) => void;
  onInputChange: (field: keyof BookmarkFormData, value: string | boolean | string[]) => void;
  onAddTag: () => void;
  onRemoveTag: (tag: string) => void;
  onUrlAnalysis: () => void;
  isAnalyzing: boolean;
  analysisProgress: number;
  extractionResult: any;
  extractionError: string;
  aiAnalysis: any;
  aiError: string;
  hasAISetup: boolean;
  selectedModel: any;
  onKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export const BasicInfoTab = ({
  formData,
  newTag,
  setNewTag,
  onInputChange,
  onAddTag,
  onRemoveTag,
  onUrlAnalysis,
  isAnalyzing,
  analysisProgress,
  extractionResult,
  extractionError,
  aiAnalysis,
  aiError,
  hasAISetup,
  selectedModel,
  onKeyPress,
}: BasicInfoTabProps) => {
  return (
    <div className="space-y-6">
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
                onChange={(e) => onInputChange('url', e.target.value)}
                onKeyPress={onKeyPress}
                className="flex-1 h-12 text-lg border-blue-200 focus:border-blue-400 bg-white"
              />
              <Button 
                onClick={onUrlAnalysis}
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
            {isAnalyzing && (
              <div className="space-y-3">
                <div className="flex justify-between text-sm text-blue-700">
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    콘텐츠 추출 중...
                  </span>
                  <span className="font-medium">{Math.round(analysisProgress)}%</span>
                </div>
                <Progress value={analysisProgress} className="h-3 bg-blue-100" />
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
          <Label className="text-sm font-medium flex items-center gap-2">
            <Hash className="h-4 w-4" />
            카테고리
          </Label>
          <Select
            value={formData.category}
            onValueChange={(value: string) => onInputChange('category', value)}
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
            {formData.tags.map((tag: string) => (
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
};