import { publicProcedure } from "../../create-context";
import { ordersDb } from "../../../db/orders-db";
import { z } from "zod";

export const deleteOrderRoute = publicProcedure
  .input(z.object({
    id: z.string()
  }))
  .mutation(({ input }) => {
    const deleted = ordersDb.deleteOrder(input.id);
    if (!deleted) {
      throw new Error('Order not found');
    }
    return { success: true };
  });
