"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Globe, Lock, Brain, Sparkles, CheckCircle, TrendingUp 
} from "lucide-react";
import { BookmarkFormData } from "@/types/bookmark";

interface AdvancedTabProps {
  formData: BookmarkFormData;
  onInputChange: (field: keyof BookmarkFormData, value: string | boolean | string[]) => void;
  hasAISetup: boolean;
  selectedModel: any;
}

export const AdvancedTab = ({
  formData,
  onInputChange,
  hasAISetup,
  selectedModel,
}: AdvancedTabProps) => {
  return (
    <div className="space-y-6">
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
              onCheckedChange={(checked: boolean) => onInputChange('isPublic', checked)}
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
    </div>
  );
};