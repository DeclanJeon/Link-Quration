import { CreateBookmarkInput, UpdateBookmarkInput } from '../models/Bookmark';
import { db } from '../index';
import { Bookmark } from '@/types/bookmark';

export class BookmarkRepository {
  private storeName = 'bookmarks';

  private async getStore(mode: IDBTransactionMode = 'readonly') {
    try {
      return await db.getObjectStore(this.storeName, mode);
    } catch (error) {
      console.error('Failed to get bookmark store:', error);
      throw new Error('데이터베이스 접근에 실패했습니다.');
    }
  }

  private handleError(operation: string, error: any): Error {
    console.error(`BookmarkRepository.${operation} failed:`, error);
    return new Error(`${operation} 작업에 실패했습니다.`);
  }

  public async create(bookmark: CreateBookmarkInput): Promise<string> {
    try {
      const store = await this.getStore('readwrite');
      const id = bookmark.id || crypto.randomUUID();
      const now = new Date();

      const newBookmark: Bookmark = {
        ...bookmark,
        id,
        createdAt: now.toISOString().split('T')[0],
        updatedAt: now.toISOString().split('T')[0],
      };

      return new Promise((resolve, reject) => {
        const request = store.add(newBookmark);

        request.onsuccess = () => {
          console.log('Bookmark created successfully:', id);
          resolve(id);
        };

        request.onerror = () => {
          if (request.error?.name === 'ConstraintError') {
            reject(new Error('이미 존재하는 URL입니다.'));
          } else {
            reject(this.handleError('create', request.error));
          }
        };
      });
    } catch (error) {
      throw this.handleError('create', error);
    }
  }

  public async getAll(): Promise<Bookmark[]> {
    try {
      const store = await this.getStore();

      return new Promise((resolve, reject) => {
        const request = store.getAll();

        request.onsuccess = () => {
          const bookmarks = request.result || [];
          console.log(`Retrieved ${bookmarks.length} bookmarks`);

          // 최신순으로 정렬
          bookmarks.sort((a, b) => {
            const dateA = new Date(b.updatedAt || b.createdAt).getTime();
            const dateB = new Date(a.updatedAt || a.createdAt).getTime();
            return dateA - dateB;
          });

          resolve(bookmarks);
        };

        request.onerror = () => {
          reject(this.handleError('getAll', request.error));
        };
      });
    } catch (error) {
      console.error('Failed to get all bookmarks:', error);
      return []; // 에러 발생 시 빈 배열 반환
    }
  }

  public async getById(id: string): Promise<Bookmark | undefined> {
    try {
      const store = await this.getStore();

      return new Promise((resolve, reject) => {
        const request = store.get(id);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => {
          console.error('Failed to get bookmark by id:', request.error);
          resolve(undefined);
        };
      });
    } catch (error) {
      console.error('GetById error:', error);
      return undefined;
    }
  }

  public async getByUrl(url: string): Promise<Bookmark | undefined> {
    try {
      const store = await this.getStore();

      return new Promise((resolve, reject) => {
        const index = store.index('url');
        const request = index.get(url);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => {
          console.error('Failed to get bookmark by URL:', request.error);
          resolve(undefined);
        };
      });
    } catch (error) {
      console.error('GetByUrl error:', error);
      return undefined;
    }
  }

  public async update(id: string, updates: Partial<UpdateBookmarkInput>): Promise<boolean> {
    try {
      const store = await this.getStore('readwrite');

      return new Promise((resolve) => {
        const getRequest = store.get(id);

        getRequest.onsuccess = () => {
          const existing = getRequest.result;
          if (!existing) {
            console.warn(`Bookmark with id '${id}' not found`);
            resolve(false);
            return;
          }

          const updatedBookmark: Bookmark = {
            ...existing,
            ...updates,
            id: existing.id, // ID는 변경 불가
            createdAt: existing.createdAt, // 생성일은 변경 불가
            updatedAt: new Date().toISOString(),
          };

          const updateRequest = store.put(updatedBookmark);

          updateRequest.onsuccess = () => {
            console.log('Bookmark updated successfully:', id);
            resolve(true);
          };

          updateRequest.onerror = () => {
            console.error('Failed to update bookmark:', updateRequest.error);
            resolve(false);
          };
        };

        getRequest.onerror = () => {
          console.error('Failed to get bookmark for update:', getRequest.error);
          resolve(false);
        };
      });
    } catch (error) {
      console.error('Update error:', error);
      return false;
    }
  }

  public async delete(id: string): Promise<boolean> {
    try {
      const store = await this.getStore('readwrite');

      return new Promise((resolve) => {
        const request = store.delete(id);

        request.onsuccess = () => {
          console.log('Bookmark deleted successfully:', id);
          resolve(true);
        };

        request.onerror = () => {
          console.error('Failed to delete bookmark:', request.error);
          resolve(false);
        };
      });
    } catch (error) {
      console.error('Delete error:', error);
      return false;
    }
  }

  public async search(query: string): Promise<Bookmark[]> {
    const bookmarks = await this.getAll();
    const queryLower = query.toLowerCase();

    return bookmarks.filter(
      (bookmark) =>
        bookmark.title.toLowerCase().includes(queryLower) ||
        (bookmark.description && bookmark.description.toLowerCase().includes(queryLower)) ||
        (bookmark.tags && bookmark.tags.some((tag) => tag.toLowerCase().includes(queryLower))),
    );
  }

  public async getByCategory(category: string): Promise<Bookmark[]> {
    const bookmarks = await this.getAll();
    return bookmarks.filter((bookmark) => bookmark.category === category);
  }

  public async getByTags(tags: string[]): Promise<Bookmark[]> {
    const bookmarks = await this.getAll();
    return bookmarks.filter((bookmark) => bookmark.tags.some((tag) => tags.includes(tag)));
  }

  public async checkUrlExists(url: string): Promise<boolean> {
    const existing = await this.getByUrl(url);
    return !!existing;
  }

  public async count(): Promise<number> {
    try {
      return await db.getCount(this.storeName);
    } catch (error) {
      console.error('Count error:', error);
      return 0;
    }
  }

  // 벌크 작업을 위한 메서드
  public async bulkCreate(bookmarks: CreateBookmarkInput[]): Promise<string[]> {
    const ids: string[] = [];

    for (const bookmark of bookmarks) {
      try {
        const id = await this.create(bookmark);
        ids.push(id);
      } catch (error) {
        console.error('Failed to create bookmark in bulk:', error);
      }
    }

    return ids;
  }

  public async bulkDelete(ids: string[]): Promise<number> {
    let deletedCount = 0;

    for (const id of ids) {
      const success = await this.delete(id);
      if (success) deletedCount++;
    }

    return deletedCount;
  }
}

export const bookmarkRepository = new BookmarkRepository();
