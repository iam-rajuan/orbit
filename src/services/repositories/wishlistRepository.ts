import { WishlistItem } from '../../types';
import { appStorage } from '../storage/storageAdapter';

const WISHLIST_KEY = 'orbit_wishlist_v1';
const INITIALIZED_KEY = 'orbit_wishlist_initialized_v1';

export const SEED_WISHLIST: WishlistItem[] = [
  {
    id: 'wish_1',
    title: 'Ergonomic High-Back Mesh Chair',
    estimatedPrice: 22000,
    category: 'Office & Work',
    priority: 'High',
    targetDate: '2026-11-15',
    url: 'https://example.com/ergonomic-chair',
    notes: 'For lower back lumbar support during long work blocks. Waiting for seasonal discount.',
    status: 'saved',
    createdAt: '2026-10-06T10:00:00.000Z',
  },
  {
    id: 'wish_2',
    title: 'Sony WH-1000XM5 Noise Cancelling Headphones',
    estimatedPrice: 38000,
    category: 'Electronics',
    priority: 'Medium',
    targetDate: '2026-11-28',
    url: 'https://example.com/sony-xm5',
    notes: 'Superior ANC for deep focus and travel. Will buy if quarterly bonus arrives.',
    status: 'saved',
    createdAt: '2026-10-07T14:30:00.000Z',
  },
  {
    id: 'wish_3',
    title: 'Kindle Paperwhite E-Reader (Warm Light)',
    estimatedPrice: 15500,
    category: 'Books & Learning',
    priority: 'Medium',
    targetDate: '2026-12-05',
    notes: 'Distraction-free reading before sleep to replace phone screen time.',
    status: 'ready',
    createdAt: '2026-10-08T09:15:00.000Z',
  },
  {
    id: 'wish_4',
    title: 'Nike Pegasus Road Running Shoes',
    estimatedPrice: 13500,
    category: 'Health & Fitness',
    priority: 'High',
    targetDate: '2026-10-25',
    notes: 'Current running sneakers are at 600km mileage. Essential for daily routine.',
    status: 'saved',
    createdAt: '2026-10-09T16:00:00.000Z',
  },
  {
    id: 'wish_5',
    title: 'RGB Mechanical Gaming Keyboard',
    estimatedPrice: 9500,
    category: 'Electronics',
    priority: 'Low',
    notes: 'Impulse want. After waiting 14 days, realized current setup works perfectly.',
    status: 'dropped',
    createdAt: '2026-09-25T11:00:00.000Z',
  },
];

export class WishlistRepository {
  async ensureInitialized(): Promise<void> {
    const initialized = await appStorage.getItem<boolean>(INITIALIZED_KEY);
    if (!initialized) {
      await appStorage.setItem(WISHLIST_KEY, SEED_WISHLIST);
      await appStorage.setItem(INITIALIZED_KEY, true);
    }
  }

  async getAllItems(): Promise<WishlistItem[]> {
    await this.ensureInitialized();
    const data = await appStorage.getItem<WishlistItem[]>(WISHLIST_KEY);
    return data || SEED_WISHLIST;
  }

  async saveAllItems(items: WishlistItem[]): Promise<void> {
    await appStorage.setItem(WISHLIST_KEY, items);
  }

  async createItem(item: WishlistItem): Promise<void> {
    const all = await this.getAllItems();
    all.unshift(item);
    await this.saveAllItems(all);
  }

  async updateItem(item: WishlistItem): Promise<void> {
    const all = await this.getAllItems();
    const index = all.findIndex((i) => i.id === item.id);
    if (index !== -1) {
      all[index] = item;
      await this.saveAllItems([...all]);
    }
  }

  async deleteItem(id: string): Promise<void> {
    const all = await this.getAllItems();
    const filtered = all.filter((i) => i.id !== id);
    await this.saveAllItems(filtered);
  }
}

export const wishlistRepository = new WishlistRepository();
