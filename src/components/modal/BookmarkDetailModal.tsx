// src/components/modal/BookmarkDetailModal.tsx
"use client"

import { useEffect, useState, memo, useCallback, useMemo } from "react";
import { 
  X, ExternalLink, Edit, Trash2, Clock, Tag, Share2, ChevronLeft, 
  ChevronRight, Globe, Calendar, User, BookOpen, Hash, 
  Sparkles, TrendingUp, CheckCircle, Quote, Target, Lightbulb,
  Video, Youtube, Music, Headphones, Radio, Podcast, Play,
  BarChart3, Zap, MessageSquare, Star, ArrowRight, Copy,
  Download, Heart, MessageCircle, Info, FileText, Image as ImageIcon,
  Eye, AlertCircle, Bookmark as BookmarkIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { Bookmark } from "@/types/bookmark";
import { format, formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import BookmarkCard from "@/components/card/BookmarkCard";
import { cn } from "@/lib/utils";

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
  youtube: 'text-red-600',
  vimeo: 'text-blue-600',
  spotify: 'text-green-600',
  soundcloud: 'text-orange-600',
  podcast: 'text-purple-600',
  apple_podcasts: 'text-pink-600',
  google_podcasts: 'text-blue-400',
  twitch: 'text-purple-500',
  instagram: 'text-pink-500',
  tiktok: 'text-black',
  generic: 'text-gray-600'
} as const;

interface BookmarkDetailModalProps {
  bookmark: Bookmark | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
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

  // 미디어 플랫폼 감지
  const mediaDetection = useMemo(() => {
    if (!bookmark?.url) return null;
    
    if (bookmark.mediaAnalysis?.platform) {
      return {
        isMedia: true,
        platform: bookmark.mediaAnalysis.platform,
        mediaType: bookmark.mediaAnalysis.mediaType
      };
    }
    
    const url = bookmark.url.toLowerCase();
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return { isMedia: true, platform: 'youtube', mediaType: '동영상' };
    }
    if (url.includes('vimeo.com')) {
      return { isMedia: true, platform: 'vimeo', mediaType: '동영상' };
    }
    
    return null;
  }, [bookmark]);

  // 키보드 네비게이션
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
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
    }
  }, [hasPrevious, hasNext, onNavigate, onClose]);

  // URL 복사
  const handleCopyUrl = useCallback(() => {
    if (bookmark?.url) {
      navigator.clipboard.writeText(bookmark.url);
      setShowCopyTooltip(true);
      setTimeout(() => setShowCopyTooltip(false), 2000);
    }
  }, [bookmark]);

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
    const colorClass = PLATFORM_COLORS[platform as keyof typeof PLATFORM_COLORS] || 'text-gray-600';
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

  if (!bookmark) return null;

  const hasAIAnalysis = bookmark.aiAnalysis && bookmark.aiAnalysis.summary;
  const hasMediaAnalysis = bookmark.mediaAnalysis && mediaDetection?.isMedia;
  const hasExtractedContent = bookmark.extractedData && bookmark.extractedData.textContent;

  return (
    <TooltipProvider>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent 
          className="max-w-5xl max-h-[95vh] flex flex-col p-0"
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          <DialogTitle className="sr-only">북마크 상세 정보</DialogTitle>
          {/* 헤더 - 간소화 */}
          <div className="p-6 pb-4 border-b bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
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
                  <Badge variant="outline" className="gap-1">
                    <Hash className="h-3 w-3" />
                    {bookmark.category}
                  </Badge>
                </div>
              </div>

              {/* 액션 버튼 그룹 */}
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCopyUrl}
                  className="h-8 w-8"
                >
                  <Tooltip open={showCopyTooltip}>
                    <TooltipTrigger asChild>
                      <Copy className="h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>복사되었습니다!</p>
                    </TooltipContent>
                  </Tooltip>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(bookmark.id)}
                  className="h-8 w-8"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* 메인 콘텐츠 - 스크롤 가능 영역 */}
          <ScrollArea className="flex-1 overflow-auto">
            <div className="p-6 space-y-6">
              {/* 썸네일 & 설명 섹션 */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  {/* 설명 */}
                  {bookmark.description && (
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
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
                      iconColor="text-purple-600"
                      isExpanded={expandedSections.has('ai-summary')}
                      onToggle={() => toggleSection('ai-summary')}
                      badge={
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {bookmark.aiAnalysis?.aiModel || 'AI'}
                        </Badge>
                      }
                    >
                      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/10 dark:to-blue-900/10 p-4 rounded-lg">
                        <p className="text-purple-900 dark:text-purple-100 leading-relaxed">
                          {bookmark.aiAnalysis?.summary}
                        </p>
                      </div>

                      {/* 핵심 포인트 */}
                      {bookmark.aiAnalysis?.keyPoints && bookmark.aiAnalysis.keyPoints.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <h4 className="font-medium text-sm text-muted-foreground mb-2">핵심 포인트</h4>
                          {bookmark.aiAnalysis.keyPoints.map((point: string, index: number) => (
                            <div key={index} className="flex items-start gap-2">
                              <div className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                                {index + 1}
                              </div>
                              <span className="text-sm">{point}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CollapsibleSection>
                  )}

                  {/* 미디어 타임라인 - 미디어인 경우만 */}
                  {hasMediaAnalysis && bookmark.mediaAnalysis?.timeline && (
                    <CollapsibleSection
                      id="timeline"
                      title="미디어 타임라인"
                      icon={Clock}
                      iconColor="text-amber-600"
                      isExpanded={expandedSections.has('timeline')}
                      onToggle={() => toggleSection('timeline')}
                      badge={
                        <Badge variant="outline" className="ml-2 text-xs">
                          {bookmark.mediaAnalysis.timeline.length}개 구간
                        </Badge>
                      }
                    >
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {bookmark.mediaAnalysis.timeline.slice(0, 5).map((segment: any, index: number) => (
                          <CompactTimelineSegment
                            key={segment.id || index}
                            segment={segment}
                            index={index}
                          />
                        ))}
                        {bookmark.mediaAnalysis.timeline.length > 5 && (
                          <div className="text-center pt-2">
                            <Button variant="ghost" size="sm" className="text-xs">
                              {bookmark.mediaAnalysis.timeline.length - 5}개 더 보기
                            </Button>
                          </div>
                        )}
                      </div>
                    </CollapsibleSection>
                  )}

                  {/* 태그 */}
                  <div className="flex flex-wrap gap-2">
                    {bookmark.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="px-3 py-1">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* 우측 사이드바 */}
                <div className="space-y-4">
                  {/* 썸네일 */}
                  {bookmark.image && (
                    <Card>
                      <img
                        src={bookmark.image}
                        alt={bookmark.title}
                        className="w-full h-48 object-cover"
                        loading="lazy"
                      />
                    </Card>
                  )}

                  {/* 빠른 액션 */}
                  <Card>
                    <CardContent className="p-4 space-y-2">
                      <Button 
                        className="w-full justify-start gap-2" 
                        variant="outline"
                        onClick={() => window.open(bookmark.url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                        원문 보기
                      </Button>
                      <Button 
                        className="w-full justify-start gap-2" 
                        variant="outline"
                        onClick={handleShare}
                      >
                        <Share2 className="h-4 w-4" />
                        공유하기
                      </Button>
                      <Button 
                        className="w-full justify-start gap-2" 
                        variant={isLiked ? "default" : "outline"}
                        onClick={() => setIsLiked(!isLiked)}
                      >
                        <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
                        좋아요
                      </Button>
                    </CardContent>
                  </Card>

                  {/* 메타 정보 */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">정보</CardTitle>
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
                    </CardContent>
                  </Card>

                  {/* 액션 아이템 - AI 분석 결과가 있는 경우 */}
                  {bookmark.aiAnalysis?.actionItems && bookmark.aiAnalysis.actionItems.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          실행 가능한 액션
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {bookmark.aiAnalysis.actionItems.slice(0, 3).map((action: string, index: number) => (
                          <label key={index} className="flex items-start gap-2 text-sm cursor-pointer">
                            <input type="checkbox" className="rounded mt-0.5" />
                            <span className="text-xs">{action}</span>
                          </label>
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
                  iconColor="text-indigo-600"
                  isExpanded={expandedSections.has('reading-goals')}
                  onToggle={() => toggleSection('reading-goals')}
                >
                  <div className="space-y-2">
                    {bookmark.aiAnalysis.readingGoals.map((goal: string, index: number) => (
                      <div key={index} className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded">
                        <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                        <span className="text-sm">{goal}</span>
                      </div>
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
                  iconColor="text-indigo-600"
                  isExpanded={expandedSections.has('quotes')}
                  onToggle={() => toggleSection('quotes')}
                >
                  <div className="space-y-3">
                    {bookmark.mediaAnalysis.notableQuotes.slice(0, 3).map((quote: any, index: number) => (
                      <div key={index} className="border-l-4 border-indigo-500 pl-4 py-2 bg-indigo-50 dark:bg-indigo-900/20">
                        <blockquote className="text-indigo-900 dark:text-indigo-100 font-medium italic text-sm">
                          "{quote.text}"
                        </blockquote>
                        <div className="flex items-center justify-between text-xs text-indigo-600 dark:text-indigo-400 mt-2">
                          <span>— {quote.speaker}</span>
                          <span>{quote.timestamp?.formatted}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>
              )}
            </div>
          </ScrollArea>

          {/* 하단 액션 바 */}
          <div className="px-6 py-4 border-t bg-slate-50 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(bookmark.id)}
                className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                삭제
              </Button>

              <div className="flex items-center gap-4">
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
                <span className="text-sm text-muted-foreground">
                  북마크 탐색
                </span>
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
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
});

BookmarkDetailModal.displayName = 'BookmarkDetailModal';

// 접을 수 있는 섹션 컴포넌트
const CollapsibleSection = memo(({
  id,
  title,
  icon: Icon,
  iconColor,
  isExpanded,
  onToggle,
  badge,
  children,
}: {
  id: string;
  title: string;
  icon: React.ElementType;
  iconColor: string;
  isExpanded: boolean;
  onToggle: () => void;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) => {
  return (
    <Card>
      <CardHeader 
        className="cursor-pointer select-none"
        onClick={onToggle}
      >
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <Icon className={cn("h-5 w-5", iconColor)} />
            {title}
            {badge}
          </div>
          <ChevronRight className={cn(
            "h-4 w-4 transition-transform",
            isExpanded && "rotate-90"
          )} />
        </CardTitle>
      </CardHeader>
      {isExpanded && (
        <CardContent className="pt-0">
          {children}
        </CardContent>
      )}
    </Card>
  );
});

CollapsibleSection.displayName = 'CollapsibleSection';

// 간소화된 타임라인 세그먼트
const CompactTimelineSegment = memo(({
  segment,
  index,
}: {
  segment: any;
  index: number;
}) => {
  const importanceColors = {
    high: 'border-red-500 bg-red-50 dark:bg-red-900/20',
    medium: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
    low: 'border-green-500 bg-green-50 dark:bg-green-900/20'
  };

  return (
    <div className={cn(
      "p-3 border-l-4 rounded",
      importanceColors[segment.importance as keyof typeof importanceColors] || 'border-gray-500 bg-gray-50'
    )}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2 text-sm">
          <Play className="h-3 w-3" />
          <span className="font-mono">
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

// 정보 행 컴포넌트
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
    <div className="flex items-center justify-between">
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