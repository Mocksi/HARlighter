import { sendMessage } from "../../utils";

interface Storage {
  tabId: string | null;
  getItem: (keys: string[]) => Promise<Record<string, any>>;
  setItem: (value: Record<string, any>) => Promise<boolean>;
  removeItem: (key: string) => Promise<boolean>;
  clearTab: () => Promise<boolean>;
  getStorageForTab: (tabId: string) => Promise<Record<string, any>>;
  setStorageForTab: (tabId: string, data: Record<string, any>) => Promise<boolean>;
  getTabId: () => Promise<string | null>;
}

interface StorageInterface {
  get: (keys: string[] | string) => Promise<Record<string, any>>;
  set: (value: Record<string, any>) => Promise<void>;
  remove: (key: string) => Promise<void>;
}

export const createStorage = (store: StorageInterface = chrome.storage.local): Storage => {
  return {
    tabId: null,
    getItem: async (keys: string[]) => {
      const tabId = await Storage.getTabId();
      if (!tabId) {
        console.error('Tab id not found');
        return [];
      }
  
      const storedData = await store.get(tabId);
      const data = storedData[tabId];
  
      if (!data) {
        return []
      }
  
      return keys.reduce((acc, curr) => {
        if (data[curr]) {
          return {
            ...acc,
            [curr]: data[curr]
          }
        }
  
        return acc;
      }, {})
    },
    setItem: async (value: Record<string, any>) => {
      const tabId = await Storage.getTabId();
      if (!tabId) {
        console.error('Tab id not found');
        return false;
      }
  
      console.log('setting item for tab', tabId, value);
  
      const data = await Storage.getStorageForTab(tabId)
  
      const newData = {
        ...data,
        ...value
      }
  
      try {
        await store.set({ [tabId]: newData })
        return true;
      } catch (error) {
        console.error('setItem: error setting local storage', error)
        return false;
      }
    },
    removeItem: async (key: string) => {
      const tabId = await Storage.getTabId();
      if (!tabId) {
        console.error('Tab id not found');
        return false;
      }
  
      const data = await Storage.getStorageForTab(tabId)
  
      const { [key]: removed, ...toKeep } = data;
  
      const result = await Storage.setStorageForTab(tabId, toKeep);
  
      return result;
    },
    clearTab: async () => {
      const tabId = await Storage.getTabId();
      if (!tabId) {
        console.error('Tab id not found');
        return false;
      }
  
      try {
        await store.remove(tabId)
        return true
      } catch (error) {
        console.error('clearTab: error clearing local storage', error)
        return false
      }
    },
    getStorageForTab: async (tabId: string) => {
      const storedData = await store.get([tabId]);
  
      return storedData[tabId];
    },
    setStorageForTab: async (tabId: string, data: Record<string, any>) => {
      try {
        await Storage.setItem({ [tabId]: data })
        return true;
      } catch (error) {
        console.error('setStorageForTab: error setting local storage', error)
        return false;
      }
    },
    getTabId: async () => {
      if (Storage.tabId) {
        return Storage.tabId;
      }
  
      return new Promise((resolve) => {
        sendMessage('getTabId', {}, (response) => {
          if (response.status !== 'success') {
            resolve(null);
          }
  
          const body = response.body as { tabId: string };
          const tabId = body.tabId;
  
          if (tabId) {
            Storage.tabId = tabId.toString();
            resolve(Storage.tabId);
          } else {
            resolve(null);
          }
        });
      });
    }
  }
}

export const Storage = createStorage();