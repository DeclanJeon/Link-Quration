
import { useState, useEffect } from "react";
import { ExternalLink, Share2, Eye, Clock, Tag, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Bookmark } from "@/types/bookmark";

interface BookmarkCardProps {
  bookmark: Bookmark;
  onClick?: () => void;
}

const BookmarkCard = ({ bookmark, onClick }: BookmarkCardProps) => {
  const [viewCount, setViewCount] = useState<number | null>(null);

  useEffect(() => {
    setViewCount(Math.floor(Math.random() * 100) + 10);
  }, []);
  return (
    <Card 
      className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white border-slate-200 hover:cursor-pointer"
      onClick={onClick}
    >
      <div className="relative">
        <img
          src={bookmark.image}
          alt={bookmark.title}
          className="w-full h-48 object-cover rounded-t-lg"
        />
        <div className="absolute top-2 right-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className="w-8 h-8 p-0 bg-white/90 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <ExternalLink className="h-4 w-4 mr-2" />
                링크 열기
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Share2 className="h-4 w-4 mr-2" />
                공유하기
              </DropdownMenuItem>
              <DropdownMenuItem>편집</DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">삭제</DropdownMenuItem>
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
                {viewCount !== null ? viewCount : '--'}
              </div>
            </div>
            <span>{bookmark.createdAt}</span>
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
                onClick={() => window.open(bookmark.url, '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
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
