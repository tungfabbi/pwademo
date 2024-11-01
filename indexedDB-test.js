// indexedDB-test.js

let db;
const dbName = 'storageTestDB';
const storeName = 'testStore';
const dataSize = 1024 * 1024; // Size of each data chunk in bytes (1MB)

async function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);

    request.onupgradeneeded = (event) => {
      db = event.target.result;
      db.createObjectStore(storeName);
    };

    request.onsuccess = (event) => {
      db = event.target.result;
      resolve();
    };

    request.onerror = () => reject(request.error);
  });
}

async function addDataToStore() {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const largeData = new Array(dataSize).fill('X').join('');

    const request = store.add(largeData, Date.now());
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function testIndexedDBStorage() {
  document.getElementById('storage-result').innerText =
    'Starting storage test...';

  try {
    await openDatabase();
    let count = 0;

    while (true) {
      try {
        await addDataToStore();
        count++;
        document.getElementById('storage-result').innerText = `Stored ${(
          (count * dataSize) /
          (1024 * 1024)
        ).toFixed(2)} MB`;
      } catch (error) {
        document.getElementById(
          'storage-result'
        ).innerText += `\nQuota reached! Stored approximately ${(
          (count * dataSize) /
          (1024 * 1024)
        ).toFixed(2)} MB`;
        break;
      }
    }
  } catch (error) {
    console.error('IndexedDB test failed', error);
    document.getElementById('storage-result').innerText =
      'Error: ' + error.message;
  }
}
