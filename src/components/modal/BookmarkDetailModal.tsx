// src/components/modal/BookmarkDetailModal.tsx
"use client"

import { useEffect, useState, memo, useCallback, useMemo, useRef } from "react";
import { 
  X, ExternalLink, Edit, Trash2, Clock, Tag, Share2, ChevronLeft, 
  ChevronRight, Globe, Calendar, User, BookOpen, Hash, 
  Sparkles, TrendingUp, CheckCircle, Quote, Target, Lightbulb,
  Video, Youtube, Music, Headphones, Radio, Podcast, Play,
  BarChart3, Zap, MessageSquare, Star, ArrowRight, Copy,
  Download, Heart, MessageCircle, Info, FileText, Image as ImageIcon,
  Eye, AlertCircle, Bookmark as BookmarkIcon, Check, Loader2,
  Link2, FolderOpen, MoreVertical, Flag, Archive, Maximize2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
// Move CollapsibleSection and CompactTimelineSegment to the bottom of the file
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Bookmark as BookmarkType, AIAnalysisResult, MediaAnalysisData, ExtractedContent } from "@/types/bookmark";
import { format, formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import BookmarkCard from "@/components/card/BookmarkCard";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// 플랫폼 아이콘 매핑
const PLATFORM_ICONS = {
  youtube: Youtube,
  vimeo: Video,
  spotify: Music,
  soundcloud: Headphones,
  podcast: Radio,
  apple_podcasts: Podcast,
  google_podcasts: Podcast,
  twitch: Video,
  instagram: Video,
  tiktok: Video,
  generic: Globe
} as const;

const PLATFORM_COLORS = {
  youtube: 'text-red-600 dark:text-red-500',
  vimeo: 'text-blue-600 dark:text-blue-500',
  spotify: 'text-green-600 dark:text-green-500',
  soundcloud: 'text-orange-600 dark:text-orange-500',
  podcast: 'text-purple-600 dark:text-purple-500',
  apple_podcasts: 'text-pink-600 dark:text-pink-500',
  google_podcasts: 'text-blue-400 dark:text-blue-400',
  twitch: 'text-purple-500 dark:text-purple-400',
  instagram: 'text-pink-500 dark:text-pink-400',
  tiktok: 'text-black dark:text-white',
  generic: 'text-gray-600 dark:text-gray-400'
} as const;

interface BookmarkDetailModalProps {
  bookmark: BookmarkType | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => Promise<void>;
  onNavigate: (direction: 'prev' | 'next') => void;
  hasPrevious: boolean;
  hasNext: boolean;
}

export const BookmarkDetailModal = memo(({
  bookmark,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onNavigate,
  hasPrevious,
  hasNext,
}: BookmarkDetailModalProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [showCopyTooltip, setShowCopyTooltip] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['ai-summary', 'timeline']));
  const [checkedActions, setCheckedActions] = useState<Set<number>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  
  const progressValue = 'readingProgress' in (bookmark || {}) 
    ? (bookmark as any).readingProgress 
    : 0;

  // 미디어 플랫폼 감지
  const mediaDetection = useMemo(() => {
    if (!bookmark?.url) return null;
    
    if (bookmark.mediaAnalysis?.platform) {
      return {
        isMedia: true,
        platform: bookmark.mediaAnalysis.platform,
        mediaType: bookmark.mediaAnalysis.mediaType || '미디어'
      } as const;
    }
    
    try {
      const url = new URL(bookmark.url);
      const hostname = url.hostname.toLowerCase();
      
      if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
        return { isMedia: true, platform: 'youtube', mediaType: '동영상' } as const;
      }
      if (hostname.includes('vimeo.com')) {
        return { isMedia: true, platform: 'vimeo', mediaType: '동영상' } as const;
      }
      if (hostname.includes('spotify.com')) {
        return { isMedia: true, platform: 'spotify', mediaType: '음악' } as const;
      }
      if (hostname.includes('soundcloud.com')) {
        return { isMedia: true, platform: 'soundcloud', mediaType: '음악' } as const;
      }
    } catch (e) {
      console.error('URL 파싱 오류:', e);
    }
    
    return null;
  }, [bookmark]);



  // URL 복사
  const handleCopyUrl = useCallback(() => {
    if (!bookmark?.url) return;
    
    navigator.clipboard.writeText(bookmark.url).catch(err => {
      console.error('URL 복사 실패:', err);
    });
    
    setShowCopyTooltip(true);
    const timer = setTimeout(() => setShowCopyTooltip(false), 2000);
    return () => clearTimeout(timer);
  }, [bookmark?.url]);

  // 삭제 확인
  const handleDelete = useCallback(async () => {
    if (!bookmark || isDeleting) return;
    
    if (window.confirm('정말로 이 북마크를 삭제하시겠습니까?')) {
      setIsDeleting(true);
      try {
        await onDelete(bookmark.id);
        onClose();
      } catch (error) {
        console.error('삭제 실패:', error);
        setIsDeleting(false);
      }
    }
  }, [bookmark, isDeleting, onDelete, onClose]);

  // 키보드 네비게이션 핸들러
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Ctrl/Cmd 조합
    if (e.metaKey || e.ctrlKey) {
      switch(e.key) {
        case 'e':
          e.preventDefault();
          if (bookmark) onEdit(bookmark.id);
          break;
        case 'd':
          e.preventDefault();
          handleDelete();
          break;
        case 'c':
          e.preventDefault();
          handleCopyUrl();
          break;
      }
      return;
    }

    // 단일 키
    switch(e.key) {
      case 'ArrowLeft':
        if (hasPrevious) onNavigate('prev');
        break;
      case 'ArrowRight':
        if (hasNext) onNavigate('next');
        break;
      case 'Escape':
        onClose();
        break;
      case 'l':
        setIsLiked(prev => !prev);
        break;
      case 'f':
        setIsFullscreen(prev => !prev);
        break;
    }
  }, [bookmark, hasPrevious, hasNext, onNavigate, onClose, onEdit, handleDelete, handleCopyUrl]);

  // 공유하기
  const handleShare = useCallback(async () => {
    if (!bookmark) return;
    
    try {
      if ('share' in navigator && typeof navigator.share === 'function') {
        await navigator.share({
          title: bookmark.title,
          text: bookmark.description || '',
          url: bookmark.url,
        });
      } else {
        handleCopyUrl();
      }
    } catch (error) {
      console.error('공유 실패:', error);
    }
  }, [bookmark, handleCopyUrl]);

  // 플랫폼 아이콘 가져오기
  const getPlatformIcon = useCallback((platform: string) => {
    const IconComponent = PLATFORM_ICONS[platform as keyof typeof PLATFORM_ICONS] || Globe;
    const colorClass = PLATFORM_COLORS[platform as keyof typeof PLATFORM_COLORS] || 'text-gray-600 dark:text-gray-400';
    return <IconComponent className={cn("h-5 w-5", colorClass)} />;
  }, []);

  // 섹션 토글
  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  }, []);

  // 액션 아이템 체크 토글
  const toggleActionCheck = useCallback((index: number) => {
    setCheckedActions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  }, []);

  // 모든 섹션 펼치기/접기
  const toggleAllSections = useCallback(() => {
    const allSections = ['ai-summary', 'timeline', 'reading-goals', 'quotes'];
    if (expandedSections.size === allSections.length) {
      setExpandedSections(new Set());
    } else {
      setExpandedSections(new Set(allSections));
    }
  }, [expandedSections]);

  // 북마크 변경 시 상태 초기화
  useEffect(() => {
    if (bookmark) {
      setImageError(false);
      setCheckedActions(new Set());
    }
  }, [bookmark]);

  // 키보드 이벤트 리스너 등록
  useEffect(() => {
    if (!isOpen) return;
    
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // TypeScript에서 React.KeyboardEvent로 타입 단언
      const reactEvent = e as unknown as React.KeyboardEvent;
      // 필요한 경우 여기서 이벤트 객체에 대한 추가 속성 설정 가능
      Object.defineProperty(reactEvent, 'target', {
        writable: false,
        value: e.target
      });
      
      handleKeyDown(reactEvent);
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  // 북마크가 없으면 렌더링하지 않음
  if (!bookmark) {
    return null;
  }

  const hasAIAnalysis = Boolean(bookmark.aiAnalysis?.summary);
  const hasMediaAnalysis = Boolean(bookmark.mediaAnalysis && mediaDetection?.isMedia);
  const hasExtractedContent = Boolean(bookmark.extractedData?.textContent);

  return (
    <TooltipProvider>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent 
          ref={modalRef}
          className={cn(
            "flex flex-col p-0 [&>button]:hidden transition-all duration-300",
            isFullscreen 
              ? "max-w-full w-full h-full max-h-full rounded-none" 
              : "max-w-5xl max-h-[95vh]"
          )}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          
          <DialogTitle className="sr-only">북마크 상세 정보</DialogTitle>
          
          {/* 로딩 상태 */}
          <AnimatePresence>
            {isDeleting && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
              >
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <p className="text-sm text-muted-foreground">삭제 중...</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 헤더 - 개선됨 */}
          <div className="p-6 pb-4 border-b bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950/50">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  {mediaDetection && getPlatformIcon(mediaDetection.platform)}
                  <h2 className="text-2xl font-bold line-clamp-2">{bookmark.title}</h2>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(bookmark.createdAt), 'yyyy년 MM월 dd일', { locale: ko })}
                  </span>
                  {bookmark.readTime && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {bookmark.readTime}
                    </span>
                  )}
                  <Badge 
                    variant="secondary" 
                    className="gap-1 bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/70 transition-colors cursor-pointer"
                  >
                    <Hash className="h-3 w-3" />
                    {bookmark.category}
                  </Badge>
                  {bookmark.isArchived && (
                    <Badge variant="outline" className="gap-1">
                      <Archive className="h-3 w-3" />
                      보관됨
                    </Badge>
                  )}
                </div>
              </div>

              {/* 액션 버튼 그룹 - 개선됨 */}
              <div className="flex gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleCopyUrl}
                      className="h-9 w-9 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      {showCopyTooltip ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{showCopyTooltip ? '복사되었습니다!' : 'URL 복사 (Ctrl+C)'}</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(bookmark.id)}
                      className="h-9 w-9 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>편집 (Ctrl+E)</p>
                  </TooltipContent>
                </Tooltip>

                {/* 더보기 메뉴 */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={toggleAllSections}>
                      <FolderOpen className="h-4 w-4 mr-2" />
                      모든 섹션 {expandedSections.size >= 3 ? '접기' : '펼치기'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsFullscreen(!isFullscreen)}>
                      <Maximize2 className="h-4 w-4 mr-2" />
                      {isFullscreen ? '일반 모드' : '전체 화면'} (F)
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Archive className="h-4 w-4 mr-2" />
                      보관하기
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Flag className="h-4 w-4 mr-2" />
                      신고하기
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={handleDelete}
                      className="text-red-600 dark:text-red-400"
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      삭제 (Ctrl+D)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onClose}
                      className="h-9 w-9 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>닫기 (ESC)</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* 진행률 표시 (읽기 진행률이 있는 경우) */}
            {('readingProgress' in bookmark) && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>읽기 진행률</span>
                  <span>{Math.round((bookmark as any).readingProgress)}%</span>
                </div>
                <Progress value={progressValue} className="h-2" />
              </div>
            )}
          </div>

          {/* 메인 콘텐츠 - 스크롤 가능 영역 */}
          <ScrollArea className="flex-1 overflow-auto">
            <div className="p-6 space-y-6">
              {/* 썸네일 & 설명 섹션 */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  {/* 설명 */}
                  {bookmark.description && (
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                          {bookmark.description}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {/* AI 요약 - 우선 표시 */}
                  {hasAIAnalysis && (
                    <CollapsibleSection
                      id="ai-summary"
                      title="AI 스마트 요약"
                      icon={Sparkles}
                      iconColor="text-purple-600 dark:text-purple-500"
                      isExpanded={expandedSections.has('ai-summary')}
                      onToggle={() => toggleSection('ai-summary')}
                      badge={
                        <Badge variant="secondary" className="ml-2 text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                          {bookmark.aiAnalysis?.aiModel || 'AI'}
                        </Badge>
                      }
                    >
                      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/10 dark:to-blue-900/10 p-4 rounded-lg">
                        <p className="text-purple-900 dark:text-purple-100 leading-relaxed whitespace-pre-wrap">
                          {bookmark.aiAnalysis?.summary}
                        </p>
                      </div>

                      {/* 핵심 포인트 */}
                      {bookmark.aiAnalysis?.keyPoints && bookmark.aiAnalysis.keyPoints.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <h4 className="font-medium text-sm text-muted-foreground mb-2">핵심 포인트</h4>
                          {bookmark.aiAnalysis.keyPoints.map((point: string, index: number) => (
                            <motion.div 
                              key={index} 
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="flex items-start gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                            >
                              <div className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                                {index + 1}
                              </div>
                              <span className="text-sm">{point}</span>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </CollapsibleSection>
                  )}

                  {/* 미디어 타임라인 - 미디어인 경우만 */}
                  {hasMediaAnalysis && bookmark.mediaAnalysis?.timeline && bookmark.mediaAnalysis.timeline.length > 0 && (
                    <CollapsibleSection
                      id="timeline"
                      title="미디어 타임라인"
                      icon={Clock}
                      iconColor="text-amber-600 dark:text-amber-500"
                      isExpanded={expandedSections.has('timeline')}
                      onToggle={() => toggleSection('timeline')}
                      badge={
                        <Badge variant="outline" className="ml-2 text-xs border-amber-200 text-amber-700 dark:border-amber-800 dark:text-amber-300">
                          {bookmark.mediaAnalysis.timeline.length}개 구간
                        </Badge>
                      }
                    >
                      <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                        {bookmark.mediaAnalysis.timeline.slice(0, 5).map((segment: any, index: number) => (
                          <CompactTimelineSegment
                            key={segment.id || index}
                            segment={segment}
                            index={index}
                          />
                        ))}
                        {bookmark.mediaAnalysis.timeline.length > 5 && (
                          <div className="text-center pt-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-xs hover:bg-amber-50 dark:hover:bg-amber-900/20"
                            >
                              <ChevronRight className="h-3 w-3 mr-1" />
                              {bookmark.mediaAnalysis.timeline.length - 5}개 더 보기
                            </Button>
                          </div>
                        )}
                      </div>
                    </CollapsibleSection>
                  )}

                  {/* 태그 - 개선됨 */}
                  {bookmark.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {bookmark.tags.map((tag) => (
                        <motion.div
                          key={tag}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Badge 
                            variant="secondary" 
                            className="px-3 py-1 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                          >
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 우측 사이드바 */}
                <div className="space-y-4">
                  {/* 썸네일 */}
                  {bookmark.image && !imageError && (
                    <Card className="overflow-hidden hover:shadow-md transition-shadow group">
                      <div className="relative">
                        <img
                          src={bookmark.image}
                          alt={bookmark.title}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          onError={() => setImageError(true)}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                      </div>
                    </Card>
                  )}

                  {/* 이미지 로드 실패 시 */}
                  {imageError && (
                    <Card className="h-48 flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                      <div className="text-center text-muted-foreground">
                        <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">이미지를 불러올 수 없습니다</p>
                      </div>
                    </Card>
                  )}

                  {/* 빠른 액션 - 개선됨 */}
                  <Card>
                    <CardContent className="p-4 space-y-2">
                      <Button 
                        className="w-full justify-start gap-2 group" 
                        variant="outline"
                        onClick={() => window.open(bookmark.url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 group-hover:rotate-12 transition-transform" />
                        원문 보기
                      </Button>
                      <Button 
                        className="w-full justify-start gap-2 group" 
                        variant="outline"
                        onClick={handleShare}
                      >
                        <Share2 className="h-4 w-4 group-hover:rotate-12 transition-transform" />
                        공유하기
                      </Button>
                      <Button 
                        className="w-full justify-start gap-2 group" 
                        variant={isLiked ? "default" : "outline"}
                        onClick={() => setIsLiked(!isLiked)}
                      >
                        <Heart className={cn(
                          "h-4 w-4 transition-all",
                          isLiked && "fill-current animate-pulse"
                        )} />
                        좋아요 {isLiked && '취소'} (L)
                      </Button>
                    </CardContent>
                  </Card>

                  {/* 메타 정보 */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        정보
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <InfoRow 
                        icon={Globe} 
                        label="도메인" 
                        value={new URL(bookmark.url).hostname} 
                      />
                      {bookmark.author && (
                        <InfoRow 
                          icon={User} 
                          label="작성자" 
                          value={bookmark.author} 
                        />
                      )}
                      {bookmark.extractedData?.wordCount && (
                        <InfoRow 
                          icon={FileText} 
                          label="단어 수" 
                          value={`${bookmark.extractedData.wordCount.toLocaleString()}개`} 
                        />
                      )}
                      <InfoRow 
                        icon={Calendar} 
                        label="저장일" 
                        value={formatDistanceToNow(new Date(bookmark.createdAt), { 
                          addSuffix: true, 
                          locale: ko 
                        })} 
                      />
                      {bookmark.lastVisited && (
                        <InfoRow 
                          icon={Eye} 
                          label="마지막 방문" 
                          value={formatDistanceToNow(new Date(bookmark.lastVisited), { 
                            addSuffix: true, 
                            locale: ko 
                          })} 
                        />
                      )}
                    </CardContent>
                  </Card>

                  {/* 액션 아이템 - AI 분석 결과가 있는 경우 */}
                  {bookmark.aiAnalysis?.actionItems && bookmark.aiAnalysis.actionItems.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          실행 가능한 액션
                          {checkedActions.size > 0 && (
                            <Badge variant="secondary" className="ml-auto text-xs">
                              {checkedActions.size}/{bookmark.aiAnalysis.actionItems.length}
                            </Badge>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {bookmark.aiAnalysis.actionItems.slice(0, 3).map((action: string, index: number) => (
                          <motion.label 
                            key={index} 
                            className="flex items-start gap-2 text-sm cursor-pointer p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            whileTap={{ scale: 0.98 }}
                          >
                            <input 
                              type="checkbox" 
                              checked={checkedActions.has(index)}
                              onChange={() => toggleActionCheck(index)}
                              className="rounded mt-0.5 cursor-pointer" 
                            />
                            <span className={cn(
                              "text-xs transition-all",
                              checkedActions.has(index) && "line-through opacity-60"
                            )}>{action}</span>
                          </motion.label>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>

              {/* 추가 분석 정보 - 접을 수 있는 섹션들 */}
              {bookmark.aiAnalysis?.readingGoals && bookmark.aiAnalysis.readingGoals.length > 0 && (
                <CollapsibleSection
                  id="reading-goals"
                  title="학습 목표"
                  icon={Target}
                  iconColor="text-indigo-600 dark:text-indigo-500"
                  isExpanded={expandedSections.has('reading-goals')}
                  onToggle={() => toggleSection('reading-goals')}
                >
                  <div className="space-y-2">
                    {bookmark.aiAnalysis.readingGoals.map((goal: string, index: number) => (
                      <motion.div 
                        key={index} 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded transition-colors"
                      >
                        <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" />
                        <span className="text-sm">{goal}</span>
                      </motion.div>
                    ))}
                  </div>
                </CollapsibleSection>
              )}

              {/* 명언/인용구 - 미디어 분석 결과가 있는 경우 */}
              {bookmark.mediaAnalysis?.notableQuotes && bookmark.mediaAnalysis.notableQuotes.length > 0 && (
                <CollapsibleSection
                  id="quotes"
                  title="명언 & 인용구"
                  icon={Quote}
                  iconColor="text-indigo-600 dark:text-indigo-500"
                  isExpanded={expandedSections.has('quotes')}
                  onToggle={() => toggleSection('quotes')}
                  badge={
                    <Badge variant="outline" className="ml-2 text-xs">
                      {bookmark.mediaAnalysis.notableQuotes.length}개
                    </Badge>
                  }
                >
                  <div className="space-y-3">
                    {bookmark.mediaAnalysis.notableQuotes.slice(0, 3).map((quote: any, index: number) => (
                      <motion.div 
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="border-l-4 border-indigo-500 pl-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors rounded-r"
                      >
                        <blockquote className="text-indigo-900 dark:text-indigo-100 font-medium italic text-sm">
                          "{quote.text}"
                        </blockquote>
                        <div className="flex items-center justify-between text-xs text-indigo-600 dark:text-indigo-400 mt-2">
                          <span>— {quote.speaker}</span>
                          <span>{quote.timestamp?.formatted}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CollapsibleSection>
              )}
            </div>
          </ScrollArea>

          {/* 하단 액션 바 - 개선됨 */}
          <div className="px-6 py-4 border-t bg-slate-50 dark:bg-slate-900/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  단축키: ← → 탐색 | L 좋아요 | F 전체화면
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onNavigate('prev')}
                      disabled={!hasPrevious}
                      className="gap-1"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      이전
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>이전 북마크 (←)</p>
                  </TooltipContent>
                </Tooltip>

                <span className="text-sm text-muted-foreground px-2">
                  북마크 탐색
                </span>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onNavigate('next')}
                      disabled={!hasNext}
                      className="gap-1"
                    >
                      다음
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>다음 북마크 (→)</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
});

BookmarkDetailModal.displayName = 'BookmarkDetailModal';

// 접을 수 있는 섹션 컴포넌트 - 개선됨
interface CollapsibleSectionProps {
  id: string;
  title: string;
  icon: React.ElementType;
  iconColor?: string;
  isExpanded: boolean;
  onToggle: () => void;
  badge?: React.ReactNode;
  children?: React.ReactNode;
}

const CollapsibleSectionComponent: React.FC<CollapsibleSectionProps> = ({
  id,
  title,
  icon: Icon,
  iconColor = 'text-blue-600',
  isExpanded,
  onToggle,
  badge = null,
  children = null,
}) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader 
        className="cursor-pointer select-none hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors rounded-t-lg"
        onClick={onToggle}
      >
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <Icon className={cn("h-5 w-5", iconColor)} />
            {title}
            {badge}
          </div>
          <ChevronRight 
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              isExpanded ? "rotate-90" : ""
            )} 
          />
        </CardTitle>
      </CardHeader>
      {isExpanded && (
        <CardContent className="pt-0 animate-in slide-in-from-top-2 duration-200">
          {children}
        </CardContent>
      )}
    </Card>
  );
};

CollapsibleSectionComponent.displayName = 'CollapsibleSection';

const CollapsibleSection = memo(CollapsibleSectionComponent);

// 간소화된 타임라인 세그먼트 - 개선됨
const CompactTimelineSegment = memo(({
  segment,
  index,
}: {
  segment: any;
  index: number;
}) => {
  const importanceColors = {
    high: 'border-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30',
    medium: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30',
    low: 'border-green-500 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30'
  };

  return (
    <div className={cn(
      "p-3 border-l-4 rounded transition-colors cursor-pointer",
      importanceColors[segment.importance as keyof typeof importanceColors] || 'border-gray-500 bg-gray-50 hover:bg-gray-100'
    )}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2 text-sm">
          <Play className="h-3 w-3" />
          <span className="font-mono text-xs">
            {segment.startTime?.formatted || segment.startTime} - {segment.endTime?.formatted || segment.endTime}
          </span>
        </div>
        <Badge variant="outline" className="text-xs">
          {segment.importance}
        </Badge>
      </div>
      <h4 className="font-medium text-sm mb-1">{segment.title}</h4>
      {segment.summary && (
        <p className="text-xs text-muted-foreground line-clamp-2">{segment.summary}</p>
      )}
    </div>
  );
});

CompactTimelineSegment.displayName = 'CompactTimelineSegment';

// 정보 행 컴포넌트 - 개선됨
const InfoRow = memo(({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) => {
  return (
    <div className="flex items-center justify-between py-1 hover:bg-slate-50 dark:hover:bg-slate-800 px-2 -mx-2 rounded transition-colors">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </div>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
});

InfoRow.displayName = 'InfoRow';



export default BookmarkDetailModal;