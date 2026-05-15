export type CartItem = {
  productId: string;
  quantity: number;
};

export type CartState = {
  items: CartItem[];
  addItem: (productId: string, qty?: number) => void;
  removeItem: (productId: string) => void;
  setQty: (productId: string, quantity: number) => void;
  clear: () => void;
};
