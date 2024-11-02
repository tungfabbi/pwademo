// indexedDBQuotaTest.js

let db;
const dbName = 'storageTestDB';
const storeName = 'testStore';
const dataSize = 1024 * 1024;
let running = false;

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

function generateLargeObject(sizeInBytes) {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < sizeInBytes; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return { data: result, timestamp: Date.now() };
}

async function addDataToStore() {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const largeData = generateLargeObject(dataSize);

    const request = store.put(largeData, Date.now());
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function updateStorageMetrics() {
  if (navigator.storage && navigator.storage.estimate) {
    const estimate = await navigator.storage.estimate();
    const total = estimate.quota;
    const used = estimate.usage;
    const remaining = total - used;

    document.getElementById('total-storage').innerText = formatBytes(total);
    document.getElementById('used-storage').innerText = formatBytes(used);
    document.getElementById('remaining-storage').innerText =
      formatBytes(remaining);
  } else {
    console.warn('Storage Quota API not supported');
  }
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

async function testIndexedDBStorage() {
  document.getElementById('storage-result').innerText =
    'Starting storage test...';
  running = true;
  setActiveButton('start-btn');

  try {
    await openDatabase();
    let count = 0;

    while (running) {
      try {
        await addDataToStore();
        count++;
        document.getElementById('storage-result').innerText = `Stored ${(
          (count * dataSize) /
          (1024 * 1024)
        ).toFixed(2)} MB`;

        await updateStorageMetrics();
        await new Promise((resolve) => setTimeout(resolve, 50));
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

function startTest() {
  if (!running) {
    testIndexedDBStorage();
  }
}

function stopTest() {
  running = false;
  setActiveButton('stop-btn');
}

function resumeTest() {
  if (!running) {
    testIndexedDBStorage();
  }
}

function setActiveButton(buttonId) {
  document.getElementById('start-btn').classList.remove('active');
  document.getElementById('stop-btn').classList.remove('active');
  document.getElementById('resume-btn').classList.remove('active');
  document.getElementById(buttonId).classList.add('active');
}
