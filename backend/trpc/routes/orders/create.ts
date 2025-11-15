import { publicProcedure } from "../../create-context";
import { ordersDb } from "../../../db/orders-db";
import { z } from "zod";

const orderItemSchema = z.object({
  item: z.object({
    id: z.string(),
    name: z.string(),
    price: z.number(),
    description: z.string(),
    category: z.enum(['burger', 'side', 'drink', 'extra']),
    cookingTime: z.number().optional(),
    image: z.string().optional()
  }),
  quantity: z.number(),
  notes: z.string().optional(),
  customizations: z.object({
    removeLettuce: z.boolean().optional(),
    removeTomato: z.boolean().optional(),
    removeOnion: z.boolean().optional(),
    removeCheese: z.boolean().optional(),
    removePickles: z.boolean().optional()
  }).optional()
});

const paymentRecordSchema = z.object({
  method: z.enum(['qr', 'cash']),
  amount: z.number(),
  timestamp: z.date()
});

export const createOrderRoute = publicProcedure
  .input(z.object({
    items: z.array(orderItemSchema),
    total: z.number(),
    status: z.enum(['pending', 'kitchen-started', 'grill-started', 'kitchen-completed', 'grill-completed', 'ready-for-pickup', 'completed']),
    station: z.enum(['kitchen', 'grill']).optional(),
    kitchenStarted: z.boolean().optional(),
    grillStarted: z.boolean().optional(),
    kitchenCompleted: z.boolean().optional(),
    grillCompleted: z.boolean().optional(),
    paymentMethod: z.enum(['qr', 'cash']),
    orderType: z.enum(['dine-in', 'takeout']),
    isMemberSale: z.boolean().optional(),
    memberName: z.string().optional(),
    notes: z.string().optional(),
    payments: z.array(paymentRecordSchema),
    amountPaid: z.number(),
    amountPending: z.number()
  }))
  .mutation(({ input }) => {
    const order = ordersDb.createOrder(input);
    
    const hasKitchenItems = input.items.some(item => 
      item.item.category === 'burger' || item.item.category === 'side'
    );
    
    if (hasKitchenItems) {
      ordersDb.addNotification({
        type: 'new-order',
        orderId: order.id,
        orderNumber: order.orderNumber,
        message: `Nuevo pedido #${order.orderNumber} - ${order.total} Bs.`,
        targetStation: 'kitchen'
      });
      
      ordersDb.addNotification({
        type: 'new-order',
        orderId: order.id,
        orderNumber: order.orderNumber,
        message: `Nuevo pedido #${order.orderNumber} - ${order.total} Bs.`,
        targetStation: 'grill'
      });
    } else {
      ordersDb.addNotification({
        type: 'ready-for-pickup',
        orderId: order.id,
        orderNumber: order.orderNumber,
        message: `🔔 ¡Pedido #${order.orderNumber} LISTO PARA RECOGER! (Solo bebidas/extras)`,
        targetStation: 'cashier'
      });
    }
    
    return order;
  });
