// IndexedDB-based PDF attachment storage for Quotations Fund transactions.
// All operations are frontend-only — no backend calls are made.

const DB_NAME = 'QuotationsFundPdfs';
const STORE_NAME = 'pdfs';
const DB_VERSION = 1;

interface PdfRecord {
  transactionId: string;
  blob: Blob;
  filename: string;
  timestamp: number;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'transactionId' });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      console.error('IndexedDB open error:', (event.target as IDBOpenDBRequest).error);
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

export async function savePdf(transactionId: bigint, file: File): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const record: PdfRecord = {
      transactionId: String(transactionId),
      blob: file,
      filename: file.name,
      timestamp: Date.now(),
    };

    const request = store.put(record);

    request.onsuccess = () => resolve();
    request.onerror = (event) => {
      console.error('IndexedDB save error:', (event.target as IDBRequest).error);
      reject((event.target as IDBRequest).error);
    };

    tx.oncomplete = () => db.close();
  });
}

export async function getPdf(transactionId: bigint): Promise<{ blob: Blob; filename: string } | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(String(transactionId));

    request.onsuccess = (event) => {
      const result = (event.target as IDBRequest<PdfRecord | undefined>).result;
      if (result) {
        resolve({ blob: result.blob, filename: result.filename });
      } else {
        resolve(null);
      }
    };

    request.onerror = (event) => {
      console.error('IndexedDB get error:', (event.target as IDBRequest).error);
      reject((event.target as IDBRequest).error);
    };

    tx.oncomplete = () => db.close();
  });
}

export async function deletePdf(transactionId: bigint): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(String(transactionId));

    request.onsuccess = () => resolve();
    request.onerror = (event) => {
      console.error('IndexedDB delete error:', (event.target as IDBRequest).error);
      reject((event.target as IDBRequest).error);
    };

    tx.oncomplete = () => db.close();
  });
}

export async function hasAttachment(transactionId: bigint): Promise<boolean> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.count(String(transactionId));

    request.onsuccess = (event) => {
      resolve((event.target as IDBRequest<number>).result > 0);
    };

    request.onerror = (event) => {
      console.error('IndexedDB count error:', (event.target as IDBRequest).error);
      reject((event.target as IDBRequest).error);
    };

    tx.oncomplete = () => db.close();
  });
}
