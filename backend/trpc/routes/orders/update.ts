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

export const updateOrderRoute = publicProcedure
  .input(z.object({
    id: z.string(),
    updates: z.object({
      items: z.array(orderItemSchema).optional(),
      total: z.number().optional(),
      status: z.enum(['pending', 'kitchen-started', 'grill-started', 'kitchen-completed', 'grill-completed', 'ready-for-pickup', 'completed']).optional(),
      station: z.enum(['kitchen', 'grill']).optional(),
      kitchenStarted: z.boolean().optional(),
      grillStarted: z.boolean().optional(),
      kitchenCompleted: z.boolean().optional(),
      grillCompleted: z.boolean().optional(),
      paymentMethod: z.enum(['qr', 'cash']).optional(),
      orderType: z.enum(['dine-in', 'takeout']).optional(),
      isMemberSale: z.boolean().optional(),
      memberName: z.string().optional(),
      notes: z.string().optional(),
      payments: z.array(paymentRecordSchema).optional(),
      amountPaid: z.number().optional(),
      amountPending: z.number().optional()
    })
  }))
  .mutation(({ input }) => {
    const order = ordersDb.updateOrder(input.id, input.updates);
    if (!order) {
      throw new Error('Order not found');
    }
    
    if (input.updates.status === 'kitchen-started') {
      ordersDb.addNotification({
        type: 'kitchen-started',
        orderId: order.id,
        orderNumber: order.orderNumber,
        message: `🔥 Cocina inició pedido #${order.orderNumber}`,
        targetStation: 'grill'
      });
    } else if (input.updates.status === 'grill-started') {
      ordersDb.addNotification({
        type: 'grill-started',
        orderId: order.id,
        orderNumber: order.orderNumber,
        message: `🔥 Plancha inició pedido #${order.orderNumber}`,
        targetStation: 'kitchen'
      });
    } else if (input.updates.status === 'kitchen-completed') {
      ordersDb.addNotification({
        type: 'kitchen-completed',
        orderId: order.id,
        orderNumber: order.orderNumber,
        message: `✅ Cocina terminó pedido #${order.orderNumber}`,
        targetStation: 'grill'
      });
    } else if (input.updates.status === 'grill-completed') {
      ordersDb.addNotification({
        type: 'grill-completed',
        orderId: order.id,
        orderNumber: order.orderNumber,
        message: `✅ Plancha terminó pedido #${order.orderNumber}`,
        targetStation: 'kitchen'
      });
    } else if (input.updates.status === 'ready-for-pickup') {
      ordersDb.addNotification({
        type: 'ready-for-pickup',
        orderId: order.id,
        orderNumber: order.orderNumber,
        message: `🔔 ¡Pedido #${order.orderNumber} LISTO PARA RECOGER!`,
        targetStation: 'cashier'
      });
    }
    
    return order;
  });
