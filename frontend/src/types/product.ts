export type ProductSummary = {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
  priceCents: number;
  currency?: string | null;
};
