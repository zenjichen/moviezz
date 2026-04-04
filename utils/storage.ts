
import { WatchHistoryItem } from '../types';

const KEYS = {
  FAVORITES: 'phat_movie_favorites',
  HISTORY: 'phat_movie_history',
};

const MAX_HISTORY_ITEMS = 60;

export const storage = {
  getFavorites: (): string[] => {
    try {
      return JSON.parse(localStorage.getItem(KEYS.FAVORITES) || '[]');
    } catch {
      return [];
    }
  },

  toggleFavorite: (slug: string): boolean => {
    const favs = storage.getFavorites();
    const index = favs.indexOf(slug);
    let newFavs;
    let isAdded = false;
    if (index === -1) {
      newFavs = [...favs, slug];
      isAdded = true;
    } else {
      newFavs = favs.filter(s => s !== slug);
    }
    localStorage.setItem(KEYS.FAVORITES, JSON.stringify(newFavs));
    return isAdded;
  },

  isFavorite: (slug: string): boolean => {
    return storage.getFavorites().includes(slug);
  },

  getHistory: (): Record<string, WatchHistoryItem> => {
    try {
      return JSON.parse(localStorage.getItem(KEYS.HISTORY) || '{}');
    } catch {
      return {};
    }
  },

  saveHistory: (item: WatchHistoryItem) => {
    const history = storage.getHistory();
    
    // Limit check: if it's a new item and we reached limit
    if (!history[item.slug]) {
        const historyArray = Object.values(history);
        if (historyArray.length >= MAX_HISTORY_ITEMS) {
            // Sort to find the oldest item
            const oldest = historyArray.sort((a, b) => a.lastUpdated - b.lastUpdated)[0];
            if (oldest) {
                delete history[oldest.slug];
            }
        }
    }

    history[item.slug] = item;
    localStorage.setItem(KEYS.HISTORY, JSON.stringify(history));
  },

  removeHistoryItem: (slug: string) => {
    const history = storage.getHistory();
    if (history[slug]) {
        delete history[slug];
        localStorage.setItem(KEYS.HISTORY, JSON.stringify(history));
    }
  },

  clearAllHistory: () => {
    localStorage.setItem(KEYS.HISTORY, JSON.stringify({}));
  },

  getHistoryItem: (slug: string): WatchHistoryItem | undefined => {
    const history = storage.getHistory();
    return history[slug];
  }
};
