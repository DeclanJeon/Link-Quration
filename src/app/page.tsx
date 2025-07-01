"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Filter, Share2, TrendingUp, Brain, Settings } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bookmark } from "@/types/bookmark";
import { Badge } from "@/components/ui/badge";
import BookmarkCard from "@/components/card/BookmarkCard";
import AddBookmarkModal from "@/components/modal/AddBookmarkModal";
import { BookmarkDetailModal } from "@/components/modal/BookmarkDetailModal";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { CATEGORIES } from "@/mock/categories";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useBookmarks } from "@/hooks/useBookmarks";
import { CreateBookmarkInput } from "@/lib/db/models/Bookmark";

const Index = () => {
  // IndexedDB Hook 사용
  const { 
    bookmarks, 
    loading,  
    error, 
    addBookmark, 
    updateBookmark, 
    deleteBookmark,
    refresh 
  } = useBookmarks();

  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedBookmark, setSelectedBookmark] = useState<Bookmark | null>(null);
  const [selectedBookmarkIndex, setSelectedBookmarkIndex] = useState<number>(-1);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [viewCount, setViewCount] = useState<number | null>(null);

  // AI 설정 상태 확인
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<any>(null);

  // 클라이언트 사이드에서만 실행되는 효과
  useEffect(() => {
    if (typeof window !== 'undefined') {
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
    }
  }, []);

  // 필터링된 북마크
  const filteredBookmarks = bookmarks.filter(bookmark => {
    const matchesCategory = selectedCategory === "전체" || bookmark.category === selectedCategory;
    const matchesSearch = bookmark.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         bookmark.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (bookmark.tags && bookmark.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesCategory && matchesSearch;
  });

  // 북마크 클릭 핸들러
  const handleBookmarkClick = useCallback(async (bookmark: Bookmark) => {
    const index = filteredBookmarks.findIndex(b => b.id === bookmark.id);
    setSelectedBookmark(bookmark);
    setSelectedBookmarkIndex(index);
    setIsDetailModalOpen(true);
    
    if (typeof window !== 'undefined' && bookmark.id) {
      const url = new URL(window.location.href);
      url.searchParams.set('bookmark', bookmark.id.toString());
      window.history.pushState({}, '', url.toString());
    }
  }, [filteredBookmarks]);

  // 네비게이션 핸들러
  const handleNavigate = useCallback((direction: 'prev' | 'next') => {
    if (!selectedBookmark) return;
    
    const newIndex = direction === 'prev' ? selectedBookmarkIndex - 1 : selectedBookmarkIndex + 1;
    
    if (newIndex >= 0 && newIndex < filteredBookmarks.length) {
      const newBookmark = filteredBookmarks[newIndex];
      setSelectedBookmark(newBookmark);
      setSelectedBookmarkIndex(newIndex);
      
      if (typeof window !== 'undefined' && newBookmark.id) {
        const url = new URL(window.location.href);
        url.searchParams.set('bookmark', newBookmark.id.toString());
        window.history.pushState({}, '', url.toString());
      }
    }
  }, [selectedBookmark, selectedBookmarkIndex, filteredBookmarks]);

  // URL에서 북마크 ID를 읽어 상세 보기 열기
  useEffect(() => {
    if (typeof window === 'undefined' || loading) return;
    
    const handlePopState = async () => {
      const params = new URLSearchParams(window.location.search);
      const bookmarkId = params.get('bookmark');
      
      if (bookmarkId) {
        const bookmark = bookmarks.find(b => b.id === bookmarkId);
        if (bookmark) {
          setSelectedBookmark(bookmark);
          setIsDetailModalOpen(true);
        }
      } else {
        setIsDetailModalOpen(false);
      }
    };

    handlePopState();
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [bookmarks, loading]);

  // 북마크 수정 핸들러
  const handleEditBookmark = useCallback((id: string) => {
    console.log('Edit bookmark:', id);
    // TODO: 수정 모달 구현
  }, []);

  // 북마크 삭제 핸들러
  const handleDeleteBookmark = useCallback(async (id: string) => {
    if (typeof window !== 'undefined' && window.confirm('정말 이 북마크를 삭제하시겠습니까?')) {
      try {
        await deleteBookmark(id);
        setIsDetailModalOpen(false);
        
        const url = new URL(window.location.href);
        url.searchParams.delete('bookmark');
        window.history.pushState({}, '', url.toString());
      } catch (error) {
        console.error('북마크 삭제 실패:', error);
        alert('북마크 삭제에 실패했습니다.');
      }
    }
  }, [deleteBookmark]);

  // 북마크 추가 핸들러
  const handleAddBookmark = useCallback(async (newBookmark: CreateBookmarkInput) => {
    try {
      await addBookmark(newBookmark);
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('북마크 추가 실패:', error);
      alert('북마크 추가에 실패했습니다.');
    }
  }, [addBookmark]);

  // 로딩 상태 표시
  if (loading) {
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="h-64 rounded-lg" />
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // 에러 상태 표시
  if (error) {
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
              <Alert variant="destructive">
                <AlertDescription>
                  북마크를 불러오는 중 오류가 발생했습니다. 페이지를 새로고침해주세요.
                </AlertDescription>
              </Alert>
            </div>
          </main>
        </div>
      </div>
    );
  }

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
            {/* AI 설정 안내 */}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredBookmarks.map((bookmark) => (
                <div 
                  key={bookmark.id} 
                  id={`bookmark-${bookmark.id}`}
                  className="hover:opacity-90 transition-opacity"
                >
                  <BookmarkCard 
                    bookmark={bookmark} 
                    onClick={() => handleBookmarkClick(bookmark)}
                  />
                </div>
              ))}
            </div>

            {/* 북마크 상세 모달 */}
            {selectedBookmark && (
              <BookmarkDetailModal
                bookmark={selectedBookmark}
                isOpen={isDetailModalOpen}
                onClose={() => {
                  setIsDetailModalOpen(false);
                  window.history.pushState({}, '', window.location.pathname);
                }}
                onEdit={handleEditBookmark}
                onDelete={handleDeleteBookmark}
                onNavigate={handleNavigate}
                hasPrevious={selectedBookmarkIndex > 0}
                hasNext={selectedBookmarkIndex < filteredBookmarks.length - 1}
              />
            )}

            {filteredBookmarks.length === 0 && (
              <div className="text-center py-12">
                <div className="text-muted-foreground mb-4">
                  {searchQuery || selectedCategory !== "전체" 
                    ? "검색 결과가 없습니다" 
                    : "아직 북마크가 없습니다"}
                </div>
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
        onAdd={handleAddBookmark}
      />
    </div>
  );
};

export default Index;
