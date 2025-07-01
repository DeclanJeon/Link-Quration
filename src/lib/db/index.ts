// src/lib/db/index.ts
export class IndexedDB {
  private static instance: IndexedDB;
  private dbName: string;
  private version: number;
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;
  private isInitialized = false;

  private constructor(dbName: string, version = 1) {
    this.dbName = dbName;
    this.version = version;
  }

  public static getInstance(dbName = 'LinkQurationDB', version = 1): IndexedDB {
    if (!IndexedDB.instance) {
      IndexedDB.instance = new IndexedDB(dbName, version);
    }
    return IndexedDB.instance;
  }

  public async init(): Promise<IDBDatabase> {
    // 이미 초기화되어 있으면 기존 DB 반환
    if (this.db && this.isInitialized) {
      return this.db;
    }

    // 이미 초기화 진행 중이면 기존 Promise 반환
    if (this.initPromise) {
      return this.initPromise;
    }

    // 새로운 초기화 시작
    this.initPromise = this.openDatabase();

    try {
      this.db = await this.initPromise;
      this.isInitialized = true;
      console.log(`IndexedDB '${this.dbName}' initialized successfully`);
      return this.db;
    } catch (error) {
      this.initPromise = null;
      this.isInitialized = false;
      console.error('Failed to initialize IndexedDB:', error);
      throw error;
    }
  }

  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      // IndexedDB 지원 여부 확인
      if (!window.indexedDB) {
        reject(new Error('IndexedDB is not supported in this browser'));
        return;
      }

      console.log(`Opening IndexedDB '${this.dbName}' version ${this.version}...`);
      const request = indexedDB.open(this.dbName, this.version);

      request.onupgradeneeded = (event) => {
        console.log('IndexedDB upgrade needed');
        const db = (event.target as IDBOpenDBRequest).result;
        const oldVersion = event.oldVersion;
        const newVersion = event.newVersion || this.version;

        console.log(`Upgrading database from version ${oldVersion} to ${newVersion}`);

        // bookmarks 스토어 생성
        if (!db.objectStoreNames.contains('bookmarks')) {
          const store = db.createObjectStore('bookmarks', { keyPath: 'id' });

          // 인덱스 생성
          store.createIndex('url', 'url', { unique: true });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          store.createIndex('updatedAt', 'updatedAt', { unique: false });
          store.createIndex('category', 'category', { unique: false });
          store.createIndex('tags', 'tags', { unique: false, multiEntry: true });
          store.createIndex('isPublic', 'isPublic', { unique: false });

          console.log('Bookmarks store created with indexes');
        }

        // 향후 버전 업그레이드를 위한 마이그레이션 로직
        // if (oldVersion < 2) {
        //   // 버전 2로 업그레이드하는 로직
        // }
      };

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        console.log(`IndexedDB opened successfully. Version: ${db.version}`);

        // 연결 종료 이벤트 처리
        db.onclose = () => {
          console.log('IndexedDB connection closed');
          this.db = null;
          this.isInitialized = false;
          this.initPromise = null;
        };

        resolve(db);
      };

      request.onerror = (event) => {
        const error = (event.target as IDBOpenDBRequest).error;
        console.error('IndexedDB open error:', error);
        reject(error || new Error('Failed to open IndexedDB'));
      };

      request.onblocked = () => {
        console.warn('IndexedDB open blocked. Please close other tabs with this site open.');
        reject(new Error('Database opening blocked by other tabs'));
      };
    });
  }

  public getDB(): IDBDatabase {
    if (!this.db || !this.isInitialized) {
      throw new Error('Database is not initialized. Call init() first.');
    }
    return this.db;
  }

  public async getTransaction(
    storeNames: string | string[],
    mode: IDBTransactionMode = 'readonly',
  ): Promise<IDBTransaction> {
    const db = await this.init();
    return db.transaction(storeNames, mode);
  }

  public async getObjectStore(
    storeName: string,
    mode: IDBTransactionMode = 'readonly',
  ): Promise<IDBObjectStore> {
    const transaction = await this.getTransaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  // 데이터베이스 연결 종료
  public close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.isInitialized = false;
      this.initPromise = null;
      console.log('IndexedDB connection closed');
    }
  }

  // 데이터베이스 삭제
  public async deleteDatabase(): Promise<void> {
    this.close();

    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(this.dbName);

      request.onsuccess = () => {
        console.log(`Database '${this.dbName}' deleted successfully`);
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to delete database:', request.error);
        reject(request.error);
      };

      request.onblocked = () => {
        console.warn('Database deletion blocked. Close all tabs using this database.');
        reject(new Error('Database deletion blocked'));
      };
    });
  }

  // 데이터베이스 정보 가져오기
  public async getDatabaseInfo() {
    const db = await this.init();

    const info = {
      name: db.name,
      version: db.version,
      objectStores: [] as string[],
    };

    for (let i = 0; i < db.objectStoreNames.length; i++) {
      info.objectStores.push(db.objectStoreNames[i]);
    }

    return info;
  }

  // 스토어의 모든 데이터 개수 가져오기
  public async getCount(storeName: string): Promise<number> {
    const store = await this.getObjectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        console.error(`Failed to count items in store '${storeName}':`, request.error);
        reject(request.error);
      };
    });
  }

  // 데이터베이스 상태 확인
  public getStatus() {
    return {
      isInitialized: this.isInitialized,
      isConnected: !!this.db,
      dbName: this.dbName,
      version: this.version,
    };
  }

  // 디버깅용 메서드
  public async debug() {
    console.group('IndexedDB Debug Info');
    console.log('Status:', this.getStatus());

    if (this.isInitialized && this.db) {
      const info = await this.getDatabaseInfo();
      console.log('Database Info:', info);

      for (const storeName of info.objectStores) {
        try {
          const count = await this.getCount(storeName);
          console.log(`Store '${storeName}' count:`, count);
        } catch (error) {
          console.error(`Failed to get count for store '${storeName}':`, error);
        }
      }
    } else {
      console.log('Database not initialized');
    }

    console.groupEnd();
  }
}

export const db = IndexedDB.getInstance();

// 개발 환경에서 전역으로 노출
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).__db = db;
}
