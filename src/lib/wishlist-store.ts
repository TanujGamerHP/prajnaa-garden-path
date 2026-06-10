import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * Wishlist store — persisted per account so saved products stay
 * synced across sessions. In the prototype, the "account" is a
 * mock email; the storage key includes the account id so switching
 * accounts loads that user's own wishlist.
 */

export type WishlistItem = {
  slug: string;
  name: string;
  image: string;
  price: number;
  weight: string;
  addedAt: number;
};

type WishlistState = {
  accountId: string;
  items: WishlistItem[];
  setAccount: (id: string) => void;
  add: (item: Omit<WishlistItem, "addedAt">) => void;
  remove: (slug: string) => void;
  toggle: (item: Omit<WishlistItem, "addedAt">) => boolean;
  has: (slug: string) => boolean;
  clear: () => void;
};

// Mock signed-in account for the prototype.
const DEFAULT_ACCOUNT = "meera@prajnaa.in";

const storageKey = (accountId: string) => `prajnaa-wishlist:${accountId}`;

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      accountId: DEFAULT_ACCOUNT,
      items: [],
      setAccount: (id) => {
        // Rehydrate from the new account's namespaced key.
        try {
          const raw = typeof window !== "undefined" ? window.localStorage.getItem(storageKey(id)) : null;
          const parsed = raw ? JSON.parse(raw) : null;
          set({ accountId: id, items: parsed?.state?.items ?? [] });
        } catch {
          set({ accountId: id, items: [] });
        }
      },
      add: (item) =>
        set((s) =>
          s.items.some((i) => i.slug === item.slug)
            ? s
            : { items: [{ ...item, addedAt: Date.now() }, ...s.items] },
        ),
      remove: (slug) => set((s) => ({ items: s.items.filter((i) => i.slug !== slug) })),
      toggle: (item) => {
        const exists = get().items.some((i) => i.slug === item.slug);
        if (exists) {
          set((s) => ({ items: s.items.filter((i) => i.slug !== item.slug) }));
          return false;
        }
        set((s) => ({ items: [{ ...item, addedAt: Date.now() }, ...s.items] }));
        return true;
      },
      has: (slug) => get().items.some((i) => i.slug === slug),
      clear: () => set({ items: [] }),
    }),
    {
      name: storageKey(DEFAULT_ACCOUNT),
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ items: s.items, accountId: s.accountId }),
    },
  ),
);
