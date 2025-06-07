"use client"

import { useEffect, useState } from "react";
import { X, ExternalLink, Edit, Trash2, Clock, Tag, Share2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Bookmark } from "@/types/bookmark";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import BookmarkCard from "@/components/card/BookmarkCard";

interface BookmarkDetailModalProps {
  bookmark: Bookmark | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  hasPrevious: boolean;
  hasNext: boolean;
}

export function BookmarkDetailModal({
  bookmark,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onNavigate,
  hasPrevious,
  hasNext,
}: BookmarkDetailModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [relatedBookmarks, setRelatedBookmarks] = useState<Bookmark[]>([]);

  useEffect(() => {
    if (bookmark?.relatedBookmarks) {
      setRelatedBookmarks(bookmark.relatedBookmarks);
    }
  }, [bookmark]);

  if (!bookmark) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft' && hasPrevious) {
      onNavigate('prev');
    } else if (e.key === 'ArrowRight' && hasNext) {
      onNavigate('next');
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0"
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        {/* 헤더 */}
        <DialogHeader className="p-4 border-b">
          <div className="flex justify-between items-center">
            <DialogTitle className="text-xl font-semibold truncate max-w-lg">
              {bookmark.title}
            </DialogTitle>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* 메인 콘텐츠 */}
        <div className="flex-1 overflow-auto p-6">
          {/* 미디어 컨텐츠 */}
          {bookmark.image && (
            <div className="mb-6 rounded-lg overflow-hidden">
              <img
                src={bookmark.image}
                alt={bookmark.title}
                className="w-full h-auto max-h-[400px] object-cover"
              />
            </div>
          )}

          {/* 메타 정보 */}
          <div className="mb-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  {format(new Date(bookmark.createdAt), 'yyyy년 MM월 dd일', { locale: ko })}
                </span>
                {bookmark.readTime && (
                  <span className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mr-1" />
                    {bookmark.readTime}
                  </span>
                )}
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" asChild>
                  <a href={bookmark.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    원문 보기
                  </a>
                </Button>
                <Button variant="outline" size="sm" onClick={() => onEdit(bookmark.id)}>
                  <Edit className="h-4 w-4 mr-2" />
                  수정
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onDelete(bookmark.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  삭제
                </Button>
              </div>
            </div>

            <h1 className="text-2xl font-bold">{bookmark.title}</h1>
            
            {bookmark.author && (
              <div className="text-muted-foreground">
                작성자: {bookmark.author}
              </div>
            )}

            {bookmark.description && (
              <p className="text-lg text-gray-700 dark:text-gray-300">
                {bookmark.description}
              </p>
            )}

            <div className="flex flex-wrap gap-2 pt-2">
              {bookmark.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* AI 분석 내용이 있을 경우 표시 */}
          {bookmark.aiAnalysis && (
            <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h3 className="text-lg font-semibold mb-2 flex items-center">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 mr-2">
                  AI
                </span>
                AI 분석 요약
              </h3>
              <div className="prose max-w-none dark:prose-invert">
                {bookmark.aiAnalysis.summary && (
                  <div className="mb-4">
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">요약</h4>
                    <p className="whitespace-pre-line">{bookmark.aiAnalysis.summary}</p>
                  </div>
                )}
                {bookmark.aiAnalysis.keyPoints && bookmark.aiAnalysis.keyPoints.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">주요 포인트</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {bookmark.aiAnalysis.keyPoints.map((point, i) => (
                        <li key={i}>{point}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {bookmark.aiAnalysis.tags && bookmark.aiAnalysis.tags.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">추천 태그</h4>
                    <div className="flex flex-wrap gap-2">
                      {bookmark.aiAnalysis.tags.map((tag, i) => (
                        <Badge key={i} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 관련 콘텐츠 */}
          {relatedBookmarks.length > 0 && (
            <div className="mt-12">
              <h3 className="text-lg font-semibold mb-4">관련 콘텐츠</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {relatedBookmarks.map((item) => (
                  <BookmarkCard 
                    key={item.id} 
                    bookmark={item} 
                    onClick={() => {
                      onClose();
                      setTimeout(() => {
                        const element = document.getElementById(`bookmark-${item.id}`);
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth' });
                        }
                        // 상태 업데이트를 다음 이벤트 루프로 미루어 모달이 닫힌 후에 실행되도록 함
                        setTimeout(() => {
                          const clickEvent = new MouseEvent('click', {
                            view: window,
                            bubbles: true,
                            cancelable: true
                          });
                          element?.dispatchEvent(clickEvent);
                        }, 100);
                      }, 100);
                    }} 
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 네비게이션 버튼 */}
        <div className="absolute inset-y-0 left-0 flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className={`h-12 w-12 rounded-full ${!hasPrevious ? 'invisible' : ''}`}
            onClick={() => onNavigate('prev')}
            disabled={!hasPrevious}
            aria-label="이전 항목"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
        </div>
        <div className="absolute inset-y-0 right-0 flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className={`h-12 w-12 rounded-full ${!hasNext ? 'invisible' : ''}`}
            onClick={() => onNavigate('next')}
            disabled={!hasNext}
            aria-label="다음 항목"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
