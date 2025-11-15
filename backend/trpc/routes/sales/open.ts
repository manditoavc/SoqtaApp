import { publicProcedure } from "../../create-context";
import { ordersDb } from "../../../db/orders-db";
import { z } from "zod";

export const openSalesRoute = publicProcedure
  .input(
    z.object({
      openedBy: z.string()
    })
  )
  .mutation(async ({ input }) => {
    const dailySales = ordersDb.getDailySales();
    
    if (dailySales && !dailySales.isClosed) {
      return { success: false, message: "La caja ya est\u00e1 abierta" };
    }

    ordersDb.resetDailySales();
    
    return { success: true, openedBy: input.openedBy };
  });
