import { create } from 'zustand';
import { WishlistItem, WishlistPriority, WishlistStatus } from '../types';
import { wishlistRepository } from '../services/repositories/wishlistRepository';
import { generateId } from '../utils/id';

interface WishlistState {
  items: WishlistItem[];
  isLoading: boolean;
  searchQuery: string;
  filterStatus: 'all' | 'active' | 'purchased' | 'dropped';
  filterPriority: 'all' | WishlistPriority;
  filterCategory: 'all' | string;

  // Actions
  loadWishlist: () => Promise<void>;
  addItem: (item: Omit<WishlistItem, 'id' | 'createdAt' | 'status'> & { status?: WishlistStatus }) => Promise<WishlistItem>;
  updateItem: (item: WishlistItem) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  markAsPurchased: (id: string, convertedExpenseId?: string) => Promise<void>;
  markAsDropped: (id: string) => Promise<void>;
  restoreItem: (id: string) => Promise<void>;
  reorderWishlistItems: (reorderedSubset: WishlistItem[]) => Promise<void>;

  // Filter setters
  setSearchQuery: (query: string) => void;
  setFilterStatus: (status: 'all' | 'active' | 'purchased' | 'dropped') => void;
  setFilterPriority: (priority: 'all' | WishlistPriority) => void;
  setFilterCategory: (category: 'all' | string) => void;

  // Computations
  getFilteredItems: () => WishlistItem[];
  getStats: () => {
    totalActiveValue: number;
    activeCount: number;
    highPriorityCount: number;
    purchasedCount: number;
    totalPurchasedValue: number;
    totalAvoidedValue: number;
    avoidedCount: number;
  };
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  items: [],
  isLoading: false,
  searchQuery: '',
  filterStatus: 'active',
  filterPriority: 'all',
  filterCategory: 'all',

  loadWishlist: async () => {
    set({ isLoading: true });
    try {
      const items = await wishlistRepository.getAllItems();
      set({ items, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  addItem: async (itemData) => {
    const newItem: WishlistItem = {
      ...itemData,
      id: generateId(),
      status: itemData.status || 'saved',
      createdAt: new Date().toISOString(),
    };
    await wishlistRepository.createItem(newItem);
    set((state) => ({ items: [newItem, ...state.items] }));
    return newItem;
  },

  updateItem: async (item) => {
    await wishlistRepository.updateItem(item);
    set((state) => ({
      items: state.items.map((i) => (i.id === item.id ? item : i)),
    }));
  },

  deleteItem: async (id) => {
    await wishlistRepository.deleteItem(id);
    set((state) => ({
      items: state.items.filter((i) => i.id !== id),
    }));
  },

  markAsPurchased: async (id, convertedExpenseId) => {
    const item = get().items.find((i) => i.id === id);
    if (!item) return;

    const updated: WishlistItem = {
      ...item,
      status: 'purchased',
      purchasedAt: new Date().toISOString(),
      convertedExpenseId: convertedExpenseId || item.convertedExpenseId,
    };
    await wishlistRepository.updateItem(updated);
    set((state) => ({
      items: state.items.map((i) => (i.id === id ? updated : i)),
    }));
  },

  markAsDropped: async (id) => {
    const item = get().items.find((i) => i.id === id);
    if (!item) return;

    const updated: WishlistItem = {
      ...item,
      status: 'dropped',
    };
    await wishlistRepository.updateItem(updated);
    set((state) => ({
      items: state.items.map((i) => (i.id === id ? updated : i)),
    }));
  },

  restoreItem: async (id) => {
    const item = get().items.find((i) => i.id === id);
    if (!item) return;

    const updated: WishlistItem = {
      ...item,
      status: 'saved',
      purchasedAt: undefined,
    };
    await wishlistRepository.updateItem(updated);
    set((state) => ({
      items: state.items.map((i) => (i.id === id ? updated : i)),
    }));
  },

  reorderWishlistItems: async (reorderedSubset: WishlistItem[]) => {
    const currentItems = get().items;
    const subsetIds = new Set(reorderedSubset.map((i) => i.id));
    const firstIndex = currentItems.findIndex((i) => subsetIds.has(i.id));
    const insertAt = firstIndex >= 0 ? firstIndex : 0;
    const remaining = currentItems.filter((i) => !subsetIds.has(i.id));
    const merged = [
      ...remaining.slice(0, insertAt),
      ...reorderedSubset,
      ...remaining.slice(insertAt),
    ];
    set({ items: merged });
    await wishlistRepository.saveAllItems(merged);
  },

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setFilterStatus: (filterStatus) => set({ filterStatus }),
  setFilterPriority: (filterPriority) => set({ filterPriority }),
  setFilterCategory: (filterCategory) => set({ filterCategory }),

  getFilteredItems: () => {
    const { items, searchQuery, filterStatus, filterPriority, filterCategory } = get();

    return items.filter((item) => {
      // Status filter
      if (filterStatus === 'active') {
        if (item.status !== 'saved' && item.status !== 'ready') return false;
      } else if (filterStatus !== 'all') {
        if (item.status !== filterStatus) return false;
      }

      // Priority filter
      if (filterPriority !== 'all' && item.priority !== filterPriority) {
        return false;
      }

      // Category filter
      if (filterCategory !== 'all' && item.category !== filterCategory) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesCategory = item.category.toLowerCase().includes(q);
        const matchesNotes = item.notes?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesCategory && !matchesNotes) {
          return false;
        }
      }

      return true;
    });
  },

  getStats: () => {
    const { items } = get();
    let totalActiveValue = 0;
    let activeCount = 0;
    let highPriorityCount = 0;
    let purchasedCount = 0;
    let totalPurchasedValue = 0;
    let totalAvoidedValue = 0;
    let avoidedCount = 0;

    for (const item of items) {
      if (item.status === 'saved' || item.status === 'ready') {
        totalActiveValue += item.estimatedPrice || 0;
        activeCount++;
        if (item.priority === 'High') highPriorityCount++;
      } else if (item.status === 'purchased') {
        purchasedCount++;
        totalPurchasedValue += item.estimatedPrice || 0;
      } else if (item.status === 'dropped') {
        avoidedCount++;
        totalAvoidedValue += item.estimatedPrice || 0;
      }
    }

    return {
      totalActiveValue,
      activeCount,
      highPriorityCount,
      purchasedCount,
      totalPurchasedValue,
      totalAvoidedValue,
      avoidedCount,
    };
  },
}));
