interface Window {
  indexedDB: IDBFactory;
  IDBTransaction: {
    prototype: IDBTransaction;
    new (): IDBTransaction;
  };
  IDBRequest: {
    prototype: IDBRequest;
    new (): IDBRequest;
  };
  IDBOpenDBRequest: {
    prototype: IDBOpenDBRequest;
    new (): IDBOpenDBRequest;
  };
  IDBKeyRange: {
    prototype: IDBKeyRange;
    new (): IDBKeyRange;
    bound(lower: any, upper: any, lowerOpen?: boolean, upperOpen?: boolean): IDBKeyRange;
    lowerBound(lower: any, open?: boolean): IDBKeyRange;
    only(value: any): IDBKeyRange;
    upperBound(upper: any, open?: boolean): IDBKeyRange;
  };
}
