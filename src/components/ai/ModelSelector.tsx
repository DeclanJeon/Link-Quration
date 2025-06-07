// src/components/ai/ModelSelector.tsx
import { useState, useEffect } from "react";
import { Search, Zap, DollarSign, Info, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { OpenRouterClient } from "@/lib/openrouter";

interface Model {
  id: string;
  name: string;
  description: string;
  pricing: any;
  isFree: boolean;
  context_length: number;
  top_provider: any;
}

interface ModelSelectorProps {
  apiKey: string;
  selectedModel: string | null;
  onModelSelect: (model: Model) => void;
}

const ModelSelector = ({ apiKey, selectedModel, onModelSelect }: ModelSelectorProps) => {
  const [models, setModels] = useState<Model[]>([]);
  const [filteredModels, setFilteredModels] = useState<Model[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("all");

  // 모델 목록 로드
  useEffect(() => {
    if (apiKey) {
      loadModels();
    }
  }, [apiKey]);

  // 검색 및 필터링
  useEffect(() => {
    filterModels();
  }, [models, searchQuery, activeTab]);

  const loadModels = async () => {
    setLoading(true);
    setError("");
    
    try {
      const client = new OpenRouterClient(apiKey);
      const modelList = await client.getModels();
      setModels(modelList);
    } catch (err) {
      setError(err instanceof Error ? err.message : '모델 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const filterModels = () => {
    let filtered = models;

    // 탭별 필터링
    if (activeTab === "free") {
      filtered = filtered.filter(model => model.isFree);
    } else if (activeTab === "paid") {
      filtered = filtered.filter(model => !model.isFree);
    }

    // 검색어 필터링
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(model => 
        model.name.toLowerCase().includes(query) ||
        model.id.toLowerCase().includes(query) ||
        model.description.toLowerCase().includes(query)
      );
    }

    setFilteredModels(filtered);
  };

  const formatPrice = (pricing: any) => {
    if (!pricing || (!pricing.prompt && !pricing.completion)) {
      return "가격 정보 없음";
    }
    
    const promptPrice = parseFloat(pricing.prompt || '0');
    const completionPrice = parseFloat(pricing.completion || '0');
    
    if (promptPrice === 0 && completionPrice === 0) {
      return "무료";
    }
    
    return `$${promptPrice.toFixed(6)}/1K input, $${completionPrice.toFixed(6)}/1K output`;
  };

  const getProviderInfo = (provider: any) => {
    if (!provider || !provider.name) return "알 수 없음";
    return provider.name;
  };

  if (!apiKey) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          모델을 선택하려면 먼저 OpenRouter API 키를 설정해주세요.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* 검색창 */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="모델 검색... (예: gpt, claude, llama)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* 탭 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">
            전체 ({models.length})
          </TabsTrigger>
          <TabsTrigger value="free" className="text-green-600">
            <Zap className="h-4 w-4 mr-1" />
            무료 ({models.filter(m => m.isFree).length})
          </TabsTrigger>
          <TabsTrigger value="paid" className="text-blue-600">
            <DollarSign className="h-4 w-4 mr-1" />
            유료 ({models.filter(m => !m.isFree).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-3">
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-muted-foreground">모델 목록을 불러오는 중...</p>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!loading && !error && filteredModels.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">검색 결과가 없습니다.</p>
            </div>
          )}

          {/* 모델 리스트 */}
          <div className="grid gap-3 max-h-96 overflow-y-auto">
            {filteredModels.map((model) => (
              <Card 
                key={model.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                  selectedModel === model.id 
                    ? 'ring-2 ring-blue-500 bg-blue-50' 
                    : 'hover:bg-slate-50'
                }`}
                onClick={() => onModelSelect(model)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium truncate">{model.name}</h3>
                        {model.isFree && (
                          <Badge variant="default" className="bg-green-600 text-xs">
                            <Zap className="h-3 w-3 mr-1" />
                            무료
                          </Badge>
                        )}
                        {selectedModel === model.id && (
                          <Badge variant="default" className="bg-blue-600 text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            선택됨
                          </Badge>
                        )}
                      </div>
                      
                      {model.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {model.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>제공: {getProviderInfo(model.top_provider)}</span>
                        <span>컨텍스트: {model.context_length.toLocaleString()}토큰</span>
                      </div>
                      
                      <div className="mt-2">
                        <span className="text-xs font-medium">
                          💰 {formatPrice(model.pricing)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ModelSelector;