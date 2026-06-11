import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  slug: string;
  name: string;
  image: string;
  price: number;
  weight: string;
  qty: number;
};

type CartState = {
  items: CartItem[];
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  remove: (slug: string) => void;
  setQty: (slug: string, qty: number) => void;
  clear: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (item, qty = 1) =>
        set((s) => {
          const existing = s.items.find((i) => i.slug === item.slug);
          if (existing) {
            return {
              items: s.items.map((i) => (i.slug === item.slug ? { ...i, qty: i.qty + qty } : i)),
            };
          }
          return { items: [...s.items, { ...item, qty }] };
        }),
      remove: (slug) => set((s) => ({ items: s.items.filter((i) => i.slug !== slug) })),
      setQty: (slug, qty) =>
        set((s) => ({
          items:
            qty <= 0
              ? s.items.filter((i) => i.slug !== slug)
              : s.items.map((i) => (i.slug === slug ? { ...i, qty } : i)),
        })),
      clear: () => set({ items: [] }),
    }),
    { name: "prajnaa-cart" },
  ),
);

export const cartTotals = (items: CartItem[]) => {
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const shipping = subtotal > 999 || subtotal === 0 ? 0 : 49;
  return {
    subtotal,
    shipping,
    total: subtotal + shipping,
    count: items.reduce((s, i) => s + i.qty, 0),
  };
};
