"use client"

import { useState, useEffect } from "react";
import { Settings, Brain, Key, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ApiKeySettings from "@/components/settings/ApiKeySettings";
import ModelSelector from "@/components/ai/ModelSelector";
import Link from "next/link";

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState<string>("");
  const [isApiKeyValid, setIsApiKeyValid] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<any>(null);

  // 페이지 로드 시 저장된 모델 불러오기
  useEffect(() => {
    const savedModel = localStorage.getItem('selected_model');
    if (savedModel) {
      try {
        setSelectedModel(JSON.parse(savedModel));
      } catch (error) {
        console.error('저장된 모델 정보를 불러오는데 실패했습니다:', error);
      }
    }
  }, []);

  const handleApiKeyChange = (key: string, valid: boolean) => {
    setApiKey(key);
    setIsApiKeyValid(valid);
    if (!valid) {
      setSelectedModel(null);
      localStorage.removeItem('selected_model');
    }
  };

  const handleModelSelect = (model: any) => {
    setSelectedModel(model);
    // 선택된 모델을 로컬 스토리지에 저장
    localStorage.setItem('selected_model', JSON.stringify(model));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* 헤더 */}
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                메인으로
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                <Settings className="h-6 w-6 text-blue-600" />
                Link Quration 설정
              </h1>
              <p className="text-muted-foreground text-sm">
                AI 모델과 API 설정을 관리하세요
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-4xl mx-auto p-6">
        <Tabs defaultValue="api" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="api" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              API 설정
            </TabsTrigger>
            <TabsTrigger value="models" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              AI 모델 선택
            </TabsTrigger>
          </TabsList>

          <TabsContent value="api">
            <ApiKeySettings onApiKeyChange={handleApiKeyChange} />
          </TabsContent>

          <TabsContent value="models">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-blue-600" />
                  AI 모델 선택
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ModelSelector
                  apiKey={apiKey}
                  selectedModel={selectedModel?.id || null}
                  onModelSelect={handleModelSelect}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* 현재 설정 요약 */}
        {(isApiKeyValid || selectedModel) && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">현재 설정</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">API 연결 상태:</span>
                <span className={`text-sm ${isApiKeyValid ? 'text-green-600' : 'text-red-600'}`}>
                  {isApiKeyValid ? '✅ 연결됨' : '❌ 연결 안됨'}
                </span>
              </div>
              
              {selectedModel && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">선택된 모델:</span>
                  <span className="text-sm text-blue-600 font-medium">
                    {selectedModel.name}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}