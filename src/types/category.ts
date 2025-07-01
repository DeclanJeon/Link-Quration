export interface Category {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  isSystem: boolean;
  isAuto: boolean;
  createdAt: Date;
  updatedAt: Date;
  bookmarkCount: number;
  tags?: string[];
}

export interface CategoryStats {
  name: string;
  count: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  popularTags: string[];
}

export interface CategoryRule {
  name: string;
  keywords: string[];
  patterns?: RegExp[];
  priority: number;
}

export interface DynamicCategory {
  name: string;
  count: number;
  tags: string[];
  createdAt: Date;
  isAuto: boolean;
}
