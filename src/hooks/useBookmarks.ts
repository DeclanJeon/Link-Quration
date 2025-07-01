// src/hooks/useBookmarks.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { bookmarkRepository } from '@/lib/db/repositories/BookmarkRepository';
import { Bookmark } from '@/types/bookmark';
import { CreateBookmarkInput } from '@/lib/db/models/Bookmark';

export const useBookmarks = () => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadBookmarks = useCallback(async () => {
    try {
      setLoading(true);
      const data = await bookmarkRepository.getAll();
      setBookmarks(data);
    } catch (err) {
      setError(err as Error);
      console.error('북마크 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);

  const addBookmark = useCallback(
    async (bookmark: CreateBookmarkInput) => {
      try {
        const id = await bookmarkRepository.create(bookmark);
        await loadBookmarks();
        return id;
      } catch (err) {
        setError(err as Error);
        throw err;
      }
    },
    [loadBookmarks],
  );

  const updateBookmark = useCallback(
    async (id: string, updates: Partial<Bookmark>) => {
      try {
        const success = await bookmarkRepository.update(id, updates);
        if (success) {
          await loadBookmarks();
        }
        return success;
      } catch (err) {
        setError(err as Error);
        throw err;
      }
    },
    [loadBookmarks],
  );

  const deleteBookmark = useCallback(
    async (id: string) => {
      try {
        const success = await bookmarkRepository.delete(id);
        if (success) {
          await loadBookmarks();
        }
        return success;
      } catch (err) {
        setError(err as Error);
        throw err;
      }
    },
    [loadBookmarks],
  );

  const getBookmarkById = useCallback(async (id: string) => {
    try {
      return await bookmarkRepository.getById(id);
    } catch (err) {
      setError(err as Error);
      return undefined;
    }
  }, []);

  const searchBookmarks = useCallback(async (query: string) => {
    try {
      return await bookmarkRepository.search(query);
    } catch (err) {
      setError(err as Error);
      return [];
    }
  }, []);

  return {
    bookmarks,
    loading,
    error,
    addBookmark,
    updateBookmark,
    deleteBookmark,
    getBookmarkById,
    searchBookmarks,
    refresh: loadBookmarks,
  };
};
