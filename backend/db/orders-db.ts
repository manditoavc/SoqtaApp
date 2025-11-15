import { Order, DailySales, Notification } from '../../types/order';

class OrdersDatabase {
  private orders: Order[] = [];
  private orderCounter: number = 1;
  private dailySales: Map<string, DailySales> = new Map();
  private notifications: Notification[] = [];

  getTodayKey(): string {
    return new Date().toISOString().split('T')[0];
  }

  getAllOrders(): Order[] {
    return this.orders;
  }

  getOrder(id: string): Order | undefined {
    return this.orders.find(o => o.id === id);
  }

  createOrder(order: Omit<Order, 'id' | 'orderNumber' | 'timestamp'>): Order {
    const newOrder: Order = {
      ...order,
      id: Date.now().toString(),
      orderNumber: this.orderCounter++,
      timestamp: new Date()
    };
    
    this.orders = [newOrder, ...this.orders];
    this.updateDailySales(newOrder);
    
    return newOrder;
  }

  updateOrder(id: string, updates: Partial<Order>): Order | null {
    const index = this.orders.findIndex(o => o.id === id);
    if (index === -1) return null;

    this.orders[index] = { ...this.orders[index], ...updates };
    return this.orders[index];
  }

  deleteOrder(id: string): boolean {
    const initialLength = this.orders.length;
    this.orders = this.orders.filter(o => o.id !== id);
    return this.orders.length < initialLength;
  }

  addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): Notification {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false
    };
    
    this.notifications = [newNotification, ...this.notifications];
    return newNotification;
  }

  getNotifications(): Notification[] {
    return this.notifications;
  }

  markNotificationAsRead(id: string): boolean {
    const notification = this.notifications.find(n => n.id === id);
    if (!notification) return false;
    
    notification.read = true;
    return true;
  }

  getDailySales(date?: string): DailySales | null {
    const key = date || this.getTodayKey();
    const sales = this.dailySales.get(key);
    if (!sales) {
      const newSales: DailySales = {
        date: key,
        totalRevenue: 0,
        totalOrders: 0,
        itemsSold: {},
        orderDetails: [],
        isClosed: false
      };
      this.dailySales.set(key, newSales);
      return newSales;
    }
    return sales;
  }

  private updateDailySales(order: Order): void {
    const today = this.getTodayKey();
    let currentSales = this.dailySales.get(today);

    if (!currentSales) {
      currentSales = {
        date: today,
        totalRevenue: 0,
        totalOrders: 0,
        itemsSold: {},
        orderDetails: [],
        isClosed: false
      };
    }

    const updatedSales: DailySales = {
      ...currentSales,
      totalRevenue: currentSales.totalRevenue + order.total,
      totalOrders: currentSales.totalOrders + 1,
      itemsSold: { ...currentSales.itemsSold }
    };

    order.items.forEach(orderItem => {
      const itemId = orderItem.item.id;
      if (updatedSales.itemsSold[itemId]) {
        updatedSales.itemsSold[itemId].quantity += orderItem.quantity;
        updatedSales.itemsSold[itemId].revenue += orderItem.item.price * orderItem.quantity;
      } else {
        updatedSales.itemsSold[itemId] = {
          name: orderItem.item.name,
          quantity: orderItem.quantity,
          revenue: orderItem.item.price * orderItem.quantity
        };
      }
    });

    updatedSales.orderDetails.push({
      orderNumber: order.orderNumber,
      total: order.total,
      paymentMethod: order.paymentMethod,
      orderType: order.orderType,
      timestamp: order.timestamp,
      isMemberSale: order.isMemberSale,
      memberName: order.memberName
    });

    this.dailySales.set(today, updatedSales);
  }

  closeDailySales(closedBy: string): boolean {
    const today = this.getTodayKey();
    const sales = this.dailySales.get(today);
    
    if (!sales || sales.isClosed) return false;

    sales.isClosed = true;
    sales.closedAt = new Date();
    sales.closedBy = closedBy;
    
    return true;
  }

  resetDailySales(): void {
    const today = this.getTodayKey();
    this.dailySales.set(today, {
      date: today,
      totalRevenue: 0,
      totalOrders: 0,
      itemsSold: {},
      orderDetails: [],
      isClosed: false
    });
  }
}

export const ordersDb = new OrdersDatabase();
