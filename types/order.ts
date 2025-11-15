export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string;
  cookingTime?: number; // en minutos
  category: 'burger' | 'side' | 'drink' | 'extra';
  image?: string; // URL de la imagen
}

export interface Burger extends MenuItem {
  category: 'burger';
  cookingTime: number;
}

export interface OrderItem {
  item: MenuItem;
  quantity: number;
  notes?: string;
  customizations?: {
    removeLettuce?: boolean;
    removeTomato?: boolean;
    removeOnion?: boolean;
    removeCheese?: boolean;
    removePickles?: boolean;
  };
}

export type PaymentMethod = 'qr' | 'cash';
export type OrderType = 'dine-in' | 'takeout';

export interface PaymentRecord {
  method: PaymentMethod;
  amount: number;
  timestamp: Date;
}

export interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'kitchen-started' | 'grill-started' | 'kitchen-completed' | 'grill-completed' | 'ready-for-pickup' | 'completed';
  timestamp: Date;
  orderNumber: number;
  station?: 'kitchen' | 'grill';
  kitchenStarted?: boolean;
  grillStarted?: boolean;
  kitchenCompleted?: boolean;
  grillCompleted?: boolean;
  paymentMethod: PaymentMethod;
  orderType: OrderType;
  isMemberSale?: boolean;
  memberName?: string;
  notes?: string;
  payments: PaymentRecord[];
  amountPaid: number;
  amountPending: number;
}

export interface Notification {
  id: string;
  type: 'new-order' | 'kitchen-started' | 'grill-started' | 'kitchen-completed' | 'grill-completed' | 'ready-for-pickup';
  orderId: string;
  orderNumber: number;
  message: string;
  timestamp: Date;
  read: boolean;
  targetStation: 'kitchen' | 'grill' | 'cashier';
}

export interface DailySales {
  date: string;
  totalRevenue: number;
  totalOrders: number;
  itemsSold: { [itemId: string]: { name: string; quantity: number; revenue: number } };
  orderDetails: {
    orderNumber: number;
    total: number;
    paymentMethod: PaymentMethod;
    orderType: OrderType;
    timestamp: Date;
    isMemberSale?: boolean;
    memberName?: string;
  }[];
  isClosed: boolean;
  closedAt?: Date;
  closedBy?: string;
}