"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { 
  Plus, Search, Filter, Share2, TrendingUp, Brain, Settings, 
  X, Grid, List, ArrowUpDown, CheckSquare, Trash2, FolderPlus,
  Download, MoreVertical, Eye, Clock, Calendar, Tag, Hash,
  FileText, Upload, Loader2, CheckCircle, AlertCircle
} from "lucide-react";
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
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import useDebounce from "@/hooks/useDebounce";

// 리스트 뷰 아이템 컴포넌트
const BookmarkListItem = ({ 
  bookmark, 
  onClick, 
  isSelectable, 
  isSelected, 
  onSelect 
}: {
  bookmark: Bookmark;
  onClick: () => void;
  isSelectable?: boolean;
  isSelected?: boolean;
  onSelect?: (selected: boolean) => void;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="group relative bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 hover:shadow-md transition-all"
    >
      <div className="flex items-start gap-4">
        {isSelectable && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect?.(e.target.checked)}
            className="mt-1 rounded border-gray-300"
            onClick={(e) => e.stopPropagation()}
          />
        )}
        
        {bookmark.image && (
          <img
            src={bookmark.image}
            alt={bookmark.title}
            className="w-20 h-20 object-cover rounded"
          />
        )}
        
        <div className="flex-1 cursor-pointer" onClick={onClick}>
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-blue-600 transition-colors">
                {bookmark.title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {bookmark.description}
              </p>
            </div>
            
            <Badge variant="secondary" className="ml-2 shrink-0">
              {bookmark.category}
            </Badge>
          </div>
          
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(bookmark.createdAt).toLocaleDateString()}
            </span>
            {bookmark.readTime && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {bookmark.readTime}
              </span>
            )}
            {bookmark.tags.length > 0 && (
              <div className="flex items-center gap-1">
                <Tag className="h-3 w-3" />
                {bookmark.tags.slice(0, 3).map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs py-0 px-1">
                    {tag}
                  </Badge>
                ))}
                {bookmark.tags.length > 3 && (
                  <span className="text-xs">+{bookmark.tags.length - 3}</span>
                )}
              </div>
            )}
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onClick()}>
              <Eye className="h-4 w-4 mr-2" />
              상세보기
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Share2 className="h-4 w-4 mr-2" />
              공유하기
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
              <Trash2 className="h-4 w-4 mr-2" />
              삭제
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
};

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

  const { toast } = useToast();

  // 상태 관리
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedBookmark, setSelectedBookmark] = useState<Bookmark | null>(null);
  const [selectedBookmarkIndex, setSelectedBookmarkIndex] = useState<number>(-1);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [viewCount, setViewCount] = useState<number | null>(null);
  
  // 개선된 상태들
  const [sortBy, setSortBy] = useState<'latest' | 'oldest' | 'popular' | 'alphabetical'>('latest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedBookmarks, setSelectedBookmarks] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // 디바운스된 검색어
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

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

      // 저장된 뷰 모드 복원
      const savedViewMode = localStorage.getItem('bookmark_view_mode');
      if (savedViewMode === 'list' || savedViewMode === 'grid') {
        setViewMode(savedViewMode);
      }
    }
  }, []);

  // 뷰 모드 저장
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('bookmark_view_mode', viewMode);
    }
  }, [viewMode]);

  // 모든 태그 추출
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    bookmarks.forEach(bookmark => {
      bookmark.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [bookmarks]);

  // 필터링 및 정렬된 북마크
  const filteredAndSortedBookmarks = useMemo(() => {
    let filtered = bookmarks.filter(bookmark => {
      // 카테고리 필터
      const matchesCategory = selectedCategory === "전체" || bookmark.category === selectedCategory;
      
      // 검색어 필터
      const matchesSearch = !debouncedSearchQuery || 
        bookmark.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        bookmark.description.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        bookmark.tags?.some(tag => tag.toLowerCase().includes(debouncedSearchQuery.toLowerCase()));
      
      // 태그 필터
      const matchesTags = selectedTags.length === 0 || 
        selectedTags.every(tag => bookmark.tags.includes(tag));
      
      // 날짜 필터
      const bookmarkDate = new Date(bookmark.createdAt);
      const matchesDateRange = (!dateRange.start || bookmarkDate >= dateRange.start) &&
                               (!dateRange.end || bookmarkDate <= dateRange.end);
      
      return matchesCategory && matchesSearch && matchesTags && matchesDateRange;
    });

    // 정렬 적용
    switch(sortBy) {
      case 'latest':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'alphabetical':
        filtered.sort((a, b) => a.title.localeCompare(b.title, 'ko'));
        break;
      case 'popular':
        // 조회수나 좋아요 수 등의 메트릭이 있다면 여기서 정렬
        break;
    }

    return filtered;
  }, [bookmarks, selectedCategory, debouncedSearchQuery, sortBy, selectedTags, dateRange]);

  // 키보드 단축키
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl/Cmd 조합
      if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
          case 'k':
            e.preventDefault();
            document.getElementById('search-input')?.focus();
            break;
          case 'n':
            e.preventDefault();
            setIsAddModalOpen(true);
            break;
          case 'a':
            if (isSelectionMode) {
              e.preventDefault();
              setSelectedBookmarks(new Set(filteredAndSortedBookmarks.map(b => b.id)));
            }
            break;
          case '/':
            e.preventDefault();
            setShowAdvancedSearch(!showAdvancedSearch);
            break;
        }
      }
      
      // ESC 키로 선택 모드 종료
      if (e.key === 'Escape' && isSelectionMode) {
        setIsSelectionMode(false);
        setSelectedBookmarks(new Set());
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isSelectionMode, filteredAndSortedBookmarks, showAdvancedSearch]);

  // 북마크 클릭 핸들러
  const handleBookmarkClick = useCallback(async (bookmark: Bookmark) => {
    if (isSelectionMode) {
      const newSelection = new Set(selectedBookmarks);
      if (newSelection.has(bookmark.id)) {
        newSelection.delete(bookmark.id);
      } else {
        newSelection.add(bookmark.id);
      }
      setSelectedBookmarks(newSelection);
      return;
    }

    const index = filteredAndSortedBookmarks.findIndex(b => b.id === bookmark.id);
    setSelectedBookmark(bookmark);
    setSelectedBookmarkIndex(index);
    setIsDetailModalOpen(true);
    
    if (typeof window !== 'undefined' && bookmark.id) {
      const url = new URL(window.location.href);
      url.searchParams.set('bookmark', bookmark.id.toString());
      window.history.pushState({}, '', url.toString());
    }
  }, [filteredAndSortedBookmarks, isSelectionMode, selectedBookmarks]);

  // 네비게이션 핸들러
  const handleNavigate = useCallback((direction: 'prev' | 'next') => {
    if (!selectedBookmark) return;
    
    const newIndex = direction === 'prev' ? selectedBookmarkIndex - 1 : selectedBookmarkIndex + 1;
    
    if (newIndex >= 0 && newIndex < filteredAndSortedBookmarks.length) {
      const newBookmark = filteredAndSortedBookmarks[newIndex];
      setSelectedBookmark(newBookmark);
      setSelectedBookmarkIndex(newIndex);
      
      if (typeof window !== 'undefined' && newBookmark.id) {
        const url = new URL(window.location.href);
        url.searchParams.set('bookmark', newBookmark.id.toString());
        window.history.pushState({}, '', url.toString());
      }
    }
  }, [selectedBookmark, selectedBookmarkIndex, filteredAndSortedBookmarks]);

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
    toast({
      title: "준비 중",
      description: "북마크 수정 기능은 곧 추가될 예정입니다.",
    });
  }, [toast]);

  // 북마크 삭제 핸들러
  const handleDeleteBookmark = useCallback(async (id: string) => {
    if (typeof window !== 'undefined' && window.confirm('정말 이 북마크를 삭제하시겠습니까?')) {
      try {
        await deleteBookmark(id);
        toast({
          title: "북마크 삭제됨",
          description: "북마크가 성공적으로 삭제되었습니다.",
        });
        setIsDetailModalOpen(false);
        
        const url = new URL(window.location.href);
        url.searchParams.delete('bookmark');
        window.history.pushState({}, '', url.toString());
      } catch (error) {
        console.error('북마크 삭제 실패:', error);
        toast({
          title: "삭제 실패",
          description: "북마크 삭제에 실패했습니다.",
          variant: "destructive",
        });
      }
    }
  }, [deleteBookmark, toast]);

  // 북마크 추가 핸들러
  const handleAddBookmark = useCallback(async (newBookmark: CreateBookmarkInput) => {
    try {
      await addBookmark(newBookmark);
      toast({
        title: "북마크 추가됨",
        description: "새 북마크가 성공적으로 추가되었습니다.",
      });
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('북마크 추가 실패:', error);
      toast({
        title: "추가 실패",
        description: "북마크 추가에 실패했습니다.",
        variant: "destructive",
      });
    }
  }, [addBookmark, toast]);

  // 일괄 삭제 핸들러
  const handleBulkDelete = useCallback(async () => {
    if (selectedBookmarks.size === 0) return;
    
    const confirmMessage = `선택한 ${selectedBookmarks.size}개의 북마크를 삭제하시겠습니까?`;
    if (window.confirm(confirmMessage)) {
      try {
        // 실제로는 bulk delete API를 사용하는 것이 좋음
        for (const id of selectedBookmarks) {
          await deleteBookmark(id);
        }
        
        toast({
          title: "북마크 삭제됨",
          description: `${selectedBookmarks.size}개의 북마크가 삭제되었습니다.`,
        });
        
        setSelectedBookmarks(new Set());
        setIsSelectionMode(false);
      } catch (error) {
        toast({
          title: "삭제 실패",
          description: "일부 북마크 삭제에 실패했습니다.",
          variant: "destructive",
        });
      }
    }
  }, [selectedBookmarks, deleteBookmark, toast]);

  // 북마크 내보내기
  const handleExport = useCallback(() => {
    const dataToExport = isSelectionMode && selectedBookmarks.size > 0
      ? bookmarks.filter(b => selectedBookmarks.has(b.id))
      : filteredAndSortedBookmarks;
    
    const jsonData = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookmarks_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "내보내기 완료",
      description: `${dataToExport.length}개의 북마크를 내보냈습니다.`,
    });
  }, [bookmarks, filteredAndSortedBookmarks, selectedBookmarks, isSelectionMode, toast]);

  // 북마크 가져오기
  const handleImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const importedBookmarks = JSON.parse(content);
        
        if (!Array.isArray(importedBookmarks)) {
          throw new Error('Invalid file format');
        }
        
        // 실제로는 각 북마크의 유효성을 검사하고 중복을 확인해야 함
        for (const bookmark of importedBookmarks) {
          await addBookmark(bookmark);
        }
        
        toast({
          title: "가져오기 완료",
          description: `${importedBookmarks.length}개의 북마크를 가져왔습니다.`,
        });
        
        refresh();
      } catch (error) {
        toast({
          title: "가져오기 실패",
          description: "파일 형식이 올바르지 않습니다.",
          variant: "destructive",
        });
      }
    };
    
    reader.readAsText(file);
    event.target.value = ''; // 같은 파일 재선택 가능하도록
  }, [addBookmark, refresh, toast]);

  // 로딩 상태 표시
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900">
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
          
          <main className={cn("flex-1 transition-all duration-300", sidebarOpen ? 'ml-64' : 'ml-0')}>
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900">
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
          
          <main className={cn("flex-1 transition-all duration-300", sidebarOpen ? 'ml-64' : 'ml-0')}>
            <div className="p-6">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
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
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900">
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
          
          <main className={cn("flex-1 transition-all duration-300", sidebarOpen ? 'ml-64' : 'ml-0')}>
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
                  <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
                    <Brain className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-700 dark:text-green-300">
                      🎉 AI 모델 ({selectedModel.name})이 설정되었습니다! 이제 스마트 북마크 기능을 사용할 수 있어요.
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {/* 검색 및 필터 섹션 */}
              <div className="mb-8 space-y-4">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search-input"
                      placeholder="북마크 검색... (Ctrl+K)"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-10 h-10 bg-white dark:bg-slate-800"
                    />
                    {searchQuery && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1 h-8 w-8 p-0"
                        onClick={() => setSearchQuery('')}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    {/* 고급 검색 토글 */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={showAdvancedSearch ? "default" : "outline"}
                          size="sm"
                          onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                        >
                          <Filter className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>고급 검색 (Ctrl+/)</p>
                      </TooltipContent>
                    </Tooltip>

                    {/* 뷰 모드 전환 */}
                    <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as 'grid' | 'list')}>
                      <ToggleGroupItem value="grid" aria-label="그리드 뷰">
                        <Grid className="h-4 w-4" />
                      </ToggleGroupItem>
                      <ToggleGroupItem value="list" aria-label="리스트 뷰">
                        <List className="h-4 w-4" />
                      </ToggleGroupItem>
                    </ToggleGroup>

                    {/* 정렬 드롭다운 */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                          <ArrowUpDown className="h-4 w-4" />
                          정렬
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuLabel>정렬 기준</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setSortBy('latest')}>
                          <Clock className="h-4 w-4 mr-2" />
                          최신순
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortBy('oldest')}>
                          <Calendar className="h-4 w-4 mr-2" />
                          오래된순
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortBy('alphabetical')}>
                          <FileText className="h-4 w-4 mr-2" />
                          가나다순
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* 다중 선택 모드 */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={isSelectionMode ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            setIsSelectionMode(!isSelectionMode);
                            setSelectedBookmarks(new Set());
                          }}
                        >
                          <CheckSquare className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>다중 선택 모드</p>
                      </TooltipContent>
                    </Tooltip>

                    {/* 더보기 메뉴 */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleExport}>
                          <Download className="h-4 w-4 mr-2" />
                          북마크 내보내기
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <label className="cursor-pointer">
                            <Upload className="h-4 w-4 mr-2" />
                            북마크 가져오기
                            <input
                              type="file"
                              accept=".json"
                              className="hidden"
                              onChange={handleImport}
                            />
                          </label>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* 고급 검색 옵션 */}
                <AnimatePresence>
                  {showAdvancedSearch && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-white dark:bg-slate-800 rounded-lg border p-4 space-y-4"
                    >
                      <div>
                        <label className="text-sm font-medium mb-2 block">태그 필터</label>
                        <div className="flex flex-wrap gap-2">
                          {allTags.map(tag => (
                            <Badge
                              key={tag}
                              variant={selectedTags.includes(tag) ? "default" : "outline"}
                              className="cursor-pointer"
                              onClick={() => {
                                if (selectedTags.includes(tag)) {
                                  setSelectedTags(selectedTags.filter(t => t !== tag));
                                } else {
                                  setSelectedTags([...selectedTags, tag]);
                                }
                              }}
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* 선택 모드 액션 바 */}
                {isSelectionMode && selectedBookmarks.size > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium">
                        {selectedBookmarks.size}개 선택됨
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedBookmarks(new Set(filteredAndSortedBookmarks.map(b => b.id)))}
                      >
                        전체 선택 (Ctrl+A)
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={handleBulkDelete}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        삭제
                      </Button>
                      <Button size="sm" variant="outline">
                        <FolderPlus className="h-4 w-4 mr-2" />
                        컬렉션에 추가
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleExport}>
                        <Download className="h-4 w-4 mr-2" />
                        내보내기
                      </Button>
                    </div>
                  </motion.div>
                )}
                
                {/* 카테고리 태그 */}
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((category) => (
                    <Badge
                      key={category}
                      variant={selectedCategory === category ? "default" : "secondary"}
                      className={cn(
                        "cursor-pointer transition-all duration-200",
                        selectedCategory === category 
                          ? "bg-blue-600 hover:bg-blue-700 text-white" 
                          : "hover:bg-slate-200 dark:hover:bg-slate-700"
                      )}
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* 통계 카드 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{bookmarks.length}</div>
                  <div className="text-sm text-muted-foreground">총 북마크</div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {bookmarks.filter(b => b.isPublic).length}
                  </div>
                  <div className="text-sm text-muted-foreground">공개 북마크</div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{CATEGORIES.length - 1}</div>
                  <div className="text-sm text-muted-foreground">카테고리</div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {bookmarks.reduce((total, bookmark) => total + (bookmark.viewCount || 0), 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">이번 주 조회수</div>
                </motion.div>
              </div>

              {/* 북마크 그리드/리스트 */}
              <AnimatePresence mode="wait">
                {viewMode === 'grid' ? (
                  <motion.div
                    key="grid"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  >
                    {filteredAndSortedBookmarks.map((bookmark, index) => (
                      <motion.div
                        key={bookmark.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="relative"
                      >
                        {isSelectionMode && (
                          <input
                            type="checkbox"
                            checked={selectedBookmarks.has(bookmark.id)}
                            onChange={(e) => {
                              const newSelection = new Set(selectedBookmarks);
                              if (e.target.checked) {
                                newSelection.add(bookmark.id);
                              } else {
                                newSelection.delete(bookmark.id);
                              }
                              setSelectedBookmarks(newSelection);
                            }}
                            className="absolute top-2 left-2 z-10 rounded"
                            onClick={(e) => e.stopPropagation()}
                          />
                        )}
                        <BookmarkCard 
                          bookmark={bookmark} 
                          onClick={() => handleBookmarkClick(bookmark)}
                          onEdit={handleEditBookmark}
                          onDelete={handleDeleteBookmark}
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    key="list"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-2"
                  >
                    {filteredAndSortedBookmarks.map((bookmark) => (
                      <BookmarkListItem
                        key={bookmark.id}
                        bookmark={bookmark}
                        onClick={() => handleBookmarkClick(bookmark)}
                        isSelectable={isSelectionMode}
                        isSelected={selectedBookmarks.has(bookmark.id)}
                        onSelect={(selected) => {
                          const newSelection = new Set(selectedBookmarks);
                          if (selected) {
                            newSelection.add(bookmark.id);
                          } else {
                            newSelection.delete(bookmark.id);
                          }
                          setSelectedBookmarks(newSelection);
                        }}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

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
                  hasNext={selectedBookmarkIndex < filteredAndSortedBookmarks.length - 1}
                />
              )}

              {filteredAndSortedBookmarks.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <div className="text-muted-foreground mb-4">
                    {searchQuery || selectedCategory !== "전체" || selectedTags.length > 0
                      ? "검색 결과가 없습니다" 
                      : "아직 북마크가 없습니다"}
                  </div>
                  {(!searchQuery && selectedCategory === "전체" && selectedTags.length === 0) && (
                    <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
                      <Plus className="h-4 w-4" />
                      첫 번째 북마크 추가하기
                    </Button>
                  )}
                </motion.div>
              )}
            </div>
          </main>
        </div>

        {/* 플로팅 액션 버튼 (모바일) */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="fixed bottom-6 right-6 rounded-full shadow-lg lg:hidden h-14 w-14"
              size="icon"
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus className="h-6 w-6" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>새 북마크 추가 (Ctrl+N)</p>
          </TooltipContent>
        </Tooltip>

        {/* 단축키 안내 */}
        <div className="fixed bottom-6 left-6 hidden lg:block">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-3 text-xs space-y-1 opacity-50 hover:opacity-100 transition-opacity">
            <div className="font-semibold mb-1">단축키</div>
            <div><kbd>Ctrl+K</kbd> 검색</div>
            <div><kbd>Ctrl+N</kbd> 새 북마크</div>
            <div><kbd>Ctrl+/</kbd> 고급 검색</div>
            {isSelectionMode && <div><kbd>Ctrl+A</kbd> 전체 선택</div>}
          </div>
        </div>

        <AddBookmarkModal 
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddBookmark}
        />
      </div>
    </TooltipProvider>
  );
};

export default Index;