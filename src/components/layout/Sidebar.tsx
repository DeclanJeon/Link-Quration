// src/components/layout/Sidebar.tsx
import { useState, useEffect, useMemo } from "react";
import { 
  Home, Bookmark, Tag, Share2, TrendingUp, Settings, Users, 
  Sparkles, ChevronDown, ChevronRight, Plus, BarChart3,
  Folder, FolderOpen, Hash
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useCategoryManagement } from "@/services/categoryService";

interface SidebarProps {
  isOpen: boolean;
  categories: readonly string[];
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
}

interface MenuItem {
  icon: React.ElementType;
  label: string;
  count: number | null;
  href?: string;
  badge?: 'new' | 'beta' | null;
}

const menuItems: MenuItem[] = [
  { icon: Home, label: "홈", count: null },
  { icon: Bookmark, label: "내 북마크", count: null }, // 동적으로 계산
];

// 카테고리별 아이콘 매핑
const categoryIcons: Record<string, React.ElementType> = {
  '전체': Folder,
  '개발': Hash,
  '디자인': Tag,
  'AI/머신러닝': Sparkles,
  '비즈니스': BarChart3,
  '교육': Bookmark,
  '뉴스': TrendingUp,
  '도구/생산성': Settings,
  '미디어': Share2,
  '기타': FolderOpen,
};

const Sidebar = ({ isOpen, categories: propCategories, selectedCategory, onCategorySelect }: SidebarProps) => {
  const { bookmarks } = useBookmarks();
  const { categories, dynamicCategories, updateCategories } = useCategoryManagement();
  const [isSystemCategoriesOpen, setIsSystemCategoriesOpen] = useState(true);
  const [isDynamicCategoriesOpen, setIsDynamicCategoriesOpen] = useState(true);
  
  // 북마크 수 계산
  const bookmarkCount = useMemo(() => bookmarks.length, [bookmarks]);
  
  // 카테고리별 북마크 수 계산
  const categoryStats = useMemo(() => {
    const stats = new Map<string, number>();
    
    bookmarks.forEach(bookmark => {
      const category = bookmark.category || '기타';
      stats.set(category, (stats.get(category) || 0) + 1);
    });
    
    return stats;
  }, [bookmarks]);

  // 동적 카테고리 업데이트
  useEffect(() => {
    if (bookmarks.length > 0) {
      updateCategories(bookmarks);
    }
  }, [bookmarks, updateCategories]);

  // 시스템 카테고리와 동적 카테고리 분리
  const systemCategories = useMemo(() => {
    const baseCategories = ['전체', '개발', '디자인', 'AI/머신러닝', '비즈니스', '교육', '뉴스', '도구/생산성', '미디어', '기타'];
    return categories.filter(cat => baseCategories.includes(cat));
  }, [categories]);

  const autoDynamicCategories = useMemo(() => {
    return dynamicCategories.filter(cat => cat.isAuto);
  }, [dynamicCategories]);

  if (!isOpen) return null;

  return (
    <TooltipProvider>
      <aside className="fixed left-0 top-16 w-64 h-[calc(100vh-4rem)] bg-white dark:bg-gray-900 border-r border-slate-200 dark:border-gray-800 shadow-sm z-40 flex flex-col">
        <ScrollArea className="flex-1">
          <div className="p-4">
            {/* 네비게이션 메뉴 */}
            <nav className="space-y-1 mb-6">
              {menuItems.map((item) => (
                <Tooltip key={item.label} delayDuration={300}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start gap-3 h-10 relative",
                        item.label === "내 북마크" && "font-medium"
                      )}
                    >
                      <item.icon className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.label === "내 북마크" && bookmarkCount > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {bookmarkCount}
                        </Badge>
                      )}
                      {item.count !== null && item.label !== "내 북마크" && (
                        <Badge variant="secondary" className="text-xs">
                          {item.count}
                        </Badge>
                      )}
                      {item.badge && (
                        <Badge 
                          variant={item.badge === 'new' ? 'default' : 'outline'} 
                          className="text-xs ml-1 px-1.5 py-0"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{item.label} 보기</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </nav>

            <Separator className="my-4" />

            {/* 시스템 카테고리 섹션 */}
            <Collapsible 
              open={isSystemCategoriesOpen} 
              onOpenChange={setIsSystemCategoriesOpen}
              className="mb-4"
            >
              <div className="flex items-center justify-between mb-3">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-0 h-auto hover:bg-transparent">
                    <div className="flex items-center gap-2">
                      {isSystemCategoriesOpen ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        카테고리
                      </h3>
                    </div>
                  </Button>
                </CollapsibleTrigger>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              
              <CollapsibleContent>
                <div className="space-y-1">
                  {systemCategories.map((category) => {
                    const Icon = categoryIcons[category] || Folder;
                    const count = category === '전체' ? bookmarkCount : (categoryStats.get(category) || 0);
                    const isActive = selectedCategory === category;
                    
                    return (
                      <Tooltip key={category} delayDuration={300}>
                        <TooltipTrigger asChild>
                          <Button
                            variant={isActive ? "secondary" : "ghost"}
                            className={cn(
                              "w-full justify-start text-sm h-9 px-2 group",
                              isActive && "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                            )}
                            onClick={() => onCategorySelect(category)}
                          >
                            <Icon className={cn(
                              "h-4 w-4 mr-2 shrink-0",
                              isActive ? "text-blue-600" : "text-slate-400",
                              "group-hover:text-slate-600 dark:group-hover:text-slate-300"
                            )} />
                            <span className="flex-1 text-left truncate">{category}</span>
                            {count > 0 && (
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "text-xs h-5 px-1.5",
                                  isActive && "border-blue-300 text-blue-700"
                                )}
                              >
                                {count}
                              </Badge>
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p>{category} ({count}개)</p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* 동적 카테고리 섹션 */}
            {autoDynamicCategories.length > 0 && (
              <>
                <Separator className="my-4" />
                
                <Collapsible 
                  open={isDynamicCategoriesOpen} 
                  onOpenChange={setIsDynamicCategoriesOpen}
                >
                  <div className="flex items-center justify-between mb-3">
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="p-0 h-auto hover:bg-transparent">
                        <div className="flex items-center gap-2">
                          {isDynamicCategoriesOpen ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            자동 생성 카테고리
                          </h3>
                          <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                        </div>
                      </Button>
                    </CollapsibleTrigger>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="text-xs px-1.5">
                          {autoDynamicCategories.length}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>태그 분석으로 자동 생성된 카테고리</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  
                  <CollapsibleContent>
                    <div className="space-y-1">
                      {autoDynamicCategories.map((category) => {
                        const isActive = selectedCategory === category.name;
                        
                        return (
                          <Tooltip key={category.name} delayDuration={300}>
                            <TooltipTrigger asChild>
                              <Button
                                variant={isActive ? "secondary" : "ghost"}
                                className={cn(
                                  "w-full justify-start text-sm h-9 px-2 group",
                                  isActive && "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300"
                                )}
                                onClick={() => onCategorySelect(category.name)}
                              >
                                <div className="w-4 h-4 mr-2 flex items-center justify-center">
                                  <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                                </div>
                                <span className="flex-1 text-left truncate">
                                  {category.name}
                                </span>
                                <Badge 
                                  variant="outline" 
                                  className={cn(
                                    "text-xs h-5 px-1.5",
                                    isActive && "border-purple-300 text-purple-700"
                                  )}
                                >
                                  {category.count}
                                </Badge>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-xs">
                              <div>
                                <p className="font-medium">{category.name}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  관련 태그: {category.tags.slice(0, 3).join(', ')}
                                  {category.tags.length > 3 && ` 외 ${category.tags.length - 3}개`}
                                </p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </>
            )}

            <Separator className="my-4" />

            {/* 설정 */}
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start gap-3 h-10"
                  onClick={() => window.location.href = '/settings'}
                >
                  <Settings className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                  설정
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>앱 설정 및 AI 모델 관리</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </ScrollArea>

        {/* 하단 상태 표시 */}
        <div className="p-4 border-t border-slate-200 dark:border-gray-800 bg-slate-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <BarChart3 className="h-3 w-3" />
              총 {bookmarkCount}개 북마크
            </span>
            {autoDynamicCategories.length > 0 && (
              <span className="flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-purple-500" />
                AI 카테고리
              </span>
            )}
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
};

export default Sidebar;
