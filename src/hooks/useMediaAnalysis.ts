// src/hooks/useMediaAnalysis.ts 수정된 버전
'use client';

import { useState, useCallback, useRef } from 'react';
import { MediaDetector } from '@/lib/media-analyzers/media-detector';
import {
  MediaAnalysisResult,
  MediaDetectionResult,
  MediaAnalysisProgress,
  MediaAnalysisError,
  AnalysisStage,
  UseMediaAnalysisState,
} from '@/types/media-analysis';

export const useMediaAnalysis = () => {
  const [state, setState] = useState<UseMediaAnalysisState>({
    isAnalyzing: false,
    progress: null,
    result: null,
    error: null,
    detection: null,
  });

  // 중복 분석 방지를 위한 ref 추가
  const abortControllerRef = useRef<AbortController | null>(null);

  // 진행률 업데이트 함수
  const updateProgress = useCallback((stage: AnalysisStage, progress: number, message: string) => {
    setState(prev => ({
      ...prev,
      progress: {
        ...prev.progress,
        stage,
        progress,
        message,
      } as MediaAnalysisProgress,
    }));
  }, []);

  // 🆕 자동 미디어 감지 (개선)
  const detectMedia = useCallback(async (url: string): Promise<MediaDetectionResult | null> => {
    if (!url.trim()) return null;

    try {
      setState((prev) => ({ ...prev, error: null }));

      console.log('🔍 미디어 감지 시작:', url);

      // URL 유효성 검사 추가
      try {
        new URL(url);
      } catch {
        throw new Error('유효하지 않은 URL입니다.');
      }

      // 클라이언트에서 직접 감지
      const detection = MediaDetector.detectMedia(url);

      setState((prev) => ({ ...prev, detection }));

      console.log('✅ 미디어 감지 결과:', detection);
      return detection;
    } catch (error) {
      console.error('❌ 미디어 감지 실패:', error);
      const mediaError: MediaAnalysisError = {
        code: 'MEDIA_NOT_FOUND',
        message: error instanceof Error ? error.message : '미디어 감지 실패',
        stage: 'detecting',
      };

      setState((prev) => ({ ...prev, error: mediaError, detection: null }));
      return null;
    }
  }, []);

  // 🧠 전체 미디어 분석 (개선)
  const analyzeMedia = useCallback(
    async (
      url: string,
      apiKey: string,
      modelId: string,
      options?: {
        includeTimeline?: boolean;
        includeTranscript?: boolean;
        analysisDepth?: 'basic' | 'detailed' | 'comprehensive';
        extractQuotes?: boolean;
      },
    ): Promise<MediaAnalysisResult | null> => {
      console.log('🚀 analyzeMedia 함수 호출됨:', { url, modelId, options });

      // 이전 요청 취소
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // 새 AbortController 생성
      abortControllerRef.current = new AbortController();
      const { signal } = abortControllerRef.current;

      try {
        setState((prev) => ({
          ...prev,
          isAnalyzing: true,
          error: null,
          result: null, // 이전 결과 초기화
          progress: {
            stage: 'detecting',
            progress: 10,
            message: '미디어 감지 중...',
          },
        }));

        // 1. 미디어 감지
        let detection = state.detection;
        if (!detection) {
          detection = await detectMedia(url);
        }

        if (!detection?.isMedia) {
          throw new Error('지원하지 않는 미디어 형식입니다.');
        }

        // 2. 진행률 업데이트
        setState((prev) => ({
          ...prev,
          progress: {
            stage: 'extracting_metadata',
            progress: 30,
            message: '미디어 정보 추출 중...',
          },
        }));

        // 3. API 요청
        const requestBody = {
          extractedData: {
            url,
            title: '미디어 분석', // detection.title이 없으므로 기본값 사용
            domain: new URL(url).hostname,
          },
          apiKey,
          modelId,
          isMediaContent: true,
          mediaUrl: url,
          mediaAnalysisOptions: {
            ...options,
            platform: detection.platform,
            mediaType: detection.mediaType,
            mediaId: detection.mediaId,
          },
        };

        console.log('📤 API 요청 데이터:', requestBody);

        // 4. AI 분석 API 호출
        setState((prev) => ({
          ...prev,
          progress: {
            stage: 'analyzing_content',
            progress: 60,
            message: 'AI 콘텐츠 분석 중...',
          },
        }));

        const response = await fetch('/api/ai-analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal, // AbortController signal 추가
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: response.statusText }));
          throw new Error(errorData.error || `API 호출 실패: ${response.status}`);
        }

        const data = await response.json();
        console.log('📊 API 응답 데이터:', data);

        // 5. 결과 처리
        setState((prev) => ({
          ...prev,
          progress: {
            stage: 'finalizing',
            progress: 90,
            message: '분석 완료 중...',
          },
        }));

        // 미디어 분석 결과 병합
        const result: MediaAnalysisResult = {
          ...data.data,
          metadata: {
            ...data.data.metadata,
            platform: detection.platform,
            mediaType: detection.mediaType,
            mediaId: detection.mediaId,
          },
        };

        setState((prev) => ({
          ...prev,
          isAnalyzing: false,
          result,
          progress: {
            stage: 'completed',
            progress: 100,
            message: '분석 완료!',
          },
        }));

        console.log('✅ 분석 완료:', result);
        return result;
      } catch (error) {
        // 취소된 요청은 에러로 처리하지 않음
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('🛑 분석이 취소되었습니다.');
          return null;
        }

        console.error('❌ analyzeMedia 에러:', error);

        const mediaError: MediaAnalysisError = {
          code: 'ANALYSIS_FAILED',
          message: error instanceof Error ? error.message : '분석 실패',
          stage: state.progress?.stage || 'analyzing_content',
        };

        setState((prev) => ({
          ...prev,
          isAnalyzing: false,
          error: mediaError,
          progress: null,
        }));

        return null;
      }
    },
    [detectMedia, state.detection],
  );

  // 🎯 타임라인만 분석 (개선)
  const analyzeTimeline = useCallback(
    async (
      url: string,
      modelId: string,
      options?: {
        segmentDuration?: number;
        analysisDepth?: 'basic' | 'detailed' | 'comprehensive';
      },
    ): Promise<MediaAnalysisResult['timeline'] | null> => {
      try {
        setState((prev) => ({
          ...prev,
          isAnalyzing: true,
          error: null,
        }));

        const response = await fetch('/api/analyze-timeline', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url,
            modelId,
            options,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: response.statusText }));
          throw new Error(errorData.error || '타임라인 분석 실패');
        }

        const data = await response.json();

        // 기존 result에 타임라인 업데이트
        setState((prev) => ({
          ...prev,
          isAnalyzing: false,
          result: prev.result
            ? {
                ...prev.result,
                timeline: data.data.timeline,
              }
            : null,
          progress: {
            stage: 'completed',
            progress: 100,
            message: '타임라인 분석 완료',
          },
        }));

        return data.data.timeline;
      } catch (error) {
        const mediaError: MediaAnalysisError = {
          code: 'ANALYSIS_FAILED',
          message: error instanceof Error ? error.message : '타임라인 분석 실패',
          stage: 'generating_timeline',
        };

        setState((prev) => ({
          ...prev,
          isAnalyzing: false,
          error: mediaError,
          progress: null,
        }));

        return null;
      }
    },
    [],
  );

  // 🔄 상태 리셋 (개선)
  const resetAnalysis = useCallback(() => {
    // 진행 중인 요청 취소
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setState({
      isAnalyzing: false,
      progress: null,
      result: null,
      error: null,
      detection: null,
    });
  }, []);

  // 📊 분석 통계 (개선)
  const getAnalysisStats = useCallback(() => {
    if (!state.result) return null;

    return {
      totalDuration: state.result.metadata.duration,
      totalDurationFormatted: state.result.metadata.durationFormatted,
      timelineSegments: state.result.timeline.length,
      keyTopics: state.result.keyTopics.length,
      actionItems: state.result.actionItems.length,
      notableQuotes: state.result.notableQuotes.length,
      chapters: state.result.chapters?.length || 0,
      confidence: state.result.confidence,
      platform: state.result.metadata.platform,
      mediaType: state.result.metadata.mediaType,
    };
  }, [state.result]);

  return {
    // 상태
    isAnalyzing: state.isAnalyzing,
    progress: state.progress,
    result: state.result,
    error: state.error,
    detection: state.detection,

    // 액션
    detectMedia,
    autoDetectMedia: detectMedia, // autoDetectMedia를 detectMedia로 통일
    analyzeMedia,
    analyzeTimeline,
    resetAnalysis,
    updateProgress, // 진행률 업데이트 함수 노출

    // 유틸리티
    getAnalysisStats,
  };
};

// 🎯 간단한 미디어 감지 훅 (개선)
export const useMediaDetection = () => {
  const [detection, setDetection] = useState<MediaDetectionResult | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { analyzeMedia } = useMediaAnalysis();
  const [progress, setProgress] = useState<{stage: string; progress: number; message: string} | null>(null);

  const updateProgress = useCallback((stage: string, progress: number, message: string) => {
    setProgress({ stage, progress, message });
  }, []);

  const detectMedia = useCallback(async (url: string) => {
    if (!url.trim()) {
      setDetection(null);
      return null;
    }

    setIsDetecting(true);
    setError(null);

    try {
      // URL 유효성 검사
      new URL(url);

      console.log('🔍 간단 미디어 감지:', url);
      const result = MediaDetector.detectMedia(url);
      setDetection(result);
      return result;
    } catch (error) {
      console.error('미디어 감지 실패:', error);
      setError(error instanceof Error ? error.message : '미디어 감지 실패');
      setDetection(null);
      return null;
    } finally {
      setIsDetecting(false);
    }
  }, []);

  // URL 변경 시 자동 감지
  const autoDetectMedia = useCallback(
    (url: string) => {
      detectMedia(url);
    },
    [detectMedia],
  );

  return {
    detection,
    isDetecting,
    detectMedia,
    autoDetectMedia,
    error,
    progress,
    updateProgress,
    // 미디어 분석 훅의 함수들도 포함
    analyzeMedia,
  };
};
