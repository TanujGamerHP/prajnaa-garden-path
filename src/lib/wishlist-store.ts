import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { supabase } from "@/integrations/supabase/client";

/**
 * Wishlist store
 *
 * - Anonymous users: items persist in localStorage under a "guest" namespace.
 * - Signed-in users: on sign-in we migrate guest items into Supabase
 *   (`wishlist_items`) and then mirror all DB items back into the store.
 *   All add/remove/toggle calls write through to Supabase.
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
  userId: string | null;
  items: WishlistItem[];
  hydrated: boolean;
  setUser: (id: string | null) => Promise<void>;
  add: (item: Omit<WishlistItem, "addedAt">) => Promise<void>;
  remove: (slug: string) => Promise<void>;
  toggle: (item: Omit<WishlistItem, "addedAt">) => Promise<boolean>;
  has: (slug: string) => boolean;
  clear: () => Promise<void>;
};

const GUEST_KEY = "prajnaa-wishlist:guest";

async function fetchRemote(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("wishlist_items")
    .select("product_slug, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []).map((r: any) => (r as { product_slug: string }).product_slug);
}

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      userId: null,
      items: [],
      hydrated: false,

      setUser: async (id) => {
        if (!id) {
          // Signed out — keep localStorage items as the new guest state.
          set({ userId: null, hydrated: true });
          return;
        }

        const local = get().items;

        // Push any guest-saved items to the DB (upsert by unique pair).
        if (local.length > 0) {
          await supabase.from("wishlist_items").upsert(
            local.map((i) => ({ user_id: id, product_slug: i.slug })),
            { onConflict: "user_id,product_slug", ignoreDuplicates: true },
          );
        }

        const remoteSlugs = await fetchRemote(id);
        // Keep metadata from local items when possible, otherwise stub by slug.
        const merged: WishlistItem[] = remoteSlugs.map((slug) => {
          const found = local.find((i) => i.slug === slug);
          return (
            found ?? {
              slug,
              name: slug,
              image: "",
              price: 0,
              weight: "",
              addedAt: Date.now(),
            }
          );
        });

        set({ userId: id, items: merged, hydrated: true });
      },

      add: async (item) => {
        const state = get();
        if (state.items.some((i) => i.slug === item.slug)) return;
        const entry = { ...item, addedAt: Date.now() };
        set((s) => ({ items: [entry, ...s.items] }));
        if (state.userId) {
          await supabase
            .from("wishlist_items")
            .upsert(
              { user_id: state.userId, product_slug: item.slug },
              { onConflict: "user_id,product_slug", ignoreDuplicates: true },
            );
        }
      },

      remove: async (slug) => {
        const state = get();
        set((s) => ({ items: s.items.filter((i) => i.slug !== slug) }));
        if (state.userId) {
          await supabase
            .from("wishlist_items")
            .delete()
            .eq("user_id", state.userId)
            .eq("product_slug", slug);
        }
      },

      toggle: async (item) => {
        const exists = get().items.some((i) => i.slug === item.slug);
        if (exists) {
          await get().remove(item.slug);
          return false;
        }
        await get().add(item);
        return true;
      },

      has: (slug) => get().items.some((i) => i.slug === slug),

      clear: async () => {
        const state = get();
        set({ items: [] });
        if (state.userId) {
          await supabase.from("wishlist_items").delete().eq("user_id", state.userId);
        }
      },
    }),
    {
      name: GUEST_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ items: s.items }),
    },
  ),
);
