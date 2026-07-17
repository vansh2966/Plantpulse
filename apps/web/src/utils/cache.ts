export let historyCache = {
  scans: null as any,
  lastFetchTime: 0,
};

export const clearHistoryCache = () => {
  historyCache.scans = null;
  historyCache.lastFetchTime = 0;
};
