
import { useState, useCallback } from "react";
import { ExternalLink, Share2, Eye, Clock, MoreVertical, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { toast } from "sonner";

import { Bookmark } from "@/types/bookmark";

interface BookmarkCardProps {
  bookmark: Bookmark;
  onClick?: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const BookmarkCard = ({ bookmark, onClick, onEdit, onDelete }: BookmarkCardProps) => {
  const [imageError, setImageError] = useState(false);

  const handleShare = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      try {
        await navigator.share({
          title: bookmark.title,
          text: bookmark.description,
          url: bookmark.url,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      navigator.clipboard.writeText(bookmark.url);
      toast.success("URL이 클립보드에 복사되었습니다.");
    }
  }, [bookmark]);

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(bookmark.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(bookmark.id);
  };
  
  const handleImageError = () => {
    setImageError(true);
  };

  const timeAgo = formatDistanceToNow(new Date(bookmark.createdAt), { addSuffix: true, locale: ko });

  return (
    <Card 
      className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white border-slate-200 hover:cursor-pointer"
      onClick={onClick}
    >
      <div className="relative">
        <img
          src={imageError ? "/placeholder.svg" : bookmark.image}
          alt={bookmark.title}
          className="w-full h-48 object-cover rounded-t-lg"
          onError={handleImageError}
        />
        <div className="absolute top-2 right-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className="w-8 h-8 p-0 bg-white/90 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); window.open(bookmark.url, '_blank'); }}>
                <ExternalLink className="h-4 w-4 mr-2" />
                링크 열기
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                공유하기
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                편집
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                삭제
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {bookmark.isPublic && (
          <Badge className="absolute top-2 left-2 bg-green-600 hover:bg-green-700">
            공개
          </Badge>
        )}
      </div>

      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-slate-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
              {bookmark.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {bookmark.description}
            </p>
          </div>

          <div className="flex flex-wrap gap-1">
            {bookmark.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {bookmark.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{bookmark.tags.length - 3}
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {bookmark.readTime}
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {bookmark.viewCount ?? 0}
              </div>
            </div>
            <span>{timeAgo}</span>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-muted-foreground">
              by {bookmark.author}
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                onClick={(e) => { e.stopPropagation(); window.open(bookmark.url, '_blank'); }}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BookmarkCard;
