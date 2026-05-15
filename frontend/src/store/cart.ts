import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, CartState } from "../types/cart";

// persist will save the cart items to localStorage
export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem(productId: string, qty = 1) {
        const items = [...get().items];
        const i = items.findIndex((item: CartItem) => item.productId === productId);
        if (i >= 0) {
          items[i] = { ...items[i], quantity: items[i].quantity + qty };
        } else {
          items.push({ productId, quantity: qty });
        }
        set({ items });
      },

      removeItem(productId: string) {
        set({ items: get().items.filter((item) => item.productId !== productId) });
      },

      setQty(productId: string, quantity: number) {
        if (quantity <= 0) {
          set({ items: get().items.filter((item) => item.productId !== productId) });
          return;
        }
        const items = get().items.map((item) =>
          item.productId === productId ? { ...item, quantity } : item,
        );
        set({ items });
      },

      clear() {
        set({ items: [] });
      },
    }),
    { name: "northwind-cart" },
  ),
);