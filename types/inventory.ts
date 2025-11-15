export interface PriceHistory {
  price: number;
  quantity: number;
  date: Date;
  purchaseId: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: 'kg' | 'litros' | 'unidades';
  price: number;
  lowStockThreshold: number;
  priceHistory?: PriceHistory[];
}
