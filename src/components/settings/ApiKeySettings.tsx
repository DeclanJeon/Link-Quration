// src/components/settings/ApiKeySettings.tsx
import { useState, useEffect } from "react";
import { Key, Check, X, AlertCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { OpenRouterClient } from "@/lib/openrouter";

interface ApiKeySettingsProps {
  onApiKeyChange: (apiKey: string, isValid: boolean) => void;
}

const ApiKeySettings = ({ onApiKeyChange }: ApiKeySettingsProps) => {
  const [apiKey, setApiKey] = useState<string>("");
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    error: string | null;
  } | null>(null);
  const [showKey, setShowKey] = useState<boolean>(false);

  // 로컬 스토리지에서 API 키 불러오기
  useEffect(() => {
    const savedApiKey = localStorage.getItem('openrouter_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
      validateApiKey(savedApiKey);
    }
  }, []);

  // API 키 유효성 검증
  const validateApiKey = async (keyToValidate: string = apiKey) => {
    if (!keyToValidate.trim()) {
      setValidationResult(null);
      onApiKeyChange("", false);
      return;
    }

    setIsValidating(true);
    
    try {
      const client = new OpenRouterClient(keyToValidate);
      const result = await client.validateApiKey();
      
      setValidationResult(result);
      
      if (result.valid) {
        // 유효한 키면 로컬 스토리지에 저장
        localStorage.setItem('openrouter_api_key', keyToValidate);
        onApiKeyChange(keyToValidate, true);
      } else {
        onApiKeyChange("", false);
      }
    } catch (error) {
      setValidationResult({
        valid: false,
        error: '네트워크 오류가 발생했습니다.'
      });
      onApiKeyChange("", false);
    } finally {
      setIsValidating(false);
    }
  };

  // API 키 입력 핸들러
  const handleApiKeyChange = (value: string) => {
    setApiKey(value);
    setValidationResult(null);
  };

  // API 키 저장
  const handleSaveApiKey = () => {
    validateApiKey(apiKey);
  };

  // API 키 삭제
  const handleDeleteApiKey = () => {
    setApiKey("");
    setValidationResult(null);
    localStorage.removeItem('openrouter_api_key');
    onApiKeyChange("", false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5 text-blue-600" />
          OpenRouter API 설정
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* API 키 안내 */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>OpenRouter API 키가 필요합니다. 무료 크레딧으로 시작할 수 있어요!</span>
            <Button
              variant="outline"
              size="sm"
              className="ml-2"
              onClick={() => window.open('https://openrouter.ai/keys', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              API 키 발급받기
            </Button>
          </AlertDescription>
        </Alert>

        {/* API 키 입력 */}
        <div className="space-y-2">
          <Label htmlFor="apiKey">API 키</Label>
          <div className="flex gap-2">
            <Input
              id="apiKey"
              type={showKey ? "text" : "password"}
              placeholder="sk-or-v1-..."
              value={apiKey}
              onChange={(e) => handleApiKeyChange(e.target.value)}
              className="flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowKey(!showKey)}
              className="shrink-0"
            >
              {showKey ? "숨기기" : "보기"}
            </Button>
          </div>
        </div>

        {/* 검증 버튼 */}
        <div className="flex gap-2">
          <Button
            onClick={handleSaveApiKey}
            disabled={!apiKey.trim() || isValidating}
            className="flex-1"
          >
            {isValidating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                검증 중...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                API 키 검증 및 저장
              </>
            )}
          </Button>
          
          {apiKey && (
            <Button
              variant="outline"
              onClick={handleDeleteApiKey}
              className="shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* 검증 결과 */}
        {validationResult && (
          <Alert variant={validationResult.valid ? "default" : "destructive"}>
            {validationResult.valid ? (
              <Check className="h-4 w-4" />
            ) : (
              <X className="h-4 w-4" />
            )}
            <AlertDescription>
              {validationResult.valid 
                ? "✅ API 키가 성공적으로 검증되었습니다!" 
                : `❌ ${validationResult.error}`}
            </AlertDescription>
          </Alert>
        )}

        {/* API 키 상태 표시 */}
        {validationResult?.valid && (
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
            <Badge variant="default" className="bg-green-600">
              연결됨
            </Badge>
            <span className="text-sm text-green-700">
              OpenRouter API가 정상적으로 연결되었습니다.
            </span>
          </div>
        )}

        {/* 사용 팁 */}
        <div className="text-sm text-muted-foreground space-y-1">
          <p>💡 <strong>팁:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>OpenRouter는 다양한 AI 모델을 하나의 API로 사용할 수 있는 서비스입니다</li>
            <li>무료 크레딧으로 시작할 수 있으며, 무료 모델들도 제공됩니다</li>
            <li>API 키는 브라우저에만 저장되며, 서버로 전송되지 않습니다</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApiKeySettings;