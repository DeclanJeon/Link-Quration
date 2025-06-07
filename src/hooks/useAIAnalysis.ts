// src/hooks/useAIAnalysis.ts
'use client';

import { useState, useCallback, useEffect } from 'react';
import { AIAnalysisResult, ExtractedContent } from '@/types/bookmark';

export const useAIAnalysis = () => {
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState<boolean>(false);
  const [aiProgress, setAiProgress] = useState<number>(0);
  const [aiError, setAiError] = useState<string>('');
  const [hasAISetup, setHasAISetup] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<any>(null);

  useEffect(() => {
    const apiKey = localStorage.getItem('openrouter_api_key');
    const model = localStorage.getItem('selected_model');

    setHasAISetup(!!apiKey);
    if (model) {
      try {
        setSelectedModel(JSON.parse(model));
      } catch (error) {
        console.error('저장된 모델 정보 파싱 실패:', error);
      }
    }
  }, []);

  const performAIAnalysis = useCallback(
    async (extractedData: ExtractedContent) => {
      setIsAiAnalyzing(true);
      setAiError('');

      try {
        const apiKey = localStorage.getItem('openrouter_api_key');
        if (!apiKey || !selectedModel) {
          throw new Error('AI 설정이 필요합니다.');
        }

        setAiProgress(0);
        const aiProgressInterval = setInterval(() => {
          setAiProgress((prev) => Math.min(prev + 12, 90));
        }, 400);

        console.log('AI 분석 시작:', selectedModel.name);

        const aiResponse = await fetch('/api/ai-analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            extractedData,
            apiKey,
            modelId: selectedModel.id,
            analysisType: 'complete',
          }),
        });

        clearInterval(aiProgressInterval);
        setAiProgress(100);

        if (!aiResponse.ok) {
          const errorData = await aiResponse.json();
          throw new Error(errorData.error || 'AI 분석에 실패했습니다.');
        }

        const aiResult = await aiResponse.json();
        setAiAnalysis(aiResult.data);

        return aiResult.data;
      } catch (error) {
        setAiError(
          error instanceof Error
            ? error.message
            : 'AI 분석 중 오류가 발생했습니다.'
        );
        throw error;
      } finally {
        setIsAiAnalyzing(false);
        setTimeout(() => setAiProgress(0), 1000);
      }
    },
    [selectedModel]
  );

  const resetAIAnalysis = useCallback(() => {
    setAiAnalysis(null);
    setAiError('');
    setAiProgress(0);
  }, []);

  return {
    aiAnalysis,
    isAiAnalyzing,
    aiProgress,
    aiError,
    hasAISetup,
    selectedModel,
    performAIAnalysis,
    resetAIAnalysis,
  };
};
