
import { Home, Bookmark, Tag, Share2, TrendingUp, Settings, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface SidebarProps {
  isOpen: boolean;
  categories: readonly string[];
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
}

const menuItems = [
  { icon: Home, label: "홈", count: null },
  { icon: Bookmark, label: "내 북마크", count: 12 },
  { icon: Share2, label: "공유 받은 것", count: 5 },
  { icon: TrendingUp, label: "인기 북마크", count: null },
  { icon: Users, label: "팔로잉", count: 8 },
];

const Sidebar = ({ isOpen, categories, selectedCategory, onCategorySelect }: SidebarProps) => {
  if (!isOpen) return null;

  return (
    <aside className="fixed left-0 top-16 w-64 h-[calc(100vh-4rem)] bg-white border-r border-slate-200 shadow-sm z-40 overflow-y-auto">
      <div className="p-4">
        {/* 네비게이션 메뉴 */}
        <nav className="space-y-1 mb-6">
          {menuItems.map((item) => (
            <Button
              key={item.label}
              variant="ghost"
              className="w-full justify-start gap-3 h-10"
            >
              <item.icon className="h-5 w-5 text-slate-500" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.count && (
                <Badge variant="secondary" className="text-xs">
                  {item.count}
                </Badge>
              )}
            </Button>
          ))}
        </nav>

        <Separator className="my-4" />

        {/* 카테고리 섹션 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-slate-700">카테고리</h3>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <Tag className="h-3 w-3" />
            </Button>
          </div>
          
          <div className="space-y-1">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "secondary" : "ghost"}
                className="w-full justify-start text-sm h-8"
                onClick={() => onCategorySelect(category)}
              >
                <span className="w-2 h-2 rounded-full bg-blue-400 mr-2" />
                {category}
              </Button>
            ))}
          </div>
        </div>

        <Separator className="my-4" />

        {/* 설정 */}
        <Button variant="ghost" className="w-full justify-start gap-3 h-10">
          <Settings className="h-5 w-5 text-slate-500" />
          설정
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;
