"use client"

import { useState, useEffect } from "react";
import { Plus, Search, Filter, Share2, TrendingUp, Brain, Settings } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bookmark } from "@/types/bookmark";
import { Badge } from "@/components/ui/badge";
import BookmarkCard from "@/components/card/BookmarkCard";
import AddBookmarkModal from "@/components/modal/AddBookmarkModal";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";

// 샘플 북마크 데이터
import { sampleBookmarks, } from "@/mock/bookmark";
import { CATEGORIES } from "@/mock/categories";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Index = () => {
  const [bookmarks, setBookmarks] = useState(sampleBookmarks);
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [viewCount, setViewCount] = useState<number | null>(null);

  // AI 설정 상태 확인
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<any>(null);

  // 클라이언트 사이드에서만 랜덤 값 생성
  useEffect(() => {
    setViewCount(Math.floor(Math.random() * 100) + 50);

    const apiKey = localStorage.getItem('openrouter_api_key');
    const model = localStorage.getItem('selected_model');
    
    setHasApiKey(!!apiKey);
    if (model) {
      try {
        setSelectedModel(JSON.parse(model));
      } catch (error) {
        console.error('모델 정보 파싱 실패:', error);
      }
    }
  }, []);

  const filteredBookmarks = bookmarks.filter(bookmark => {
    const matchesCategory = selectedCategory === "전체" || bookmark.category === selectedCategory;
    const matchesSearch = bookmark.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         bookmark.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         bookmark.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen}
        onAddBookmark={() => setIsAddModalOpen(true)}
      />
      
      <div className="flex">
        <Sidebar 
          isOpen={sidebarOpen}
          categories={CATEGORIES}
          selectedCategory={selectedCategory}
          onCategorySelect={setSelectedCategory}
        />
        
        <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
          <div className="p-6">

            
            {/* AI 설정 안내 (API 키가 없을 때만 표시) */}
          {!hasApiKey && (
            <div className="mb-6">
              <Alert>
                <Settings className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>🤖 AI 기능을 사용하려면 OpenRouter API를 설정해주세요!</span>
                  <Link href="/settings">
                    <Button variant="outline" size="sm" className="ml-2">
                      <Settings className="h-4 w-4 mr-1" />
                      설정하기
                    </Button>
                  </Link>
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* AI 설정 완료 상태 표시 */}
          {hasApiKey && selectedModel && (
            <div className="mb-6">
              <Alert className="border-green-200 bg-green-50">
                <Brain className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700">
                  🎉 AI 모델 ({selectedModel.name})이 설정되었습니다! 이제 스마트 북마크 기능을 사용할 수 있어요.
                </AlertDescription>
              </Alert>
            </div>
          )}

            {/* 검색 및 필터 섹션 */}
            <div className="mb-8">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="북마크 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-white border-slate-200 focus:border-blue-400"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="h-4 w-4" />
                    필터
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <TrendingUp className="h-4 w-4" />
                    인기순
                  </Button>
                </div>
              </div>
              
              {/* 카테고리 태그 */}
              <div className="flex flex-wrap gap-2 mt-4">
                {CATEGORIES.map((category) => (
                  <Badge
                    key={category}
                    variant={selectedCategory === category ? "default" : "secondary"}
                    className={`cursor-pointer transition-all duration-200 ${
                      selectedCategory === category 
                        ? "bg-blue-600 hover:bg-blue-700" 
                        : "hover:bg-slate-200"
                    }`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Badge>
                ))}
              </div>
            </div>

            {/* 통계 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <div className="text-2xl font-bold text-blue-600">{bookmarks.length}</div>
                <div className="text-sm text-muted-foreground">총 북마크</div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <div className="text-2xl font-bold text-green-600">
                  {bookmarks.filter(b => b.isPublic).length}
                </div>
                <div className="text-sm text-muted-foreground">공개 북마크</div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <div className="text-2xl font-bold text-purple-600">{CATEGORIES.length - 1}</div>
                <div className="text-sm text-muted-foreground">카테고리</div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <div className="text-2xl font-bold text-orange-600">
                  {viewCount !== null ? viewCount : '--'}
                </div>
                <div className="text-sm text-muted-foreground">이번 주 조회수</div>
              </div>
            </div>

            {/* 북마크 그리드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredBookmarks.map((bookmark) => (
                <BookmarkCard key={bookmark.id} bookmark={bookmark} />
              ))}
            </div>

            {filteredBookmarks.length === 0 && (
              <div className="text-center py-12">
                <div className="text-muted-foreground mb-4">검색 결과가 없습니다</div>
                <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  첫 번째 북마크 추가하기
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>

      <AddBookmarkModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={(newBookmark: Bookmark) => {
          setBookmarks([...bookmarks, { ...newBookmark, id: Date.now() }]);
          setIsAddModalOpen(false);
        }}
      />
    </div>
  );
};

export default Index;
