const DB_NAME = import.meta.env.VITE_INDEXEDDB_NAME;
const STORE_NAME = import.meta.env.VITE_STORE_NAME;

// IndexedDB helpers
const saveToIndexedDB = (keyJwk: JsonWebKey, id = "user-private-key") =>
  new Promise<void>((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    req.onsuccess = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      store.put({ id, key: keyJwk });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };
    req.onerror = () => reject(req.error);
  });

export default saveToIndexedDB;