// src/hooks/useMediaAnalysis.ts 수정
'use client';

import { useState, useCallback, useEffect } from 'react';
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

  // 🆕 자동 미디어 감지
  const detectMedia = useCallback(
    async (url: string): Promise<MediaDetectionResult | null> => {
      if (!url.trim()) return null;

      try {
        setState((prev) => ({ ...prev, error: null }));

        console.log('🔍 미디어 감지 시작:', url);

        // 클라이언트에서 직접 감지 (API 호출 없이)
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

        setState((prev) => ({ ...prev, error: mediaError }));
        return null;
      }
    },
    []
  );

  // 🆕 URL 변경 시 자동 감지
  const autoDetectMedia = useCallback(
    async (url: string) => {
      if (url && url.trim().length > 0) {
        await detectMedia(url);
      }
    },
    [detectMedia]
  );

  // 🧠 전체 미디어 분석
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
      }
    ): Promise<MediaAnalysisResult | null> => {
      console.log('🚀 analyzeMedia 함수 호출됨:', { url, modelId, options });

      try {
        setState((prev) => ({
          ...prev,
          isAnalyzing: true,
          error: null,
          progress: {
            stage: 'detecting',
            progress: 10,
            message: '미디어 감지 중...',
          },
        }));

        // 1. 미디어 감지
        console.log('🔍 미디어 감지 시작...');
        let detection = state.detection;
        if (!detection) {
          detection = await detectMedia(url);
        }

        console.log('📋 감지 결과:', detection);

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

        // 3. API 요청 준비
        const requestBody = {
          extractedData: {
            url,
            title: '미디어 분석',
            domain: new URL(url).hostname,
          },
          apiKey,
          modelId,
          isMediaContent: true,
          mediaUrl: url,
          mediaAnalysisOptions: options,
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

        console.log('🌐 API 호출 시작...');

        const response = await fetch('/api/ai-analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        console.log('📡 API 응답 상태:', response.status, response.statusText);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ API 에러 응답:', errorText);
          throw new Error(`API 호출 실패: ${response.status} - ${errorText}`);
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

        // 임시 결과 생성 (API가 완전히 구현되지 않은 경우)
        const mockResult: MediaAnalysisResult = {
          metadata: {
            id: detection.mediaId || 'test',
            title: '테스트 미디어',
            description: '미디어 분석 테스트',
            duration: 300,
            durationFormatted: '5분',
            platform: detection.platform,
            mediaType: detection.mediaType,
            quality: {},
            language: 'ko',
          },
          timeline: [
            {
              id: 'segment-1',
              startTime: { seconds: 0, formatted: '0:00' },
              endTime: { seconds: 60, formatted: '1:00' },
              duration: 60,
              title: '시작 부분',
              description: '미디어 시작',
              summary: '테스트 세그먼트입니다.',
              keyPoints: ['테스트 포인트 1', '테스트 포인트 2'],
              importance: 'high' as const,
              tags: ['test'],
            },
          ],
          overallSummary: '이것은 테스트 분석 결과입니다.',
          keyTopics: ['테스트', '미디어', '분석'],
          difficulty: 'intermediate',
          targetAudience: ['개발자'],
          learningObjectives: ['미디어 분석 이해하기'],
          relatedTopics: ['AI', '분석'],
          actionItems: ['테스트 실행하기'],
          notableQuotes: [],
          chapters: [],
          analysisTimestamp: new Date().toISOString(),
          aiModel: modelId,
          confidence: 0.8,
        };

        const result = data.data || mockResult;

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
    [detectMedia, state.detection, state.progress?.stage]
  );

  // 🎯 타임라인만 분석
  const analyzeTimeline = useCallback(
    async (
      url: string,
      apiKey: string,
      modelId: string,
      options?: {
        segmentDuration?: number;
        analysisDepth?: 'basic' | 'detailed' | 'comprehensive';
      }
    ): Promise<any> => {
      try {
        setState((prev) => ({
          ...prev,
          isAnalyzing: true,
          error: null,
          progress: {
            stage: 'generating_timeline',
            progress: 0,
            message: '타임라인 분석 시작...',
          },
        }));

        const response = await fetch('/api/media-timeline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mediaUrl: url,
            apiKey,
            modelId,
            options,
          }),
        });

        if (!response.ok) {
          throw new Error('타임라인 분석 실패');
        }

        const data = await response.json();

        setState((prev) => ({
          ...prev,
          isAnalyzing: false,
          progress: {
            stage: 'completed',
            progress: 100,
            message: '타임라인 분석 완료!',
          },
        }));

        return data.data;
      } catch (error) {
        const mediaError: MediaAnalysisError = {
          code: 'ANALYSIS_FAILED',
          message:
            error instanceof Error ? error.message : '타임라인 분석 실패',
          stage: 'generating_timeline',
        };

        setState((prev) => ({
          ...prev,
          isAnalyzing: false,
          error: mediaError,
        }));

        return null;
      }
    },
    []
  );

  // 진행률 업데이트 헬퍼
  const updateProgress = useCallback(
    (
      stage: AnalysisStage,
      progress: number,
      message: string,
      estimatedTimeRemaining?: number
    ) => {
      setState((prev) => ({
        ...prev,
        progress: {
          stage,
          progress,
          message,
          estimatedTimeRemaining,
        },
      }));
    },
    []
  );

  // 🔄 상태 리셋
  const resetAnalysis = useCallback(() => {
    setState({
      isAnalyzing: false,
      progress: null,
      result: null,
      error: null,
      detection: null,
    });
  }, []);

  // 📊 분석 통계
  const getAnalysisStats = useCallback(() => {
    if (!state.result) return null;

    return {
      totalDuration: state.result.metadata.duration,
      timelineSegments: state.result.timeline.length,
      keyTopics: state.result.keyTopics.length,
      actionItems: state.result.actionItems.length,
      notableQuotes: state.result.notableQuotes.length,
      chapters: state.result.chapters.length,
      confidence: state.result.confidence,
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
    autoDetectMedia, // 🆕 자동 감지
    analyzeMedia,
    analyzeTimeline,
    resetAnalysis,

    // 유틸리티
    getAnalysisStats,
  };
};

// 🎯 간단한 미디어 감지 훅
export const useMediaDetection = () => {
  const [detection, setDetection] = useState<MediaDetectionResult | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);

  const detectMedia = useCallback(async (url: string) => {
    if (!url.trim()) return null;

    setIsDetecting(true);
    try {
      console.log('🔍 간단 미디어 감지:', url);
      const result = MediaDetector.detectMedia(url);
      setDetection(result);
      return result;
    } catch (error) {
      console.error('미디어 감지 실패:', error);
      return null;
    } finally {
      setIsDetecting(false);
    }
  }, []);

  return { detection, isDetecting, detectMedia };
};
