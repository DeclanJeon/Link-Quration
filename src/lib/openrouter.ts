// src/lib/openrouter.ts

import {
  ApiKeyValidationResult,
  ChatCompletionOptions,
  ChatCompletionResponse,
  ChatMessage,
  ErrorResponse,
  ModelsResponse,
  OpenRouterModel,
  ProcessedModel,
} from '@/types/openrouter';

export class OpenRouterClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://openrouter.ai/api/v1';
  }

  // 사용 가능한 모델 목록 가져오기
  async getModels(): Promise<ProcessedModel[]> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API 오류: ${response.status}`);
      }

      const data: ModelsResponse = await response.json();
      return this.processModels(data.data);
    } catch (error) {
      console.error('모델 목록 가져오기 실패:', error);
      throw error;
    }
  }

  // 모델 데이터 가공 (무료/유료 구분)
  private processModels(models: OpenRouterModel[]): ProcessedModel[] {
    return models
      .map(
        (model: OpenRouterModel): ProcessedModel => ({
          id: model.id,
          name: model.name || model.id,
          description: model.description || '',
          pricing: model.pricing || {},
          isFree: this.isFreeModel(model),
          context_length: model.context_length || 4096,
          top_provider: model.top_provider || {},
        })
      )
      .sort((a: ProcessedModel, b: ProcessedModel): number => {
        // 무료 모델을 먼저 정렬
        if (a.isFree && !b.isFree) return -1;
        if (!a.isFree && b.isFree) return 1;
        return a.name.localeCompare(b.name);
      });
  }

  // 무료 모델 판별
  private isFreeModel(model: OpenRouterModel): boolean {
    const pricing = model.pricing;
    if (!pricing) return false;

    // prompt와 completion 가격이 모두 0이면 무료
    const promptPrice: number = parseFloat(pricing.prompt || '0');
    const completionPrice: number = parseFloat(pricing.completion || '0');

    return promptPrice === 0 && completionPrice === 0;
  }

  // 채팅 완성 요청
  async createChatCompletion(
    messages: ChatMessage[],
    modelId: string,
    options: ChatCompletionOptions = {}
  ): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer':
            typeof window !== 'undefined' ? window.location.origin : '',
          'X-Title': 'Link Quration',
        },
        body: JSON.stringify({
          model: modelId,
          messages: messages,
          max_tokens: options.maxTokens || 1000,
          temperature: options.temperature || 0.3,
          top_p: options.topP || 1,
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorData: ErrorResponse = await response.json();
        throw new Error(
          errorData.error?.message || `API 요청 실패: ${response.status}`
        );
      }

      const data: ChatCompletionResponse = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('OpenRouter 채팅 완성 실패:', error);
      throw error;
    }
  }

  // API 키 유효성 검증
  async validateApiKey(): Promise<ApiKeyValidationResult> {
    try {
      await this.getModels();
      return { valid: true, error: null };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : '알 수 없는 오류가 발생했습니다.';
      return {
        valid: false,
        error: errorMessage.includes('401')
          ? 'API 키가 유효하지 않습니다.'
          : errorMessage,
      };
    }
  }

  // 현재 설정된 API 키 반환 (보안상 마스킹)
  getMaskedApiKey(): string {
    if (!this.apiKey) return '';
    const length = this.apiKey.length;
    if (length <= 8) return '*'.repeat(length);
    return (
      this.apiKey.substring(0, 4) +
      '*'.repeat(length - 8) +
      this.apiKey.substring(length - 4)
    );
  }

  // API 키 업데이트
  updateApiKey(newApiKey: string): void {
    this.apiKey = newApiKey;
  }

  // 사용 가능한 모델인지 확인
  async isModelAvailable(modelId: string): Promise<boolean> {
    try {
      const models = await this.getModels();
      return models.some((model) => model.id === modelId);
    } catch (error) {
      console.error('모델 가용성 확인 실패:', error);
      return false;
    }
  }

  // 모델별 가격 정보 포맷팅
  static formatModelPrice(model: ProcessedModel): string {
    if (model.isFree) {
      return '무료';
    }

    const pricing = model.pricing;
    if (!pricing || (!pricing.prompt && !pricing.completion)) {
      return '가격 정보 없음';
    }

    const promptPrice = parseFloat(pricing.prompt || '0');
    const completionPrice = parseFloat(pricing.completion || '0');

    if (promptPrice === 0 && completionPrice === 0) {
      return '무료';
    }

    return `$${promptPrice.toFixed(6)}/1K input, $${completionPrice.toFixed(
      6
    )}/1K output`;
  }

  // 모델의 컨텍스트 길이를 사람이 읽기 쉬운 형태로 포맷팅
  static formatContextLength(contextLength: number): string {
    if (contextLength >= 1000000) {
      return `${(contextLength / 1000000).toFixed(1)}M 토큰`;
    } else if (contextLength >= 1000) {
      return `${(contextLength / 1000).toFixed(0)}K 토큰`;
    } else {
      return `${contextLength} 토큰`;
    }
  }
}

// 기본 내보내기도 추가 (편의성을 위해)
export default OpenRouterClient;

// 유틸리티 함수들
export const openRouterUtils = {
  formatPrice: OpenRouterClient.formatModelPrice,
  formatContextLength: OpenRouterClient.formatContextLength,
};
