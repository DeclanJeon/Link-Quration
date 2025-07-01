import { Bookmark } from '@/types/bookmark';

export interface CreateBookmarkInput extends Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt'> {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateBookmarkInput extends Partial<Omit<Bookmark, 'id' | 'createdAt'>> {
  id: string;
  updatedAt: string;
}
