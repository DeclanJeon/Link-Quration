// src/hooks/useContentExtraction.ts
'use client';

import { useState, useCallback } from 'react';
import { ExtractedContent } from '@/types/bookmark';

export const useContentExtraction = () => {
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisProgress, setAnalysisProgress] = useState<number>(0);
  const [extractionResult, setExtractionResult] =
    useState<ExtractedContent | null>(null);
  const [extractionError, setExtractionError] = useState<string>('');

  const extractContent = useCallback(async (url: string) => {
    if (!url.trim()) return;

    setIsAnalyzing(true);
    setExtractionResult(null);
    setExtractionError('');
    setAnalysisProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setAnalysisProgress((prev) => Math.min(prev + 8, 50));
      }, 300);

      console.log('콘텐츠 추출 시작:', url);

      const response = await fetch('/api/extract-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      clearInterval(progressInterval);
      setAnalysisProgress(60);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '콘텐츠 추출에 실패했습니다.');
      }

      const result = await response.json();
      setExtractionResult(result.data);
      setAnalysisProgress(100);

      if (!result.success) {
        setExtractionError(result.data.error || '일부 정보만 추출되었습니다.');
      }

      return result.data;
    } catch (err) {
      setExtractionError(
        err instanceof Error
          ? err.message
          : '콘텐츠 추출 중 오류가 발생했습니다.'
      );
      throw err;
    } finally {
      setIsAnalyzing(false);
      setTimeout(() => setAnalysisProgress(0), 2000);
    }
  }, []);

  const resetExtraction = useCallback(() => {
    setExtractionResult(null);
    setExtractionError('');
    setAnalysisProgress(0);
  }, []);

  return {
    isAnalyzing,
    analysisProgress,
    extractionResult,
    extractionError,
    extractContent,
    resetExtraction,
  };
};
