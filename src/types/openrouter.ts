// OpenRouter API 응답 타입 정의
export interface OpenRouterModel {
  id: string;
  name?: string;
  description?: string;
  pricing?: {
    prompt?: string;
    completion?: string;
  };
  context_length?: number;
  top_provider?: {
    name?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

// 가공된 모델 타입
export interface ProcessedModel {
  id: string;
  name: string;
  description: string;
  pricing: {
    prompt?: string;
    completion?: string;
  };
  isFree: boolean;
  context_length: number;
  top_provider: {
    name?: string;
    [key: string]: any;
  };
}

// API 응답 타입
export interface ModelsResponse {
  data: OpenRouterModel[];
  [key: string]: any;
}

// 채팅 메시지 타입
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// 채팅 완성 옵션 타입
export interface ChatCompletionOptions {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
}

// API 키 검증 결과 타입
export interface ApiKeyValidationResult {
  valid: boolean;
  error: string | null;
}

// 채팅 완성 응답 타입
export interface ChatCompletionResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
    [key: string]: any;
  }>;
  [key: string]: any;
}

// 에러 응답 타입
export interface ErrorResponse {
  error?: {
    message?: string;
    [key: string]: any;
  };
  [key: string]: any;
}
