import { publicProcedure } from "../../create-context";
import { ordersDb } from "../../../db/orders-db";
import { z } from "zod";

export const markNotificationAsReadRoute = publicProcedure
  .input(z.object({
    id: z.string()
  }))
  .mutation(({ input }) => {
    const marked = ordersDb.markNotificationAsRead(input.id);
    if (!marked) {
      throw new Error('Notification not found');
    }
    return { success: true };
  });
