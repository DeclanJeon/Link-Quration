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
    setAnalysisProgress(10); // 초기 진행률 설정

    try {
      // 진행률 애니메이션
      const progressInterval = setInterval(() => {
        setAnalysisProgress((prev) => {
          // 최대 80%까지만 진행 (나머지 20%는 API 응답 후)
          const newProgress = prev + 5;
          return Math.min(newProgress, 80);
        });
      }, 500);

      console.log('콘텐츠 추출 시작:', url);

      // API 요청
      const response = await fetch('/api/extract-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      clearInterval(progressInterval);
      setAnalysisProgress(90);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '콘텐츠 추출에 실패했습니다.');
      }

      const result = await response.json();
      
      // 이미지 URL 유효성 검사
      if (result.data.leadImageUrl) {
        try {
          // 이미지 사전 로드하여 유효성 확인
          await new Promise<void>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = () => reject(new Error('이미지 로드 실패'));
            img.src = result.data.leadImageUrl;
          });
        } catch (e) {
          console.warn('썸네일 이미지 로드 실패:', e);
          // 유효하지 않은 이미지 URL 제거
          result.data.leadImageUrl = null;
          
          // 도메인에서 파비콘 URL 생성 시도
          try {
            const domain = new URL(url).hostname;
            result.data.favicon = `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(domain)}&size=256`;
          } catch (e) {
            console.warn('파비콘 생성 실패:', e);
          }
        }
      }

      setExtractionResult(result.data);
      setAnalysisProgress(100);

      if (!result.success) {
        setExtractionError(result.data.error || '일부 정보만 추출되었습니다.');
      }

      return result.data;
    } catch (err) {
      console.error('콘텐츠 추출 오류:', err);
      setExtractionError(
        err instanceof Error
          ? `콘텐츠를 가져오는 중 오류가 발생했습니다: ${err.message}`
          : '알 수 없는 오류가 발생했습니다.'
      );
      throw err;
    } finally {
      setIsAnalyzing(false);
      // 완료 후 잠시 동안 진행률 표시 유지
      setTimeout(() => setAnalysisProgress(0), 1000);
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
